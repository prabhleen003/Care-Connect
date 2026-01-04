import { users, causes, tasks, donations, posts, postLikes, postComments, type InsertUser, type User, type Cause, type Task, type InsertCause, type InsertTask, type InsertDonation, type InsertPost, type Donation, type Post, type PostLike, type PostComment, type InsertPostComment, type PostResponse } from "@shared/schema";
import { db } from "./db";
import { eq, and, sql, desc } from "drizzle-orm";
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
  getCauses(filters?: { category?: string; location?: string; urgency?: string }): Promise<Cause[]>;
  getCause(id: number): Promise<Cause | undefined>;
  getCausesByNgo(ngoId: number): Promise<Cause[]>;
  
  createTask(task: InsertTask): Promise<Task>;
  getTask(id: number): Promise<Task & { cause: Cause, volunteer: User } | undefined>;
  getTasksByVolunteer(volunteerId: number): Promise<Task[]>;
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

  async getCauses(filters?: { category?: string; location?: string; urgency?: string }): Promise<Cause[]> {
    let query = db.select().from(causes);
    const conditions = [];
    
    if (filters?.category) conditions.push(eq(causes.category, filters.category));
    if (filters?.location) conditions.push(eq(causes.location, filters.location));
    // urgency filtering logic can be added here if exact match, or range
    
    if (conditions.length > 0) {
      // @ts-ignore
      query.where(and(...conditions));
    }
    
    return await query.orderBy(desc(causes.createdAt));
  }

  async getCause(id: number): Promise<Cause | undefined> {
    const [cause] = await db.select().from(causes).where(eq(causes.id, id));
    return cause;
  }

  async getCausesByNgo(ngoId: number): Promise<Cause[]> {
    return await db.select().from(causes).where(eq(causes.ngoId, ngoId));
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

  async getPosts(userId?: number): Promise<PostResponse[]> {
    const allPosts = await db
      .select({
        post: posts,
        author: users,
      })
      .from(posts)
      .innerJoin(users, eq(posts.authorId, users.id))
      .orderBy(desc(posts.createdAt));

    const postResponses = await Promise.all(allPosts.map(async (p) => {
      const likes = await db.select().from(postLikes).where(eq(postLikes.postId, p.post.id));
      const comments = await db
        .select({
          comment: postComments,
          author: users,
        })
        .from(postComments)
        .innerJoin(users, eq(postComments.authorId, users.id))
        .where(eq(postComments.postId, p.post.id));

      const isLiked = userId ? likes.some(l => l.userId === userId) : false;

      return {
        ...p.post,
        author: { id: p.author.id, name: p.author.name, role: p.author.role },
        likesCount: likes.length,
        commentsCount: comments.length,
        isLiked,
        comments: comments.map(c => ({
          ...c.comment,
          author: { name: c.author.name }
        }))
      };
    }));

    return postResponses;
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

    return await Promise.all(authorPosts.map(async (p) => {
      const likes = await db.select().from(postLikes).where(eq(postLikes.postId, p.post.id));
      const comments = await db
        .select({
          comment: postComments,
          author: users,
        })
        .from(postComments)
        .innerJoin(users, eq(postComments.authorId, users.id))
        .where(eq(postComments.postId, p.post.id));

      const isLiked = currentUserId ? likes.some(l => l.userId === currentUserId) : false;

      return {
        ...p.post,
        author: { id: p.author.id, name: p.author.name, role: p.author.role },
        likesCount: likes.length,
        commentsCount: comments.length,
        isLiked,
        comments: comments.map(c => ({
          ...c.comment,
          author: { name: c.author.name }
        }))
      };
    }));
  }

  async getTasksByVolunteer(volunteerId: number): Promise<Task[]> {
    return await db.select().from(tasks).where(eq(tasks.volunteerId, volunteerId));
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
      .set({ proofUrl, status: 'completed' }) // Auto-set to completed pending approval? Or in_progress? Prompt says "Update progress... then upload proof"
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

  async getNgos(): Promise<User[]> {
    return await db.select().from(users).where(eq(users.role, "ngo"));
  }
}

export const storage = new DatabaseStorage();
