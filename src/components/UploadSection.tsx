import React, { useRef, useState, useEffect } from 'react';
import {
  UploadCloud,
  Image as ImageIcon,
  AlertCircle,
  X,
  Check,
  Camera,
} from 'lucide-react';
import { CameraCaptureModal } from './CameraCaptureModal';

interface UploadSectionProps {
  onImageSelected: (base64OrUrl: string) => void;
  onAnalyze: () => void;
  selectedImage: string | null;
  isLoading: boolean;
  onClose?: () => void;
}

export const UploadSection: React.FC<UploadSectionProps> = ({
  onImageSelected,
  selectedImage,
  isLoading,
  onClose,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [cameraModalOpen, setCameraModalOpen] = useState(false);

  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            processFile(file);
            break;
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, []);

  const processFile = (file: File) => {
    setErrorMsg(null);

    const isImage = file.type.startsWith('image/') || /\.(jpg|jpeg|png|webp)$/i.test(file.name);

    if (!isImage) {
      setErrorMsg('Unsupported format. Please select an image (JPG, PNG, WEBP).');
      return;
    }

    if (file.size > 25 * 1024 * 1024) {
      setErrorMsg(`File size exceeds limit (${(file.size / (1024 * 1024)).toFixed(1)} MB). Please select a file under 25 MB.`);
      return;
    }

    // Process image with client-side scaling to prevent payload timeouts or memory errors
    const reader = new FileReader();
    reader.onload = (e) => {
      const rawBase64 = e.target?.result as string;
      const img = new Image();
      img.onload = () => {
        const MAX_DIM = 1600;
        let width = img.width;
        let height = img.height;

        if (width > MAX_DIM || height > MAX_DIM) {
          if (width > height) {
            height = Math.round((height * MAX_DIM) / width);
            width = MAX_DIM;
          } else {
            width = Math.round((width * MAX_DIM) / height);
            height = MAX_DIM;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const scaledBase64 = canvas.toDataURL('image/jpeg', 0.88);
          onImageSelected(scaledBase64);
        } else {
          onImageSelected(rawBase64);
        }
      };
      img.onerror = () => onImageSelected(rawBase64);
      img.src = rawBase64;
    };
    reader.onerror = () => {
      setErrorMsg('Failed to read the image file.');
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  return (
    <>
      <div className="bg-[#FAF8F4] border border-[#E2DDD3] rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-[#E2DDD3] pb-3">
          <div className="flex items-center gap-2">
            <UploadCloud className="w-4 h-4 text-[#0D9488]" />
            <h3 className="text-xs font-mono font-bold text-[#1C1917] tracking-wider uppercase">
              Inspection Media: Photo Upload or Live Camera
            </h3>
          </div>

          {onClose && (
            <button
              onClick={onClose}
              className="p-1 text-[#857F75] hover:text-[#1C1917] hover:bg-[#EBE6DC] rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {errorMsg && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* 2 Primary Media Options: Photo Upload & Camera Snapshot */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Option 1: Drag & Drop Photo */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[150px] ${
              isDragging
                ? 'border-[#0D9488] bg-[#0D9488]/5 scale-[0.99]'
                : 'border-[#CDC5B5] hover:border-[#1C1917] bg-white hover:bg-[#F4F1EA]/50'
            }`}
          >
            <div className="w-12 h-12 rounded-xl bg-[#EBE6DC] flex items-center justify-center text-[#57534E] mb-3">
              <ImageIcon className="w-6 h-6 text-[#0D9488]" />
            </div>
            <div className="text-sm font-bold text-[#1C1917]">Drag & Drop Photo</div>
            <p className="text-xs text-[#857F75] mt-1 font-mono">JPG, PNG, WEBP (or click to browse)</p>
          </div>

          {/* Option 2: Live Camera Snapshot */}
          <div
            onClick={() => setCameraModalOpen(true)}
            className="border-2 border-[#E2DDD3] hover:border-[#0D9488] bg-white hover:bg-[#F4F1EA]/50 rounded-xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[150px] shadow-2xs"
          >
            <div className="w-12 h-12 rounded-xl bg-[#0D9488]/15 flex items-center justify-center text-[#0D9488] mb-3">
              <Camera className="w-6 h-6" />
            </div>
            <div className="text-sm font-bold text-[#1C1917]">Live Camera Capture</div>
            <p className="text-xs text-[#857F75] mt-1 font-mono">Take an instant photo using your camera</p>
          </div>
        </div>

        {/* Hidden File Input for images only */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/jpg"
          onChange={handleFileInputChange}
          className="hidden"
        />

        {/* Selected Image Indicator */}
        {selectedImage && (
          <div className="p-3 bg-white border border-[#E2DDD3] rounded-xl flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600" />
              <span className="font-medium text-[#1C1917]">Photo loaded and ready for analysis</span>
            </div>
            {isLoading && (
              <span className="text-xs font-mono text-[#0D9488] font-bold">Analyzing...</span>
            )}
          </div>
        )}
      </div>

      {/* Camera Capture Modal */}
      <CameraCaptureModal
        isOpen={cameraModalOpen}
        onClose={() => setCameraModalOpen(false)}
        onCapture={(base64) => {
          setCameraModalOpen(false);
          onImageSelected(base64);
        }}
      />
    </>
  );
};
