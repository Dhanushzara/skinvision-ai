import { useCallback, useState, useRef, useEffect } from 'react';
import { Upload, Camera, X, RefreshCw, Loader2, MapPin } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';

const BODY_LOCATIONS = [
  "Head / Face", "Neck", "Chest", "Back", "Left Arm", "Right Arm",
  "Abdomen", "Left Leg", "Right Leg", "Left Hand", "Right Hand", "Left Foot", "Right Foot",
];

interface UploadZoneProps {
  onImageSelected: (file: File | string, bodyLocation?: string) => void;
  isAnalyzing: boolean;
}

export function UploadZone({ onImageSelected, isAnalyzing }: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<string>("");
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const { toast } = useToast();

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  }, []);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      if (videoRef.current) { videoRef.current.srcObject = stream; streamRef.current = stream; }
    } catch {
      toast({ title: "Camera Error", description: "Could not access camera.", variant: "destructive" });
      setIsCameraOpen(false);
    }
  }, [toast]);

  useEffect(() => {
    if (isCameraOpen) startCamera(); else stopCamera();
    return () => stopCamera();
  }, [isCameraOpen, startCamera, stopCamera]);

  const capturePhoto = useCallback(() => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current; const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      if (context) {
        canvas.width = video.videoWidth; canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], "camera-capture.jpg", { type: "image/jpeg" });
            setPendingFile(file);
            setIsCameraOpen(false);
          }
        }, 'image/jpeg');
      }
    }
  }, []);

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      toast({ title: "Invalid file type", description: "Please upload an image file.", variant: "destructive" });
      return;
    }
    setPendingFile(file);
  }, [toast]);

  const handleSubmit = useCallback(() => {
    if (pendingFile) {
      onImageSelected(pendingFile, selectedLocation || undefined);
      setPendingFile(null);
    }
  }, [pendingFile, selectedLocation, onImageSelected]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false);
    if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0]);
  }, [handleFile]);

  // Show preview + body location picker if we have a pending file
  if (pendingFile && !isAnalyzing) {
    const previewUrl = URL.createObjectURL(pendingFile);
    return (
      <div className="space-y-4">
        <div className="relative rounded-2xl overflow-hidden bg-slate-100 aspect-video">
          <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
          <button onClick={() => setPendingFile(null)} className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <MapPin className="w-3 h-3" /> Body Location (optional)
          </label>
          <div className="flex flex-wrap gap-1.5">
            {BODY_LOCATIONS.map(loc => (
              <button key={loc} onClick={() => setSelectedLocation(loc === selectedLocation ? "" : loc)}
                className={`text-xs px-2.5 py-1.5 rounded-full border transition-all ${
                  selectedLocation === loc ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'
                }`}>
                {loc}
              </button>
            ))}
          </div>
        </div>
        <Button onClick={handleSubmit} className="w-full py-5 rounded-xl text-base font-semibold bg-gradient-to-r from-blue-600 to-teal-500 hover:from-blue-700 hover:to-teal-600 shadow-lg shadow-blue-600/20">
          Analyze Lesion
        </Button>
      </div>
    );
  }

  if (isCameraOpen) {
    return (
      <div className="relative rounded-2xl overflow-hidden bg-black aspect-video flex items-center justify-center">
        <video ref={videoRef} autoPlay playsInline className="absolute inset-0 w-full h-full object-cover" />
        <canvas ref={canvasRef} className="hidden" />
        <div className="absolute bottom-6 flex items-center gap-4 z-10">
          <Button variant="secondary" size="icon" className="rounded-full h-12 w-12 bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm" onClick={() => setIsCameraOpen(false)}><X className="w-6 h-6" /></Button>
          <Button variant="default" size="icon" className="rounded-full h-16 w-16 border-4 border-white/30 bg-white text-primary hover:bg-white/90 transition-all" onClick={capturePhoto}><div className="w-12 h-12 rounded-full border-2 border-primary" /></Button>
          <Button variant="secondary" size="icon" className="rounded-full h-12 w-12 bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm" onClick={startCamera}><RefreshCw className="w-5 h-5" /></Button>
        </div>
      </div>
    );
  }

  return (
    <div onDrop={onDrop} onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }} onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
      className={`relative group border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center gap-5 transition-all duration-300 ${
        isDragging ? 'border-blue-500 bg-blue-50/50 scale-[1.01]' : 'border-slate-200 bg-white hover:border-blue-400/50'
      }`}>
      <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer z-10"
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} disabled={isAnalyzing} />
      <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-300 ${
        isDragging ? 'bg-blue-500 text-white shadow-xl' : 'bg-slate-100 text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-500'
      }`}>
        {isAnalyzing ? <Loader2 className="w-8 h-8 animate-spin" /> : <Upload className="w-8 h-8" />}
      </div>
      <div className="text-center space-y-1">
        <h3 className="text-base font-display font-semibold text-slate-900">{isAnalyzing ? "Processing..." : "Upload skin lesion image"}</h3>
        <p className="text-sm text-slate-400">Drag and drop or tap to browse</p>
      </div>
      <div className="relative z-20 flex items-center gap-3 w-full max-w-xs">
        <div className="h-px bg-slate-200 flex-1" /><span className="text-xs text-slate-400 font-medium">OR</span><div className="h-px bg-slate-200 flex-1" />
      </div>
      <Button variant="outline" onClick={() => setIsCameraOpen(true)} disabled={isAnalyzing}
        className="relative z-20 gap-2 rounded-full border-slate-200 hover:border-blue-400 hover:text-blue-600 transition-colors">
        <Camera className="w-4 h-4" /> Use Camera
      </Button>
    </div>
  );
}
