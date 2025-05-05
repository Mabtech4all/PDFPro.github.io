const fileInput = document.getElementById('fileInput');
const fileList = document.getElementById('fileList');
const previewList = document.getElementById('previewList');
const pageRangeInput = document.getElementById('pageRangeInput');
const dragDropZone = document.getElementById('dragDropZone');
const previewModal = new bootstrap.Modal(document.getElementById('previewModal'));
const videoAdModal = new bootstrap.Modal(document.getElementById('videoAdModal'));
const previewContent = document.getElementById('previewContent');
const mergeBtn = document.getElementById('mergeBtn');
const compressBtn = document.getElementById('compressBtn');
const saveBtn = document.getElementById('saveBtn');
let filesArray = []; // [{file, type: 'pdf'|'image', pages: [{pageNum, included, fileIndex}]}]
let allPages = []; // [{fileIndex, pageNum, type: 'pdf'|'image'}]
let isDragging = false;

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';

// Initialize drag-and-drop
setupDragAndDrop();

// Handle file selection
fileInput.addEventListener('change', (e) => {
    const newFiles = Array.from(e.target.files);
    newFiles.forEach(processNewFile);
    fileInput.value = '';
});

// Drag and drop files
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
    const droppedFiles = Array.from(e.dataTransfer.files);
    droppedFiles.forEach(processNewFile);
});

// Process new file
async function processNewFile(file) {
    const fileIndex = filesArray.length;
    const type = file.type === 'application/pdf' ? 'pdf' : 'image';
    if (type !== 'pdf' && !file.type.startsWith('image/')) {
        alert(`${file.name} is not a supported file type!`);
        return;
    }

    filesArray.push({ file, type, pages: [] });
    renderFileList();

    if (type === 'pdf') {
        const fileReader = new FileReader();
        fileReader.onload = async () => {
            const typedArray = new Uint8Array(fileReader.result);
            const pdf = await pdfjsLib.getDocument(typedArray).promise;
            const numPages = pdf.numPages;
            filesArray[fileIndex].pages = Array.from({ length: numPages }, (_, i) => ({
                pageNum: i + 1,
                included: true,
                fileIndex
            }));
            updateAllPages();
            await renderAllPreviews();
        };
        fileReader.readAsArrayBuffer(file);
    } else {
        filesArray[fileIndex].pages = [{ pageNum: 1, included: true, fileIndex }];
        updateAllPages();
        await renderAllPreviews();
    }
}

// Render file list
function renderFileList() {
    fileList.innerHTML = '';
    filesArray.forEach((item, index) => {
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';
        fileItem.innerHTML = `
            <span>${item.file.name} (${(item.file.size / 1024 / 1024).toFixed(2)} MB)</span>
            <div>
                <button class="btn btn-sm btn-success me-2" onclick="addMoreFiles()">+</button>
                <button class="btn btn-sm btn-danger" onclick="deleteFile(${index})">Delete</button>
            </div>
        `;
        fileList.appendChild(fileItem);
    });
}

// Update allPages array
function updateAllPages() {
    allPages = [];
    filesArray.forEach((item, fileIndex) => {
        item.pages.forEach(page => {
            if (page.included) {
                allPages.push({ fileIndex, pageNum: page.pageNum, type: item.type });
            }
        });
    });
}

// Render all previews
async function renderAllPreviews() {
    previewList.innerHTML = '';
    allPages.forEach((page, index) => {
        const { fileIndex, pageNum, type } = page;
        const file = filesArray[fileIndex].file;
        const pageDiv = document.createElement('div');
        pageDiv.className = 'page-preview';
        pageDiv.dataset.fileIndex = fileIndex;
        pageDiv.dataset.pageNum = pageNum;
        pageDiv.dataset.index = index;
        pageDiv.innerHTML = `
            <span class="page-number">${index + 1}</span>
            <button class="delete-page-btn" data-file-index="${fileIndex}" data-page-num="${pageNum - 1}">
                <i class="fas fa-trash"></i>
            </button>
            <button class="preview-btn" data-file-index="${fileIndex}" data-page-num="${pageNum}">
                <i class="fas fa-search"></i>
            </button>
        `;

        // Delete button event
        pageDiv.querySelector('.delete-page-btn').addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const fileIndex = parseInt(e.target.closest('.delete-page-btn').dataset.fileIndex);
            const pageIndex = parseInt(e.target.closest('.delete-page-btn').dataset.pageNum);
            deletePage(fileIndex, pageIndex);
        });

        // Preview button event
        pageDiv.querySelector('.preview-btn').addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const fileIndex = parseInt(e.target.closest('.preview-btn').dataset.fileIndex);
            const pageNum = parseInt(e.target.closest('.preview-btn').dataset.pageNum);
            showFullScreenPreview(fileIndex, pageNum, type);
        });

        if (type === 'pdf') {
            const fileReader = new FileReader();
            fileReader.onload = async () => {
                const typedArray = new Uint8Array(fileReader.result);
                const pdf = await pdfjsLib.getDocument(typedArray).promise;
                const pdfPage = await pdf.getPage(pageNum);
                const viewport = pdfPage.getViewport({ scale: 0.3 });
                const canvas = document.createElement('canvas');
                canvas.width = viewport.width;
                canvas.height = viewport.height;
                canvas.alt = `Preview of page ${pageNum} from ${file.name}`;
                const context = canvas.getContext('2d');
                await pdfPage.render({ canvasContext: context, viewport }).promise;
                pageDiv.appendChild(canvas);
                previewList.appendChild(pageDiv);
            };
            fileReader.readAsArrayBuffer(file);
        } else {
            const img = document.createElement('img');
            img.src = URL.createObjectURL(file);
            img.alt = `Preview of ${file.name}`;
            img.onload = () => URL.revokeObjectURL(img.src);
            pageDiv.appendChild(img);
            previewList.appendChild(pageDiv);
        }
    });
}

// Show full-screen preview
async function showFullScreenPreview(fileIndex, pageNum, type) {
    previewContent.innerHTML = '';
    const file = filesArray[fileIndex].file;

    if (type === 'pdf') {
        const fileReader = new FileReader();
        fileReader.onload = async () => {
            const typedArray = new Uint8Array(fileReader.result);
            const pdf = await pdfjsLib.getDocument(typedArray).promise;
            const pdfPage = await pdf.getPage(pageNum);
            const viewport = pdfPage.getViewport({ scale: 1.5 });
            const canvas = document.createElement('canvas');
            canvas.width = viewport.width;
            canvas.height = viewport.height;
            canvas.alt = `Full-screen preview of page ${pageNum} from ${file.name}`;
            const context = canvas.getContext('2d');
            await pdfPage.render({ canvasContext: context, viewport }).promise;
            previewContent.appendChild(canvas);
            previewModal.show();
        };
        fileReader.readAsArrayBuffer(file);
    } else {
        const img = document.createElement('img');
        img.src = URL.createObjectURL(file);
        img.alt = `Full-screen preview of ${file.name}`;
        img.style.maxWidth = '100%';
        img.style.maxHeight = '70vh';
        img.onload = () => URL.revokeObjectURL(img.src);
        previewContent.appendChild(img);
        previewModal.show();
    }
}

// Setup drag-and-drop for page reordering
function setupDragAndDrop() {
    interact('#previewList .page-preview').draggable({
        inertia: false,
        autoScroll: true,
        modifiers: [
            interact.modifiers.restrictRect({
                restriction: '#previewList',
                endOnly: true
            })
        ],
        listeners: {
            start(event) {
                isDragging = true;
                event.target.classList.add('dragging');
            },
            move(event) {
                const target = event.target;
                const x = (parseFloat(target.getAttribute('data-x')) || 0) + event.dx;
                const y = (parseFloat(target.getAttribute('data-y')) || 0) + event.dy;
                target.style.transform = `translate(${x}px, ${y}px)`;
                target.setAttribute('data-x', x);
                target.setAttribute('data-y', y);

                // Highlight potential drop target
                const dropzone = document.elementFromPoint(event.clientX, event.clientY);
                document.querySelectorAll('.page-preview').forEach(el => el.classList.remove('dragover'));
                if (dropzone && dropzone.closest('.page-preview') && dropzone.closest('.page-preview') !== target) {
                    dropzone.closest('.page-preview').classList.add('dragover');
                }
            },
            end(event) {
                isDragging = false;
                const target = event.target;
                target.classList.remove('dragging');
                target.style.transform = '';
                target.removeAttribute('data-x');
                target.removeAttribute('data-y');

                // Find drop target based on mouse position
                const rect = previewList.getBoundingClientRect();
                const dropY = event.clientY - rect.top;
                const previews = Array.from(previewList.querySelectorAll('.page-preview'));
                let dropIndex = previews.findIndex(preview => {
                    const previewRect = preview.getBoundingClientRect();
                    return dropY <= (previewRect.top - rect.top + previewRect.height / 2);
                });
                if (dropIndex === -1) dropIndex = previews.length;

                const targetIndex = parseInt(target.dataset.index);
                document.querySelectorAll('.page-preview').forEach(el => el.classList.remove('dragover'));

                if (dropIndex !== targetIndex) {
                    // Swap pages in allPages array
                    const movedPage = allPages.splice(targetIndex, 1)[0];
                    allPages.splice(dropIndex, 0, movedPage);

                    // Reorder DOM elements
                    const targetElement = previews[targetIndex];
                    if (dropIndex < targetIndex) {
                        previewList.insertBefore(targetElement, previews[dropIndex]);
                    } else {
                        previewList.insertBefore(targetElement, previews[dropIndex].nextSibling);
                    }

                    // Update indices and page numbers
                    previews.forEach((preview, idx) => {
                        preview.dataset.index = idx;
                        preview.querySelector('.page-number').textContent = idx + 1;
                    });
                }
            }
        }
    });
}

// Delete file
function deleteFile(index) {
    filesArray.splice(index, 1);
    renderFileList();
    updateAllPages();
    renderAllPreviews();
}

// Delete page
function deletePage(fileIndex, pageIndex) {
    if (filesArray[fileIndex] && filesArray[fileIndex].pages[pageIndex]) {
        filesArray[fileIndex].pages[pageIndex].included = false;
        updateAllPages();
        renderAllPreviews();
    } else {
        console.error(`Invalid fileIndex: ${fileIndex} or pageIndex: ${pageIndex}`);
    }
}

// Add more files
function addMoreFiles() {
    fileInput.click();
}

// Apply page range
function applyPageRange() {
    const rangeInput = pageRangeInput.value.trim();
    if (!rangeInput) return;

    const ranges = rangeInput.split(',').map(r => r.trim());
    filesArray.forEach(fileItem => {
        fileItem.pages.forEach(page => {
            page.included = false;
        });
    });

    ranges.forEach(range => {
        if (range.includes('-')) {
            const [start, end] = range.split('-').map(n => parseInt(n.trim()));
            if (isNaN(start) || isNaN(end)) {
                alert('Invalid range format');
                return;
            }
            filesArray.forEach(fileItem => {
                fileItem.pages.forEach(page => {
                    if (page.pageNum >= start && page.pageNum <= end) {
                        page.included = true;
                    }
                });
            });
        } else {
            const pageNum = parseInt(range);
            if (isNaN(pageNum)) {
                alert('Invalid page number');
                return;
            }
            filesArray.forEach(fileItem => {
                fileItem.pages.forEach(page => {
                    if (page.pageNum === pageNum) {
                        page.included = true;
                    }
                });
            });
        }
    });

    updateAllPages();
    renderAllPreviews();
}

// Set button loading state
function setButtonLoading(btn, isLoading) {
    btn.disabled = isLoading;
    if (isLoading) {
        btn.innerHTML = `${btn.textContent} <span class="spinner-border spinner-border-sm"></span>`;
    } else {
        btn.innerHTML = btn.textContent.replace(/ <span.*<\/span>/, '');
    }
}

// Merge files
async function mergeFiles() {
    if (allPages.length < 2) {
        alert('Please upload at least two pages to merge.');
        return;
    }

    setButtonLoading(mergeBtn, true);
    try {
        const pdfDoc = await PDFLib.PDFDocument.create();
        for (const page of allPages) {
            const { fileIndex, pageNum, type } = page;
            const file = filesArray[fileIndex].file;

            if (type === 'pdf') {
                const arrayBuffer = await file.arrayBuffer();
                const srcPdf = await PDFLib.PDFDocument.load(arrayBuffer);
                const [copiedPage] = await pdfDoc.copyPages(srcPdf, [pageNum - 1]);
                pdfDoc.addPage(copiedPage);
            } else {
                const imgData = await new Promise(resolve => {
                    const img = new Image();
                    img.src = URL.createObjectURL(file);
                    img.onload = () => {
                        const canvas = document.createElement('canvas');
                        canvas.width = img.width;
                        canvas.height = img.height;
                        canvas.getContext('2d').drawImage(img, 0, 0);
                        URL.revokeObjectURL(img.src);
                        resolve(canvas.toDataURL('image/jpeg'));
                    };
                });
                const img = file.type === 'image/png' ?
                    await pdfDoc.embedPng(imgData) :
                    await pdfDoc.embedJpg(imgData);
                const page = pdfDoc.addPage([img.width, img.height]);
                page.drawImage(img, { x: 0, y: 0, width: img.width, height: img.height });
            }
        }

        const pdfBytes = await pdfDoc.save();
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'merged.pdf';
        link.click();
        URL.revokeObjectURL(link.href);
        alert('Files merged successfully!');
    } catch (error) {
        console.error('Merge error:', error);
        alert('Error merging files. Please try again.');
    } finally {
        setButtonLoading(mergeBtn, false);
    }
}

// Compress files
async function compressFiles() {
    if (allPages.length === 0) {
        alert('Please upload at least one file to compress.');
        return;
    }

    setButtonLoading(compressBtn, true);
    try {
        const pdfDoc = await PDFLib.PDFDocument.create();
        for (const page of allPages) {
            const { fileIndex, pageNum, type } = page;
            const file = filesArray[fileIndex].file;

            if (type === 'pdf') {
                const arrayBuffer = await file.arrayBuffer();
                const srcPdf = await PDFLib.PDFDocument.load(arrayBuffer);
                const [copiedPage] = await pdfDoc.copyPages(srcPdf, [pageNum - 1]);
                pdfDoc.addPage(copiedPage);
            } else {
                const imgData = await new Promise(resolve => {
                    const img = new Image();
                    img.src = URL.createObjectURL(file);
                    img.onload = () => {
                        const canvas = document.createElement('canvas');
                        canvas.width = img.width / 2;
                        canvas.height = img.height / 2;
                        const ctx = canvas.getContext('2d');
                        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                        URL.revokeObjectURL(img.src);
                        resolve(canvas.toDataURL('image/jpeg', 0.5));
                    };
                });
                const img = await pdfDoc.embedJpg(imgData);
                const page = pdfDoc.addPage([img.width, img.height]);
                page.drawImage(img, { x: 0, y: 0, width: img.width, height: img.height });
            }
        }

        const pdfBytes = await pdfDoc.save();
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'compressed.pdf';
        link.click();
        URL.revokeObjectURL(link.href);
        alert('Files compressed successfully!');
    } catch (error) {
        console.error('Compress error:', error);
        alert('Error compressing files. Please try again.');
    } finally {
        setButtonLoading(compressBtn, false);
    }
}

// Save PDF with video ad
async function savePDF() {
    if (allPages.length === 0) {
        alert('No pages to save.');
        return;
    }

    setButtonLoading(saveBtn, true);
    try {
        const pdfDoc = await PDFLib.PDFDocument.create();
        for (const page of allPages) {
            const { fileIndex, pageNum, type } = page;
            const file = filesArray[fileIndex].file;

            if (type === 'pdf') {
                const arrayBuffer = await file.arrayBuffer();
                const srcPdf = await PDFLib.PDFDocument.load(arrayBuffer);
                const [copiedPage] = await pdfDoc.copyPages(srcPdf, [pageNum - 1]);
                pdfDoc.addPage(copiedPage);
            } else {
                const imgData = await new Promise(resolve => {
                    const img = new Image();
                    img.src = URL.createObjectURL(file);
                    img.onload = () => {
                        const canvas = document.createElement('canvas');
                        canvas.width = img.width;
                        canvas.height = img.height;
                        canvas.getContext('2d').drawImage(img, 0, 0);
                        URL.revokeObjectURL(img.src);
                        resolve(canvas.toDataURL('image/jpeg'));
                    };
                });
                const img = file.type === 'image/png' ?
                    await pdfDoc.embedPng(imgData) :
                    await pdfDoc.embedJpg(imgData);
                const page = pdfDoc.addPage([img.width, img.height]);
                page.drawImage(img, { x: 0, y: 0, width: img.width, height: img.height });
            }
        }

        const pdfBytes = await pdfDoc.save();
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'output.pdf';
        link.click();
        URL.revokeObjectURL(link.href);

        // Show video ad
        videoAdModal.show();
    } catch (error) {
        console.error('Save error:', error);
        alert('Error saving PDF. Please try again.');
    } finally {
        setButtonLoading(saveBtn, false);
    }
}

// Sidebar Menu Functions
async function convertWordToPDF() {
    alert('Convert Word to PDF requires server-side processing. Please upload a Word document to a server-based converter.');
}

async function imageToPDF() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.multiple = true;
    input.onchange = async () => {
        const files = Array.from(input.files);
        if (files.length === 0) return;

        setButtonLoading(document.querySelector('.sidebar .nav-link[onclick="imageToPDF()"]'), true);
        try {
            const pdfDoc = await PDFLib.PDFDocument.create();
            for (const file of files) {
                const imgData = await new Promise(resolve => {
                    const img = new Image();
                    img.src = URL.createObjectURL(file);
                    img.onload = () => {
                        const canvas = document.createElement('canvas');
                        canvas.width = img.width;
                        canvas.height = img.height;
                        canvas.getContext('2d').drawImage(img, 0, 0);
                        URL.revokeObjectURL(img.src);
                        resolve(canvas.toDataURL(file.type === 'image/png' ? 'image/png' : 'image/jpeg'));
                    };
                });
                const img = file.type === 'image/png' ?
                    await pdfDoc.embedPng(imgData) :
                    await pdfDoc.embedJpg(imgData);
                const page = pdfDoc.addPage([img.width, img.height]);
                page.drawImage(img, { x: 0, y: 0, width: img.width, height: img.height });
            }

            const pdfBytes = await pdfDoc.save();
            const blob = new Blob([pdfBytes], { type: 'application/pdf' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = 'images_to_pdf.pdf';
            link.click();
            URL.revokeObjectURL(link.href);
        } catch (error) {
            console.error('Image to PDF error:', error);
            alert('Error converting images to PDF. Please try again.');
        } finally {
            setButtonLoading(document.querySelector('.sidebar .nav-link[onclick="imageToPDF()"]'), false);
        }
    };
    input.click();
}

async function addWatermark() {
    if (allPages.length === 0) {
        alert('Please upload a PDF to add a watermark.');
        return;
    }

    const watermarkText = prompt('Enter watermark text:', 'Confidential');
    if (!watermarkText) return;

    setButtonLoading(document.querySelector('.sidebar .nav-link[onclick="addWatermark()"]'), true);
    try {
        const pdfDoc = await PDFLib.PDFDocument.create();
        for (const page of allPages) {
            const { fileIndex, pageNum, type } = page;
            const file = filesArray[fileIndex].file;

            if (type === 'pdf') {
                const arrayBuffer = await file.arrayBuffer();
                const srcPdf = await PDFLib.PDFDocument.load(arrayBuffer);
                const [copiedPage] = await pdfDoc.copyPages(srcPdf, [pageNum - 1]);
                const page = pdfDoc.addPage(copiedPage);
                const { width, height } = page.getSize();
                page.drawText(watermarkText, {
                    x: width / 4,
                    y: height / 4,
                    size: 50,
                    opacity: 0.3,
                    rotate: PDFLib.degrees(45),
                    color: PDFLib.rgb(0.5, 0.5, 0.5)
                });
            } else {
                const imgData = await new Promise(resolve => {
                    const img = new Image();
                    img.src = URL.createObjectURL(file);
                    img.onload = () => {
                        const canvas = document.createElement('canvas');
                        canvas.width = img.width;
                        canvas.height = img.height;
                        canvas.getContext('2d').drawImage(img, 0, 0);
                        URL.revokeObjectURL(img.src);
                        resolve(canvas.toDataURL('image/jpeg'));
                    };
                });
                const img = file.type === 'image/png' ?
                    await pdfDoc.embedPng(imgData) :
                    await pdfDoc.embedJpg(imgData);
                const page = pdfDoc.addPage([img.width, img.height]);
                page.drawImage(img, { x: 0, y: 0, width: img.width, height: img.height });
                const { width, height } = page.getSize();
                page.drawText(watermarkText, {
                    x: width / 4,
                    y: height / 4,
                    size: 50,
                    opacity: 0.3,
                    rotate: PDFLib.degrees(45),
                    color: PDFLib.rgb(0.5, 0.5, 0.5)
                });
            }
        }

        const pdfBytes = await pdfDoc.save();
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'watermarked.pdf';
        link.click();
        URL.revokeObjectURL(link.href);
    } catch (error) {
        console.error('Watermark error:', error);
        alert('Error adding watermark. Please try again.');
    } finally {
        setButtonLoading(document.querySelector('.sidebar .nav-link[onclick="addWatermark()"]'), false);
    }
}

async function unlockPDF() {
    if (allPages.length === 0) {
        alert('Please upload a PDF to unlock.');
        return;
    }
    alert('Unlock PDF requires server-side processing or a password. Assuming no password for demo.');
    savePDF();
}

async function compressToMail() {
    if (allPages.length === 0) {
        alert('Please upload a file to compress.');
        return;
    }
    alert('Compression requires server-side processing. Generating standard PDF for mailing.');
    savePDF();
}

async function pdfToImages() {
    if (allPages.length === 0) {
        alert('Please upload a PDF to convert to images.');
        return;
    }

    setButtonLoading(document.querySelector('.sidebar .nav-link[onclick="pdfToImages()"]'), true);
    try {
        const zip = new JSZip();
        const promises = [];

        for (const page of allPages) {
            const { fileIndex, pageNum, type } = page;
            if (type !== 'pdf') continue; // Skip non-PDF files

            const file = filesArray[fileIndex].file;
            const promise = new Promise((resolve) => {
                const fileReader = new FileReader();
                fileReader.onload = async () => {
                    const typedArray = new Uint8Array(fileReader.result);
                    const pdf = await pdfjsLib.getDocument(typedArray).promise;
                    const pdfPage = await pdf.getPage(pageNum);
                    const viewport = pdfPage.getViewport({ scale: 2 });
                    const canvas = document.createElement('canvas');
                    canvas.width = viewport.width;
                    canvas.height = viewport.height;
                    const context = canvas.getContext('2d');
                    await pdfPage.render({ canvasContext: context, viewport }).promise;
                    const imgData = canvas.toDataURL('image/jpeg');
                    zip.file(`page_${pageNum}.jpg`, imgData.split(',')[1], { base64: true });
                    resolve();
                };
                fileReader.readAsArrayBuffer(file);
            });
            promises.push(promise);
        }

        // Wait for all images to be processed
        await Promise.all(promises);
        const zipBlob = await zip.generateAsync({ type: 'blob' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(zipBlob);
        link.download = 'pdf_to_images.zip';
        link.click();
        URL.revokeObjectURL(link.href);
        alert('PDF pages converted to images successfully!');
    } catch (error) {
        console.error('PDF to Images error:', error);
        alert('Error converting PDF to images. Please try again.');
    } finally {
        setButtonLoading(document.querySelector('.sidebar .nav-link[onclick="pdfToImages()"]'), false);
    }
}