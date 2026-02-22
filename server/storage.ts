import { users, causes, tasks, donations, posts, postLikes, postComments, follows, type InsertUser, type User, type Cause, type Task, type InsertCause, type InsertTask, type InsertDonation, type InsertPost, type Donation, type Post, type PostLike, type PostComment, type InsertPostComment, type PostResponse } from "@shared/schema";
import { db } from "./db";
import { eq, and, sql, desc, inArray } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  sessionStore: session.Store;
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, data: Partial<User>): Promise<User>;
  
  createCause(cause: InsertCause): Promise<Cause>;
  getCauses(filters?: { category?: string; location?: string; urgency?: string }): Promise<(Cause & { ngoName: string })[]>;
  getCause(id: number): Promise<Cause | undefined>;
  getCausesByNgo(ngoId: number): Promise<(Cause & { ngoName: string })[]>;
  updateCause(id: number, data: Partial<Cause>): Promise<Cause>;
  deleteCause(id: number): Promise<void>;
  
  createTask(task: InsertTask): Promise<Task>;
  getTask(id: number): Promise<Task & { cause: Cause, volunteer: User } | undefined>;
  getTasksByVolunteer(volunteerId: number): Promise<(Task & { cause: Cause; ngoName: string })[]>;
  getTasksByNgo(ngoId: number): Promise<(Task & { cause: Cause, volunteer: User })[]>;
  updateTaskStatus(id: number, status: string): Promise<Task>;
  deleteTask(id: number): Promise<void>;
  updateTaskProof(id: number, proofUrl: string): Promise<Task>;
  approveTask(id: number): Promise<Task>;
  
  createDonation(donation: InsertDonation): Promise<Donation>;
  getDonationsByNgo(ngoId: number): Promise<Donation[]>;
  getDonationAnalytics(ngoId: number): Promise<any>;
  
  createPost(post: InsertPost): Promise<Post>;
  getPosts(userId?: number): Promise<PostResponse[]>;
  toggleLike(postId: number, userId: number): Promise<{ liked: boolean }>;
  createComment(comment: InsertPostComment): Promise<PostComment>;
  getPostsByAuthor(authorId: number, currentUserId?: number): Promise<PostResponse[]>;

  getImpactStats(): Promise<any>;
  getNgos(): Promise<User[]>;
  toggleFollow(followerId: number, followingId: number): Promise<{ following: boolean }>;
  isFollowing(followerId: number, followingId: number): Promise<boolean>;
  getFollowerCount(userId: number): Promise<number>;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true,
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUser(id: number, data: Partial<User>): Promise<User> {
    const [updated] = await db
      .update(users)
      .set(data)
      .where(eq(users.id, id))
      .returning();
    return updated;
  }

  async createCause(cause: InsertCause): Promise<Cause> {
    const [newCause] = await db.insert(causes).values(cause).returning();
    return newCause;
  }

  async getCauses(filters?: { category?: string; location?: string; urgency?: string }): Promise<(Cause & { ngoName: string })[]> {
    const conditions = [];

    if (filters?.category && filters.category !== "all") conditions.push(eq(causes.category, filters.category));
    if (filters?.location) conditions.push(eq(causes.location, filters.location));

    const baseSelect = db
      .select({ cause: causes, ngoName: users.name })
      .from(causes)
      .innerJoin(users, eq(causes.ngoId, users.id))
      .orderBy(desc(causes.createdAt));

    const result = conditions.length > 0
      ? await baseSelect.where(and(...conditions))
      : await baseSelect;

    return result.map(r => ({ ...r.cause, ngoName: r.ngoName }));
  }

  async getCause(id: number): Promise<Cause | undefined> {
    const [cause] = await db.select().from(causes).where(eq(causes.id, id));
    return cause;
  }

  async getCausesByNgo(ngoId: number): Promise<(Cause & { ngoName: string })[]> {
    const result = await db
      .select({ cause: causes, ngoName: users.name })
      .from(causes)
      .innerJoin(users, eq(causes.ngoId, users.id))
      .where(eq(causes.ngoId, ngoId));
    return result.map(r => ({ ...r.cause, ngoName: r.ngoName }));
  }

  async updateCause(id: number, data: Partial<Cause>): Promise<Cause> {
    const [updated] = await db.update(causes).set(data).where(eq(causes.id, id)).returning();
    return updated;
  }

  async deleteCause(id: number): Promise<void> {
    await db.delete(causes).where(eq(causes.id, id));
  }

  async getTask(id: number): Promise<Task & { cause: Cause, volunteer: User } | undefined> {
    if (isNaN(id)) return undefined;
    const [result] = await db
      .select({
        task: tasks,
        cause: causes,
        volunteer: users
      })
      .from(tasks)
      .innerJoin(causes, eq(tasks.causeId, causes.id))
      .innerJoin(users, eq(tasks.volunteerId, users.id))
      .where(eq(tasks.id, id));
    
    if (!result) return undefined;
    return { ...result.task, cause: result.cause, volunteer: result.volunteer };
  }

  async createTask(task: InsertTask): Promise<Task> {
    const [newTask] = await db.insert(tasks).values({
      ...task,
      startDate: task.startDate ? new Date(task.startDate) : null,
      endDate: task.endDate ? new Date(task.endDate) : null,
    }).returning();
    return newTask;
  }

  async createDonation(donation: InsertDonation): Promise<Donation> {
    const [newDonation] = await db.insert(donations).values(donation).returning();
    return newDonation;
  }

  async getDonationsByNgo(ngoId: number): Promise<Donation[]> {
    const result = await db
      .select({ donation: donations })
      .from(donations)
      .innerJoin(causes, eq(donations.causeId, causes.id))
      .where(eq(causes.ngoId, ngoId));
    return result.map(r => r.donation);
  }

  async getDonationAnalytics(ngoId: number) {
    const allDonations = await db
      .select({ 
        donation: donations,
        cause: causes 
      })
      .from(donations)
      .innerJoin(causes, eq(donations.causeId, causes.id))
      .where(eq(causes.ngoId, ngoId));

    const total = allDonations.reduce((sum, d) => sum + Number(d.donation.amount), 0);
    
    const byCauseMap = new Map<number, { title: string, amount: number }>();
    allDonations.forEach(d => {
      const current = byCauseMap.get(d.cause.id) || { title: d.cause.title, amount: 0 };
      byCauseMap.set(d.cause.id, { ...current, amount: current.amount + Number(d.donation.amount) });
    });

    const trendsMap = new Map<string, number>();
    allDonations.forEach(d => {
      const date = d.donation.createdAt?.toISOString().split('T')[0] || 'unknown';
      trendsMap.set(date, (trendsMap.get(date) || 0) + Number(d.donation.amount));
    });

    return {
      totalDonations: total,
      byCause: Array.from(byCauseMap.entries()).map(([id, data]) => ({ causeId: id, ...data })),
      trends: Array.from(trendsMap.entries()).map(([date, amount]) => ({ date, amount })).sort((a, b) => a.date.localeCompare(b.date)),
    };
  }

  async createPost(post: InsertPost): Promise<Post> {
    const [newPost] = await db.insert(posts).values(post).returning();
    return newPost;
  }

  private async enrichPosts(
    rawPosts: { post: Post; author: User }[],
    currentUserId?: number
  ): Promise<PostResponse[]> {
    if (rawPosts.length === 0) return [];

    const postIds = rawPosts.map(p => p.post.id);

    const [allLikes, allComments] = await Promise.all([
      db.select().from(postLikes).where(inArray(postLikes.postId, postIds)),
      db.select({ comment: postComments, author: users })
        .from(postComments)
        .innerJoin(users, eq(postComments.authorId, users.id))
        .where(inArray(postComments.postId, postIds)),
    ]);

    const likesByPost = new Map<number, PostLike[]>();
    for (const like of allLikes) {
      const arr = likesByPost.get(like.postId) || [];
      arr.push(like);
      likesByPost.set(like.postId, arr);
    }

    const commentsByPost = new Map<number, { comment: PostComment; author: User }[]>();
    for (const c of allComments) {
      const arr = commentsByPost.get(c.comment.postId) || [];
      arr.push(c);
      commentsByPost.set(c.comment.postId, arr);
    }

    return rawPosts.map(p => {
      const likes = likesByPost.get(p.post.id) || [];
      const comments = commentsByPost.get(p.post.id) || [];
      return {
        ...p.post,
        author: { id: p.author.id, name: p.author.name, role: p.author.role },
        likesCount: likes.length,
        commentsCount: comments.length,
        isLiked: currentUserId ? likes.some(l => l.userId === currentUserId) : false,
        comments: comments.map(c => ({
          ...c.comment,
          author: { name: c.author.name },
        })),
      };
    });
  }

  async getPosts(userId?: number): Promise<PostResponse[]> {
    const allPosts = await db
      .select({
        post: posts,
        author: users,
      })
      .from(posts)
      .innerJoin(users, eq(posts.authorId, users.id))
      .orderBy(desc(posts.createdAt));

    return this.enrichPosts(allPosts, userId);
  }

  async toggleLike(postId: number, userId: number): Promise<{ liked: boolean }> {
    const [existing] = await db
      .select()
      .from(postLikes)
      .where(and(eq(postLikes.postId, postId), eq(postLikes.userId, userId)));

    if (existing) {
      await db.delete(postLikes).where(eq(postLikes.id, existing.id));
      return { liked: false };
    } else {
      await db.insert(postLikes).values({ postId, userId });
      return { liked: true };
    }
  }

  async createComment(comment: InsertPostComment): Promise<PostComment> {
    const [newComment] = await db.insert(postComments).values(comment).returning();
    return newComment;
  }

  async getPostsByAuthor(authorId: number, currentUserId?: number): Promise<PostResponse[]> {
    const authorPosts = await db
      .select({
        post: posts,
        author: users,
      })
      .from(posts)
      .innerJoin(users, eq(posts.authorId, users.id))
      .where(eq(posts.authorId, authorId))
      .orderBy(desc(posts.createdAt));

    return this.enrichPosts(authorPosts, currentUserId);
  }

  async getTasksByVolunteer(volunteerId: number): Promise<(Task & { cause: Cause; ngoName: string })[]> {
    const result = await db
      .select({
        task: tasks,
        cause: causes,
        ngoName: users.name,
      })
      .from(tasks)
      .innerJoin(causes, eq(tasks.causeId, causes.id))
      .innerJoin(users, eq(causes.ngoId, users.id))
      .where(eq(tasks.volunteerId, volunteerId));

    return result.map(r => ({ ...r.task, cause: r.cause, ngoName: r.ngoName }));
  }

  async getTasksByNgo(ngoId: number): Promise<(Task & { cause: Cause, volunteer: User })[]> {
    // Join tasks with causes where cause.ngoId = ngoId
    const result = await db
      .select({
        task: tasks,
        cause: causes,
        volunteer: users
      })
      .from(tasks)
      .innerJoin(causes, eq(tasks.causeId, causes.id))
      .innerJoin(users, eq(tasks.volunteerId, users.id))
      .where(eq(causes.ngoId, ngoId));

    return result.map(r => ({ ...r.task, cause: r.cause, volunteer: r.volunteer }));
  }

  async updateTaskStatus(id: number, status: string): Promise<Task> {
    const [updated] = await db.update(tasks)
      .set({ status: status as any })
      .where(eq(tasks.id, id))
      .returning();
    return updated;
  }

  async deleteTask(id: number): Promise<void> {
    await db.delete(tasks).where(eq(tasks.id, id));
  }

  async updateTaskProof(id: number, proofUrl: string): Promise<Task> {
    const [updated] = await db.update(tasks)
      .set({ proofUrl, status: 'completed' })
      .where(eq(tasks.id, id))
      .returning();
    return updated;
  }

  async approveTask(id: number): Promise<Task> {
    const [updated] = await db.update(tasks)
      .set({ approved: true, status: 'completed' })
      .where(eq(tasks.id, id))
      .returning();
    return updated;
  }

  async getImpactStats() {
    const [ngoCount] = await db.select({ count: sql<number>`count(*)` }).from(users).where(eq(users.role, 'ngo'));
    const [volCount] = await db.select({ count: sql<number>`count(*)` }).from(users).where(eq(users.role, 'volunteer'));
    const [completedTasks] = await db.select({ count: sql<number>`count(*)` }).from(tasks).where(eq(tasks.approved, true));
    
    return {
      totalNgos: Number(ngoCount.count),
      totalVolunteers: Number(volCount.count),
      causesCompleted: Number(completedTasks.count),
      volunteerHours: Number(completedTasks.count) * 4,
    };
  }

  async getVolunteerImpact(volunteerId: number) {
    // Get all tasks for this volunteer
    const volunteerTasks = await db
      .select({ task: tasks, cause: causes })
      .from(tasks)
      .innerJoin(causes, eq(tasks.causeId, causes.id))
      .where(eq(tasks.volunteerId, volunteerId));

    // Get all donations by this volunteer
    const volunteerDonations = await db
      .select({ donation: donations, cause: causes })
      .from(donations)
      .innerJoin(causes, eq(donations.causeId, causes.id))
      .where(eq(donations.volunteerId, volunteerId));

    const completedTasks = volunteerTasks.filter(t => t.task.approved);
    const activeTasks = volunteerTasks.filter(t =>
      ["approved", "in_progress"].includes(t.task.status ?? "")
    );

    // Calculate hours from task date ranges
    let totalHours = 0;
    for (const t of completedTasks) {
      if (t.task.startDate && t.task.endDate) {
        const days = Math.ceil(
          (new Date(t.task.endDate).getTime() - new Date(t.task.startDate).getTime()) / (1000 * 60 * 60 * 24)
        );
        totalHours += Math.max(days, 1) * 4; // 4 hours per day
      } else {
        totalHours += 4; // default 4 hours if no dates
      }
    }

    const totalDonated = volunteerDonations.reduce(
      (sum, d) => sum + Number(d.donation.amount), 0
    );

    // Unique causes supported
    const uniqueCauseIds = new Set([
      ...volunteerTasks.map(t => t.cause.id),
      ...volunteerDonations.map(d => d.cause.id),
    ]);

    // Category breakdown from completed tasks
    const categoryMap = new Map<string, number>();
    for (const t of completedTasks) {
      categoryMap.set(t.cause.category, (categoryMap.get(t.cause.category) || 0) + 1);
    }

    // Timeline: monthly activity (tasks completed + donations)
    const timelineMap = new Map<string, { tasks: number; donated: number }>();
    for (const t of completedTasks) {
      const month = (t.task.updatedAt ?? t.task.endDate ?? new Date())
        .toISOString().slice(0, 7); // "YYYY-MM"
      const entry = timelineMap.get(month) || { tasks: 0, donated: 0 };
      entry.tasks += 1;
      timelineMap.set(month, entry);
    }
    for (const d of volunteerDonations) {
      const month = (d.donation.createdAt ?? new Date()).toISOString().slice(0, 7);
      const entry = timelineMap.get(month) || { tasks: 0, donated: 0 };
      entry.donated += Number(d.donation.amount);
      timelineMap.set(month, entry);
    }

    return {
      totalHours,
      totalDonated,
      causesSupported: uniqueCauseIds.size,
      tasksCompleted: completedTasks.length,
      activeTasks: activeTasks.length,
      categories: Array.from(categoryMap.entries()).map(([name, count]) => ({ name, count })),
      timeline: Array.from(timelineMap.entries())
        .map(([month, data]) => ({ month, ...data }))
        .sort((a, b) => a.month.localeCompare(b.month)),
    };
  }

  async toggleFollow(followerId: number, followingId: number): Promise<{ following: boolean }> {
    const [existing] = await db
      .select()
      .from(follows)
      .where(and(eq(follows.followerId, followerId), eq(follows.followingId, followingId)));

    if (existing) {
      await db.delete(follows).where(eq(follows.id, existing.id));
      return { following: false };
    } else {
      await db.insert(follows).values({ followerId, followingId });
      return { following: true };
    }
  }

  async isFollowing(followerId: number, followingId: number): Promise<boolean> {
    const [existing] = await db
      .select()
      .from(follows)
      .where(and(eq(follows.followerId, followerId), eq(follows.followingId, followingId)));
    return !!existing;
  }

  async getFollowerCount(userId: number): Promise<number> {
    const [result] = await db
      .select({ count: sql<number>`count(*)` })
      .from(follows)
      .where(eq(follows.followingId, userId));
    return Number(result?.count ?? 0);
  }

  async getNgos(): Promise<User[]> {
    return await db.select().from(users).where(eq(users.role, "ngo"));
  }
}

export const storage = new DatabaseStorage();
