import { useState } from 'react';
import FileInput from './FileInput';
import { PDFDocument } from 'pdf-lib';

const Merge = () => {
  const [pdfFiles, setPdfFiles] = useState<File[]>([]);

  const handleFilesSelected = (files: File[]) => {
    setPdfFiles(files);
  };

  const handleRemoveFile = (index: number) => {
    setPdfFiles(pdfFiles.filter((_, i) => i !== index));
  };

  const handleMerge = async () => {
    if (pdfFiles.length < 2) {
      alert('Please select at least two PDF files to merge.');
      return;
    }

    const mergedPdf = await PDFDocument.create();
    for (const pdfFile of pdfFiles) {
      const pdfBytes = await pdfFile.arrayBuffer();
      const pdf = await PDFDocument.load(pdfBytes);
      const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
      copiedPages.forEach((page) => {
        mergedPdf.addPage(page);
      });
    }

    const mergedPdfBytes = await mergedPdf.save();

    const blob = new Blob([mergedPdfBytes], { type: 'application/pdf' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'merged.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="card shadow-sm">
      <div className="card-body">
        <h2 className="card-title">Merge PDFs</h2>
        <p className="card-text text-muted">Combine multiple PDFs into one. Drag and drop to reorder.</p>
        <FileInput onFilesSelected={handleFilesSelected} multiple />
        {pdfFiles.length > 0 && (
          <div className="mt-4">
            <h4>Selected Files:</h4>
            <ul className="list-group">
              {pdfFiles.map((file, index) => (
                <li key={index} className="list-group-item d-flex justify-content-between align-items-center">
                  {file.name}
                  <button className="btn btn-danger btn-sm" onClick={() => handleRemoveFile(index)}>&times;</button>
                </li>
              ))}
            </ul>
            <button className="btn btn-primary w-100 mt-3" onClick={handleMerge}>
              Merge PDFs
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Merge;
