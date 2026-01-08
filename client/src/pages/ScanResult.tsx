import { useRoute, Link } from "wouter";
import { Navigation } from "@/components/Navigation";
import { useScan } from "@/hooks/use-scans";
import { ScanResultCard } from "@/components/ScanResultCard";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

export default function ScanResult() {
  const [match, params] = useRoute("/result/:id");
  const id = params?.id ? parseInt(params.id) : 0;
  
  const { data: scan, isLoading, isError } = useScan(id);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto" />
          <p className="text-slate-500 font-medium">Retrieving analysis...</p>
        </div>
      </div>
    );
  }

  if (isError || !scan) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
        <div className="max-w-md text-center space-y-4">
          <h1 className="text-2xl font-bold text-slate-900">Scan not found</h1>
          <p className="text-slate-500">The scan you are looking for does not exist or has been deleted.</p>
          <Link href="/">
            <Button>Return Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-24 md:pb-10">
      <Navigation />
      
      <div className="max-w-3xl mx-auto px-6 pt-8 pb-12 md:pt-12">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/">
            <Button variant="ghost" size="icon" className="rounded-full hover:bg-white hover:shadow-sm">
              <ChevronLeft className="w-6 h-6 text-slate-600" />
            </Button>
          </Link>
          <h1 className="text-2xl font-display font-bold text-slate-900">Scan Report</h1>
        </div>

        <ScanResultCard scan={scan} />

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-8 text-center"
        >
          <p className="text-xs text-slate-400 max-w-lg mx-auto">
            Disclaimer: This tool uses artificial intelligence to assist in detection but does NOT replace professional medical advice. Always consult a certified dermatologist for diagnosis.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
