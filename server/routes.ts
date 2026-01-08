import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import multer from "multer";
import path from "path";
import express from "express";

// Configure multer for disk storage
const upload = multer({ 
  storage: multer.diskStorage({
    destination: 'uploads/',
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
  })
});

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Serve uploads directory
  app.use('/uploads', express.static('uploads'));

  // Ensure uploads directory exists
  const fs = await import('fs');
  if (!fs.existsSync('uploads')){
      fs.mkdirSync('uploads');
  }

  // File upload endpoint (helper, not strictly in shared schema but needed for functionality)
  app.post('/api/upload', upload.single('image'), (req, res) => {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    // Return the URL to the file
    res.json({ url: `/uploads/${req.file.filename}` });
  });

  // Scan creation - Simulation of ML Model
  app.post(api.scans.create.path, async (req, res) => {
    try {
      const input = api.scans.create.input.parse(req.body);
      
      // MOCK DETECTION LOGIC
      // In a real app, this would call a Python script or YOLO model
      const isMelanoma = Math.random() > 0.5;
      const confidence = Math.floor(Math.random() * 20) + 80; // 80-99% confidence
      
      const scan = await storage.createScan({
        imageUrl: input.imageUrl,
        result: isMelanoma ? "Melanoma" : "Not Melanoma",
        confidence: confidence,
        // Mock a mask URL or leave null
        segmentationMask: null 
      });

      res.status(201).json(scan);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  app.get(api.scans.get.path, async (req, res) => {
    const scan = await storage.getScan(Number(req.params.id));
    if (!scan) {
      return res.status(404).json({ message: 'Scan not found' });
    }
    res.json(scan);
  });

  app.get(api.scans.list.path, async (req, res) => {
    const scans = await storage.getScans();
    res.json(scans);
  });

  // UV Index Proxy
  app.get(api.weather.uv.path, async (req, res) => {
    try {
      const { lat, lng } = req.query;
      
      if (!lat || !lng) {
        return res.status(400).json({ message: "Latitude and Longitude required" });
      }

      // Call Open-Meteo API
      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&daily=uv_index_max&timezone=auto&forecast_days=1`
      );
      const data = await response.json();
      
      const uvMax = data.daily?.uv_index_max?.[0] || 0;
      
      let riskLevel = "Low";
      let message = "Low danger from the sun's UV rays for the average person.";
      
      if (uvMax >= 3 && uvMax < 6) {
        riskLevel = "Moderate";
        message = "Stay in shade near midday when the sun is strongest.";
      } else if (uvMax >= 6 && uvMax < 8) {
        riskLevel = "High";
        message = "Reduce time in the sun between 10 a.m. and 4 p.m.";
      } else if (uvMax >= 8 && uvMax < 11) {
        riskLevel = "Very High";
        message = "Minimize sun exposure between 10 a.m. and 4 p.m.";
      } else if (uvMax >= 11) {
        riskLevel = "Extreme";
        message = "Try to avoid sun exposure between 10 a.m. and 4 p.m.";
      }

      res.json({
        uvIndex: uvMax, // Using max as the main indicator
        uvMax,
        riskLevel,
        message
      });
      
    } catch (error) {
      console.error("UV API Error:", error);
      res.status(500).json({ message: "Failed to fetch UV data" });
    }
  });

  return httpServer;
}
