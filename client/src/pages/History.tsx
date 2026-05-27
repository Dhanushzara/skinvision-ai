import { Navigation } from "@/components/Navigation";
import { useScans } from "@/hooks/use-scans";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { Clock, AlertTriangle, CheckCircle, ChevronRight, BarChart3, MapPin, Loader2 } from "lucide-react";
import type { Scan } from "@shared/schema";

export default function History() {
  const { data: scans, isLoading } = useScans();

  // Group by date
  const grouped = (scans || []).reduce((acc: Record<string, Scan[]>, scan: Scan) => {
    const date = scan.analyzedAt ? new Date(scan.analyzedAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : "Unknown";
    (acc[date] = acc[date] || []).push(scan);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-slate-50 pb-24 md:pb-10">
      <Navigation />
      <div className="max-w-4xl mx-auto px-6 py-8 md:py-12">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-display font-bold text-slate-900 flex items-center gap-2">
              <Clock className="w-6 h-6 text-blue-500" /> Scan History
            </h1>
            <p className="text-sm text-slate-500 mt-1">Track lesion changes over time to detect progression early.</p>
          </div>
          {scans && <span className="text-xs bg-blue-50 text-blue-600 px-3 py-1.5 rounded-full font-semibold">{scans.length} scans</span>}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-slate-300" /></div>
        ) : !scans || scans.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 mx-auto bg-slate-100 rounded-2xl flex items-center justify-center mb-4"><BarChart3 className="w-8 h-8 text-slate-300" /></div>
            <h3 className="text-lg font-semibold text-slate-700 mb-1">No scans yet</h3>
            <p className="text-sm text-slate-400">Upload your first skin lesion image to start tracking.</p>
            <Link href="/"><button className="mt-4 px-5 py-2.5 bg-blue-600 text-white rounded-full text-sm font-semibold hover:bg-blue-700 transition-colors">Start Scan</button></Link>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(grouped).map(([date, dateScans]) => (
              <div key={date}>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">{date}</h3>
                <div className="space-y-2">
                  {(dateScans as Scan[]).map((scan, i) => (
                    <Link key={scan.id} href={`/result/${scan.id}`}>
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                        className="bg-white rounded-xl border border-slate-100 p-3 flex items-center gap-4 hover:shadow-md hover:border-slate-200 transition-all cursor-pointer group">
                        <div className="w-14 h-14 rounded-lg bg-slate-100 overflow-hidden shrink-0">
                          <img src={scan.imageUrl} alt="" className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-slate-800 truncate">{scan.result}</span>
                            {scan.riskScore >= 50 ? <AlertTriangle className="w-3.5 h-3.5 text-red-500 shrink-0" /> : <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />}
                          </div>
                          <div className="flex items-center gap-3 mt-0.5">
                            <span className="text-xs text-slate-400">{scan.confidence}% conf.</span>
                            <span className={`text-xs font-semibold ${scan.riskScore >= 75 ? "text-red-500" : scan.riskScore >= 50 ? "text-amber-500" : scan.riskScore >= 25 ? "text-blue-500" : "text-emerald-500"}`}>
                              Risk: {scan.riskScore}/100
                            </span>
                            {scan.bodyLocation && <span className="text-xs text-slate-400 flex items-center gap-0.5"><MapPin className="w-3 h-3" />{scan.bodyLocation}</span>}
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors shrink-0" />
                      </motion.div>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Progression Insight */}
        {scans && scans.length >= 2 && (
          <div className="mt-8 bg-gradient-to-r from-blue-600 to-teal-500 rounded-2xl p-6 text-white">
            <h3 className="font-bold text-lg mb-2">Progression Tracking</h3>
            <p className="text-blue-100 text-sm mb-3">You have {scans.length} scans recorded. Regular monitoring helps detect changes early — the key to successful treatment.</p>
            <div className="flex items-center gap-4">
              {scans.slice(0, 5).map((scan: Scan) => (
                <div key={scan.id} className="w-12 h-12 rounded-lg border-2 border-white/30 overflow-hidden">
                  <img src={scan.imageUrl} alt="" className="w-full h-full object-cover" />
                </div>
              ))}
              {scans.length > 5 && <span className="text-sm text-white/70 font-medium">+{scans.length - 5} more</span>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
