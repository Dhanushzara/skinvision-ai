import { useState } from "react";
import { Navigation } from "@/components/Navigation";
import { UploadZone } from "@/components/UploadZone";
import { useCreateScan } from "@/hooks/use-scans";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { ShieldCheck, Brain, Smartphone } from "lucide-react";

export default function Home() {
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  const createScan = useCreateScan();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleImageSelected = async (base64: string) => {
    setIsProcessing(true);
    try {
      const result = await createScan.mutateAsync(base64);
      setLocation(`/result/${result.id}`);
    } catch (error) {
      toast({
        title: "Analysis Failed",
        description: error instanceof Error ? error.message : "Something went wrong",
        variant: "destructive",
      });
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-24 md:pb-0">
      <Navigation />
      
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-white border-b border-slate-100">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-50 to-teal-50 opacity-50" />
        <div className="max-w-5xl mx-auto px-6 py-12 md:py-20 relative z-10">
          <div className="flex flex-col md:flex-row items-center gap-12">
            <div className="flex-1 space-y-6 text-center md:text-left">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-bold uppercase tracking-wider mb-4">
                  <Brain className="w-3 h-3" />
                  AI-Powered Dermatology
                </div>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-slate-900 leading-tight">
                  Early detection saves <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-teal-500">lives.</span>
                </h1>
                <p className="text-lg text-slate-500 leading-relaxed max-w-lg mx-auto md:mx-0 mt-6">
                  SkinVision YOLO uses advanced computer vision to analyze skin lesions for signs of melanoma instantly.
                </p>
              </motion.div>
            </div>

            <div className="flex-1 w-full max-w-md">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="bg-white p-6 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100"
              >
                <UploadZone 
                  onImageSelected={handleImageSelected} 
                  isAnalyzing={isProcessing} 
                />
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="max-w-5xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <FeatureCard 
            icon={ShieldCheck}
            title="Medical Grade"
            description="Trained on thousands of clinical dermoscopy images for high accuracy."
          />
          <FeatureCard 
            icon={Brain}
            title="Instant Analysis"
            description="Get results in seconds with our optimized YOLOv8 segmentation model."
          />
          <FeatureCard 
            icon={Smartphone}
            title="Privacy First"
            description="Your medical data is encrypted and secure. We value your privacy."
          />
        </div>
      </div>
    </div>
  );
}

function FeatureCard({ icon: Icon, title, description }: any) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
      <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 mb-4">
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="text-lg font-bold text-slate-900 mb-2">{title}</h3>
      <p className="text-slate-500 text-sm leading-relaxed">{description}</p>
    </div>
  );
}
