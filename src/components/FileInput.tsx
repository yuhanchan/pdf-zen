import React, { useState, useCallback } from 'react';

interface FileInputProps {
  onFilesSelected: (files: File[]) => void;
  multiple?: boolean;
}

const FileInput: React.FC<FileInputProps> = ({ onFilesSelected, multiple = false }) => {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      onFilesSelected(Array.from(event.target.files));
    }
  };

  const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragOver(false);
    if (event.dataTransfer.files) {
      onFilesSelected(Array.from(event.dataTransfer.files));
    }
  }, [onFilesSelected]);

  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
  }, []);

  const handleDragEnter = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragOver(false);
  }, []);

  return (
    <div 
      className={`border-2 border-dashed rounded text-center p-5 ${isDragOver ? 'border-primary bg-light' : 'border-secondary'}`}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
    >
      <input 
        type="file" 
        className="d-none" 
        id="file-input" 
        onChange={handleFileChange} 
        accept=".pdf" 
        multiple={multiple} 
      />
      <label htmlFor="file-input" className="btn btn-primary mb-3">
        Select Files
      </label>
      <p className="text-muted">Or drag and drop files here</p>
    </div>
  );
};

export default FileInput;
