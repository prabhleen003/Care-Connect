import { z } from 'zod';
import { insertUserSchema, insertCauseSchema, insertTaskSchema, users, causes, tasks } from './schema';

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
  unauthorized: z.object({
    message: z.string(),
  }),
};

export const api = {
  auth: {
    register: {
      method: 'POST' as const,
      path: '/api/auth/register',
      input: insertUserSchema,
      responses: {
        201: z.custom<typeof users.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    login: {
      method: 'POST' as const,
      path: '/api/auth/login',
      input: z.object({ username: z.string(), password: z.string() }),
      responses: {
        200: z.custom<typeof users.$inferSelect>(),
        401: errorSchemas.unauthorized,
      },
    },
    logout: {
      method: 'POST' as const,
      path: '/api/auth/logout',
      responses: {
        200: z.void(),
      },
    },
    me: {
      method: 'GET' as const,
      path: '/api/user',
      responses: {
        200: z.custom<typeof users.$inferSelect>(),
        401: errorSchemas.unauthorized,
      },
    },
  },
  causes: {
    list: {
      method: 'GET' as const,
      path: '/api/causes',
      input: z.object({
        category: z.string().optional(),
        location: z.string().optional(),
        urgency: z.string().optional(),
      }).optional(),
      responses: {
        200: z.array(z.custom<typeof causes.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/causes',
      input: insertCauseSchema.omit({ ngoId: true }),
      responses: {
        201: z.custom<typeof causes.$inferSelect>(),
        401: errorSchemas.unauthorized,
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/causes/:id',
      responses: {
        200: z.custom<typeof causes.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    getByNgo: {
      method: 'GET' as const,
      path: '/api/ngo/causes',
      responses: {
        200: z.array(z.custom<typeof causes.$inferSelect>()),
        401: errorSchemas.unauthorized,
      },
    }
  },
  tasks: {
    apply: {
      method: 'POST' as const,
      path: '/api/tasks/apply/:causeId',
      responses: {
        201: z.custom<typeof tasks.$inferSelect>(),
        401: errorSchemas.unauthorized,
      },
    },
    listByVolunteer: {
      method: 'GET' as const,
      path: '/api/volunteer/tasks',
      responses: {
        200: z.array(z.custom<typeof tasks.$inferSelect>()),
        401: errorSchemas.unauthorized,
      },
    },
    listByNgo: {
      method: 'GET' as const,
      path: '/api/ngo/tasks', // Tasks/Applications for my causes
      responses: {
        200: z.array(z.custom<typeof tasks.$inferSelect>()),
        401: errorSchemas.unauthorized,
      },
    },
    updateStatus: {
      method: 'PATCH' as const,
      path: '/api/tasks/:id/status',
      input: z.object({ status: z.enum(["pending", "in_progress", "completed"]) }),
      responses: {
        200: z.custom<typeof tasks.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    uploadProof: {
      method: 'POST' as const,
      path: '/api/tasks/:id/proof',
      input: z.object({ proofUrl: z.string() }),
      responses: {
        200: z.custom<typeof tasks.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    approve: {
      method: 'POST' as const,
      path: '/api/tasks/:id/approve',
      responses: {
        200: z.custom<typeof tasks.$inferSelect>(),
        401: errorSchemas.unauthorized,
      },
    },
  },
  impact: {
    stats: {
      method: 'GET' as const,
      path: '/api/impact/stats',
      responses: {
        200: z.object({
          totalNgos: z.number(),
          totalVolunteers: z.number(),
          causesCompleted: z.number(),
          volunteerHours: z.number(),
        }),
      },
    },
  },
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
