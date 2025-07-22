import { useState, useRef } from "react";
import { cn } from "@/lib/utils";
import { Upload, X, Image } from "lucide-react";

interface FileUploadProps {
  onFileSelect: (file: File | null) => void;
  accept?: string;
  className?: string;
  maxSize?: number; // in MB
}

export default function FileUpload({ 
  onFileSelect, 
  accept = "image/*", 
  className,
  maxSize = 5 
}: FileUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    const file = files[0];
    
    // Check file size
    if (file.size > maxSize * 1024 * 1024) {
      alert(`File size must be less than ${maxSize}MB`);
      return;
    }

    setSelectedFile(file);
    onFileSelect(file);

    // Create preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files);
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    setPreview(null);
    onFileSelect(null);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const openFileDialog = () => {
    inputRef.current?.click();
  };

  return (
    <div className={cn("relative", className)}>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleChange}
        className="hidden"
      />
      
      {!selectedFile ? (
        <div
          className={cn(
            "border-2 border-dashed rounded-lg p-6 text-center hover:border-slate-600 transition-colors cursor-pointer",
            dragActive ? "border-blue-500 bg-blue-500/10" : "border-slate-700",
            className
          )}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={openFileDialog}
        >
          <div className="w-12 h-12 bg-slate-800 rounded-lg flex items-center justify-center mx-auto mb-4">
            <Upload className="w-6 h-6 text-slate-400" />
          </div>
          <p className="text-slate-400 mb-2">Drag and drop your screenshot here</p>
          <p className="text-slate-500 text-sm">or click to browse files</p>
          <p className="text-slate-600 text-xs mt-2">Max file size: {maxSize}MB</p>
        </div>
      ) : (
        <div className="border-2 border-slate-700 rounded-lg p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center">
                <Image className="w-5 h-5 text-slate-400" />
              </div>
              <div>
                <p className="text-slate-200 font-medium text-sm">{selectedFile.name}</p>
                <p className="text-slate-400 text-xs">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>
            <button
              onClick={clearFile}
              className="text-slate-400 hover:text-slate-200 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          
          {preview && (
            <div className="mt-3">
              <img
                src={preview}
                alt="Preview"
                className="max-w-full h-32 object-cover rounded-md border border-slate-600"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
