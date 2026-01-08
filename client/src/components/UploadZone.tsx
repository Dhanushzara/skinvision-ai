import { useCallback, useState } from 'react';
import { Upload, ImageIcon, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface UploadZoneProps {
  onImageSelected: (base64: string) => void;
  isAnalyzing: boolean;
}

export function UploadZone({ onImageSelected, isAnalyzing }: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const { toast } = useToast();

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file (JPEG, PNG).",
        variant: "destructive",
      });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      onImageSelected(reader.result as string);
    };
    reader.readAsDataURL(file);
  }, [onImageSelected, toast]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, [handleFile]);

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  return (
    <div
      onDrop={onDrop}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      className={`
        relative group cursor-pointer
        border-2 border-dashed rounded-3xl p-10
        flex flex-col items-center justify-center gap-4
        transition-all duration-300 ease-out
        ${isDragging 
          ? 'border-primary bg-primary/5 scale-[1.02]' 
          : 'border-slate-200 bg-white hover:border-primary/50 hover:bg-slate-50'
        }
      `}
    >
      <input
        type="file"
        accept="image/*"
        className="absolute inset-0 opacity-0 cursor-pointer z-10"
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
        disabled={isAnalyzing}
      />
      
      <div className={`
        w-20 h-20 rounded-full flex items-center justify-center
        transition-all duration-300
        ${isDragging ? 'bg-primary text-white shadow-xl shadow-primary/20' : 'bg-blue-50 text-blue-500 group-hover:scale-110'}
      `}>
        {isAnalyzing ? (
          <Loader2 className="w-10 h-10 animate-spin" />
        ) : (
          <Upload className="w-10 h-10" />
        )}
      </div>

      <div className="text-center space-y-1">
        <h3 className="text-lg font-display font-semibold text-slate-900">
          {isAnalyzing ? "Analyzing lesion..." : "Upload scan image"}
        </h3>
        <p className="text-sm text-slate-500 max-w-xs mx-auto">
          Drag and drop your skin lesion photo here, or tap to browse your gallery
        </p>
      </div>
    </div>
  );
}
