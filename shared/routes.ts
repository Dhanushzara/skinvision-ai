import { z } from 'zod';
import { insertScanSchema, scans } from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

export const api = {
  scans: {
    create: {
      method: 'POST' as const,
      path: '/api/scans',
      input: z.object({
        imageUrl: z.string(), // We'll handle the actual file upload separately and pass the URL here, or mock it
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
  },
  weather: {
    uv: {
      method: 'GET' as const,
      path: '/api/weather/uv',
      input: z.object({
        lat: z.string(),
        lng: z.string(),
      }),
      responses: {
        200: z.object({
          uvIndex: z.number(),
          uvMax: z.number(),
          riskLevel: z.string(),
          message: z.string()
        })
      }
    }
  }
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
