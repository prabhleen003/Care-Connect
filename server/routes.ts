import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { setupAuth, sanitizeUser } from "./auth";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import multer from "multer";
import path from "path";
import fs from "fs";

// Catches async errors and forwards them to the Express error middleware.
// Required for Express 4, which does not handle unhandled promise rejections automatically.
const asyncRoute = (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>) =>
  (req: Request, res: Response, next: NextFunction) =>
    fn(req, res, next).catch(next);

// In-memory geocode cache: normalised location string → coords (or null = known miss).
// Bounded to 500 entries; evicts the oldest when full.
const geocodeCache = new Map<string, { lat: number; lon: number } | null>();
const GEOCODE_CACHE_MAX = 500;
const GEOCODE_TIMEOUT_MS = 5_000;

async function geocodeLocation(locationText: string): Promise<{ lat: number; lon: number } | null> {
  const key = locationText.trim().toLowerCase();

  if (geocodeCache.has(key)) return geocodeCache.get(key)!;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), GEOCODE_TIMEOUT_MS);

  try {
    const url = `https://nominatim.openstreetmap.org/search?` +
      new URLSearchParams({ q: locationText, format: "json", limit: "1" });
    const response = await fetch(url, {
      headers: { "User-Agent": "CareConnect/1.0 (volunteer-platform)" },
      signal: controller.signal,
    });
    if (!response.ok) {
      geocodeCache.set(key, null);
      return null;
    }
    const results = await response.json();
    const coords = results.length > 0
      ? { lat: parseFloat(results[0].lat), lon: parseFloat(results[0].lon) }
      : null;

    if (geocodeCache.size >= GEOCODE_CACHE_MAX) {
      geocodeCache.delete(geocodeCache.keys().next().value!);
    }
    geocodeCache.set(key, coords);
    return coords;
  } catch {
    // Timeout, network error, rate-limit — don't cache so next request can retry.
    return null;
  } finally {
    clearTimeout(timer);
  }
}

// Setup multer for file uploads
const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadsDir),
    filename: (_req, file, cb) => {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      cb(null, uniqueSuffix + path.extname(file.originalname));
    },
  }),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (_req, file, cb) => {
    const allowedExtensions = /\.(jpg|jpeg|png|gif|webp|mp4|webm)$/i;
    const allowedMimeTypes = /^(image\/(jpeg|png|gif|webp)|video\/(mp4|webm))$/;
    if (allowedExtensions.test(path.extname(file.originalname)) && allowedMimeTypes.test(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only image and video files are allowed"));
    }
  },
});

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  setupAuth(app);

  // Serve uploaded files statically (authenticated only, no directory listing)
  app.use("/uploads", (req, _res, next) => {
    if (!(req as any).isAuthenticated()) return _res.sendStatus(401);
    next();
  }, (await import("express")).default.static(uploadsDir, { dotfiles: "deny", index: false }));

  // Magic bytes for allowed file types: [signature, mime, byteOffset]
  const MAGIC_BYTES: [Buffer, string, number][] = [
    [Buffer.from([0xFF, 0xD8, 0xFF]), "image/jpeg", 0],
    [Buffer.from([0x89, 0x50, 0x4E, 0x47]), "image/png", 0],
    [Buffer.from("GIF87a"), "image/gif", 0],
    [Buffer.from("GIF89a"), "image/gif", 0],
    [Buffer.from("RIFF"), "image/webp", 0], // WebP starts with RIFF....WEBP
    [Buffer.from("ftyp"), "video/mp4", 4], // ISO base media: box size (4 bytes) then "ftyp"
    [Buffer.from([0x1A, 0x45, 0xDF, 0xA3]), "video/webm", 0],
  ];

  function validateMagicBytes(filePath: string): boolean {
    const fd = fs.openSync(filePath, "r");
    const buf = Buffer.alloc(12);
    fs.readSync(fd, buf, 0, 12, 0);
    fs.closeSync(fd);

    return MAGIC_BYTES.some(([magic, , offset]) =>
      buf.subarray(offset, offset + magic.length).equals(magic)
    );
  }

  // File upload endpoint
  app.post("/api/upload", (req, res, next) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    next();
  }, upload.single("file"), (req, res) => {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    // Validate actual file content against magic bytes
    if (!validateMagicBytes(req.file.path)) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ message: "File content does not match an allowed type" });
    }

    const url = `/uploads/${req.file.filename}`;
    res.json({ url });
  });

  // Causes
  app.get(api.causes.list.path, asyncRoute(async (req, res) => {
    const causes = await storage.getCauses(req.query as any);
    res.json(causes);
  }));

  app.post(api.causes.create.path, asyncRoute(async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== 'ngo') return res.sendStatus(401);
    const body = { ...req.body };
    if (body.startDate) body.startDate = new Date(body.startDate);
    if (body.endDate) body.endDate = new Date(body.endDate);
    const input = api.causes.create.input.parse(body);

    let latitude: number | null = null;
    let longitude: number | null = null;
    if (input.location) {
      const coords = await geocodeLocation(input.location);
      if (coords) {
        latitude = coords.lat;
        longitude = coords.lon;
      }
    }

    const cause = await storage.createCause({ ...input, ngoId: req.user.id, latitude, longitude });
    res.status(201).json(cause);
  }));

  app.get(api.causes.get.path, asyncRoute(async (req, res) => {
    const cause = await storage.getCause(Number(req.params.id));
    if (!cause) return res.sendStatus(404);
    res.json(cause);
  }));

  app.get(api.tasks.get.path, asyncRoute(async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const task = await storage.getTask(Number(req.params.id));
    if (!task) return res.sendStatus(404);
    res.json(task);
  }));

  app.get(api.causes.getByNgo.path, asyncRoute(async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== 'ngo') return res.sendStatus(401);
    const causes = await storage.getCausesByNgo(req.user.id);
    res.json(causes);
  }));

  app.patch(api.causes.update.path, asyncRoute(async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== 'ngo') return res.sendStatus(401);
    const causeId = Number(req.params.id);
    const cause = await storage.getCause(causeId);
    if (!cause) return res.sendStatus(404);
    if (cause.ngoId !== req.user.id) return res.sendStatus(403);

    const { id, ngoId, createdAt, ...body } = req.body;
    if (body.startDate) body.startDate = new Date(body.startDate);
    if (body.endDate) body.endDate = new Date(body.endDate);

    // Re-geocode if location changed
    if (body.location && body.location !== cause.location) {
      const coords = await geocodeLocation(body.location);
      if (coords) {
        body.latitude = coords.lat;
        body.longitude = coords.lon;
      } else {
        body.latitude = null;
        body.longitude = null;
      }
    }

    const updated = await storage.updateCause(causeId, body);
    res.json(updated);
  }));

  app.delete(api.causes.delete.path, asyncRoute(async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== 'ngo') return res.sendStatus(401);
    const causeId = Number(req.params.id);
    const cause = await storage.getCause(causeId);
    if (!cause) return res.sendStatus(404);
    if (cause.ngoId !== req.user.id) return res.sendStatus(403);

    await storage.deleteCause(causeId);
    res.sendStatus(204);
  }));

  // Tasks
  app.post(api.tasks.apply.path, asyncRoute(async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== 'volunteer') return res.sendStatus(401);
    const causeId = Number(req.params.causeId);

    const applySchema = z.object({
      startDate: z.coerce.date(),
      endDate: z.coerce.date(),
    });
    const parsed = applySchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Valid startDate and endDate are required" });

    try {
      const task = await storage.createTask({
        causeId,
        volunteerId: req.user.id,
        status: 'pending',
        startDate: parsed.data.startDate,
        endDate: parsed.data.endDate,
      });
      res.status(201).json(task);
    } catch (e: any) {
      if (e.code === '23505') return res.status(409).json({ message: "Already applied to this cause" });
      throw e;
    }
  }));

  app.get(api.tasks.listByVolunteer.path, asyncRoute(async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const tasks = await storage.getTasksByVolunteer(req.user.id);
    res.json(tasks);
  }));

  app.get(api.tasks.listByNgo.path, asyncRoute(async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== 'ngo') return res.sendStatus(401);
    const tasks = await storage.getTasksByNgo(req.user.id);
    res.json(tasks);
  }));

  app.patch(api.tasks.updateStatus.path, asyncRoute(async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const statusSchema = z.object({
      status: z.enum(["pending", "in_consideration", "approved", "declined", "in_progress", "completed", "no_show"]),
    });
    const parsedStatus = statusSchema.safeParse(req.body);
    if (!parsedStatus.success) return res.status(400).json({ message: "Invalid status value" });
    const { status } = parsedStatus.data;

    const taskId = Number(req.params.id);
    const task = await storage.getTask(taskId);
    if (!task) return res.sendStatus(404);

    // Volunteers can only update their own tasks, and only to in_progress or completed
    if (req.user.role === 'volunteer') {
      if (task.volunteerId !== req.user.id) return res.sendStatus(403);
      if (!['in_progress', 'completed'].includes(status)) {
        return res.status(403).json({ message: "Volunteers can only update to in_progress or completed" });
      }
    }

    // NGOs can only update tasks belonging to their own causes
    if (req.user.role === 'ngo') {
      if (task.cause.ngoId !== req.user.id) return res.sendStatus(403);
    }

    const updatedTask = await storage.updateTaskStatus(taskId, status);
    res.json(updatedTask);
  }));

  app.delete("/api/tasks/:id", asyncRoute(async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const taskId = Number(req.params.id);
    const task = await storage.getTask(taskId);
    if (!task) return res.sendStatus(404);

    // Only the volunteer who applied can opt out
    if (req.user.role === 'volunteer' && task.volunteerId !== req.user.id) {
      return res.sendStatus(403);
    }

    // NGOs can only delete tasks belonging to their own causes
    if (req.user.role === 'ngo' && task.cause.ngoId !== req.user.id) {
      return res.sendStatus(403);
    }

    await storage.deleteTask(taskId);
    res.sendStatus(204);
  }));

  app.post(api.tasks.uploadProof.path, asyncRoute(async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const taskId = Number(req.params.id);
    const task = await storage.getTask(taskId);
    if (!task) return res.sendStatus(404);

    // Only the assigned volunteer can upload proof
    if (task.volunteerId !== req.user.id) return res.sendStatus(403);

    const proofSchema = z.object({ proofUrl: z.string().min(1) });
    const parsed = proofSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "proofUrl is required" });

    const updated = await storage.updateTaskProof(taskId, parsed.data.proofUrl);
    res.json(updated);
  }));

  app.post(api.tasks.approve.path, asyncRoute(async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== 'ngo') return res.sendStatus(401);
    const taskId = Number(req.params.id);
    const task = await storage.getTask(taskId);
    if (!task) return res.sendStatus(404);

    // Only the NGO that owns the cause can approve the task
    if (task.cause.ngoId !== req.user.id) return res.sendStatus(403);

    const approved = await storage.approveTask(taskId);
    res.json(approved);
  }));

  // Posts
  app.get(api.posts.list.path, asyncRoute(async (req, res) => {
    const userId = req.isAuthenticated() ? req.user.id : undefined;
    const posts = await storage.getPosts(userId);
    res.json(posts);
  }));

  app.post("/api/posts/:id/like", asyncRoute(async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const result = await storage.toggleLike(Number(req.params.id), req.user.id);
    res.json(result);
  }));

  app.post("/api/posts/:id/comments", asyncRoute(async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const comment = await storage.createComment({
      postId: Number(req.params.id),
      authorId: req.user.id,
      content: req.body.content,
    });
    res.status(201).json(comment);
  }));

  app.post(api.posts.create.path, asyncRoute(async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const input = api.posts.create.input.parse(req.body);
    const post = await storage.createPost({ ...input, authorId: req.user.id });
    res.status(201).json(post);
  }));

  app.get("/api/causes/ngo/:id", asyncRoute(async (req, res) => {
    const causes = await storage.getCausesByNgo(Number(req.params.id));
    res.json(causes);
  }));

  app.get("/api/posts/author/:id", asyncRoute(async (req, res) => {
    const userId = req.isAuthenticated() ? req.user.id : undefined;
    const posts = await storage.getPostsByAuthor(Number(req.params.id), userId);
    res.json(posts);
  }));

  // Impact
  app.get("/api/impact/stats", asyncRoute(async (req, res) => {
    const stats = await storage.getImpactStats();
    res.json(stats);
  }));

  app.get("/api/volunteer/impact", asyncRoute(async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== 'volunteer') return res.sendStatus(401);
    const impact = await storage.getVolunteerImpact(req.user.id);
    res.json(impact);
  }));

  app.patch("/api/user", asyncRoute(async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const updateUserSchema = z.object({
      name: z.string().min(1).optional(),
      email: z.string().email().optional(),
      description: z.string().nullable().optional(),
      location: z.string().nullable().optional(),
      website: z.string().nullable().optional(),
      phoneNumber: z.string().nullable().optional(),
      avatarUrl: z.string().nullable().optional(),
      bannerUrl: z.string().nullable().optional(),
      headline: z.string().nullable().optional(),
    });
    const parsed = updateUserSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.issues[0]?.message ?? "Invalid input" });

    const updated = await storage.updateUser(req.user.id, parsed.data);
    res.json(sanitizeUser(updated));
  }));

  app.get("/api/ngos", asyncRoute(async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const ngos = await storage.getNgos();
    res.json(ngos.map(sanitizeUser));
  }));

  // Public user profile (no auth required — no password exposed)
  app.get("/api/users/:id", asyncRoute(async (req, res) => {
    const userId = Number(req.params.id);
    if (!Number.isInteger(userId) || userId <= 0) return res.status(400).json({ message: "Invalid user id" });
    const user = await storage.getUser(userId);
    if (!user) return res.sendStatus(404);
    res.json(sanitizeUser(user));
  }));

  // Follow / Unfollow
  app.post("/api/users/:id/follow", asyncRoute(async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const followingId = Number(req.params.id);
    if (!Number.isInteger(followingId) || followingId <= 0) return res.status(400).json({ message: "Invalid user id" });
    if (followingId === req.user.id) return res.status(400).json({ message: "Cannot follow yourself" });
    const result = await storage.toggleFollow(req.user.id, followingId);
    res.json(result);
  }));

  app.get("/api/users/:id/follow-status", asyncRoute(async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const followingId = Number(req.params.id);
    if (!Number.isInteger(followingId) || followingId <= 0) return res.status(400).json({ message: "Invalid user id" });
    const following = await storage.isFollowing(req.user.id, followingId);
    res.json({ following });
  }));

  app.get("/api/users/:id/followers/count", asyncRoute(async (req, res) => {
    const userId = Number(req.params.id);
    if (!Number.isInteger(userId) || userId <= 0) return res.status(400).json({ message: "Invalid user id" });
    const count = await storage.getFollowerCount(userId);
    res.json({ count });
  }));

  // Seed Data (Auto-run if empty)
  (async () => {
    if (process.env.NODE_ENV !== 'production') {
      const existingUser = await storage.getUserByUsername('ngo_demo');
      if (!existingUser) {
        console.log('Seeding database...');
        console.log('Database ready. Please register as NGO or Volunteer to start.');
      }
    }
  })();

  return httpServer;
}
