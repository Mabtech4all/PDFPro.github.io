let pagePreviews = [];

const DragDropHandler = {
    init() {
        const dropZone = document.getElementById('dragDropZone');
        const fileInput = document.getElementById('fileInput');
        this.setupDragAndDrop(dropZone);
        this.setupFileInput(fileInput);
        this.setupPageReordering();
    },

    setupDragAndDrop(dropZone) {
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, this.preventDefaults, false);
        });
        ['dragenter', 'dragover'].forEach(eventName => {
            dropZone.addEventListener(eventName, () => {
                dropZone.classList.add('dragover');
            });
        });
        ['dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, () => {
                dropZone.classList.remove('dragover');
            });
        });
        dropZone.addEventListener('drop', (e) => {
            const files = Array.from(e.dataTransfer.files);
            this.handleFiles(files);
        });
    },

    setupFileInput(fileInput) {
        fileInput.addEventListener('change', (e) => {
            const files = Array.from(e.target.files);
            this.handleFiles(files);
        });
    },

    setupPageReordering() {
        let dragSrcIndex = null;
        interact('.page-preview').draggable({
            inertia: false,
            modifiers: [
                interact.modifiers.restrictRect({
                    restriction: 'parent',
                    endOnly: true
                })
            ],
            autoScroll: false,
            listeners: {
                start: (event) => {
                    const previews = Array.from(document.querySelectorAll('.page-preview'));
                    dragSrcIndex = previews.indexOf(event.target);
                    event.target.classList.add('dragging');
                },
                move: this.dragMoveListener,
                end: (event) => {
                    const previews = Array.from(document.querySelectorAll('.page-preview'));
                    const target = event.target;
                    target.style.transform = 'none';
                    target.classList.remove('dragging');
                    target.style.zIndex = '';
                    // Find drop index
                    let dropIndex = dragSrcIndex;
                    let minDist = Infinity;
                    const targetRect = target.getBoundingClientRect();
                    const targetCenter = targetRect.left + targetRect.width / 2;
                    previews.forEach((el, idx) => {
                        if (el === target) return;
                        const rect = el.getBoundingClientRect();
                        const center = rect.left + rect.width / 2;
                        const dist = Math.abs(center - targetCenter);
                        if (dist < minDist) {
                            minDist = dist;
                            dropIndex = idx;
                        }
                    });
                    // Move the dragged page in the array
                    if (dragSrcIndex !== null && dropIndex !== null && dragSrcIndex !== dropIndex) {
                        const moved = pagePreviews.splice(dragSrcIndex, 1)[0];
                        pagePreviews.splice(dropIndex, 0, moved);
                    }
                    this.renderAllPreviews();
                    dragSrcIndex = null;
                }
            }
        });
    },

    dragMoveListener(event) {
        const target = event.target;
        const x = (parseFloat(target.getAttribute('data-x')) || 0) + event.dx;
        const y = (parseFloat(target.getAttribute('data-y')) || 0) + event.dy;
        requestAnimationFrame(() => {
            target.style.transform = `translate(${x}px, ${y}px)`;
            target.setAttribute('data-x', x);
            target.setAttribute('data-y', y);
        });
    },

    async handleFiles(files) {
        if (files.length > CONFIG.maxFiles) {
            Utils.showNotification(`Maximum ${CONFIG.maxFiles} files allowed`, 'warning');
            return;
        }
        UIHandler.showLoading();
        try {
            for (const file of files) {
                if (!Utils.isValidFileType(file.name)) {
                    Utils.showNotification(`Invalid file type: ${file.name}`, 'error');
                    continue;
                }
                if (!Utils.isValidFileSize(file.size)) {
                    Utils.showNotification(`File too large: ${file.name}`, 'error');
                    continue;
                }
                if (file.type.startsWith('image/')) {
                    const pdfBytes = await Utils.convertImageToPDF(file);
                    const pdfFile = new File([pdfBytes], file.name.replace(/\.[^/.]+$/, '.pdf'), { type: 'application/pdf' });
                    await this.addFileToPreview(pdfFile, file, 'image');
                } else {
                    await this.addFileToPreview(file, file, 'pdf');
                }
            }
        } catch (error) {
            console.error('Error processing files:', error);
            Utils.showNotification('Error processing files', 'error');
        } finally {
            UIHandler.hideLoading();
        }
    },

    async addFileToPreview(file, originalFile, type) {
        const pdf = await PDFHandler.loadPDF(file);
        const pageCount = pdf.numPages;
        for (let i = 1; i <= pageCount; i++) {
            const imageData = await PDFHandler.getPageAsImage(pdf, i);
            pagePreviews.push({ imageData, fileName: file.name, pageNumber: i, file: originalFile, type });
        }
        this.renderAllPreviews();
    },

    renderAllPreviews() {
        const previewList = document.getElementById('previewList');
        previewList.innerHTML = '';
        pagePreviews.forEach((page, idx) => {
            const preview = document.createElement('div');
            preview.className = 'page-preview';
            preview.setAttribute('data-file', page.fileName);
            preview.setAttribute('data-page', page.pageNumber);
            // Page image
            const img = document.createElement('img');
            img.src = page.imageData;
            img.alt = `Page ${page.pageNumber} of ${page.fileName}`;
            preview.appendChild(img);
            // Page number (top-right)
            const pageNumberSpan = document.createElement('span');
            pageNumberSpan.className = 'page-number';
            pageNumberSpan.textContent = idx + 1;
            preview.appendChild(pageNumberSpan);
            // Delete button (centered, pink, trash icon)
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-page-btn';
            deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
            deleteBtn.onclick = (e) => {
                e.stopPropagation();
                pagePreviews.splice(idx, 1);
                this.renderAllPreviews();
            };
            preview.appendChild(deleteBtn);
            // Magnifier button (bottom-right)
            const magnifierBtn = document.createElement('button');
            magnifierBtn.className = 'magnifier-btn';
            magnifierBtn.innerHTML = '<i class="fas fa-search"></i>';
            magnifierBtn.onclick = (e) => {
                e.stopPropagation();
                this.showZoomablePreview(page.imageData);
            };
            preview.appendChild(magnifierBtn);
            previewList.appendChild(preview);
        });
    },

    showZoomablePreview(imageData) {
        const modalEl = document.getElementById('previewModal');
        const previewContent = document.getElementById('previewContent');
        previewContent.innerHTML = '';

        // Zoom controls
        const zoomControls = document.createElement('div');
        zoomControls.className = 'zoom-controls';
        const zoomInBtn = document.createElement('button');
        zoomInBtn.className = 'zoom-btn';
        zoomInBtn.innerHTML = '<i class="fas fa-search-plus"></i>';
        const zoomOutBtn = document.createElement('button');
        zoomOutBtn.className = 'zoom-btn';
        zoomOutBtn.innerHTML = '<i class="fas fa-search-minus"></i>';
        const zoomResetBtn = document.createElement('button');
        zoomResetBtn.className = 'zoom-btn';
        zoomResetBtn.innerHTML = '<i class="fas fa-compress"></i>';
        zoomControls.appendChild(zoomInBtn);
        zoomControls.appendChild(zoomOutBtn);
        zoomControls.appendChild(zoomResetBtn);
        previewContent.appendChild(zoomControls);

        // Image
        const img = document.createElement('img');
        img.src = imageData;
        img.style.transform = 'scale(1)';
        img.style.transition = 'transform 0.2s';
        let scale = 1;
        previewContent.appendChild(img);

        // Zoom logic
        zoomInBtn.onclick = () => {
            scale = Math.min(scale + 0.2, 4);
            img.style.transform = `scale(${scale})`;
        };
        zoomOutBtn.onclick = () => {
            scale = Math.max(scale - 0.2, 0.2);
            img.style.transform = `scale(${scale})`;
        };
        zoomResetBtn.onclick = () => {
            scale = 1;
            img.style.transform = 'scale(1)';
        };
        // Mouse wheel zoom
        img.onwheel = (e) => {
            e.preventDefault();
            if (e.deltaY < 0) {
                scale = Math.min(scale + 0.1, 4);
            } else {
                scale = Math.max(scale - 0.1, 0.2);
            }
            img.style.transform = `scale(${scale})`;
        };

        // Modern close button
        let closeBtn = modalEl.querySelector('.close-btn');
        if (!closeBtn) {
            closeBtn = document.createElement('button');
            closeBtn.className = 'close-btn';
            closeBtn.innerHTML = '<i class="fas fa-times"></i>';
            closeBtn.onclick = () => {
                const modal = bootstrap.Modal.getInstance(modalEl);
                modal.hide();
            };
            modalEl.querySelector('.preview-container').appendChild(closeBtn);
        } else {
            closeBtn.style.display = 'flex';
        }

        // Show modal
        const modal = new bootstrap.Modal(modalEl);
        modal.show();
    },

    updatePageNumbers() {
        this.renderAllPreviews();
    },

    preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }
}; 