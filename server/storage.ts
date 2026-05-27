import type { InsertScan, Scan, Consultation } from "@shared/schema";

export interface IStorage {
  createScan(scan: InsertScan): Promise<Scan>;
  getScan(id: number): Promise<Scan | undefined>;
  getScans(): Promise<Scan[]>;
  getScansByPatient(patientId: string): Promise<Scan[]>;
  updateScan(id: number, data: Partial<Scan>): Promise<Scan | undefined>;
  createConsultation(data: { scanId: number; patientId?: string; doctorEmail?: string; message?: string; shareToken: string }): Promise<Consultation>;
  getConsultationByToken(token: string): Promise<Consultation | undefined>;
  getConsultationsByScan(scanId: number): Promise<Consultation[]>;
}

export class MemStorage implements IStorage {
  private scans: Map<number, Scan>;
  private consultationMap: Map<number, Consultation>;
  private currentId: number;
  private consultationId: number;

  constructor() {
    this.scans = new Map();
    this.consultationMap = new Map();
    this.currentId = 1;
    this.consultationId = 1;
  }

  async createScan(insertScan: InsertScan): Promise<Scan> {
    const id = this.currentId++;
    const scan: Scan = {
      ...insertScan,
      id,
      analyzedAt: new Date(),
      classifications: insertScan.classifications || null,
      riskLevel: insertScan.riskLevel || "Low",
      riskScore: insertScan.riskScore || 0,
      segmentationMask: insertScan.segmentationMask || null,
      heatmapRegions: insertScan.heatmapRegions || null,
      abcdeScores: insertScan.abcdeScores || null,
      aiExplanation: insertScan.aiExplanation || null,
      patientId: insertScan.patientId || null,
      bodyLocation: insertScan.bodyLocation || null,
      notes: insertScan.notes || null,
      tags: insertScan.tags || null,
      sharedWithDoctor: insertScan.sharedWithDoctor || false,
      doctorNotes: insertScan.doctorNotes || null,
      consultationStatus: insertScan.consultationStatus || "none",
    };
    this.scans.set(id, scan);
    return scan;
  }

  async getScan(id: number): Promise<Scan | undefined> {
    return this.scans.get(id);
  }

  async getScans(): Promise<Scan[]> {
    return Array.from(this.scans.values()).sort((a, b) =>
      (b.analyzedAt?.getTime() || 0) - (a.analyzedAt?.getTime() || 0)
    );
  }

  async getScansByPatient(patientId: string): Promise<Scan[]> {
    return Array.from(this.scans.values())
      .filter(s => s.patientId === patientId)
      .sort((a, b) => (b.analyzedAt?.getTime() || 0) - (a.analyzedAt?.getTime() || 0));
  }

  async updateScan(id: number, data: Partial<Scan>): Promise<Scan | undefined> {
    const scan = this.scans.get(id);
    if (!scan) return undefined;
    const updated = { ...scan, ...data };
    this.scans.set(id, updated);
    return updated;
  }

  async createConsultation(data: { scanId: number; patientId?: string; doctorEmail?: string; message?: string; shareToken: string }): Promise<Consultation> {
    const id = this.consultationId++;
    const c: Consultation = {
      id,
      scanId: data.scanId,
      patientId: data.patientId || null,
      doctorEmail: data.doctorEmail || null,
      message: data.message || null,
      status: "pending",
      shareToken: data.shareToken,
      createdAt: new Date(),
    };
    this.consultationMap.set(id, c);
    return c;
  }

  async getConsultationByToken(token: string): Promise<Consultation | undefined> {
    return Array.from(this.consultationMap.values()).find(c => c.shareToken === token);
  }

  async getConsultationsByScan(scanId: number): Promise<Consultation[]> {
    return Array.from(this.consultationMap.values()).filter(c => c.scanId === scanId);
  }
}

export const storage = new MemStorage();
