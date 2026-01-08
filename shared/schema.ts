import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const scans = pgTable("scans", {
  id: serial("id").primaryKey(),
  imageUrl: text("image_url").notNull(),
  result: text("result").notNull(), // "Melanoma" | "Not Melanoma"
  confidence: integer("confidence").notNull(), // 0-100
  segmentationMask: text("segmentation_mask"), // URL to mask image (optional)
  analyzedAt: timestamp("analyzed_at").defaultNow(),
});

export const insertScanSchema = createInsertSchema(scans).omit({ 
  id: true, 
  analyzedAt: true 
});

export type Scan = typeof scans.$inferSelect;
export type InsertScan = z.infer<typeof insertScanSchema>;

// Explicit API types
export type CreateScanRequest = {
  imageUrl: string;
};

export type ScanResponse = Scan;

// UV Index types
export type UVData = {
  uvIndex: number;
  uvMax: number;
  safeExposureMinutes?: number;
};
