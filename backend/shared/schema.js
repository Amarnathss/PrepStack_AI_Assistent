import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, jsonb, boolean } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  githubToken: text("github_token"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const notes = pgTable("notes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  content: text("content").notNull(),
  subject: text("subject").notNull(),
  fileType: text("file_type").notNull(),
  fileName: text("file_name").notNull(),
  embedding: text("embedding"), // JSON string of vector embedding
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
});

export const githubRepos = pgTable("github_repos", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  repoName: text("repo_name").notNull(),
  description: text("description"),
  language: text("language"),
  stars: integer("stars").default(0),
  lastAnalyzed: timestamp("last_analyzed"),
  analysis: jsonb("analysis"), // Store code analysis results
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const placementQuestions = pgTable("placement_questions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  company: text("company").notNull(),
  question: text("question").notNull(),
  difficulty: text("difficulty").notNull(),
  topic: text("topic").notNull(),
  solution: text("solution"),
  year: integer("year").notNull(),
  embedding: text("embedding"), // JSON string of vector embedding
  isSolved: boolean("is_solved").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const chatSessions = pgTable("chat_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  messages: jsonb("messages").notNull(), // Array of message objects
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  notes: many(notes),
  githubRepos: many(githubRepos),
  placementQuestions: many(placementQuestions),
  chatSessions: many(chatSessions),
}));

export const notesRelations = relations(notes, ({ one }) => ({
  user: one(users, { fields: [notes.userId], references: [users.id] }),
}));

export const githubReposRelations = relations(githubRepos, ({ one }) => ({
  user: one(users, { fields: [githubRepos.userId], references: [users.id] }),
}));

export const placementQuestionsRelations = relations(placementQuestions, ({ one }) => ({
  user: one(users, { fields: [placementQuestions.userId], references: [users.id] }),
}));

export const chatSessionsRelations = relations(chatSessions, ({ one }) => ({
  user: one(users, { fields: [chatSessions.userId], references: [users.id] }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertNoteSchema = createInsertSchema(notes).omit({
  id: true,
  uploadedAt: true,
  embedding: true,
});

export const insertGithubRepoSchema = createInsertSchema(githubRepos).omit({
  id: true,
  createdAt: true,
  lastAnalyzed: true,
  analysis: true,
});

export const insertPlacementQuestionSchema = createInsertSchema(placementQuestions).omit({
  id: true,
  createdAt: true,
  embedding: true,
});

export const insertChatSessionSchema = createInsertSchema(chatSessions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});