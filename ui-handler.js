const UIHandler = {
    init() {
        this.setupEventListeners();
        this.setupModals();
    },

    setupEventListeners() {
        // Sidebar menu items
        document.querySelectorAll('.sidebar .nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const action = e.target.dataset.action;
                this.handleSidebarAction(action);
            });
        });

        // Page preview click
        document.getElementById('previewList').addEventListener('click', (e) => {
            const preview = e.target.closest('.page-preview');
            if (preview) {
                this.showFullScreenPreview(preview);
            }
        });
    },

    setupModals() {
        const previewModal = document.getElementById('previewModal');
        const closeBtn = previewModal.querySelector('.close-btn');
        
        closeBtn.addEventListener('click', () => {
            const modal = bootstrap.Modal.getInstance(previewModal);
            modal.hide();
        });
    },

    handleSidebarAction(action) {
        switch (action) {
            case 'word-to-pdf':
                Utils.showNotification('Word to PDF conversion coming soon!', 'info');
                break;
            case 'image-to-pdf':
                document.getElementById('fileInput').click();
                break;
            case 'add-watermark':
                Utils.showNotification('Watermark feature coming soon!', 'info');
                break;
            case 'unlock-pdf':
                Utils.showNotification('PDF unlocking feature coming soon!', 'info');
                break;
            case 'compress-to-mail':
                Utils.showNotification('Compress to mail feature coming soon!', 'info');
                break;
            case 'pdf-to-images':
                Utils.showNotification('PDF to images conversion coming soon!', 'info');
                break;
        }
    },

    showFullScreenPreview(preview) {
        const modal = new bootstrap.Modal(document.getElementById('previewModal'));
        const previewContent = document.getElementById('previewContent');
        
        // Clear previous content
        previewContent.innerHTML = '';
        
        // Clone the preview image
        const img = preview.querySelector('img').cloneNode();
        img.style.maxWidth = '100%';
        img.style.maxHeight = '80vh';
        previewContent.appendChild(img);
        
        modal.show();
    },

    updateFileList(files) {
        const fileList = document.getElementById('fileList');
        fileList.innerHTML = '';
        
        files.forEach(file => {
            const fileItem = document.createElement('div');
            fileItem.className = 'file-item mb-2';
            fileItem.innerHTML = `
                <div class="d-flex justify-content-between align-items-center">
                    <span>${file.name}</span>
                    <span class="text-muted">${Utils.formatFileSize(file.size)}</span>
                </div>
            `;
            fileList.appendChild(fileItem);
        });
    },

    showLoading() {
        const loadingOverlay = document.createElement('div');
        loadingOverlay.className = 'loading-overlay';
        loadingOverlay.innerHTML = `
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
        `;
        document.body.appendChild(loadingOverlay);
    },

    hideLoading() {
        const loadingOverlay = document.querySelector('.loading-overlay');
        if (loadingOverlay) {
            loadingOverlay.remove();
        }
    },

    showError(message) {
        Utils.showNotification(message, 'error');
    },

    showSuccess(message) {
        Utils.showNotification(message, 'success');
    }
}; 