import { useState } from "react";
import { Navigation } from "@/components/Navigation";
import { useScans, useCreateConsultation } from "@/hooks/use-scans";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { Video, Send, Copy, Check, Shield, Globe, Hospital, Link as LinkIcon, Loader2 } from "lucide-react";
import { Link } from "wouter";
import type { Scan } from "@shared/schema";

export default function TeleDerm() {
  const { data: scans } = useScans();
  const createConsultation = useCreateConsultation();
  const { toast } = useToast();
  const [selectedScan, setSelectedScan] = useState<number | null>(null);
  const [doctorEmail, setDoctorEmail] = useState("");
  const [message, setMessage] = useState("");
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleSubmit = async () => {
    if (!selectedScan) { toast({ title: "Select a scan", variant: "destructive" }); return; }
    try {
      const result = await createConsultation.mutateAsync({ scanId: selectedScan, doctorEmail: doctorEmail || undefined, message: message || undefined });
      const url = `${window.location.origin}/shared/${result.shareToken}`;
      setShareUrl(url);
      toast({ title: "Consultation request created!", description: "Share the link with your doctor." });
    } catch { toast({ title: "Error", variant: "destructive" }); }
  };

  const handleCopy = () => {
    if (shareUrl) { navigator.clipboard.writeText(shareUrl); setCopied(true); setTimeout(() => setCopied(false), 2000); }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-24 md:pb-10">
      <Navigation />
      <div className="max-w-4xl mx-auto px-6 py-8 md:py-12">
        <div className="mb-8">
          <h1 className="text-2xl font-display font-bold text-slate-900 flex items-center gap-2"><Video className="w-6 h-6 text-blue-500" /> Tele-Dermatology</h1>
          <p className="text-sm text-slate-500 mt-1">Share your AI analysis with a dermatologist for professional review.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-5">
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">Select a scan to share</label>
              {scans && scans.length > 0 ? (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {scans.map((scan: Scan) => (
                    <button key={scan.id} onClick={() => setSelectedScan(scan.id)}
                      className={`relative rounded-xl overflow-hidden border-2 transition-all aspect-square ${selectedScan === scan.id ? "border-blue-500 shadow-md" : "border-slate-100 hover:border-slate-300"}`}>
                      <img src={scan.imageUrl} alt="" className="w-full h-full object-cover" />
                      {selectedScan === scan.id && <div className="absolute inset-0 bg-blue-500/20 flex items-center justify-center"><Check className="w-6 h-6 text-white" /></div>}
                      <div className={`absolute bottom-1 right-1 w-4 h-4 rounded-full text-[8px] font-bold flex items-center justify-center text-white ${scan.riskScore >= 50 ? "bg-red-500" : "bg-emerald-500"}`}>
                        {scan.riskLevel?.[0]}
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 bg-slate-50 rounded-xl">
                  <p className="text-sm text-slate-400">No scans available. <Link href="/" className="text-blue-600 hover:underline">Analyze one first.</Link></p>
                </div>
              )}
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">Doctor's email (optional)</label>
              <Input value={doctorEmail} onChange={e => setDoctorEmail(e.target.value)} placeholder="doctor@clinic.com" className="rounded-xl" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">Message to doctor (optional)</label>
              <textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="I noticed this mole has been changing..."
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none h-24" />
            </div>
            <Button onClick={handleSubmit} disabled={!selectedScan || createConsultation.isPending}
              className="w-full py-5 rounded-xl bg-blue-600 hover:bg-blue-700 text-base font-semibold gap-2">
              {createConsultation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Generate Shareable Report
            </Button>

            {shareUrl && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="bg-emerald-50 p-4 rounded-xl border border-emerald-200">
                <p className="text-xs text-emerald-700 font-semibold mb-2">Report link generated!</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-xs bg-white p-2.5 rounded-lg border border-emerald-200 text-slate-700 truncate">{shareUrl}</code>
                  <Button size="sm" variant="outline" onClick={handleCopy} className="shrink-0 gap-1.5 rounded-lg border-emerald-300">
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />} {copied ? "Copied" : "Copy"}
                  </Button>
                </div>
              </motion.div>
            )}
          </div>

          {/* Info */}
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
              <h3 className="font-bold text-sm text-slate-900 mb-3">How it works</h3>
              <div className="space-y-3">
                {[
                  { step: "1", text: "Select a completed scan" },
                  { step: "2", text: "Add doctor details (optional)" },
                  { step: "3", text: "Generate a secure report link" },
                  { step: "4", text: "Doctor views full AI analysis" },
                ].map(s => (
                  <div key={s.step} className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-xs font-bold flex items-center justify-center shrink-0">{s.step}</div>
                    <p className="text-xs text-slate-600">{s.text}</p>
                  </div>
                ))}
              </div>
            </div>
            <InfoCard icon={Shield} title="Secure" desc="Reports are encrypted with unique tokens." color="emerald" />
            <InfoCard icon={Globe} title="Accessible" desc="Works on any device with a browser." color="blue" />
            <InfoCard icon={Hospital} title="FHIR Compatible" desc="Export data in HL7 FHIR format for EHR systems." color="purple" />
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoCard({ icon: Icon, title, desc, color }: any) {
  const colors: Record<string, string> = { emerald: "bg-emerald-50 text-emerald-600", blue: "bg-blue-50 text-blue-600", purple: "bg-purple-50 text-purple-600" };
  return (
    <div className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm">
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${colors[color]}`}><Icon className="w-4 h-4" /></div>
      <h4 className="text-xs font-bold text-slate-800">{title}</h4>
      <p className="text-xs text-slate-400 mt-0.5">{desc}</p>
    </div>
  );
}
