import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import multer from "multer";
import path from "path";
import express from "express";
import crypto from "crypto";
import type { Classification, HeatmapRegion, ABCDEScore, RiskLevel } from "@shared/schema";

const upload = multer({
  storage: multer.diskStorage({
    destination: 'uploads/',
    filename: (_req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
  })
});

// ── Sophisticated Multi-Class ML Simulation Engine ──
function generateClassifications(): Classification[] {
  const malignant = [
    { condition: "Melanoma", base: 0.15, isMalignant: true },
    { condition: "Basal Cell Carcinoma", base: 0.08, isMalignant: true },
    { condition: "Squamous Cell Carcinoma", base: 0.05, isMalignant: true },
    { condition: "Actinic Keratosis", base: 0.10, isMalignant: true },
  ];
  const benign = [
    { condition: "Benign Keratosis", base: 0.20, isMalignant: false },
    { condition: "Melanocytic Nevus", base: 0.25, isMalignant: false },
    { condition: "Dermatofibroma", base: 0.05, isMalignant: false },
    { condition: "Vascular Lesion", base: 0.04, isMalignant: false },
    { condition: "Psoriasis", base: 0.03, isMalignant: false },
    { condition: "Eczema", base: 0.03, isMalignant: false },
    { condition: "Acne", base: 0.02, isMalignant: false },
  ];

  const all = [...malignant, ...benign];
  // Generate realistic probability distribution using softmax-like approach
  const raw = all.map(c => c.base + Math.random() * 0.3);
  const sum = raw.reduce((a, b) => a + b, 0);
  const normalized = raw.map(v => Math.round((v / sum) * 1000) / 10);

  // Sort descending and return top 5
  return all.map((c, i) => ({
    condition: c.condition,
    probability: normalized[i],
    isMalignant: c.isMalignant,
  }))
  .sort((a, b) => b.probability - a.probability)
  .slice(0, 5);
}

function computeRiskScore(classifications: Classification[]): { riskLevel: RiskLevel; riskScore: number } {
  const malignantSum = classifications
    .filter(c => c.isMalignant)
    .reduce((sum, c) => sum + c.probability, 0);

  const topIsMalignant = classifications[0]?.isMalignant || false;
  const topProb = classifications[0]?.probability || 0;

  // Weighted risk: top prediction weight + overall malignancy weight
  let score = Math.round(malignantSum * 0.6 + (topIsMalignant ? topProb * 0.8 : topProb * 0.1));
  score = Math.min(100, Math.max(0, score));

  let level: RiskLevel = "Low";
  if (score >= 25) level = "Medium";
  if (score >= 50) level = "High";
  if (score >= 75) level = "Critical";

  return { riskLevel: level, riskScore: score };
}

function generateHeatmapRegions(): HeatmapRegion[] {
  const count = 3 + Math.floor(Math.random() * 4);
  return Array.from({ length: count }, (_, i) => ({
    x: 20 + Math.random() * 60, // percentage positions
    y: 20 + Math.random() * 60,
    radius: 5 + Math.random() * 15,
    intensity: 0.3 + Math.random() * 0.7,
    label: i === 0 ? "Primary Region of Interest" : undefined,
  })).sort((a, b) => b.intensity - a.intensity);
}

function generateABCDE(): ABCDEScore {
  return {
    asymmetry: Math.round((Math.random() * 10) * 10) / 10,
    border: Math.round((Math.random() * 10) * 10) / 10,
    color: Math.round((Math.random() * 10) * 10) / 10,
    diameter: Math.round((Math.random() * 10) * 10) / 10,
    evolution: Math.round((Math.random() * 10) * 10) / 10,
  };
}

function generateExplanation(classifications: Classification[], abcde: ABCDEScore, risk: RiskLevel): string {
  const top = classifications[0];
  const highFeatures: string[] = [];
  if (abcde.asymmetry > 6) highFeatures.push("asymmetric shape");
  if (abcde.border > 6) highFeatures.push("irregular borders");
  if (abcde.color > 6) highFeatures.push("color heterogeneity");
  if (abcde.diameter > 6) highFeatures.push("large diameter");
  if (abcde.evolution > 6) highFeatures.push("evolving morphology");

  const featureStr = highFeatures.length > 0
    ? `Notable features include ${highFeatures.join(", ")}.`
    : "No highly concerning morphological features were detected.";

  return `The AI model classified this lesion as most likely ${top.condition} (${top.probability}% confidence). ${featureStr} Overall risk assessment: ${risk}. ${
    top.isMalignant
      ? "This classification suggests potential malignancy. Professional dermatological evaluation is strongly recommended."
      : "This classification suggests a benign condition, but continued monitoring is advised."
  }`;
}

function generateFHIR(scan: any) {
  return {
    resourceType: "DiagnosticReport",
    id: `skinvision-scan-${scan.id}`,
    status: "final",
    code: {
      coding: [{
        system: "http://loinc.org",
        code: "72386-7",
        display: "Dermatology Diagnostic study note",
      }],
    },
    effectiveDateTime: scan.analyzedAt?.toISOString() || new Date().toISOString(),
    result: (scan.classifications || []).map((c: Classification) => ({
      display: c.condition,
      value: c.probability,
      isMalignant: c.isMalignant,
    })),
    conclusion: scan.aiExplanation || scan.result,
    riskAssessment: {
      riskLevel: scan.riskLevel,
      riskScore: scan.riskScore,
    },
    abcdeAnalysis: scan.abcdeScores,
  };
}

export async function registerRoutes(httpServer: Server, app: Express): Promise<Server> {
  app.use('/uploads', express.static('uploads'));

  const fs = await import('fs');
  if (!fs.existsSync('uploads')) fs.mkdirSync('uploads');

  // ── File Upload ──
  app.post('/api/upload', upload.single('image'), (req, res) => {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    res.json({ url: `/uploads/${req.file.filename}` });
  });

  // ── Create Scan (Full ML Pipeline Simulation) ──
  app.post(api.scans.create.path, async (req, res) => {
    try {
      const input = api.scans.create.input.parse(req.body);
      const classifications = generateClassifications();
      const { riskLevel, riskScore } = computeRiskScore(classifications);
      const heatmapRegions = generateHeatmapRegions();
      const abcdeScores = generateABCDE();
      const aiExplanation = generateExplanation(classifications, abcdeScores, riskLevel);

      const scan = await storage.createScan({
        imageUrl: input.imageUrl,
        result: classifications[0].condition,
        confidence: Math.round(classifications[0].probability),
        classifications,
        riskLevel,
        riskScore,
        heatmapRegions,
        abcdeScores,
        aiExplanation,
        segmentationMask: null,
        patientId: input.patientId || `patient-${Date.now()}`,
        bodyLocation: input.bodyLocation || null,
        notes: input.notes || null,
        tags: null,
        sharedWithDoctor: false,
        doctorNotes: null,
        consultationStatus: "none",
      });

      res.status(201).json(scan);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message, field: err.errors[0].path.join('.') });
      }
      throw err;
    }
  });

  // ── Specific routes FIRST (before /:id to avoid shadowing) ──
  app.get(api.scans.list.path, async (req, res) => {
    const scans = await storage.getScans();
    res.json(scans);
  });

  // ── Patient History (Feature 4) — must be before /api/scans/:id ──
  app.get(api.scans.history.path, async (req, res) => {
    const scans = await storage.getScansByPatient(req.params.patientId);
    res.json(scans);
  });

  app.get(api.scans.get.path, async (req, res) => {
    const scan = await storage.getScan(Number(req.params.id));
    if (!scan) return res.status(404).json({ message: 'Scan not found' });
    res.json(scan);
  });

  // ── Update Scan ──
  app.patch('/api/scans/:id', async (req, res) => {
    const scan = await storage.updateScan(Number(req.params.id), req.body);
    if (!scan) return res.status(404).json({ message: 'Scan not found' });
    res.json(scan);
  });

  // ── Tele-Dermatology: Create Consultation (Feature 6) ──
  app.post(api.consultations.create.path, async (req, res) => {
    try {
      const input = api.consultations.create.input.parse(req.body);
      const shareToken = crypto.randomBytes(16).toString('hex');
      const consultation = await storage.createConsultation({
        scanId: input.scanId,
        patientId: input.patientId,
        doctorEmail: input.doctorEmail,
        message: input.message,
        shareToken,
      });
      // Mark scan as shared
      await storage.updateScan(input.scanId, { sharedWithDoctor: true, consultationStatus: "requested" });
      res.status(201).json({ id: consultation.id, shareToken, status: consultation.status });
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      throw err;
    }
  });

  // ── Shared Report (Tele-Derm) ──
  app.get(api.consultations.getByToken.path, async (req, res) => {
    const consultation = await storage.getConsultationByToken(req.params.token);
    if (!consultation) return res.status(404).json({ message: 'Report not found' });
    const scan = await storage.getScan(consultation.scanId);
    if (!scan) return res.status(404).json({ message: 'Scan not found' });
    res.json({ scan, consultation });
  });

  // ── FHIR Export (Feature 7) ──
  app.get(api.export.fhir.path, async (req, res) => {
    const scan = await storage.getScan(Number(req.params.id));
    if (!scan) return res.status(404).json({ message: 'Scan not found' });
    res.json(generateFHIR(scan));
  });

  // ── UV Index ──
  app.get(api.weather.uv.path, async (req, res) => {
    try {
      const { lat, lng } = req.query;
      if (!lat || !lng) return res.status(400).json({ message: "Latitude and Longitude required" });

      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&daily=uv_index_max&timezone=auto&forecast_days=1`
      );
      const data = await response.json();
      const uvMax = data.daily?.uv_index_max?.[0] || 0;

      let riskLevel = "Low", message = "Low danger from the sun's UV rays.";
      if (uvMax >= 3 && uvMax < 6) { riskLevel = "Moderate"; message = "Stay in shade near midday."; }
      else if (uvMax >= 6 && uvMax < 8) { riskLevel = "High"; message = "Reduce time in the sun between 10 a.m. and 4 p.m."; }
      else if (uvMax >= 8 && uvMax < 11) { riskLevel = "Very High"; message = "Minimize sun exposure between 10 a.m. and 4 p.m."; }
      else if (uvMax >= 11) { riskLevel = "Extreme"; message = "Avoid sun exposure between 10 a.m. and 4 p.m."; }

      res.json({ uvIndex: uvMax, uvMax, riskLevel, message });
    } catch (error) {
      console.error("UV API Error:", error);
      res.status(500).json({ message: "Failed to fetch UV data" });
    }
  });

  return httpServer;
}
