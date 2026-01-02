
import * as pdfjsLib from 'pdfjs-dist';

// Set worker source to the same version as the library
// In a Vite environment, we often need to point to the worker file explicitly.
// Using unpkg/CDN is a safe fallback if local worker resolution fails in some setups,
// but for a local project, we try to use the installed package.
// However, ensuring the worker is bundled correctly often requires:
// import pdfWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';
// pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

// For simplicity and stability without complex config changes, we can set standard worker src
// or use the CDN for the worker which is very reliable for client-side usage.
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

export const extractTextFromPdf = async (url) => {
    try {
        const loadingTask = pdfjsLib.getDocument(url);
        const pdf = await loadingTask.promise;
        let fullText = '';

        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items.map((item) => item.str).join(' ');
            fullText += pageText + '\n';
        }

        return fullText;
    } catch (error) {
        console.error('Error extracting text from PDF:', error);
        throw error;
    }
};
