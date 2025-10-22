/**
 * PDF Parser Utility
 * Extract text from PDF files using pdfjs-dist
 */

import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;

/**
 * Extract text from a PDF file
 * @param {File} file - PDF file object from input
 * @returns {Promise<string>} Extracted text content
 */
export const extractTextFromPDF = async (file) => {
  try {
    // Read file as ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    
    // Load PDF document
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    
    let fullText = '';
    
    // Extract text from each page
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      
      // Build text with proper line breaks based on Y position
      let lastY = null;
      const pageLines = [];
      let currentLine = '';
      
      textContent.items.forEach(item => {
        // If Y position changed significantly, it's a new line
        if (lastY !== null && Math.abs(item.transform[5] - lastY) > 5) {
          if (currentLine.trim()) {
            pageLines.push(currentLine.trim());
          }
          currentLine = item.str;
        } else {
          currentLine += ' ' + item.str;
        }
        lastY = item.transform[5];
      });
      
      // Add last line
      if (currentLine.trim()) {
        pageLines.push(currentLine.trim());
      }
      
      fullText += pageLines.join('\n') + '\n';
    }
    
    return fullText;
    
  } catch (err) {
    console.error('PDF parsing error:', err);
    throw new Error(`Failed to extract text from PDF: ${err.message}`);
  }
};

/**
 * Extract text from multiple PDF files and combine
 * @param {File[]} files - Array of PDF file objects
 * @returns {Promise<string>} Combined text from all PDFs
 */
export const extractTextFromMultiplePDFs = async (files) => {
  try {
    const textPromises = files.map(file => extractTextFromPDF(file));
    const texts = await Promise.all(textPromises);
    return texts.join('\n\n--- Next PDF ---\n\n');
  } catch (err) {
    throw new Error(`Failed to process multiple PDFs: ${err.message}`);
  }
};
