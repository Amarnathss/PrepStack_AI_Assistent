import {
  users,
  notes,
  githubRepos,
  placementQuestions,
  chatSessions
} from "../shared/schema.js";
import { db } from "./db.js";
import { eq, desc, like, and, or } from "drizzle-orm";

export class DatabaseStorage {
  async getUser(id) {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email) {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser) {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUser(id, updates) {
    const [user] = await db.update(users).set(updates).where(eq(users.id, id)).returning();
    return user || undefined;
  }

  async createNote(insertNote) {
    const [note] = await db.insert(notes).values(insertNote).returning();
    return note;
  }

  async getNotesByUser(userId) {
    return await db.select().from(notes).where(eq(notes.userId, userId)).orderBy(desc(notes.uploadedAt));
  }

  async getNotesBySubject(userId, subject) {
    return await db.select().from(notes)
      .where(and(eq(notes.userId, userId), eq(notes.subject, subject)))
      .orderBy(desc(notes.uploadedAt));
  }

  async searchNotes(userId, query) {
    return await db.select().from(notes)
      .where(and(
        eq(notes.userId, userId),
        or(
          like(notes.title, `%${query}%`),
          like(notes.content, `%${query}%`)
        )
      ))
      .orderBy(desc(notes.uploadedAt));
  }

  async updateNoteEmbedding(id, embedding) {
    await db.update(notes).set({ embedding }).where(eq(notes.id, id));
  }

  async getNoteById(id) {
    const [note] = await db.select().from(notes).where(eq(notes.id, id));
    return note;
  }

  async deleteNote(id) {
    await db.delete(notes).where(eq(notes.id, id));
  }

  async createGithubRepo(insertRepo) {
    const [repo] = await db.insert(githubRepos).values(insertRepo).returning();
    return repo;
  }

  async getGithubReposByUser(userId) {
    return await db.select().from(githubRepos).where(eq(githubRepos.userId, userId)).orderBy(desc(githubRepos.createdAt));
  }

  async updateGithubRepoAnalysis(id, analysis) {
    await db.update(githubRepos).set({ analysis, lastAnalyzed: new Date() }).where(eq(githubRepos.id, id));
  }

  async createPlacementQuestion(insertQuestion) {
    const [question] = await db.insert(placementQuestions).values(insertQuestion).returning();
    return question;
  }

  async getPlacementQuestionsByUser(userId) {
    return await db.select().from(placementQuestions).where(eq(placementQuestions.userId, userId)).orderBy(desc(placementQuestions.createdAt));
  }

  async searchPlacementQuestions(userId, filters) {
    const conditions = [eq(placementQuestions.userId, userId)];
    
    if (filters.company) {
      conditions.push(eq(placementQuestions.company, filters.company));
    }
    if (filters.year) {
      conditions.push(eq(placementQuestions.year, filters.year));
    }
    if (filters.difficulty) {
      conditions.push(eq(placementQuestions.difficulty, filters.difficulty));
    }
    if (filters.topic) {
      conditions.push(like(placementQuestions.topic, `%${filters.topic}%`));
    }

    return await db.select().from(placementQuestions)
      .where(and(...conditions))
      .orderBy(desc(placementQuestions.createdAt));
  }

  async updateQuestionEmbedding(id, embedding) {
    await db.update(placementQuestions).set({ embedding }).where(eq(placementQuestions.id, id));
  }

  async createChatSession(insertSession) {
    const [session] = await db.insert(chatSessions).values(insertSession).returning();
    return session;
  }

  async getChatSessionsByUser(userId) {
    return await db.select().from(chatSessions).where(eq(chatSessions.userId, userId)).orderBy(desc(chatSessions.updatedAt));
  }

  async updateChatSession(id, messages) {
    const [session] = await db.update(chatSessions)
      .set({ messages, updatedAt: new Date() })
      .where(eq(chatSessions.id, id))
      .returning();
    return session || undefined;
  }

  async deleteChatSessionsByUser(userId) {
    await db.delete(chatSessions).where(eq(chatSessions.userId, userId));
  }
}

export const storage = new DatabaseStorage();