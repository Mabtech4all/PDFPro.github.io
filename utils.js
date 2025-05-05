const Utils = {
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },

    getFileExtension(filename) {
        return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2).toLowerCase();
    },

    isValidFileType(filename) {
        const ext = this.getFileExtension(filename);
        return CONFIG.allowedFileTypes.includes('.' + ext);
    },

    isValidFileSize(size) {
        return size <= CONFIG.maxFileSize;
    },

    generateUniqueId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `alert alert-${type} notification`;
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    },

    async loadImage(file) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = URL.createObjectURL(file);
        });
    },

    async convertImageToPDF(imageFile) {
        try {
            const image = await this.loadImage(imageFile);
            const pdfDoc = await PDFLib.PDFDocument.create();
            const page = pdfDoc.addPage([image.width, image.height]);
            
            const imageBytes = await imageFile.arrayBuffer();
            const imageEmbed = await pdfDoc.embedJpg(imageBytes);
            
            page.drawImage(imageEmbed, {
                x: 0,
                y: 0,
                width: image.width,
                height: image.height
            });
            
            return await pdfDoc.save();
        } catch (error) {
            console.error('Error converting image to PDF:', error);
            throw error;
        }
    }
}; 