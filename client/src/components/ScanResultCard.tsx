import { motion } from "framer-motion";
import { AlertTriangle, CheckCircle, ArrowRight, MapPin } from "lucide-react";
import { Link } from "wouter";
import type { ScanResponse } from "@shared/schema";
import { Button } from "@/components/ui/button";

interface ScanResultCardProps {
  scan: ScanResponse;
}

export function ScanResultCard({ scan }: ScanResultCardProps) {
  const isHighRisk = scan.result === "Melanoma";
  const confidencePercent = scan.confidence;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-3xl shadow-xl shadow-slate-200/60 overflow-hidden border border-slate-100"
    >
      <div className="relative h-64 bg-slate-100">
        <img 
          src={scan.imageUrl} 
          alt="Scan Analysis" 
          className="w-full h-full object-cover"
        />
        
        {/* Simulated YOLO Bounding Box Overlay */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 border-2 border-yellow-400 rounded-lg shadow-[0_0_15px_rgba(250,204,21,0.5)] animate-pulse">
          <div className="absolute -top-6 left-0 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-0.5 rounded">
            Lesion {(confidencePercent)}%
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-6">
          <p className="text-white/90 text-sm font-medium">Scanned just now</p>
        </div>
      </div>

      <div className="p-6 md:p-8">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-2xl font-display font-bold text-slate-900 mb-1">Analysis Result</h2>
            <p className="text-slate-500 text-sm">AI Confidence Score: <span className="font-semibold text-slate-900">{confidencePercent}%</span></p>
          </div>
          
          {isHighRisk ? (
            <div className="flex flex-col items-end">
              <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-red-50 text-red-600 font-bold text-sm border border-red-100 mb-2">
                <AlertTriangle className="w-4 h-4" />
                High Risk
              </span>
            </div>
          ) : (
             <div className="flex flex-col items-end">
              <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-emerald-50 text-emerald-600 font-bold text-sm border border-emerald-100 mb-2">
                <CheckCircle className="w-4 h-4" />
                Low Risk
              </span>
            </div>
          )}
        </div>

        {isHighRisk ? (
          <div className="space-y-4">
            <div className="bg-red-50 border border-red-100 rounded-xl p-4 text-sm text-red-800 leading-relaxed">
              <strong>Attention needed:</strong> The AI model has detected patterns consistent with melanoma. This is not a diagnosis, but immediate consultation with a dermatologist is strongly recommended.
            </div>
            
            <Link href="/dermatologist">
              <Button className="w-full bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/20 py-6 text-lg rounded-xl">
                <MapPin className="w-5 h-5 mr-2" />
                Find a Dermatologist
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
             <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 text-sm text-emerald-800 leading-relaxed">
              <strong>Good news:</strong> The AI did not detect high-risk patterns. However, always monitor your skin for changes.
            </div>

            <Link href="/self-care">
              <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/20 py-6 text-lg rounded-xl">
                <ArrowRight className="w-5 h-5 mr-2" />
                View Self-Care Tips
              </Button>
            </Link>
          </div>
        )}
      </div>
    </motion.div>
  );
}
