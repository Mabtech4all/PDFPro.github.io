// Initialize PDF.js worker
PDFHandler.init();

// Initialize drag and drop functionality
DragDropHandler.init();

// Initialize UI handlers
UIHandler.init();

// Global functions for button actions
async function mergeFiles() {
    try {
        UIHandler.showLoading();
        const previews = document.querySelectorAll('.page-preview');
        if (previews.length === 0) {
            throw new Error('No files to merge');
        }

        const files = [];
        for (const preview of previews) {
            const fileName = preview.dataset.file;
            const pageNumber = parseInt(preview.dataset.page);
            
            // Get the original file from the file input
            const fileInput = document.getElementById('fileInput');
            const originalFile = Array.from(fileInput.files).find(f => f.name === fileName);
            
            if (originalFile) {
                files.push({
                    file: originalFile,
                    page: pageNumber
                });
            }
        }

        if (files.length === 0) {
            throw new Error('No valid files to merge');
        }

        const mergedPdf = await PDFHandler.mergePDFs(files);
        downloadFile(mergedPdf, 'merged.pdf');
        UIHandler.showSuccess('Files merged successfully!');
    } catch (error) {
        console.error('Error merging files:', error);
        UIHandler.showError('Error merging files: ' + error.message);
    } finally {
        UIHandler.hideLoading();
    }
}

async function compressFiles() {
    try {
        UIHandler.showLoading();
        const previews = document.querySelectorAll('.page-preview');
        if (previews.length === 0) {
            throw new Error('No files to compress');
        }

        const files = [];
        for (const preview of previews) {
            const fileName = preview.dataset.file;
            const pageNumber = parseInt(preview.dataset.page);
            
            // Get the original file from the file input
            const fileInput = document.getElementById('fileInput');
            const originalFile = Array.from(fileInput.files).find(f => f.name === fileName);
            
            if (originalFile) {
                files.push({
                    file: originalFile,
                    page: pageNumber
                });
            }
        }

        if (files.length === 0) {
            throw new Error('No valid files to compress');
        }

        const compressedPdf = await PDFHandler.compressPDF(files[0].file);
        downloadFile(compressedPdf, 'compressed.pdf');
        UIHandler.showSuccess('Files compressed successfully!');
    } catch (error) {
        console.error('Error compressing files:', error);
        UIHandler.showError('Error compressing files: ' + error.message);
    } finally {
        UIHandler.hideLoading();
    }
}

async function savePDF() {
    try {
        UIHandler.showLoading();
        const previews = document.querySelectorAll('.page-preview');
        if (previews.length === 0) {
            throw new Error('No files to save');
        }

        const files = [];
        for (const preview of previews) {
            const fileName = preview.dataset.file;
            const pageNumber = parseInt(preview.dataset.page);
            
            // Get the original file from the file input
            const fileInput = document.getElementById('fileInput');
            const originalFile = Array.from(fileInput.files).find(f => f.name === fileName);
            
            if (originalFile) {
                files.push({
                    file: originalFile,
                    page: pageNumber
                });
            }
        }

        if (files.length === 0) {
            throw new Error('No valid files to save');
        }

        const pdf = await PDFHandler.mergePDFs(files);
        downloadFile(pdf, 'document.pdf');
        UIHandler.showSuccess('PDF saved successfully!');
    } catch (error) {
        console.error('Error saving PDF:', error);
        UIHandler.showError('Error saving PDF: ' + error.message);
    } finally {
        UIHandler.hideLoading();
    }
}

function applyPageRange() {
    const pageRange = document.getElementById('pageRangeInput').value;
    if (!pageRange) {
        UIHandler.showError('Please enter a page range');
        return;
    }

    try {
        const previews = document.querySelectorAll('.page-preview');
        if (previews.length === 0) {
            throw new Error('No files to process');
        }

        const pages = pageRange.split(',').flatMap(range => {
            if (range.includes('-')) {
                const [start, end] = range.split('-').map(Number);
                return Array.from({ length: end - start + 1 }, (_, i) => start + i);
            }
            return [parseInt(range)];
        });

        const validPages = pages.filter(page => page > 0 && page <= previews.length);
        if (validPages.length === 0) {
            throw new Error('Invalid page range');
        }

        // Remove pages not in range
        previews.forEach((preview, index) => {
            if (!validPages.includes(index + 1)) {
                preview.remove();
            }
        });

        // Update page numbers after removing pages
        DragDropHandler.updatePageNumbers();
        UIHandler.showSuccess('Page range applied successfully!');
    } catch (error) {
        console.error('Error applying page range:', error);
        UIHandler.showError('Error applying page range: ' + error.message);
    }
}

function downloadFile(data, filename) {
    const blob = new Blob([data], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
} 