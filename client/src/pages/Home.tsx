import { useState } from "react";
import { Navigation } from "@/components/Navigation";
import { UploadZone } from "@/components/UploadZone";
import { useCreateScan, useScans } from "@/hooks/use-scans";
import { useToast } from "@/hooks/use-toast";
import { useLocation, Link } from "wouter";
import { motion } from "framer-motion";
import { ShieldCheck, Brain, Smartphone, Layers, Activity, BarChart3, Eye, Video, Clock } from "lucide-react";

export default function Home() {
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  const createScan = useCreateScan();
  const { data: recentScans } = useScans();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleImageSelected = async (image: File | string, bodyLocation?: string) => {
    setIsProcessing(true);
    try {
      const result = await createScan.mutateAsync({ image, bodyLocation });
      setLocation(`/result/${result.id}`);
    } catch (error) {
      toast({ title: "Analysis Failed", description: error instanceof Error ? error.message : "Something went wrong", variant: "destructive" });
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-24 md:pb-0">
      <Navigation />
      {/* Hero */}
      <div className="relative overflow-hidden bg-white border-b border-slate-100">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-teal-50 opacity-60" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
        <div className="max-w-6xl mx-auto px-6 py-10 md:py-16 relative z-10">
          <div className="flex flex-col md:flex-row items-center gap-10">
            <div className="flex-1 space-y-5 text-center md:text-left">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-bold uppercase tracking-wider mb-3">
                  <Brain className="w-3 h-3" /> Multi-Class AI Dermatology
                </div>
                <h1 className="text-3xl md:text-5xl font-display font-bold text-slate-900 leading-tight">
                  Complete skin analysis, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-teal-500">powered by AI.</span>
                </h1>
                <p className="text-base text-slate-500 leading-relaxed max-w-lg mx-auto md:mx-0 mt-4">
                  Detect melanoma, psoriasis, eczema, acne & more. Get risk scores, AI explanations, and share reports with dermatologists instantly.
                </p>
                <div className="flex flex-wrap gap-3 mt-5 justify-center md:justify-start">
                  {["11 Conditions", "Risk Scoring", "XAI Heatmaps", "Tele-Derm"].map((tag) => (
                    <span key={tag} className="text-xs bg-slate-100 text-slate-600 px-3 py-1.5 rounded-full font-medium">{tag}</span>
                  ))}
                </div>
              </motion.div>
            </div>
            <div className="flex-1 w-full max-w-md">
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2, duration: 0.5 }}
                className="bg-white p-5 rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100">
                <UploadZone onImageSelected={handleImageSelected} isAnalyzing={isProcessing} />
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Scans */}
      {recentScans && recentScans.length > 0 && (
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-display font-bold text-slate-900 flex items-center gap-2"><Clock className="w-4 h-4 text-slate-400" /> Recent Scans</h2>
            <Link href="/history" className="text-sm text-blue-600 font-medium hover:underline">View All</Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {recentScans.slice(0, 4).map((scan: any) => (
              <Link key={scan.id} href={`/result/${scan.id}`}>
                <div className="bg-white rounded-xl border border-slate-100 overflow-hidden hover:shadow-md transition-shadow cursor-pointer group">
                  <div className="h-28 bg-slate-100 relative">
                    <img src={scan.imageUrl} alt="" className="w-full h-full object-cover" />
                    <div className={`absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      scan.riskScore >= 50 ? "bg-red-500 text-white" : "bg-emerald-500 text-white"
                    }`}>{scan.riskLevel}</div>
                  </div>
                  <div className="p-2.5">
                    <p className="text-xs font-semibold text-slate-800 truncate">{scan.result}</p>
                    <p className="text-[10px] text-slate-400">{scan.confidence}% confidence</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Features Grid */}
      <div className="max-w-6xl mx-auto px-6 py-12">
        <h2 className="text-xl font-display font-bold text-slate-900 mb-6 text-center">Enterprise-Grade Features</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <FeatureCard icon={Layers} title="Multi-Class Detection" description="Classifies 11 skin conditions including melanoma, psoriasis, eczema, and acne with probability scores." color="blue" />
          <FeatureCard icon={BarChart3} title="Risk Score Engine" description="Weighted severity scoring from Low to Critical with visual gauge and ABCDE dermatological analysis." color="amber" />
          <FeatureCard icon={Eye} title="Explainable AI (XAI)" description="Grad-CAM style heatmaps show exactly which regions the model focused on. Builds doctor trust." color="purple" />
          <FeatureCard icon={Clock} title="Patient History" description="Track lesion changes over time with timeline view. Detect progression early." color="emerald" />
          <FeatureCard icon={Video} title="Tele-Dermatology" description="Generate shareable report links. Doctors see full analysis with one click." color="rose" />
          <FeatureCard icon={Smartphone} title="Hospital Integration" description="FHIR-compliant export for EHR systems. Deploy to rural clinics with PWA support." color="teal" />
        </div>
      </div>
    </div>
  );
}

const colorMap: Record<string, string> = {
  blue: "bg-blue-50 text-blue-600", amber: "bg-amber-50 text-amber-600",
  purple: "bg-purple-50 text-purple-600", emerald: "bg-emerald-50 text-emerald-600",
  rose: "bg-rose-50 text-rose-600", teal: "bg-teal-50 text-teal-600",
};

function FeatureCard({ icon: Icon, title, description, color }: any) {
  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all group">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${colorMap[color]}`}>
        <Icon className="w-5 h-5" />
      </div>
      <h3 className="text-sm font-bold text-slate-900 mb-1.5">{title}</h3>
      <p className="text-slate-500 text-xs leading-relaxed">{description}</p>
    </div>
  );
}
