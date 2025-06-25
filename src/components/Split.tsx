import React, { useState, useEffect, useCallback } from 'react';
import FileInput from './FileInput';
import { PDFDocument } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
import JSZip from 'jszip';

// Set workerSrc for pdf.js
pdfjsLib.GlobalWorkerOptions.workerSrc = `/pdf.worker.mjs`;

interface Page {
  id: string;
  pageNumber: number;
  thumbnail: string;
  selected: boolean;
}

const Split: React.FC = () => {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pages, setPages] = useState<Page[]>([]);
  const [outputOption, setOutputOption] = useState<'single' | 'multiple'>('single');

  const renderPdfThumbnails = useCallback(async (file: File) => {
    const fileReader = new FileReader();
    fileReader.onload = async () => {
      const typedArray = new Uint8Array(fileReader.result as ArrayBuffer);
      const pdf = await pdfjsLib.getDocument(typedArray).promise;
      const newPages: Page[] = [];

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 0.3 });
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        if (context) {
          await page.render({ canvasContext: context, viewport: viewport }).promise;
          newPages.push({
            id: `page-${i}`,
            pageNumber: i,
            thumbnail: canvas.toDataURL(),
            selected: true, // Default to selected
          });
        }
      }
      setPages(newPages);
    };
    fileReader.readAsArrayBuffer(file);
  }, []);

  useEffect(() => {
    if (pdfFile) {
      renderPdfThumbnails(pdfFile);
    } else {
      setPages([]);
    }
  }, [pdfFile, renderPdfThumbnails]);

  const handleFileSelected = (files: File[]) => {
    if (files.length > 0) {
      setPdfFile(files[0]);
    } else {
      setPdfFile(null);
    }
  };

  const togglePageSelection = (id: string) => {
    setPages(pages.map(p => p.id === id ? { ...p, selected: !p.selected } : p));
  };

  const handleSelectAll = (select: boolean) => {
    setPages(pages.map(p => ({ ...p, selected: select })));
  };

  const handleSplit = async () => {
    if (!pdfFile) return;

    const selectedPages = pages.filter(p => p.selected);
    if (selectedPages.length === 0) {
      alert('Please select at least one page to extract.');
      return;
    }

    const pdfBytes = await pdfFile.arrayBuffer();
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const pageIndices = selectedPages.map(p => p.pageNumber - 1);

    if (outputOption === 'single') {
      const newPdfDoc = await PDFDocument.create();
      const copiedPages = await newPdfDoc.copyPages(pdfDoc, pageIndices);
      copiedPages.forEach(page => newPdfDoc.addPage(page));
      const newPdfBytes = await newPdfDoc.save();
      const blob = new Blob([newPdfBytes], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${pdfFile.name.replace('.pdf', '')}_split.pdf`;
      link.click();
    } else {
      const zip = new JSZip();
      for (const index of pageIndices) {
        const newPdfDoc = await PDFDocument.create();
        const [copiedPage] = await newPdfDoc.copyPages(pdfDoc, [index]);
        newPdfDoc.addPage(copiedPage);
        const newPdfBytes = await newPdfDoc.save();
        zip.file(`${pdfFile.name.replace('.pdf', '')}_page_${index + 1}.pdf`, newPdfBytes);
      }
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(zipBlob);
      link.download = `${pdfFile.name.replace('.pdf', '')}_split.zip`;
      link.click();
    }
  };

  return (
    <div className="card shadow-sm">
      <div className="card-body">
        <h2 className="card-title">Split PDF</h2>
        <p className="card-text text-muted">Select pages to extract from your PDF file.</p>
        {!pdfFile ? (
          <FileInput onFilesSelected={handleFileSelected} />
        ) : (
          <div>
            <h4>Selected File: <span className="fw-normal">{pdfFile.name}</span> <button className="btn btn-sm btn-outline-danger ms-2" onClick={() => setPdfFile(null)}>Change File</button></h4>
            <div className="d-flex justify-content-between align-items-center my-3">
              <div>
                <button className="btn btn-secondary btn-sm me-2" onClick={() => handleSelectAll(true)}>Select All</button>
                <button className="btn btn-secondary btn-sm" onClick={() => handleSelectAll(false)}>Deselect All</button>
              </div>
              <div className="form-check form-switch">
                <input 
                  className="form-check-input" 
                  type="checkbox" 
                  role="switch" 
                  id="output-option-switch"
                  checked={outputOption === 'multiple'}
                  onChange={(e) => setOutputOption(e.target.checked ? 'multiple' : 'single')}
                />
                <label className="form-check-label" htmlFor="output-option-switch">
                  {outputOption === 'single' ? 'Save as single PDF' : 'Save as separate files (ZIP)'}
                </label>
              </div>
            </div>
            <div className="card bg-light mt-3 p-3">
              <div className="d-flex flex-wrap gap-3">
                {pages.map(page => (
                  <div key={page.id} className="text-center" onClick={() => togglePageSelection(page.id)} style={{ cursor: 'pointer' }}>
                    <div className={`position-relative shadow-sm rounded border ${page.selected ? 'border-primary border-3' : 'border-light'}`}>
                      <img src={page.thumbnail} alt={`Page ${page.pageNumber}`} className="img-thumbnail" />
                      <input 
                        type="checkbox" 
                        className="form-check-input position-absolute top-0 start-0 m-1" 
                        checked={page.selected}
                        readOnly
                      />
                    </div>
                    <p className="mt-1 mb-0">{page.pageNumber}</p>
                  </div>
                ))}
              </div>
            </div>
            <button className="btn btn-primary w-100 mt-4" onClick={handleSplit} disabled={pages.filter(p => p.selected).length === 0}>
              Split PDF ({pages.filter(p => p.selected).length} pages selected)
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Split;