import * as pdfjsLib from 'pdfjs-dist';

// Use unpkg for the worker which is very reliable for ESM modules
const PDFJS_VERSION = '5.4.530';
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${PDFJS_VERSION}/build/pdf.worker.min.mjs`;

/**
 * Extracts text from a PDF file URL.
 * Attempts to preserve some structure using positional data.
 */
export const extractTextFromPdf = async (url) => {
    try {
        console.log(`[pdfUtils] Loading PDF from: ${url.substring(0, 80)}...`);
        
        const loadingTask = pdfjsLib.getDocument({
            url,
            cMapUrl: `https://unpkg.com/pdfjs-dist@${PDFJS_VERSION}/cmaps/`,
            cMapPacked: true,
            standardFontDataUrl: `https://unpkg.com/pdfjs-dist@${PDFJS_VERSION}/standard_fonts/`,
        });

        const pdf = await loadingTask.promise;
        console.log(`[pdfUtils] PDF success. Pages: ${pdf.numPages}`);
        
        let fullText = '';
        let totalItemsFound = 0;

        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const items = textContent.items || [];
            
            totalItemsFound += items.length;
            console.log(`[pdfUtils] Page ${i}: found ${items.length} items.`);

            if (items.length === 0) continue;

            // Sort items
            const sortedItems = [...items].sort((a, b) => {
                const yA = a.transform ? a.transform[5] : 0;
                const yB = b.transform ? b.transform[5] : 0;
                const xA = a.transform ? a.transform[4] : 0;
                const xB = b.transform ? b.transform[4] : 0;
                
                if (Math.abs(yA - yB) > 5) return yB - yA;
                return xA - xB;
            });

            let lastY = -1;
            let pageText = '';
            
            for (const item of sortedItems) {
                const str = item.str || '';
                const y = item.transform ? item.transform[5] : -1;

                if (str.trim() === '') continue;

                if (lastY !== -1 && Math.abs(y - lastY) > 5) {
                    pageText += '\n';
                }
                pageText += str + ' ';
                lastY = y;
            }
            
            fullText += pageText + '\n\n';
        }

        const result = fullText.trim();
        if (result.length > 0) {
            console.log(`[pdfUtils] Extraction complete. Length: ${result.length}`);
            return result;
        }

        if (totalItemsFound === 0) {
            return "--- EMPTY PDF (NO TEXT ITEMS FOUND) ---\nThis usually means the PDF is a scanned image (picture) and not a text document.";
        } else {
            return `--- EXTRACTION RETURNED NO VISIBLE TEXT ---\nFound ${totalItemsFound} items, but none contained displayable text. This could be due to unsupported font encoding.`;
        }

    } catch (error) {
        console.error('[pdfUtils] CRITICAL ERROR:', error);
        return `--- PDF ERROR ---\n${error.message || String(error)}`;
    }
};
