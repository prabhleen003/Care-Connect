import { IStorage } from "./storage";
import { users, causes, tasks, type InsertUser, type User, type Cause, type Task, type InsertCause, type InsertTask } from "@shared/schema";
import { db } from "./db";
import { eq, and, sql, desc } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

const PostgresSessionStore = connectPg(session);

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

  async createTask(task: InsertTask): Promise<Task> {
    const [newTask] = await db.insert(tasks).values(task).returning();
    return newTask;
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

  async getTask(id: number): Promise<Task | undefined> {
    const [task] = await db.select().from(tasks).where(eq(tasks.id, id));
    return task;
  }

  async updateTaskStatus(id: number, status: string): Promise<Task> {
    const [updated] = await db.update(tasks)
      .set({ status })
      .where(eq(tasks.id, id))
      .returning();
    return updated;
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
      causesCompleted: Number(completedTasks.count), // Approximation
      volunteerHours: Number(completedTasks.count) * 4, // Rough estimate 4h per task
    };
  }
}

export const storage = new DatabaseStorage();
