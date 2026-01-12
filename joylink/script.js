let currentCategory = 'aisite';
let links = [];
let isReorderMode = false;
let draggedItem = null;

// 초기 로드
document.addEventListener('DOMContentLoaded', () => {
    fetchLinks();
});

// 카테고리 설정
function setCategory(category) {
    currentCategory = category;
    
    // 탭 스타일 업데이트
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.innerText.toLowerCase().replace(' ', '') === category) {
            btn.classList.add('active');
        }
    });

    renderLinks();
}

// 링크 데이터 가져오기 (GET)
async function fetchLinks() {
    try {
        const response = await fetch('api.php');
        links = await response.json();
        renderLinks();
    } catch (error) {
        console.error('Error fetching links:', error);
    }
}

// 화면 그리기
function renderLinks() {
    const grid = document.getElementById('link-grid');
    grid.innerHTML = '';

    const filteredLinks = links.filter(link => link.category === currentCategory);

    filteredLinks.forEach(link => {
        const card = document.createElement('div');
        card.className = 'card';
        card.dataset.id = link.id;

        if (isReorderMode) {
            card.draggable = true;
            card.addEventListener('dragstart', handleDragStart);
            card.addEventListener('dragend', handleDragEnd);
            card.addEventListener('dragover', handleDragOver);
            card.addEventListener('drop', handleDrop);
        }

        card.innerHTML = `
            <div class="card-actions">
                <button class="action-btn" onclick="openModal('edit', ${link.id})">✎</button>
                <button class="action-btn" onclick="deleteLink(${link.id})">✕</button>
            </div>
            <a href="${link.url}" target="_blank" style="text-decoration: none; color: inherit; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;">
                <div class="card-title">${link.title}</div>
            </a>
        `;
        grid.appendChild(card);
    });
}

// Reorder Mode Toggle
function toggleReorderMode() {
    isReorderMode = !isReorderMode;
    document.body.classList.toggle('reorder-mode');
    document.getElementById('reorder-btn').classList.toggle('active');
    renderLinks();
}

// Drag & Drop Handlers
function handleDragStart(e) {
    draggedItem = this;
    this.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
}

function handleDragEnd(e) {
    this.classList.remove('dragging');
    draggedItem = null;
}

function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    return false;
}

function handleDrop(e) {
    e.stopPropagation();
    e.preventDefault();

    if (draggedItem !== this) {
        const draggedId = parseInt(draggedItem.dataset.id);
        const targetId = parseInt(this.dataset.id);

        const draggedIndex = links.findIndex(l => l.id == draggedId);
        const targetIndex = links.findIndex(l => l.id == targetId);

        if (draggedIndex > -1 && targetIndex > -1) {
            // Array swap
            const item = links.splice(draggedIndex, 1)[0];
            links.splice(targetIndex, 0, item);

            // Re-render immediately for visual feedback
            renderLinks();

            // Save new order
            saveOrder();
        }
    }
    return false;
}

// Save Order to Server
async function saveOrder() {
    // Map current array index to sort_order
    const orderData = links.map((link, index) => ({
        id: link.id,
        sort_order: index
    }));

    try {
        await fetch('api.php', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(orderData)
        });
    } catch (error) {
        console.error('Error saving order:', error);
    }
}


// 모달 열기
function openModal(mode = 'add', id = null) {
    const modal = document.getElementById('modal');
    const title = document.getElementById('modal-title');
    const nameInput = document.getElementById('site-name');
    const urlInput = document.getElementById('site-url');
    const categoryInput = document.getElementById('site-category');
    const idInput = document.getElementById('link-id');

    modal.classList.remove('hidden');

    if (mode === 'edit' && id) {
        const link = links.find(l => l.id == id);
        if (link) {
            title.innerText = 'Edit Link';
            nameInput.value = link.title;
            urlInput.value = link.url;
            categoryInput.value = link.category;
            idInput.value = link.id;
        }
    } else {
        title.innerText = 'Add New Link';
        nameInput.value = '';
        urlInput.value = '';
        categoryInput.value = currentCategory;
        idInput.value = '';
    }
}

// 모달 닫기
function closeModal() {
    document.getElementById('modal').classList.add('hidden');
}

// 링크 저장 (추가 또는 수정)
async function saveLink() {
    const id = document.getElementById('link-id').value;
    const title = document.getElementById('site-name').value;
    const url = document.getElementById('site-url').value;
    const category = document.getElementById('site-category').value;

    if (!title || !url) {
        alert('Please fill in all fields.');
        return;
    }

    const data = { title, url, category };
    let method = 'POST';
    
    if (id) {
        method = 'PUT';
        data.id = id;
    }

    try {
        const response = await fetch('api.php', {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (response.ok) {
            closeModal();
            fetchLinks(); // 목록 새로고침
        } else {
            alert('Failed to save link.');
        }
    } catch (error) {
        console.error('Error saving link:', error);
    }
}

// 링크 삭제
async function deleteLink(id) {
    if (!confirm('Are you sure you want to delete this link?')) return;

    try {
        const response = await fetch('api.php', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id })
        });

        if (response.ok) {
            fetchLinks();
        } else {
            alert('Failed to delete link.');
        }
    } catch (error) {
        console.error('Error deleting link:', error);
    }
}