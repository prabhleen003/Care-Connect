import { pgTable, text, serial, integer, boolean, timestamp, jsonb, doublePrecision } from "drizzle-orm/pg-core";
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
  description: text("description"),
  location: text("location"),
  website: text("website"),
  phoneNumber: text("phone_number"),
  avatarUrl: text("avatar_url"),
  bannerUrl: text("banner_url"),
  headline: text("headline"),
});

export const causes = pgTable("causes", {
  id: serial("id").primaryKey(),
  ngoId: integer("ngo_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(),
  location: text("location").notNull(),
  urgency: integer("urgency").default(0),
  status: text("status", { enum: ["open", "closed"] }).default("open"),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  latitude: doublePrecision("latitude"),
  longitude: doublePrecision("longitude"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  causeId: integer("cause_id").notNull().references(() => causes.id, { onDelete: "cascade" }),
  volunteerId: integer("volunteer_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  status: text("status", { enum: ["pending", "in_consideration", "approved", "declined", "in_progress", "completed", "no_show"] }).default("pending"),
  proofUrl: text("proof_url"),
  approved: boolean("approved").default(false),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const donations = pgTable("donations", {
  id: serial("id").primaryKey(),
  causeId: integer("cause_id").notNull().references(() => causes.id, { onDelete: "cascade" }),
  volunteerId: integer("volunteer_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  amount: doublePrecision("amount").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const posts = pgTable("posts", {
  id: serial("id").primaryKey(),
  authorId: integer("author_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  mediaUrl: text("media_url"),
  mediaType: text("media_type", { enum: ["image", "video"] }),
  createdAt: timestamp("created_at").defaultNow(),
});

export const usersRelations = relations(users, ({ many }) => ({
  causes: many(causes),
  tasks: many(tasks),
  posts: many(posts),
}));

export const causesRelations = relations(causes, ({ one, many }) => ({
  ngo: one(users, {
    fields: [causes.ngoId],
    references: [users.id],
  }),
  tasks: many(tasks),
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

export const postsRelations = relations(posts, ({ one }) => ({
  author: one(users, {
    fields: [posts.authorId],
    references: [users.id],
  }),
}));

export const insertUserSchema = createInsertSchema(users).omit({ id: true });
export const insertCauseSchema = createInsertSchema(causes).omit({ id: true, createdAt: true });
export const insertTaskSchema = createInsertSchema(tasks).omit({ id: true, updatedAt: true, approved: true });
export const insertPostSchema = createInsertSchema(posts).omit({ id: true, createdAt: true });
export const insertDonationSchema = createInsertSchema(donations).omit({ id: true, createdAt: true });

export type User = typeof users.$inferSelect;
export type Cause = typeof causes.$inferSelect;
export type Task = typeof tasks.$inferSelect;
export type Post = typeof posts.$inferSelect;
export type Donation = typeof donations.$inferSelect;

export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertCause = z.infer<typeof insertCauseSchema>;
export type InsertTask = z.infer<typeof insertTaskSchema>;
export type InsertPost = z.infer<typeof insertPostSchema>;
export type InsertDonation = z.infer<typeof insertDonationSchema>;

export const follows = pgTable("follows", {
  id: serial("id").primaryKey(),
  followerId: integer("follower_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  followingId: integer("following_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow(),
});

export const followsRelations = relations(follows, ({ one }) => ({
  follower: one(users, { fields: [follows.followerId], references: [users.id] }),
  following: one(users, { fields: [follows.followingId], references: [users.id] }),
}));

export type Follow = typeof follows.$inferSelect;

export const postLikes = pgTable("post_likes", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").notNull().references(() => posts.id, { onDelete: "cascade" }),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow(),
});

export const postComments = pgTable("post_comments", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").notNull().references(() => posts.id, { onDelete: "cascade" }),
  authorId: integer("author_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const postLikesRelations = relations(postLikes, ({ one }) => ({
  post: one(posts, {
    fields: [postLikes.postId],
    references: [posts.id],
  }),
  user: one(users, {
    fields: [postLikes.userId],
    references: [users.id],
  }),
}));

export const postCommentsRelations = relations(postComments, ({ one }) => ({
  post: one(posts, {
    fields: [postComments.postId],
    references: [posts.id],
  }),
  author: one(users, {
    fields: [postComments.authorId],
    references: [users.id],
  }),
}));

export const insertPostLikeSchema = createInsertSchema(postLikes).omit({ id: true, createdAt: true });
export const insertPostCommentSchema = createInsertSchema(postComments).omit({ id: true, createdAt: true });

export type PostLike = typeof postLikes.$inferSelect;
export type PostComment = typeof postComments.$inferSelect;
export type InsertPostComment = z.infer<typeof insertPostCommentSchema>;

export type PostResponse = Post & {
  author?: { id: number, name: string, role: string },
  likesCount: number,
  commentsCount: number,
  isLiked?: boolean,
  comments?: (PostComment & { author: { name: string } })[]
};
