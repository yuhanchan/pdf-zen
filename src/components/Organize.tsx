import React, { useState, useEffect, useCallback } from 'react';
import FileInput from './FileInput';
import { PDFDocument } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, rectSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Set workerSrc for pdf.js
pdfjsLib.GlobalWorkerOptions.workerSrc = `/pdf.worker.mjs`;

interface Page {
  id: string;
  pageNumber: number;
  thumbnail: string;
}

const SortablePage = ({ page, onDelete }: { page: Page, onDelete: (id: string) => void }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: page.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="text-center">
      <div className="position-relative shadow-sm rounded border">
        <img src={page.thumbnail} alt={`Page ${page.pageNumber}`} className="img-thumbnail" />
        <button 
          className="btn btn-danger btn-sm position-absolute top-0 end-0 m-1"
          onClick={(e) => { 
            e.stopPropagation(); // Prevent dnd listeners from firing
            onDelete(page.id); 
          }}
        >
          &times;
        </button>
      </div>
      <p className="mt-1 mb-0">{page.pageNumber}</p>
    </div>
  );
};

const Organize: React.FC = () => {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pages, setPages] = useState<Page[]>([]);
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const renderPdfThumbnails = useCallback(async (file: File) => {
    const fileReader = new FileReader();
    fileReader.onload = async () => {
      const typedArray = new Uint8Array(fileReader.result as ArrayBuffer);
      const pdf = await pdfjsLib.getDocument(typedArray).promise;
      const newPages: Page[] = [];

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 0.5 });
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
    }
  };

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      setPages((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleDelete = (id: string) => {
    setPages(pages.filter(p => p.id !== id));
  };

  const handleOrganize = async () => {
    if (!pdfFile) return;

    try {
      const pdfBytes = await pdfFile.arrayBuffer();
      const pdfDoc = await PDFDocument.load(pdfBytes);
      const newPdfDoc = await PDFDocument.create();

      const pageIndices = pages.map(p => p.pageNumber - 1);
      const copiedPages = await newPdfDoc.copyPages(pdfDoc, pageIndices);
      copiedPages.forEach(page => newPdfDoc.addPage(page));

      const newPdfBytes = await newPdfDoc.save();
      const blob = new Blob([newPdfBytes], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'organized.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Failed to organize PDF:", error);
      alert("An error occurred while saving the PDF. Please check the console for details.");
    }
  };

  return (
    <div className="card shadow-sm">
      <div className="card-body">
        <h2 className="card-title">Organize Pages</h2>
        <p className="card-text text-muted">Drag and drop to reorder pages, or use the red 'X' to delete them.</p>
        {!pdfFile ? (
          <FileInput onFilesSelected={handleFileSelected} />
        ) : (
          <>
            <div className="card bg-light mt-4 p-3">
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={pages} strategy={rectSortingStrategy}>
                  <div className="d-flex flex-wrap gap-3">
                    {pages.map(page => (
                      <SortablePage key={page.id} page={page} onDelete={handleDelete} />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            </div>
            <button className="btn btn-primary w-100 mt-4" onClick={handleOrganize}>
              Save Organized PDF
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default Organize;