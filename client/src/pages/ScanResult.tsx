import { useRoute, Link } from "wouter";
import { Navigation } from "@/components/Navigation";
import { useScan } from "@/hooks/use-scans";
import { ScanResultCard } from "@/components/ScanResultCard";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

export default function ScanResult() {
  const [, params] = useRoute("/result/:id");
  const id = params?.id ? parseInt(params.id) : 0;
  const { data: scan, isLoading, isError } = useScan(id);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-10 h-10 animate-spin text-blue-500 mx-auto" />
          <p className="text-slate-500 font-medium">Loading analysis...</p>
        </div>
      </div>
    );
  }

  if (isError || !scan) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
        <div className="max-w-md text-center space-y-4">
          <h1 className="text-2xl font-bold text-slate-900">Scan not found</h1>
          <p className="text-slate-500">The scan does not exist or has been deleted.</p>
          <Link href="/"><Button>Return Home</Button></Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-24 md:pb-10">
      <Navigation />
      <div className="max-w-3xl mx-auto px-6 pt-6 pb-10 md:pt-10">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/"><Button variant="ghost" size="icon" className="rounded-full hover:bg-white"><ChevronLeft className="w-6 h-6 text-slate-600" /></Button></Link>
          <h1 className="text-xl font-display font-bold text-slate-900">Scan Report #{scan.id}</h1>
        </div>
        <ScanResultCard scan={scan} />
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="mt-6 text-center">
          <p className="text-xs text-slate-400 max-w-lg mx-auto">
            Disclaimer: This tool uses AI to assist in detection but does NOT replace professional medical advice. Always consult a certified dermatologist.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
