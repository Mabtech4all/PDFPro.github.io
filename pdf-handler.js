const PDFHandler = {
    async init() {
        pdfjsLib.GlobalWorkerOptions.workerSrc = CONFIG.pdfWorkerPath;
    },

    async loadPDF(file) {
        try {
            const arrayBuffer = await file.arrayBuffer();
            const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
            return pdf;
        } catch (error) {
            console.error('Error loading PDF:', error);
            throw error;
        }
    },

    async getPageAsImage(pdf, pageNumber) {
        try {
            const page = await pdf.getPage(pageNumber);
            const viewport = page.getViewport({ scale: CONFIG.previewQuality });
            
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.width = viewport.width;
            canvas.height = viewport.height;
            
            await page.render({
                canvasContext: context,
                viewport: viewport
            }).promise;
            
            return canvas.toDataURL('image/jpeg');
        } catch (error) {
            console.error('Error rendering PDF page:', error);
            throw error;
        }
    },

    async mergePDFs(files) {
        try {
            const mergedPdf = await PDFLib.PDFDocument.create();
            
            for (const { file, page } of files) {
                const pdfBytes = await file.arrayBuffer();
                const pdf = await PDFLib.PDFDocument.load(pdfBytes);
                
                if (page) {
                    // If specific page is requested, only copy that page
                    const [copiedPage] = await mergedPdf.copyPages(pdf, [page - 1]);
                    mergedPdf.addPage(copiedPage);
                } else {
                    // If no specific page, copy all pages
                    const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
                    pages.forEach(page => mergedPdf.addPage(page));
                }
            }
            
            return await mergedPdf.save();
        } catch (error) {
            console.error('Error merging PDFs:', error);
            throw error;
        }
    },

    async compressPDF(pdfFile) {
        try {
            const pdfBytes = await pdfFile.arrayBuffer();
            const pdf = await PDFLib.PDFDocument.load(pdfBytes);
            
            const compressedPdf = await PDFLib.PDFDocument.create();
            const pages = await compressedPdf.copyPages(pdf, pdf.getPageIndices());
            
            pages.forEach(page => {
                compressedPdf.addPage(page);
            });
            
            return await compressedPdf.save({
                useObjectStreams: true,
                addDefaultPage: false,
                objectsPerTick: 20,
                updateFieldAppearances: false,
                compress: true
            });
        } catch (error) {
            console.error('Error compressing PDF:', error);
            throw error;
        }
    },

    async extractPages(pdfFile, pageRange) {
        try {
            const pdfBytes = await pdfFile.arrayBuffer();
            const pdf = await PDFLib.PDFDocument.load(pdfBytes);
            const extractedPdf = await PDFLib.PDFDocument.create();
            
            const pages = pageRange.split(',').flatMap(range => {
                if (range.includes('-')) {
                    const [start, end] = range.split('-').map(Number);
                    return Array.from({ length: end - start + 1 }, (_, i) => start + i - 1);
                }
                return [parseInt(range) - 1];
            });
            
            const copiedPages = await extractedPdf.copyPages(pdf, pages);
            copiedPages.forEach(page => extractedPdf.addPage(page));
            
            return await extractedPdf.save();
        } catch (error) {
            console.error('Error extracting pages:', error);
            throw error;
        }
    }
}; 