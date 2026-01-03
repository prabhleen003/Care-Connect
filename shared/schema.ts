import { pgTable, text, serial, integer, boolean, timestamp, jsonb, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role", { enum: ["ngo", "volunteer"] }).notNull(),
  name: text("name").notNull(),
  email: text("email").notNull(),
});

export const causes = pgTable("causes", {
  id: serial("id").primaryKey(),
  ngoId: integer("ngo_id").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(),
  location: text("location").notNull(),
  urgency: integer("urgency").default(0),
  status: text("status", { enum: ["open", "closed"] }).default("open"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  causeId: integer("cause_id").notNull(),
  volunteerId: integer("volunteer_id").notNull(),
  status: text("status", { enum: ["pending", "in_progress", "completed"] }).default("pending"),
  proofUrl: text("proof_url"),
  approved: boolean("approved").default(false),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const donations = pgTable("donations", {
  id: serial("id").primaryKey(),
  causeId: integer("cause_id").notNull(),
  volunteerId: integer("volunteer_id").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const posts = pgTable("posts", {
  id: serial("id").primaryKey(),
  authorId: integer("author_id").notNull(),
  content: text("content").notNull(),
  mediaUrl: text("media_url"),
  mediaType: text("media_type", { enum: ["image", "video"] }),
  createdAt: timestamp("created_at").defaultNow(),
});

export const usersRelations = relations(users, ({ many }) => ({
  causes: many(causes),
  tasks: many(tasks),
  donations: many(donations),
  posts: many(posts),
}));

export const causesRelations = relations(causes, ({ one, many }) => ({
  ngo: one(users, {
    fields: [causes.ngoId],
    references: [users.id],
  }),
  tasks: many(tasks),
  donations: many(donations),
}));

export const tasksRelations = relations(tasks, ({ one }) => ({
  cause: one(causes, {
    fields: [tasks.causeId],
    references: [causes.id],
  }),
  volunteer: one(users, {
    fields: [tasks.volunteerId],
    references: [users.id],
  }),
}));

export const donationsRelations = relations(donations, ({ one }) => ({
  cause: one(causes, {
    fields: [donations.causeId],
    references: [causes.id],
  }),
  volunteer: one(users, {
    fields: [donations.volunteerId],
    references: [users.id],
  }),
}));

export const postsRelations = relations(posts, ({ one }) => ({
  author: one(users, {
    fields: [posts.authorId],
    references: [users.id],
  }),
}));

export const insertUserSchema = createInsertSchema(users).omit({ id: true });
export const insertCauseSchema = createInsertSchema(causes).omit({ id: true, createdAt: true });
export const insertTaskSchema = createInsertSchema(tasks).omit({ id: true, updatedAt: true, approved: true });
export const insertDonationSchema = createInsertSchema(donations).omit({ id: true, createdAt: true });
export const insertPostSchema = createInsertSchema(posts).omit({ id: true, createdAt: true });

export type User = typeof users.$inferSelect;
export type Cause = typeof causes.$inferSelect;
export type Task = typeof tasks.$inferSelect;
export type Donation = typeof donations.$inferSelect;
export type Post = typeof posts.$inferSelect;

export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertCause = z.infer<typeof insertCauseSchema>;
export type InsertTask = z.infer<typeof insertTaskSchema>;
export type InsertDonation = z.infer<typeof insertDonationSchema>;
export type InsertPost = z.infer<typeof insertPostSchema>;

// Explicit API types
export type CauseResponse = Cause & { ngo?: { name: string } };
export type TaskResponse = Task & { cause?: Cause, volunteer?: { name: string } };
export type DonationResponse = Donation & { cause?: Cause, volunteer?: { name: string } };
export type PostResponse = Post & { author?: { name: string, role: string } };
