import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ── Disease Classification Types ──
export const SKIN_CONDITIONS = [
  "Melanoma", "Basal Cell Carcinoma", "Squamous Cell Carcinoma",
  "Actinic Keratosis", "Benign Keratosis", "Dermatofibroma",
  "Melanocytic Nevus", "Vascular Lesion", "Psoriasis", "Eczema", "Acne",
] as const;
export type SkinCondition = (typeof SKIN_CONDITIONS)[number];
export const RISK_LEVELS = ["Low", "Medium", "High", "Critical"] as const;
export type RiskLevel = (typeof RISK_LEVELS)[number];

export const classificationSchema = z.object({
  condition: z.string(),
  probability: z.number().min(0).max(100),
  isMalignant: z.boolean(),
});
export type Classification = z.infer<typeof classificationSchema>;

export const heatmapRegionSchema = z.object({
  x: z.number(), y: z.number(), radius: z.number(),
  intensity: z.number().min(0).max(1), label: z.string().optional(),
});
export type HeatmapRegion = z.infer<typeof heatmapRegionSchema>;

export const abcdeScoreSchema = z.object({
  asymmetry: z.number().min(0).max(10),
  border: z.number().min(0).max(10),
  color: z.number().min(0).max(10),
  diameter: z.number().min(0).max(10),
  evolution: z.number().min(0).max(10),
});
export type ABCDEScore = z.infer<typeof abcdeScoreSchema>;

export const scans = pgTable("scans", {
  id: serial("id").primaryKey(),
  imageUrl: text("image_url").notNull(),
  result: text("result").notNull(),
  confidence: integer("confidence").notNull(),
  classifications: jsonb("classifications").$type<Classification[]>(),
  riskLevel: text("risk_level").$type<RiskLevel>().notNull().default("Low"),
  riskScore: integer("risk_score").notNull().default(0),
  segmentationMask: text("segmentation_mask"),
  heatmapRegions: jsonb("heatmap_regions").$type<HeatmapRegion[]>(),
  abcdeScores: jsonb("abcde_scores").$type<ABCDEScore>(),
  aiExplanation: text("ai_explanation"),
  patientId: text("patient_id"),
  bodyLocation: text("body_location"),
  notes: text("notes"),
  tags: jsonb("tags").$type<string[]>(),
  sharedWithDoctor: boolean("shared_with_doctor").default(false),
  doctorNotes: text("doctor_notes"),
  consultationStatus: text("consultation_status").default("none"),
  analyzedAt: timestamp("analyzed_at").defaultNow(),
});

export const insertScanSchema = createInsertSchema(scans).omit({ id: true, analyzedAt: true });
export type Scan = typeof scans.$inferSelect;
export type InsertScan = z.infer<typeof insertScanSchema>;

export const consultations = pgTable("consultations", {
  id: serial("id").primaryKey(),
  scanId: integer("scan_id").notNull(),
  patientId: text("patient_id"),
  doctorEmail: text("doctor_email"),
  message: text("message"),
  status: text("status").notNull().default("pending"),
  shareToken: text("share_token"),
  createdAt: timestamp("created_at").defaultNow(),
});
export type Consultation = typeof consultations.$inferSelect;

export type CreateScanRequest = { imageUrl: string; patientId?: string; bodyLocation?: string; notes?: string; };
export type ScanResponse = Scan;
export type UVData = { uvIndex: number; uvMax: number; safeExposureMinutes?: number; riskLevel?: string; message?: string; };
