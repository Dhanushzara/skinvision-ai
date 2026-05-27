import { z } from 'zod';
import { scans } from './schema';

export const errorSchemas = {
  validation: z.object({ message: z.string(), field: z.string().optional() }),
  notFound: z.object({ message: z.string() }),
  internal: z.object({ message: z.string() }),
};

export const api = {
  scans: {
    create: {
      method: 'POST' as const,
      path: '/api/scans',
      input: z.object({
        imageUrl: z.string(),
        patientId: z.string().optional(),
        bodyLocation: z.string().optional(),
        notes: z.string().optional(),
      }),
      responses: {
        201: z.custom<typeof scans.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/scans/:id',
      responses: {
        200: z.custom<typeof scans.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    list: {
      method: 'GET' as const,
      path: '/api/scans',
      responses: {
        200: z.array(z.custom<typeof scans.$inferSelect>()),
      },
    },
    history: {
      method: 'GET' as const,
      path: '/api/scans/patient/:patientId',
      responses: {
        200: z.array(z.custom<typeof scans.$inferSelect>()),
      },
    },
    update: {
      method: 'PATCH' as const,
      path: '/api/scans/:id',
      input: z.object({
        notes: z.string().optional(),
        bodyLocation: z.string().optional(),
        tags: z.array(z.string()).optional(),
      }),
      responses: {
        200: z.custom<typeof scans.$inferSelect>(),
      },
    },
  },
  consultations: {
    create: {
      method: 'POST' as const,
      path: '/api/consultations',
      input: z.object({
        scanId: z.number(),
        doctorEmail: z.string().email().optional(),
        message: z.string().optional(),
        patientId: z.string().optional(),
      }),
      responses: {
        201: z.object({ id: z.number(), shareToken: z.string(), status: z.string() }),
      },
    },
    getByToken: {
      method: 'GET' as const,
      path: '/api/shared/:token',
      responses: {
        200: z.object({ scan: z.custom<typeof scans.$inferSelect>(), consultation: z.any() }),
        404: errorSchemas.notFound,
      },
    },
  },
  export: {
    fhir: {
      method: 'GET' as const,
      path: '/api/scans/:id/export/fhir',
      responses: { 200: z.any() },
    },
    pdf: {
      method: 'GET' as const,
      path: '/api/scans/:id/export/pdf',
      responses: { 200: z.any() },
    },
  },
  weather: {
    uv: {
      method: 'GET' as const,
      path: '/api/weather/uv',
      input: z.object({ lat: z.string(), lng: z.string() }),
      responses: {
        200: z.object({ uvIndex: z.number(), uvMax: z.number(), riskLevel: z.string(), message: z.string() }),
      },
    },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) url = url.replace(`:${key}`, String(value));
    });
  }
  return url;
}
