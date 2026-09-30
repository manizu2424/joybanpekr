'use strict';
const PORTAL_CATEGORIES = { ai: 'AI', web: '웹개발', python: '파이썬', automation: '자동화', other: '기타' };
const PORTAL_VIEWS = { all: '모든 자료', favorites: '즐겨찾기', site: '사이트 · 도구', article: '읽을거리', unread: '나중에 읽기', workspace: '내 작업 공간' };
const PORTAL_KINDS = { site: '사이트', article: '읽을거리', workspace: '작업 공간' };
const portalState = { admin: false, csrfToken: '', category: '', view: 'all', q: '', tag: '', page: 1, request: 0, controller: null, items: new Map() };
const $ = (id) => document.getElementById(id);
function element(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
}
function safeLinkURL(value) {
    try {
        const url = new URL(value);
        if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password) return null;
        return url;
    } catch { return null; }
}
function splitTags(value) {
    return [...new Set(value.split(',').map((tag) => tag.trim()).filter(Boolean))];
}
let toastTimer;
function notify(message) {
    clearTimeout(toastTimer);
    $('portal-toast').textContent = message;
    $('portal-toast').hidden = false;
    toastTimer = setTimeout(() => { $('portal-toast').hidden = true; }, 3500);
}
function clearPrivateState() {
    portalState.request++;
    portalState.controller?.abort();
    portalState.admin = false;
    portalState.csrfToken = '';
    portalState.items.clear();
    $('link-grid').replaceChildren();
    if (['unread', 'workspace'].includes(portalState.view)) portalState.view = 'all';
    for (const id of ['link-dialog', 'confirm-dialog']) if ($(id).open) $(id).close();
    updateAuthUI();
}
function updateAuthUI() {
    $('auth-button').disabled = false;
    $('auth-button').textContent = portalState.admin ? '로그아웃' : '관리자 로그인';
    $('add-link').hidden = !portalState.admin;
    document.querySelectorAll('[data-admin]').forEach((node) => { node.hidden = !portalState.admin; });
    $('visibility-note').textContent = portalState.admin ? '개인 자료와 공개 자료를 함께 보고 있습니다. 새 자료는 기본 비공개입니다.' : '공개 자료를 둘러보세요. 로그인하면 개인 보관함을 관리할 수 있습니다.';
}
async function api(url, options = {}) {
    const response = await fetch(url, { cache: 'no-store', ...options });
    let result;
    try { result = await response.json(); }
    catch { throw new Error('서버 응답을 읽지 못했습니다. 잠시 후 다시 시도해주세요.'); }
    if (!response.ok || result.status !== 'success') {
        if (response.status === 403 && options.method === 'POST') {
            clearPrivateState();
            void loadLinks();
        }
        throw new Error(result.message || '요청을 처리하지 못했습니다.');
    }
    return result;
}
async function writeAPI(path, body) {
    const auth = await api('api/auth/status.php');
    if (!auth.isLoggedIn || !auth.csrfToken) {
        clearPrivateState(); void loadLinks();
        throw new Error('로그인이 만료되었습니다. 다시 로그인해주세요.');
    }
    portalState.csrfToken = auth.csrfToken;
    return api(path, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': auth.csrfToken }, body: JSON.stringify(body) });
}
function updateFilters() {
    document.querySelectorAll('[data-category]').forEach((button) => {
        if (button.tagName === 'BUTTON') button.setAttribute('aria-pressed', String(button.dataset.category === portalState.category));
    });
    document.querySelectorAll('[data-view]').forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.view === portalState.view)));
    $('library-title').textContent = PORTAL_VIEWS[portalState.view];
    $('library-kicker').textContent = portalState.category ? PORTAL_CATEGORIES[portalState.category].toUpperCase() : 'YOUR COLLECTION';
    $('active-tag').hidden = !portalState.tag;
    $('active-tag').querySelector('span').textContent = '#' + portalState.tag;
}
function message(text, retry = false) {
    $('library-message').replaceChildren(element('p', '', text));
    $('library-message').hidden = false;
    if (retry) {
        const button = element('button', 'btn-secondary', '다시 불러오기');
        button.type = 'button'; button.onclick = () => loadLinks();
        $('library-message').append(button);
    }
}
async function loadLinks(append = false) {
    portalState.controller?.abort();
    const controller = new AbortController();
    portalState.controller = controller;
    const request = ++portalState.request;
    const page = append ? portalState.page + 1 : 1;
    updateFilters();
    $('load-more').hidden = true;
    $('link-grid').setAttribute('aria-busy', 'true');
    if (!append) {
        portalState.items.clear(); $('link-grid').replaceChildren();
        $('result-count').textContent = '';
        message('자료를 불러오는 중입니다.');
    }
    const params = new URLSearchParams({ category: portalState.category, view: portalState.view, q: portalState.q, tag: portalState.tag, page: String(page) });
    try {
        const result = await api('api/links/read.php?' + params, { signal: controller.signal });
        if (request !== portalState.request) return;
        portalState.page = page;
        $('library-message').hidden = true;
        result.data.forEach((link) => {
            if (portalState.items.has(link.id)) return;
            portalState.items.set(link.id, link);
            $('link-grid').append(renderLink(link));
        });
        $('result-count').textContent = result.total + '개 자료';
        $('load-more').hidden = !result.has_more;
        if (!portalState.items.size) {
            const filtered = portalState.q || portalState.tag || portalState.category || portalState.view !== 'all';
            message(filtered ? '조건에 맞는 자료가 없습니다. 검색어나 필터를 바꿔보세요.' : portalState.admin ? '첫 링크를 저장해보세요. 자주 쓰는 도구는 즐겨찾기에 고정할 수 있습니다.' : '아직 공개된 자료가 없습니다. 개인 기록을 둘러보거나 로그인해 보관함을 만들어보세요.');
        }
    } catch (error) {
        if (error.name === 'AbortError' || request !== portalState.request) return;
        message(error.message, true);
    } finally {
        if (request === portalState.request) $('link-grid').setAttribute('aria-busy', 'false');
    }
}
function action(text, callback, className = '') {
    const button = element('button', className, text); button.type = 'button';
    button.addEventListener('click', async () => {
        button.disabled = true;
        try { await callback(); }
        catch (error) { notify(error.message); }
        finally { button.disabled = false; }
    });
    return button;
}
function renderLink(link) {
    const card = element('article', 'link-card');
    const url = safeLinkURL(link.url);
    const top = element('div', 'card-top');
    top.append(element('span', 'link-monogram', link.title.slice(0, 1).toUpperCase()), element('span', 'card-category', PORTAL_CATEGORIES[link.category] || '기타'));
    const title = element('h3', 'card-title');
    if (url) {
        const anchor = element('a', '', link.title);
        anchor.href = url.href; anchor.target = '_blank'; anchor.rel = 'noopener noreferrer';
        anchor.append(element('span', '', '↗')); title.append(anchor);
    } else title.textContent = link.title;
    card.append(top, title, element('p', 'card-host', url?.hostname || '사용할 수 없는 링크'));
    if (link.description) card.append(element('p', 'card-description', link.description));
    const tags = element('div', 'card-tags');
    (Array.isArray(link.tags) ? link.tags : []).forEach((tag) => {
        const button = action('#' + tag, () => { portalState.tag = tag; return loadLinks(); });
        button.setAttribute('aria-label', tag + ' 태그로 검색'); tags.append(button);
    });
    card.append(tags);
    const footer = element('div', 'card-footer');
    const meta = element('div', 'card-meta');
    meta.append(element('span', '', PORTAL_KINDS[link.kind] || '자료'));
    if (link.is_favorite) meta.append(element('span', 'card-favorite', '★ 고정'));
    if (portalState.admin) {
        meta.append(element('span', '', link.visibility === 'private' ? '나만 보기' : '공개'));
        if (link.kind === 'article') meta.append(element('span', '', link.is_read ? '읽음' : '안 읽음'));
    }
    footer.append(meta);
    if (portalState.admin) {
        const actions = element('div', 'card-actions');
        actions.append(action(link.is_favorite ? '고정 해제' : '☆ 고정', () => updateLink(link, { is_favorite: !link.is_favorite })));
        if (link.kind === 'article') actions.append(action(link.is_read ? '읽음 취소' : '읽음', () => updateLink(link, { is_read: !link.is_read })));
        actions.append(action('수정', () => openEditor(link)), action('삭제', async () => {
            if (!await confirmDelete()) return;
            await writeAPI('api/links/delete.php', { id: link.id });
            notify('자료를 삭제했습니다.'); await loadLinks();
        }, 'delete-link'));
        footer.append(actions);
    }
    card.append(footer);
    return card;
}
async function updateLink(link, patch) {
    await writeAPI('api/links/state.php', { id: link.id, ...patch });
    notify('변경사항을 저장했습니다.'); await loadLinks();
}
function confirmDelete() {
    const dialog = $('confirm-dialog'); dialog.returnValue = '';
    return new Promise((resolve) => {
        dialog.addEventListener('close', () => resolve(dialog.returnValue === 'confirm'), { once: true });
        dialog.showModal();
    });
}
function openEditor(link = null) {
    if (!portalState.admin) return;
    const form = $('link-form'); form.reset();
    $('editor-title').textContent = link ? '링크 수정' : '링크 저장';
    $('editor-error').textContent = '';
    const defaults = { id: 0, category: portalState.category || 'ai', kind: 'article', visibility: 'private', sort_order: 0 };
    const values = link || defaults;
    for (const [key, value] of Object.entries(values)) {
        const field = form.elements.namedItem(key);
        if (!field) continue;
        if (field.type === 'checkbox') field.checked = Boolean(value);
        else field.value = key === 'tags' ? value.join(', ') : value;
    }
    updateWorkspaceField(); $('link-dialog').showModal();
}
function updateWorkspaceField() {
    const form = $('link-form');
    const workspace = form.elements.kind.value === 'workspace';
    form.elements.visibility.disabled = workspace;
    if (workspace) form.elements.visibility.value = 'private';
}
function busyForm(form, busy) {
    form.dataset.busy = String(busy);
    form.querySelectorAll('button').forEach((button) => { button.disabled = busy; });
    // 값은 유지하되 저장 중 입력 변경을 막습니다.
    form.querySelectorAll('input,textarea,select').forEach((field) => { field.disabled = busy; });
    if (!busy && form.id === 'link-form') updateWorkspaceField();
}
async function loadRecords() {
    try {
        const result = await api('api/posts/stats.php');
        document.querySelectorAll('.post-count').forEach((node) => { node.textContent = (result.data[node.dataset.category]?.count || 0) + '개 기록'; });
        document.querySelectorAll('.post-latest').forEach((node) => { node.textContent = result.data[node.dataset.latestCategory]?.latest?.title || '첫 기록을 기다립니다'; });
    } catch {
        document.querySelectorAll('.post-count').forEach((node) => { node.textContent = '기록 목록으로 이동 ↗'; });
    }
}
async function initializePortal() {
    try {
        const result = await api('api/auth/status.php');
        portalState.admin = Boolean(result.isLoggedIn); portalState.csrfToken = result.csrfToken || '';
    } catch { portalState.admin = false; }
    updateAuthUI(); await loadLinks();
}
document.addEventListener('DOMContentLoaded', () => {
    $('category-filters').addEventListener('click', (event) => {
        const button = event.target.closest('button[data-category]'); if (!button) return;
        portalState.category = button.dataset.category; void loadLinks();
    });
    $('view-filters').addEventListener('click', (event) => {
        const button = event.target.closest('button[data-view]'); if (!button) return;
        portalState.view = button.dataset.view; void loadLinks();
    });
    $('search-form').addEventListener('submit', (event) => { event.preventDefault(); portalState.q = $('search-input').value.trim(); void loadLinks(); });
    $('search-input').addEventListener('search', () => { if (!$('search-input').value) { portalState.q = ''; void loadLinks(); } });
    $('active-tag').querySelector('button').onclick = () => { portalState.tag = ''; void loadLinks(); };
    $('load-more').onclick = () => loadLinks(true);
    $('add-link').onclick = () => openEditor();
    $('link-form').elements.kind.addEventListener('change', updateWorkspaceField);
    document.querySelectorAll('[data-close]').forEach((button) => button.addEventListener('click', () => $(button.dataset.close).close()));
    for (const id of ['link-dialog', 'login-dialog']) {
        $(id).addEventListener('cancel', (event) => { if ($(id).querySelector('form').dataset.busy === 'true') event.preventDefault(); });
    }
    $('auth-button').addEventListener('click', async () => {
        if (!portalState.admin) { $('login-error').textContent = ''; $('login-dialog').showModal(); return; }
        $('auth-button').disabled = true;
        try { await writeAPI('api/auth/logout.php', {}); clearPrivateState(); notify('로그아웃했습니다.'); await loadLinks(); }
        catch (error) { notify(error.message); }
        finally { $('auth-button').disabled = false; }
    });
    $('login-form').addEventListener('submit', async (event) => {
        event.preventDefault(); const form = event.currentTarget;
        const data = Object.fromEntries(new FormData(form));
        $('login-error').textContent = ''; busyForm(form, true);
        try {
            await api('api/auth/login.php', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(data) });
            form.elements.password.value = ''; $('login-dialog').close();
            notify('나의 포털에 로그인했습니다.'); await initializePortal();
        } catch (error) { $('login-error').textContent = error.message; }
        finally { busyForm(form, false); }
    });
    $('link-form').addEventListener('submit', async (event) => {
        event.preventDefault(); const form = event.currentTarget;
        const data = Object.fromEntries(new FormData(form));
        data.id = Number(data.id); data.sort_order = Number(data.sort_order);
        data.visibility = form.elements.visibility.value;
        data.tags = splitTags(data.tags); data.is_favorite = form.elements.is_favorite.checked; data.is_read = form.elements.is_read.checked;
        if (!safeLinkURL(data.url)) { $('editor-error').textContent = 'http 또는 https 링크를 입력해주세요.'; return; }
        $('editor-error').textContent = ''; busyForm(form, true);
        try { await writeAPI('api/links/save.php', data); $('link-dialog').close(); notify('링크를 저장했습니다.'); await loadLinks(); }
        catch (error) { $('editor-error').textContent = error.message; }
        finally { busyForm(form, false); }
    });
    void initializePortal(); void loadRecords();
});
// 다른 탭에서 로그아웃한 경우 비공개 자료를 다시 확인합니다.
window.addEventListener('pageshow', (event) => { if (event.persisted) { clearPrivateState(); void initializePortal(); } });

// 다른 탭에서 세션을 종료했으면 보관함으로 돌아올 때 개인 자료를 제거합니다.
document.addEventListener('visibilitychange', async () => {
    if (document.visibilityState !== 'visible' || !portalState.admin) return;
    try {
        const auth = await api('api/auth/status.php');
        if (!auth.isLoggedIn) { clearPrivateState(); await loadLinks(); }
    } catch { clearPrivateState(); await loadLinks(); }
});
