/**
 * UI Manager Class for Custom Notifications
 */
class UIManager {
    static init() {
        // Create Toast Container
        if (!document.querySelector('.toast-container')) {
            const container = document.createElement('div');
            container.className = 'toast-container';
            document.body.appendChild(container);
        }
    }

    static showToast(message, type = 'info') {
        this.init();
        const container = document.querySelector('.toast-container');
        
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        let icon = '';
        if (type === 'success') icon = '<i class="fas fa-check-circle"></i>';
        else if (type === 'error') icon = '<i class="fas fa-exclamation-circle"></i>';
        else icon = '<i class="fas fa-info-circle"></i>';

        toast.innerHTML = `${icon} <span>${message}</span>`;
        
        container.appendChild(toast);

        // Auto remove after 3 seconds
        setTimeout(() => {
            toast.style.animation = 'toastFadeOut 0.3s forwards';
            toast.addEventListener('animationend', () => {
                toast.remove();
            });
        }, 3000);
    }

    static showConfirm(message) {
        return new Promise((resolve) => {
            const overlay = document.createElement('div');
            overlay.className = 'custom-modal-overlay';
            
            overlay.innerHTML = `
                <div class="custom-modal">
                    <h3><i class="fas fa-question-circle"></i> 확인</h3>
                    <p>${message}</p>
                    <div class="modal-buttons">
                        <button class="btn-modal confirm">확인</button>
                        <button class="btn-modal cancel">취소</button>
                    </div>
                </div>
            `;

            document.body.appendChild(overlay);

            const confirmBtn = overlay.querySelector('.confirm');
            const cancelBtn = overlay.querySelector('.cancel');

            const close = (result) => {
                overlay.style.animation = 'fadeOut 0.3s forwards'; // Define fadeOut if needed or just remove
                overlay.remove(); // Simple remove for now
                resolve(result);
            };

            confirmBtn.onclick = () => close(true);
            cancelBtn.onclick = () => close(false);
            // Click outside to cancel
            overlay.onclick = (e) => {
                if(e.target === overlay) close(false);
            };
        });
    }

    static showPrompt(message, type = 'text') {
        return new Promise((resolve) => {
            const overlay = document.createElement('div');
            overlay.className = 'custom-modal-overlay';
            
            overlay.innerHTML = `
                <div class="custom-modal">
                    <h3><i class="fas fa-pen"></i> 입력</h3>
                    <p>${message}</p>
                    <input type="${type}" class="modal-input" autofocus>
                    <div class="modal-buttons">
                        <button class="btn-modal confirm">확인</button>
                        <button class="btn-modal cancel">취소</button>
                    </div>
                </div>
            `;

            document.body.appendChild(overlay);

            const input = overlay.querySelector('input');
            const confirmBtn = overlay.querySelector('.confirm');
            const cancelBtn = overlay.querySelector('.cancel');

            // Focus input after render
            setTimeout(() => input.focus(), 50);

            const close = (result) => {
                overlay.remove();
                resolve(result);
            };

            confirmBtn.onclick = () => close(input.value);
            cancelBtn.onclick = () => close(null);
            
            input.onkeydown = (e) => {
                if (e.key === 'Enter') close(input.value);
                if (e.key === 'Escape') close(null);
            };

            overlay.onclick = (e) => {
                if(e.target === overlay) close(null);
            };
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    console.log('Joyban App Initialized');

    // URL 파라미터 파싱
    const urlParams = new URLSearchParams(window.location.search);
    const category = urlParams.get('category');
    const postId = urlParams.get('id');

    // 페이지 타입 확인
    const isBoardPage = window.location.pathname.includes('board.html');
    const isViewPage = window.location.pathname.includes('view.html');
    const isIndexPage = window.location.pathname.endsWith('index.html') || window.location.pathname === '/' || window.location.pathname.endsWith('joyban/');

    // 로그인 상태 확인 및 UI 업데이트
    checkLoginStatus();

    if (isBoardPage && category) {
        loadBoardPosts(category);
    } else if (isViewPage && postId) {
        loadPostDetail(postId);
    } else if (isIndexPage) {
        loadPostStats();
    }
});

const CATEGORY_META = {
    aiworld: {
        title: 'AI 이야기',
        desc: 'AI 활용, 도구 리뷰, 기술 실험 기록',
        icon: 'fa-robot'
    },
    works: {
        title: '만든 것들',
        desc: '직접 만든 프로젝트와 작업물',
        icon: 'fa-folder-open'
    },
    vision: {
        title: '생각정리',
        desc: '목표, 회고, 방향성에 대한 기록',
        icon: 'fa-compass'
    },
    skillup: {
        title: '배움노트',
        desc: '학습 기록, 개발 메모, 문제 해결 노트',
        icon: 'fa-seedling'
    }
};

function getCategoryTitle(category) {
    return CATEGORY_META[category]?.title || category;
}

function escapeHTML(value) {
    return String(value ?? '').replace(/[&<>"']/g, (char) => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    }[char]));
}

function toPlainText(value) {
    const div = document.createElement('div');
    div.innerHTML = value ?? '';
    return div.textContent || div.innerText || '';
}

function setActiveNav(category) {
    if (!category) return;

    document.querySelectorAll('.menu-links a').forEach(link => {
        const url = new URL(link.href, window.location.href);
        link.classList.toggle('active', url.searchParams.get('category') === category);
    });
}

function setMetaContent(selector, content) {
    const element = document.querySelector(selector);
    if (element && content) {
        element.setAttribute('content', content);
    }
}

/**
 * 메인 페이지 게시글 통계 로드
 */
async function loadPostStats() {
    try {
        const response = await fetch('api/posts/stats.php');
        const result = await response.json();
        
        if (result.status === 'success') {
            const stats = result.data;
            const countElements = document.querySelectorAll('.post-count');
            const latestElements = document.querySelectorAll('.post-latest');
            
            countElements.forEach(el => {
                const category = el.getAttribute('data-category');
                const categoryStats = stats[category] || 0;
                const count = typeof categoryStats === 'object' ? categoryStats.count : categoryStats;
                el.innerText = `${count}개 글`;
            });

            latestElements.forEach(el => {
                const category = el.getAttribute('data-latest-category');
                const categoryStats = stats[category];
                const latest = typeof categoryStats === 'object' ? categoryStats.latest : null;
                el.innerText = latest ? `최근: ${latest.title}` : '아직 등록된 글이 없습니다';
            });
        }
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

/**
 * 로그인 상태 확인 및 UI 업데이트
 */
async function checkLoginStatus() {
    try {
        const response = await fetch('api/auth/status.php');
        const result = await response.json();
        updateAdminUI(result.isLoggedIn);
    } catch (error) {
        console.error('Login status check failed:', error);
    }
}

/**
 * 관리자 UI 업데이트 (자물쇠 아이콘 등)
 */
function updateAdminUI(isLoggedIn) {
    const adminBtn = document.querySelector('.admin-login-btn');
    if (!adminBtn) return;

    // 기존 이벤트 리스너 제거를 위해 노드 복제 (간단한 방법)
    const newBtn = adminBtn.cloneNode(true);
    adminBtn.parentNode.replaceChild(newBtn, adminBtn);

    const icon = newBtn.querySelector('i');

    if (isLoggedIn) {
        // 로그인 상태: 열린 자물쇠(또는 로그아웃 아이콘), 로그아웃 기능 연결
        icon.className = 'fas fa-lock-open'; // 또는 fa-sign-out-alt
        newBtn.title = '로그아웃';
        newBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            if (await UIManager.showConfirm('로그아웃 하시겠습니까?')) {
                logoutAdmin();
            }
        });
        
        // 관리자 전용 UI 요소 표시 (글쓰기 버튼 등 - 필요시 추가)
        document.body.classList.add('is-admin'); // CSS로 제어하기 위해 body에 클래스 추가

        // 1. 게시판 목록 관리자 컨트롤 (글쓰기 버튼)
        const boardControls = document.getElementById('board-admin-controls');
        if (boardControls) {
            boardControls.style.display = 'block';
            const writeBtn = document.getElementById('btn-write');
            const currentCategory = document.body.dataset.currentCategory;
            if (writeBtn && currentCategory) {
                writeBtn.onclick = () => {
                    location.href = `admin_write.html?category=${currentCategory}`;
                };
            }
        }

        // 2. 게시글 상세 관리자 컨트롤 (수정, 삭제 버튼)
        const viewControls = document.getElementById('admin-controls');
        if (viewControls) {
            viewControls.style.display = 'block';
            
            // 수정 버튼
            const btnEdit = document.getElementById('btn-edit');
            if (btnEdit) {
                btnEdit.onclick = () => {
                    const urlParams = new URLSearchParams(window.location.search);
                    const postId = urlParams.get('id');
                    if(postId) location.href = `admin_write.html?id=${postId}`;
                };
            }

            // 삭제 버튼
            const btnDelete = document.getElementById('btn-delete');
            if (btnDelete) {
                btnDelete.onclick = async () => {
                    const urlParams = new URLSearchParams(window.location.search);
                    const postId = urlParams.get('id');
                    // 현재 카테고리 정보 가져오기 (DOM에서)
                    const category = document.body.dataset.currentCategory || 'aiworld';

                    if(postId && await UIManager.showConfirm('정말 이 게시글을 삭제하시겠습니까?')) {
                        deletePost(postId, category);
                    }
                };
            }
        }

    } else {
        // 비로그인 상태: 닫힌 자물쇠, 로그인 기능 연결
        icon.className = 'fas fa-lock';
        newBtn.title = '관리자 로그인';
        newBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            const password = await UIManager.showPrompt('관리자 비밀번호를 입력하세요:', 'password');
            if (password) {
                loginAdmin('admin', password);
            }
        });

        document.body.classList.remove('is-admin');
        
        // 관리자 컨트롤 숨김
        const boardControls = document.getElementById('board-admin-controls');
        if (boardControls) boardControls.style.display = 'none';
        
        const viewControls = document.getElementById('admin-controls');
        if (viewControls) viewControls.style.display = 'none';
    }
}

/**
 * 게시글 삭제 (관리자)
 */
async function deletePost(id, category) {
    try {
        const response = await fetch('api/posts/delete.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: id })
        });
        const result = await response.json();
        
        if (result.status === 'success') {
            UIManager.showToast('게시글이 삭제되었습니다.', 'success');
            // Toast를 볼 시간을 주기 위해 약간 지연 후 이동
            setTimeout(() => {
                location.href = `board.html?category=${category}`; 
            }, 1000);
        } else {
            UIManager.showToast('삭제 실패: ' + result.message, 'error');
        }
    } catch (error) {
        console.error('Delete failed:', error);
        UIManager.showToast('삭제 중 오류가 발생했습니다.', 'error');
    }
}

/**
 * 관리자 로그아웃
 */
async function logoutAdmin() {
    try {
        const response = await fetch('api/auth/logout.php');
        const result = await response.json();
        if (result.status === 'success') {
            UIManager.showToast('로그아웃 되었습니다.', 'success');
            setTimeout(() => location.reload(), 1000);
        }
    } catch (error) {
        console.error('Logout failed:', error);
    }
}

/**
 * 게시글 목록 로드 (board.html)
 */
async function loadBoardPosts(category, page = 1) {
    const postListContainer = document.querySelector('.post-list');
    if (!postListContainer) return;

    // 카테고리 타이틀 업데이트
    const titleEl = document.querySelector('.category-title');
    const descEl = document.querySelector('.category-desc');
    const meta = CATEGORY_META[category];
    document.body.dataset.currentCategory = category;
    if (titleEl) titleEl.innerText = getCategoryTitle(category);
    if (descEl && meta) descEl.innerText = meta.desc;
    document.title = `${getCategoryTitle(category)} - Joyban`;
    setActiveNav(category);

    const limit = 10;
    const offset = (page - 1) * limit;

    try {
        const response = await fetch(`api/posts/read.php?category=${category}&limit=${limit}&offset=${offset}`);
        const result = await response.json();

        postListContainer.innerHTML = ''; // 초기화

        if (result.status === 'success' && result.data.length > 0) {
            result.data.forEach(post => {
                const postItem = document.createElement('article');
                postItem.className = 'post-item';
                postItem.onclick = () => location.href = `view.html?id=${post.id}`;
                
                // 썸네일 처리
                let thumbHtml = `
                    <div class="img-placeholder">
                        <i class="fas ${meta?.icon || 'fa-file-lines'}"></i>
                    </div>
                `;
                if (post.thumbnail) {
                    thumbHtml = `<img src="${escapeHTML(post.thumbnail)}" alt="${escapeHTML(post.title)}">`;
                }
                const summaryText = toPlainText(post.content).trim();
                
                postItem.innerHTML = `
                    <div class="post-thumb">
                        ${thumbHtml}
                    </div>
                    <div class="post-info">
                        <h3 class="post-title">${escapeHTML(post.title)}</h3>
                        <p class="post-summary">${escapeHTML(summaryText.substring(0, 150))}${summaryText.length > 150 ? '...' : ''}</p>
                        <div class="post-meta">
                            <span class="date">${post.created_at.split(' ')[0]}</span>
                        </div>
                    </div>
                `;
                postListContainer.appendChild(postItem);
            });

            // 페이지네이션 렌더링
            renderPagination(result.total_count, page, limit, category);

        } else {
            postListContainer.innerHTML = `
                <div class="empty-state">
                    <i class="fas ${meta?.icon || 'fa-file-lines'}"></i>
                    <h3>${getCategoryTitle(category)}에 아직 글이 없습니다</h3>
                    <p>첫 글을 등록하면 이곳에 목록이 표시됩니다.</p>
                </div>
            `;
            renderPagination(0, 1, limit, category);
        }
    } catch (error) {
        console.error('Error fetching posts:', error);
        postListContainer.innerHTML = `
            <div class="empty-state error">
                <i class="fas fa-triangle-exclamation"></i>
                <h3>게시글을 불러오지 못했습니다</h3>
                <p>서버 연결 또는 데이터베이스 상태를 확인해주세요.</p>
            </div>
        `;
    }
}

/**
 * 페이지네이션 렌더링
 */
function renderPagination(totalCount, currentPage, limit, category) {
    const paginationContainer = document.querySelector('.pagination');
    if (!paginationContainer) return;

    paginationContainer.innerHTML = ''; // 초기화

    if (totalCount === 0) return;

    const totalPages = Math.ceil(totalCount / limit);
    const maxPagesToShow = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

    if (endPage - startPage + 1 < maxPagesToShow) {
        startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }

    // 이전 버튼
    if (currentPage > 1) {
        const prevBtn = document.createElement('a');
        prevBtn.href = '#';
        prevBtn.className = 'page-btn prev';
        prevBtn.innerHTML = '<i class="fas fa-chevron-left"></i>';
        prevBtn.onclick = (e) => {
            e.preventDefault();
            loadBoardPosts(category, currentPage - 1);
        };
        paginationContainer.appendChild(prevBtn);
    }

    // 페이지 번호
    for (let i = startPage; i <= endPage; i++) {
        const pageBtn = document.createElement('a');
        pageBtn.href = '#';
        pageBtn.className = `page-btn ${i === currentPage ? 'active' : ''}`;
        pageBtn.innerText = i;
        pageBtn.onclick = (e) => {
            e.preventDefault();
            loadBoardPosts(category, i);
        };
        paginationContainer.appendChild(pageBtn);
    }

    // 다음 버튼
    if (currentPage < totalPages) {
        const nextBtn = document.createElement('a');
        nextBtn.href = '#';
        nextBtn.className = 'page-btn next';
        nextBtn.innerHTML = '<i class="fas fa-chevron-right"></i>';
        nextBtn.onclick = (e) => {
            e.preventDefault();
            loadBoardPosts(category, currentPage + 1);
        };
        paginationContainer.appendChild(nextBtn);
    }
}

/**
 * 게시글 상세 로드 (view.html)
 */
async function loadPostDetail(id) {
    try {
        const response = await fetch(`api/posts/detail.php?id=${id}`);
        const result = await response.json();

        if (result.status === 'success') {
            const post = result.data;
            document.body.dataset.currentCategory = post.category;
            setActiveNav(post.category);
            document.querySelector('.view-title').innerText = post.title;
            document.title = `${post.title} - Joyban`;
            const plainContent = toPlainText(post.content).trim();
            const description = plainContent.substring(0, 120) || 'Joyban 개인 홈페이지의 게시글입니다.';
            setMetaContent('meta[name="description"]', description);
            setMetaContent('meta[property="og:title"]', `${post.title} - Joyban`);
            setMetaContent('meta[property="og:description"]', description);
            setMetaContent('meta[property="og:url"]', window.location.href);
            setMetaContent('meta[name="twitter:title"]', `${post.title} - Joyban`);
            setMetaContent('meta[name="twitter:description"]', description);
            document.querySelector('.category-badge').innerText = getCategoryTitle(post.category);
            document.querySelector('.view-meta .date').innerText = post.created_at;
            //document.querySelector('.view-content').innerHTML = post.content.replace(/\n/g, '<br>');
            const contentP = document.querySelector('.view-content p');
            if (contentP) {
                contentP.innerHTML = escapeHTML(post.content).replace(/\n/g, '<br>');
            }

            // 미디어 및 첨부파일 처리
            const mediaWrapper = document.querySelector('.content-media-wrapper');
            const fileListContainer = document.querySelector('.attachment-list');
            const fileListUl = document.getElementById('file-download-list');
            
            if (mediaWrapper) mediaWrapper.innerHTML = '';
            if (fileListUl) fileListUl.innerHTML = '';
            if (fileListContainer) fileListContainer.style.display = 'none';

            if (post.media && post.media.length > 0) {
                // 이미지/비디오/기타 분류
                const imagePaths = [];
                const videoPaths = [];

                post.media.forEach(media => {
                    // 경로 정리: ../ 제거
                    let cleanPath = media.file_path.replace(/^(\.\.\/)+/, '');
                    const ext = cleanPath.split('.').pop().toLowerCase();
                    const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext);
                    const isVideo = ['mp4', 'webm', 'ogg'].includes(ext);

                    if (isImage) {
                        imagePaths.push(cleanPath);
                    } else if (isVideo) {
                        videoPaths.push(cleanPath);
                    } else {
                        // 그 외 파일은 다운로드 목록에 추가
                        if (fileListUl && fileListContainer) {
                            const li = document.createElement('li');
                            const a = document.createElement('a');
                            a.href = cleanPath;
                            a.download = media.original_name || cleanPath.split('/').pop();
                            a.innerHTML = `<i class="fas fa-file-download"></i> ${escapeHTML(media.original_name || '첨부파일')}`;
                            a.style.textDecoration = 'none';
                            a.style.color = '#333';
                            li.style.marginBottom = '0.5rem';
                            li.appendChild(a);
                            fileListUl.appendChild(li);
                            fileListContainer.style.display = 'block';
                        }
                    }
                });

                // 이미지 처리: 1개면 단독 표시, 2개 이상이면 슬라이드
                if (mediaWrapper && imagePaths.length > 0) {
                    if (imagePaths.length === 1) {
                        const img = document.createElement('img');
                        img.src = imagePaths[0];
                        img.className = 'content-media';
                        img.style.cursor = 'zoom-in';
                        img.onerror = () => { img.alt = '이미지를 불러올 수 없습니다.'; };
                        img.onclick = () => showLightbox(imagePaths, 0);
                        mediaWrapper.appendChild(img);
                    } else {
                        // 슬라이드 생성
                        mediaWrapper.appendChild(createMediaSlider(imagePaths));
                    }
                }

                // 비디오 처리
                if (mediaWrapper && videoPaths.length > 0) {
                    videoPaths.forEach(src => {
                        const video = document.createElement('video');
                        video.src = src;
                        video.controls = true;
                        video.className = 'content-media';
                        mediaWrapper.appendChild(video);
                    });
                }
            }

            // '목록으로' 링크 수정
            const listBtn = document.querySelector('.view-nav .btn-list');
            if (listBtn && post.category) {
                listBtn.href = `board.html?category=${post.category}`;
            }
        }
    } catch (error) {
        console.error('Error fetching post detail:', error);
    }
}

/**
 * 이미지 슬라이드(캐러셀) 생성
 * @param {string[]} images - 이미지 경로 배열
 * @returns {HTMLElement} 슬라이드 컨테이너
 */
function createMediaSlider(images) {
    const slider = document.createElement('div');
    slider.className = 'media-slider';

    // 슬라이드 트랙
    const track = document.createElement('div');
    track.className = 'media-slider-track';

    images.forEach((src, i) => {
        const slide = document.createElement('div');
        slide.className = 'media-slide';
        const img = document.createElement('img');
        img.src = src;
        img.alt = `이미지 ${i + 1}`;
        img.loading = 'lazy';
        img.onerror = () => { img.alt = '이미지를 불러올 수 없습니다.'; };
        img.onclick = () => showLightbox(images, currentIndex);
        slide.appendChild(img);
        track.appendChild(slide);
    });
    slider.appendChild(track);

    // 슬라이드 카운터
    const count = document.createElement('div');
    count.className = 'slider-count';
    slider.appendChild(count);

    // 이전/다음 버튼
    const prevBtn = document.createElement('button');
    prevBtn.className = 'slider-btn prev';
    prevBtn.innerHTML = '<i class="fas fa-chevron-left"></i>';
    prevBtn.setAttribute('aria-label', '이전 이미지');

    const nextBtn = document.createElement('button');
    nextBtn.className = 'slider-btn next';
    nextBtn.innerHTML = '<i class="fas fa-chevron-right"></i>';
    nextBtn.setAttribute('aria-label', '다음 이미지');

    slider.appendChild(prevBtn);
    slider.appendChild(nextBtn);

    // 인디케이터 dots
    const dotsWrapper = document.createElement('div');
    dotsWrapper.className = 'slider-dots';
    const dots = images.map((_, i) => {
        const dot = document.createElement('button');
        dot.className = 'slider-dot' + (i === 0 ? ' active' : '');
        dot.setAttribute('aria-label', `${i + 1}번 이미지`);
        dot.onclick = () => goTo(i);
        dotsWrapper.appendChild(dot);
        return dot;
    });
    slider.appendChild(dotsWrapper);

    let currentIndex = 0;

    function goTo(index) {
        currentIndex = Math.max(0, Math.min(images.length - 1, index));
        track.style.transform = `translateX(-${currentIndex * 100}%)`;
        dots.forEach((d, i) => d.classList.toggle('active', i === currentIndex));
        count.textContent = `${currentIndex + 1} / ${images.length}`;
        // 이미지 클릭 이벤트 동기화 (클로저 업데이트)
        track.querySelectorAll('.media-slide img').forEach((img, i) => {
            img.onclick = () => showLightbox(images, currentIndex);
        });
    }

    prevBtn.onclick = () => goTo(currentIndex - 1);
    nextBtn.onclick = () => goTo(currentIndex + 1);

    // 터치 스와이프 지원
    let touchStartX = 0;
    slider.addEventListener('touchstart', e => { touchStartX = e.touches[0].clientX; }, { passive: true });
    slider.addEventListener('touchend', e => {
        const diff = touchStartX - e.changedTouches[0].clientX;
        if (Math.abs(diff) > 40) goTo(currentIndex + (diff > 0 ? 1 : -1));
    }, { passive: true });

    // 초기화
    goTo(0);
    return slider;
}

/**
 * 라이트박스 표시
 * @param {string[]} images - 이미지 경로 배열
 * @param {number} startIndex - 시작 인덱스
 */
function showLightbox(images, startIndex = 0) {
    let current = startIndex;

    const overlay = document.createElement('div');
    overlay.className = 'lightbox-overlay';

    const inner = document.createElement('div');
    inner.className = 'lightbox-inner';

    const img = document.createElement('img');
    img.className = 'lightbox-img';
    inner.appendChild(img);

    // 닫기 버튼
    const closeBtn = document.createElement('button');
    closeBtn.className = 'lightbox-close';
    closeBtn.innerHTML = '<i class="fas fa-times"></i>';
    closeBtn.setAttribute('aria-label', '닫기');

    // 이전/다음 버튼 (이미지 2개 이상일 때만)
    let prevNav = null, nextNav = null, counter = null;
    if (images.length > 1) {
        prevNav = document.createElement('button');
        prevNav.className = 'lightbox-nav prev';
        prevNav.innerHTML = '<i class="fas fa-chevron-left"></i>';
        prevNav.setAttribute('aria-label', '이전');

        nextNav = document.createElement('button');
        nextNav.className = 'lightbox-nav next';
        nextNav.innerHTML = '<i class="fas fa-chevron-right"></i>';
        nextNav.setAttribute('aria-label', '다음');

        counter = document.createElement('div');
        counter.className = 'lightbox-counter';

        overlay.appendChild(prevNav);
        overlay.appendChild(nextNav);
        overlay.appendChild(counter);
    }

    overlay.appendChild(inner);
    overlay.appendChild(closeBtn);
    document.body.appendChild(overlay);
    document.body.style.overflow = 'hidden';

    function update(index) {
        current = Math.max(0, Math.min(images.length - 1, index));
        img.src = images[current];
        img.alt = `이미지 ${current + 1}`;
        if (counter) counter.textContent = `${current + 1} / ${images.length}`;
        if (prevNav) prevNav.style.display = current === 0 ? 'none' : 'grid';
        if (nextNav) nextNav.style.display = current === images.length - 1 ? 'none' : 'grid';
    }

    function close() {
        overlay.remove();
        document.body.style.overflow = '';
        document.removeEventListener('keydown', onKey);
    }

    function onKey(e) {
        if (e.key === 'Escape') close();
        if (e.key === 'ArrowLeft' && images.length > 1) update(current - 1);
        if (e.key === 'ArrowRight' && images.length > 1) update(current + 1);
    }

    closeBtn.onclick = close;
    overlay.onclick = (e) => { if (e.target === overlay) close(); };
    if (prevNav) prevNav.onclick = () => update(current - 1);
    if (nextNav) nextNav.onclick = () => update(current + 1);
    document.addEventListener('keydown', onKey);

    update(startIndex);
}

/**
 * 관리자 로그인 시도
 */
async function loginAdmin(username, password) {
    try {
        const response = await fetch('api/auth/login.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const result = await response.json();
        if (result.status === 'success') {
            UIManager.showToast('로그인되었습니다.', 'success');
            setTimeout(() => location.reload(), 1000);
        } else {
            UIManager.showToast(result.message, 'error');
        }
    } catch (error) {
        UIManager.showToast('로그인 처리 중 오류가 발생했습니다.', 'error');
    }
}

/**
 * Mobile Menu Toggle
 */
function initMobileMenu() {
    const toggle = document.querySelector('.mobile-menu-toggle');
    const nav = document.querySelector('.main-nav');
    
    if (!toggle || !nav) return;

    // Create overlay element
    const overlay = document.createElement('div');
    overlay.className = 'mobile-menu-overlay';
    document.body.appendChild(overlay);

    // Toggle menu
    toggle.addEventListener('click', () => {
        toggle.classList.toggle('active');
        nav.classList.toggle('active');
        overlay.classList.toggle('active');
        document.body.style.overflow = nav.classList.contains('active') ? 'hidden' : '';
    });

    // Close menu when clicking overlay
    overlay.addEventListener('click', () => {
        toggle.classList.remove('active');
        nav.classList.remove('active');
        overlay.classList.remove('active');
        document.body.style.overflow = '';
    });

    // Close menu when clicking menu links
    const menuLinks = nav.querySelectorAll('.menu-links a, .social-links a, .admin-login-btn');
    menuLinks.forEach(link => {
        link.addEventListener('click', () => {
            toggle.classList.remove('active');
            nav.classList.remove('active');
            overlay.classList.remove('active');
            document.body.style.overflow = '';
        });
    });

    // Close menu on window resize if open
    window.addEventListener('resize', () => {
        if (window.innerWidth > 768 && nav.classList.contains('active')) {
            toggle.classList.remove('active');
            nav.classList.remove('active');
            overlay.classList.remove('active');
            document.body.style.overflow = '';
        }
    });
}

// Initialize mobile menu on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMobileMenu);
} else {
    initMobileMenu();
}
