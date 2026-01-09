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
            
            countElements.forEach(el => {
                const category = el.getAttribute('data-category');
                const count = stats[category] || 0;
                el.innerText = `${count} Posts`;
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
                    const categoryBadge = document.querySelector('.category-badge');
                    const category = categoryBadge ? categoryBadge.innerText.toLowerCase() : 'ailand'; // 기본값 ailand

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
    if (titleEl) titleEl.innerText = category.toUpperCase();

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
                let thumbHtml = '<div class="img-placeholder">Thumb</div>';
                if (post.thumbnail) {
                    thumbHtml = `<img src="${post.thumbnail}" alt="${post.title}" style="width: 100%; height: 100%; object-fit: cover;">`;
                }
                
                postItem.innerHTML = `
                    <div class="post-thumb">
                        ${thumbHtml}
                    </div>
                    <div class="post-info">
                        <h3 class="post-title">${post.title}</h3>
                        <p class="post-summary">${post.content.substring(0, 150)}...</p>
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
            postListContainer.innerHTML = '<p class="no-data">등록된 게시물이 없습니다.</p>';
            renderPagination(0, 1, limit, category);
        }
    } catch (error) {
        console.error('Error fetching posts:', error);
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
            document.querySelector('.view-title').innerText = post.title;
            document.querySelector('.category-badge').innerText = post.category.toUpperCase();
            document.querySelector('.view-meta .date').innerText = post.created_at;
            //document.querySelector('.view-content').innerHTML = post.content.replace(/\n/g, '<br>');
            const contentP = document.querySelector('.view-content p');
            if (contentP) {
                contentP.innerHTML = post.content.replace(/\n/g, '<br>');
            }

            // 미디어 및 첨부파일 처리
            const mediaWrapper = document.querySelector('.content-media-wrapper');
            const fileListContainer = document.querySelector('.attachment-list');
            const fileListUl = document.getElementById('file-download-list');
            
            if (mediaWrapper) mediaWrapper.innerHTML = '';
            if (fileListUl) fileListUl.innerHTML = '';
            if (fileListContainer) fileListContainer.style.display = 'none';

            if (post.media && post.media.length > 0) {
                post.media.forEach(media => {
                    // 경로 정리: ../ 제거 및 uploads/ 확인
                    let cleanPath = media.file_path.replace(/^(\.\.\/)+/, '');
                    
                    const ext = cleanPath.split('.').pop().toLowerCase();
                    const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext);
                    const isVideo = ['mp4', 'webm', 'ogg'].includes(ext);

                    if (isImage) {
                        if (mediaWrapper) {
                            const img = document.createElement('img');
                            img.src = cleanPath;
                            img.style.width = '50%';
                            img.style.maxWidth = '50%';
                            img.style.marginBottom = '1rem';
                            img.style.display = 'block'; 
                            img.style.margin = '0 auto 1rem auto'; // 중앙 정렬
                            img.style.cursor = 'pointer';
                            
                            img.onerror = () => {
                                console.error('Image load failed:', cleanPath);
                                img.alt = '이미지를 불러올 수 없습니다.';
                            };

                            img.onclick = () => window.open(cleanPath, '_blank');

                            mediaWrapper.appendChild(img);
                        }
                    } else if (isVideo) {
                        if (mediaWrapper) {
                            const video = document.createElement('video');
                            video.src = cleanPath;
                            video.controls = true;
                            video.style.maxWidth = '100%';
                            video.style.marginBottom = '1rem';
                            video.style.display = 'block';
                            video.style.margin = '0 auto 1rem auto';
                            mediaWrapper.appendChild(video);
                        }
                    } else {
                        // 그 외 파일은 다운로드 목록에 추가
                        if (fileListUl && fileListContainer) {
                            const li = document.createElement('li');
                            const a = document.createElement('a');
                            a.href = cleanPath;
                            a.download = media.original_name || cleanPath.split('/').pop();
                            a.innerHTML = `<i class="fas fa-file-download"></i> ${media.original_name || '첨부파일'}`;
                            a.style.textDecoration = 'none';
                            a.style.color = '#333';
                            
                            li.style.marginBottom = '0.5rem';
                            li.appendChild(a);
                            fileListUl.appendChild(li);
                            
                            fileListContainer.style.display = 'block'; 
                        }
                    }
                });
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
