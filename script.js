document.addEventListener('DOMContentLoaded', () => {
    const fileInput = document.getElementById('fileInput');
    const dragDropZone = document.getElementById('dragDropZone');
    const fileList = document.getElementById('fileList');
    const previewList = document.getElementById('previewList');
    const pageRangeInput = document.getElementById('pageRangeInput');

    // Handle file input change
    fileInput.addEventListener('change', handleFiles);

    // Handle drag and drop
    dragDropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dragDropZone.classList.add('dragover');
    });

    dragDropZone.addEventListener('dragleave', () => {
        dragDropZone.classList.remove('dragover');
    });

    dragDropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dragDropZone.classList.remove('dragover');
        handleFiles(e);
    });

    function handleFiles(event) {
        const files = event.target.files || event.dataTransfer.files;
        fileList.innerHTML = '';
        Array.from(files).forEach(file => {
            const li = document.createElement('li');
            li.textContent = file.name;
            fileList.appendChild(li);
        });
    }

    // Button functions
    window.convertWordToPDF = () => alert('Convert Word to PDF functionality placeholder');
    window.imageToPDF = () => alert('Image to PDF functionality placeholder');
    window.addWatermark = () => alert('Add Watermark functionality placeholder');
    window.unlockPDF = () => alert('Unlock PDF functionality placeholder');
    window.compressToMail = () => alert('Compress to Mail functionality placeholder');
    window.pdfToImages = () => alert('PDF to Images functionality placeholder');
    window.applyPageRange = () => alert('Apply Page Range functionality placeholder');
    window.mergeFiles = () => alert('Merge Files functionality placeholder');
    window.compressFiles = () => alert('Compress Files functionality placeholder');
    window.savePDF = () => alert('Save PDF functionality placeholder');
});