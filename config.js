const CONFIG = {
    pdfWorkerPath: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js',
    maxFileSize: 50 * 1024 * 1024, // 50MB
    allowedFileTypes: ['.pdf', '.jpg', '.jpeg', '.png'],
    maxFiles: 20,
    previewQuality: 0.5,
    compressionLevel: 0.8,
    defaultPageSize: {
        width: 595.28, // A4 width in points
        height: 841.89 // A4 height in points
    },
    adSpaces: {
        header: { width: 728, height: 90 },
        sidebar: { width: 300, height: 250 },
        skyscraper: { width: 160, height: 600 },
        footer: { width: 728, height: 90 }
    }
}; 