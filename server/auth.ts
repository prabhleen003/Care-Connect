import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SchemaUser, insertUserSchema } from "@shared/schema";

const scryptAsync = promisify(scrypt);

export function sanitizeUser(user: SchemaUser): Omit<SchemaUser, "password"> {
  const { password, ...safeUser } = user;
  return safeUser;
}

declare global {
  namespace Express {
    interface User extends SchemaUser {}
  }
}

export function setupAuth(app: Express) {
  if (!process.env.SESSION_SECRET) {
    console.warn("WARNING: SESSION_SECRET is not set. Using a random secret — sessions will not persist across restarts.");
  }
  const sessionSecret = process.env.SESSION_SECRET || randomBytes(32).toString("hex");

  const isProd = app.get("env") === "production";
  if (isProd) app.set("trust proxy", 1);

  const sessionSettings: session.SessionOptions = {
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    name: "cc.sid",           // don't advertise which session library is in use
    cookie: {
      httpOnly: true,         // no JS access to the cookie
      sameSite: "lax",        // CSRF protection for cross-site navigations
      secure: isProd,         // HTTPS-only in production
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7-day sliding expiry
    },
  };

  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user) {
          console.log(`Login failed: user not found - ${username}`);
          return done(null, false);
        } else {
          const [salt, key] = user.password.split(":");
          if (!salt || !key) {
            console.log(`Login failed: invalid password format for user - ${username}`);
            return done(null, false);
          }
          const derivedKey = (await scryptAsync(password, salt, 64)) as Buffer;

          if (timingSafeEqual(Buffer.from(key, "hex"), derivedKey)) {
            return done(null, user);
          } else {
            console.log(`Login failed: password mismatch for user - ${username}`);
            return done(null, false);
          }
        }
      } catch (err) {
        console.error(`Login error for user ${username}:`, err);
        return done(err);
      }
    }),
  );

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id, done) => {
    const user = await storage.getUser(id as number);
    done(null, user);
  });

  app.post("/api/auth/register", async (req, res, next) => {
    try {
      const parsed = insertUserSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: parsed.error.issues[0]?.message ?? "Invalid input" });
      }
      const { password: rawPassword, ...rest } = parsed.data;

      const existingUser = await storage.getUserByUsername(rest.username);
      if (existingUser) {
        return res.status(400).send("Username already exists");
      }

      const salt = randomBytes(16).toString("hex");
      const buf = (await scryptAsync(rawPassword, salt, 64)) as Buffer;
      const hashedPassword = `${salt}:${buf.toString("hex")}`;

      const user = await storage.createUser({ ...rest, password: hashedPassword });

      req.login(user, (err) => {
        if (err) return next(err);
        res.status(201).json(sanitizeUser(user));
      });
    } catch (err) {
      next(err);
    }
  });

  app.post("/api/auth/login", passport.authenticate("local"), (req, res) => {
    res.status(200).json(sanitizeUser(req.user as SchemaUser));
  });

  app.post("/api/auth/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    res.json(sanitizeUser(req.user as SchemaUser));
  });
}
