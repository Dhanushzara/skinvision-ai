import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, CheckCircle, MapPin, Share2, Download, Brain, Eye, BarChart3, Shield, ChevronDown, ChevronUp, Send, Copy, Check } from "lucide-react";
import { Link } from "wouter";
import type { Scan } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { useCreateConsultation, useExportFHIR } from "@/hooks/use-scans";
import { useToast } from "@/hooks/use-toast";

// ── Heatmap Canvas Overlay (XAI Feature 5) ──
function HeatmapOverlay({ imageUrl, regions, visible }: { imageUrl: string; regions: any[]; visible: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!visible || !canvasRef.current || !regions?.length) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      // Draw heatmap regions
      regions.forEach((r) => {
        const cx = (r.x / 100) * img.width;
        const cy = (r.y / 100) * img.height;
        const rad = (r.radius / 100) * Math.min(img.width, img.height);
        const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, rad);
        const alpha = r.intensity * 0.6;
        if (r.intensity > 0.7) {
          gradient.addColorStop(0, `rgba(255, 0, 0, ${alpha})`);
          gradient.addColorStop(0.5, `rgba(255, 100, 0, ${alpha * 0.6})`);
          gradient.addColorStop(1, "rgba(255, 200, 0, 0)");
        } else if (r.intensity > 0.4) {
          gradient.addColorStop(0, `rgba(255, 165, 0, ${alpha})`);
          gradient.addColorStop(0.5, `rgba(255, 200, 50, ${alpha * 0.5})`);
          gradient.addColorStop(1, "rgba(255, 255, 100, 0)");
        } else {
          gradient.addColorStop(0, `rgba(0, 150, 255, ${alpha})`);
          gradient.addColorStop(0.5, `rgba(0, 200, 255, ${alpha * 0.4})`);
          gradient.addColorStop(1, "rgba(100, 230, 255, 0)");
        }
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(cx, cy, rad, 0, Math.PI * 2);
        ctx.fill();
        // Label
        if (r.label) {
          ctx.fillStyle = "rgba(255,255,255,0.95)";
          ctx.font = `bold ${Math.max(12, img.width * 0.02)}px sans-serif`;
          ctx.fillText(r.label, cx - rad * 0.5, cy - rad - 5);
        }
      });
    };
    img.src = imageUrl;
  }, [imageUrl, regions, visible]);

  return (
    <div ref={containerRef} className="absolute inset-0">
      <canvas ref={canvasRef} className={`w-full h-full object-cover transition-opacity duration-500 ${visible ? "opacity-100" : "opacity-0"}`} />
    </div>
  );
}

// ── ABCDE Radar Chart (XAI Feature 5) ──
function ABCDERadar({ scores }: { scores: any }) {
  if (!scores) return null;
  const labels = ["Asymmetry", "Border", "Color", "Diameter", "Evolution"];
  const values = [scores.asymmetry, scores.border, scores.color, scores.diameter, scores.evolution];
  const cx = 100, cy = 100, maxR = 75;
  const angles = labels.map((_, i) => (Math.PI * 2 * i) / labels.length - Math.PI / 2);
  const points = values.map((v, i) => ({
    x: cx + Math.cos(angles[i]) * (v / 10) * maxR,
    y: cy + Math.sin(angles[i]) * (v / 10) * maxR,
  }));
  const pathD = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ") + " Z";

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 200 200" className="w-48 h-48">
        {[0.25, 0.5, 0.75, 1].map(scale => (
          <polygon key={scale} points={angles.map(a => `${cx + Math.cos(a) * maxR * scale},${cy + Math.sin(a) * maxR * scale}`).join(" ")}
            fill="none" stroke="#e2e8f0" strokeWidth="0.5" />
        ))}
        {angles.map((a, i) => (
          <g key={i}>
            <line x1={cx} y1={cy} x2={cx + Math.cos(a) * maxR} y2={cy + Math.sin(a) * maxR} stroke="#e2e8f0" strokeWidth="0.5" />
            <text x={cx + Math.cos(a) * (maxR + 15)} y={cy + Math.sin(a) * (maxR + 15)}
              textAnchor="middle" dominantBaseline="middle" className="fill-slate-500" style={{ fontSize: "8px", fontWeight: 600 }}>
              {labels[i]}
            </text>
          </g>
        ))}
        <path d={pathD} fill="rgba(59, 130, 246, 0.2)" stroke="#3b82f6" strokeWidth="2" />
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="3" fill="#3b82f6" stroke="white" strokeWidth="1.5" />
        ))}
      </svg>
      <div className="grid grid-cols-5 gap-2 text-center mt-2 w-full">
        {labels.map((l, i) => (
          <div key={l}>
            <div className={`text-sm font-bold ${values[i] > 7 ? "text-red-500" : values[i] > 4 ? "text-amber-500" : "text-emerald-500"}`}>{values[i].toFixed(1)}</div>
            <div className="text-[10px] text-slate-400">{l[0]}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Risk Gauge (Feature 2) ──
function RiskGauge({ score, level }: { score: number; level: string }) {
  const rotation = (score / 100) * 180 - 90;
  const color = score >= 75 ? "#dc2626" : score >= 50 ? "#f59e0b" : score >= 25 ? "#3b82f6" : "#10b981";
  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 120 70" className="w-36">
        <path d="M 10 60 A 50 50 0 0 1 110 60" fill="none" stroke="#f1f5f9" strokeWidth="8" strokeLinecap="round" />
        <path d="M 10 60 A 50 50 0 0 1 110 60" fill="none" stroke={color} strokeWidth="8" strokeLinecap="round"
          strokeDasharray={`${(score / 100) * 157} 157`} className="transition-all duration-1000" />
        <g transform={`rotate(${rotation}, 60, 60)`}>
          <line x1="60" y1="60" x2="60" y2="20" stroke={color} strokeWidth="2" strokeLinecap="round" />
        </g>
        <circle cx="60" cy="60" r="4" fill={color} />
      </svg>
      <div className="text-center -mt-1">
        <span className="text-2xl font-bold" style={{ color }}>{score}</span>
        <span className="text-xs text-slate-400">/100</span>
      </div>
      <span className="text-xs font-semibold mt-0.5 px-2 py-0.5 rounded-full" style={{ backgroundColor: color + "20", color }}>{level} Risk</span>
    </div>
  );
}

// ── Classification Bar Chart (Feature 1) ──
function ClassificationBars({ classifications }: { classifications: any[] }) {
  if (!classifications?.length) return null;
  const maxProb = Math.max(...classifications.map(c => c.probability));
  return (
    <div className="space-y-2.5">
      {classifications.map((c, i) => (
        <motion.div key={c.condition} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}>
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${c.isMalignant ? "bg-red-500" : "bg-emerald-500"}`} />
              <span className="text-xs font-semibold text-slate-700">{c.condition}</span>
            </div>
            <span className="text-xs font-bold text-slate-900">{c.probability}%</span>
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <motion.div initial={{ width: 0 }} animate={{ width: `${(c.probability / maxProb) * 100}%` }}
              transition={{ duration: 0.8, delay: i * 0.1 }}
              className={`h-full rounded-full ${c.isMalignant ? "bg-gradient-to-r from-red-400 to-red-500" : "bg-gradient-to-r from-emerald-400 to-teal-500"}`} />
          </div>
        </motion.div>
      ))}
    </div>
  );
}

// ── Main Component ──
export function ScanResultCard({ scan }: { scan: Scan }) {
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>("classifications");
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const createConsultation = useCreateConsultation();
  const exportFHIR = useExportFHIR();
  const { toast } = useToast();

  const isHighRisk = scan.riskScore >= 50;
  const classifications = (scan.classifications || []) as any[];

  const handleShare = async () => {
    try {
      const result = await createConsultation.mutateAsync({ scanId: scan.id });
      const url = `${window.location.origin}/shared/${result.shareToken}`;
      setShareUrl(url);
      toast({ title: "Report link created!", description: "Share this link with your doctor." });
    } catch { toast({ title: "Error", description: "Failed to create share link.", variant: "destructive" }); }
  };

  const handleCopy = () => {
    if (shareUrl) { navigator.clipboard.writeText(shareUrl); setCopied(true); setTimeout(() => setCopied(false), 2000); }
  };

  const handleExportFHIR = async () => {
    try {
      const data = await exportFHIR.mutateAsync(scan.id);
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url; a.download = `scan-${scan.id}-fhir.json`; a.click();
      toast({ title: "Exported", description: "FHIR DiagnosticReport downloaded." });
    } catch { toast({ title: "Export failed", variant: "destructive" }); }
  };

  const toggle = (section: string) => setExpandedSection(expandedSection === section ? null : section);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      {/* Image + Heatmap */}
      <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/60 overflow-hidden border border-slate-100">
        <div className="relative h-64 sm:h-72 bg-slate-100">
          <img src={scan.imageUrl} alt="Scan" className={`w-full h-full object-cover transition-opacity ${showHeatmap ? "opacity-0" : "opacity-100"}`} />
          {scan.heatmapRegions && <HeatmapOverlay imageUrl={scan.imageUrl} regions={scan.heatmapRegions as any[]} visible={showHeatmap} />}
          {/* Overlay controls */}
          <div className="absolute top-3 right-3 flex gap-2">
            <button onClick={() => setShowHeatmap(!showHeatmap)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold backdrop-blur-md border transition-all ${
                showHeatmap ? "bg-blue-600 text-white border-blue-700" : "bg-black/40 text-white border-white/20 hover:bg-black/60"
              }`}>
              <Eye className="w-3.5 h-3.5" /> {showHeatmap ? "Original" : "XAI Heatmap"}
            </button>
          </div>
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-5 flex items-end justify-between">
            <div>
              <p className="text-white/80 text-xs">Primary Detection</p>
              <p className="text-white text-lg font-bold">{scan.result}</p>
            </div>
            {scan.bodyLocation && (
              <span className="text-xs bg-white/20 backdrop-blur-sm text-white px-2.5 py-1 rounded-full flex items-center gap-1">
                <MapPin className="w-3 h-3" /> {scan.bodyLocation}
              </span>
            )}
          </div>
        </div>

        {/* Risk Score + Quick Stats */}
        <div className="p-5 border-b border-slate-100">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <RiskGauge score={scan.riskScore} level={scan.riskLevel} />
            <div className="flex-1 min-w-[200px] space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-display font-bold text-slate-900">Analysis Report</h2>
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-bold text-xs border ${
                  isHighRisk ? "bg-red-50 text-red-600 border-red-100" : "bg-emerald-50 text-emerald-600 border-emerald-100"
                }`}>
                  {isHighRisk ? <AlertTriangle className="w-3.5 h-3.5" /> : <CheckCircle className="w-3.5 h-3.5" />}
                  {scan.riskLevel}
                </span>
              </div>
              <p className="text-sm text-slate-500 leading-relaxed">{scan.aiExplanation?.slice(0, 150)}...</p>
            </div>
          </div>
        </div>
      </div>

      {/* Expandable Sections */}
      <div className="space-y-3">
        {/* Multi-Class Classifications */}
        <CollapsibleSection title="Multi-Class Detection" icon={<BarChart3 className="w-4 h-4" />} isOpen={expandedSection === "classifications"} onToggle={() => toggle("classifications")}>
          <ClassificationBars classifications={classifications} />
          <div className="mt-3 flex gap-2">
            <span className="text-xs flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-red-500" /> Malignant</span>
            <span className="text-xs flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-500" /> Benign</span>
          </div>
        </CollapsibleSection>

        {/* XAI Explanation */}
        <CollapsibleSection title="AI Explanation (XAI)" icon={<Brain className="w-4 h-4" />} isOpen={expandedSection === "xai"} onToggle={() => toggle("xai")}>
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-1">
              <ABCDERadar scores={scan.abcdeScores} />
            </div>
            <div className="flex-1 space-y-3">
              <p className="text-sm text-slate-600 leading-relaxed">{scan.aiExplanation}</p>
              <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
                <p className="text-xs text-blue-700 font-medium">The heatmap highlights regions the model focused on. Warmer colors = higher attention. Toggle the "XAI Heatmap" button on the image to visualize.</p>
              </div>
            </div>
          </div>
        </CollapsibleSection>

        {/* Actions: Share, Export */}
        <CollapsibleSection title="Share & Export" icon={<Share2 className="w-4 h-4" />} isOpen={expandedSection === "share"} onToggle={() => toggle("share")}>
          <div className="space-y-4">
            {/* Tele-Derm Share */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button onClick={handleShare} disabled={createConsultation.isPending} className="flex-1 gap-2 rounded-xl bg-blue-600 hover:bg-blue-700">
                <Send className="w-4 h-4" /> {createConsultation.isPending ? "Creating..." : "Generate Report Link"}
              </Button>
              <Button onClick={handleExportFHIR} variant="outline" disabled={exportFHIR.isPending} className="flex-1 gap-2 rounded-xl">
                <Download className="w-4 h-4" /> Export FHIR (HL7)
              </Button>
            </div>
            {shareUrl && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <p className="text-xs text-slate-500 mb-2 font-medium">Share this link with your doctor:</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-xs bg-white p-2 rounded-lg border border-slate-200 text-slate-700 truncate">{shareUrl}</code>
                  <Button size="sm" variant="outline" onClick={handleCopy} className="shrink-0 gap-1.5 rounded-lg">
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? "Copied" : "Copy"}
                  </Button>
                </div>
              </motion.div>
            )}
          </div>
        </CollapsibleSection>
      </div>

      {/* CTA */}
      <div className={`rounded-2xl p-5 border ${isHighRisk ? "bg-red-50 border-red-100" : "bg-emerald-50 border-emerald-100"}`}>
        {isHighRisk ? (
          <div className="space-y-3">
            <p className="text-sm text-red-800 font-medium"><strong>Attention:</strong> The AI model detected patterns associated with potential malignancy. This is not a diagnosis — consult a dermatologist promptly.</p>
            <Link href="/dermatologist"><Button className="w-full bg-red-600 hover:bg-red-700 text-white py-5 rounded-xl"><MapPin className="w-5 h-5 mr-2" /> Find a Dermatologist</Button></Link>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-emerald-800 font-medium"><strong>Good news:</strong> No high-risk patterns detected. Continue monitoring and maintain skin health.</p>
            <Link href="/self-care"><Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-5 rounded-xl"><Shield className="w-5 h-5 mr-2" /> Self-Care Tips</Button></Link>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function CollapsibleSection({ title, icon, isOpen, onToggle, children }: any) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <button onClick={onToggle} className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">{icon}</div>
          <span className="font-semibold text-sm text-slate-800">{title}</span>
        </div>
        {isOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}>
            <div className="px-4 pb-4">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
