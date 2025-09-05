import jsPDF from 'jspdf';

export interface DocumentSection {
  title?: string;
  content: string;
  imageUrl?: string;
}

export interface DocumentOptions {
  title?: string;
  author?: string;
  subject?: string;
  sections: DocumentSection[];
}

export const generatePDF = (options: DocumentOptions): void => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const margin = 20;
  const maxWidth = pageWidth - (margin * 2);
  
  let currentY = margin;

  // Add title
  if (options.title) {
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    const titleLines = doc.splitTextToSize(options.title, maxWidth);
    doc.text(titleLines, margin, currentY);
    currentY += titleLines.length * 12 + 10;
  }

  // Add metadata
  if (options.author || options.subject) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    if (options.author) {
      doc.text(`Author: ${options.author}`, margin, currentY);
      currentY += 8;
    }
    
    if (options.subject) {
      doc.text(`Subject: ${options.subject}`, margin, currentY);
      currentY += 8;
    }
    
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, margin, currentY);
    currentY += 20;
  }

  // Add sections
  options.sections.forEach((section, index) => {
    // Check if we need a new page
    if (currentY > pageHeight - 60) {
      doc.addPage();
      currentY = margin;
    }

    // Add section title
    if (section.title) {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      const titleLines = doc.splitTextToSize(section.title, maxWidth);
      doc.text(titleLines, margin, currentY);
      currentY += titleLines.length * 8 + 5;
    }

    // Add content
    if (section.content.trim()) {
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      
      const contentLines = doc.splitTextToSize(section.content, maxWidth);
      
      // Check if content fits on current page
      const contentHeight = contentLines.length * 6;
      if (currentY + contentHeight > pageHeight - margin) {
        doc.addPage();
        currentY = margin;
      }
      
      doc.text(contentLines, margin, currentY);
      currentY += contentHeight + 10;
    }

    // Add separator line between sections (except last)
    if (index < options.sections.length - 1) {
      doc.setDrawColor(200, 200, 200);
      doc.line(margin, currentY, pageWidth - margin, currentY);
      currentY += 15;
    }
  });

  // Save the PDF
  const filename = options.title 
    ? `${options.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`
    : 'extracted_document.pdf';
    
  doc.save(filename);
};

export const generateTextFile = (options: DocumentOptions): void => {
  let content = '';
  
  if (options.title) {
    content += `${options.title}\n`;
    content += '='.repeat(options.title.length) + '\n\n';
  }

  if (options.author) {
    content += `Author: ${options.author}\n`;
  }
  
  if (options.subject) {
    content += `Subject: ${options.subject}\n`;
  }
  
  content += `Generated: ${new Date().toLocaleDateString()}\n\n`;

  options.sections.forEach((section, index) => {
    if (section.title) {
      content += `${section.title}\n`;
      content += '-'.repeat(section.title.length) + '\n\n';
    }
    
    if (section.content.trim()) {
      content += `${section.content}\n\n`;
    }
    
    if (index < options.sections.length - 1) {
      content += '---\n\n';
    }
  });

  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  
  const filename = options.title 
    ? `${options.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.txt`
    : 'extracted_document.txt';
    
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};