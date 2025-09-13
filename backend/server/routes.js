import { createServer } from "http";
import { storage } from "./storage.js";
import { insertUserSchema, insertNoteSchema, insertPlacementQuestionSchema, insertChatSessionSchema } from "../shared/schema.js";
import { FileProcessor } from "./services/fileProcessor.js";
import { RAGService } from "./services/ragService.js";
import { GitHubService } from "./services/githubService.js";
import { GroqService } from "./services/groqService.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import multer from "multer";
import path from "path";
import fs from "fs";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
const upload = multer({ dest: 'uploads/' });

// Helper function to get authenticated user ID
const getUserId = (req, res) => {
  const userId = req.user?.userId;
  if (!userId) {
    res.status(401).json({ message: "Unauthorized" });
    return null;
  }
  return userId;
};

// Auth middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

export async function registerRoutes(app) {
  // Health check endpoint for deployment platforms
  app.get("/api/health", (req, res) => {
    res.json({ 
      status: "healthy", 
      timestamp: new Date().toISOString(),
      service: "RAG Stack Generator API"
    });
  });

  // Auth routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { email, password, name } = insertUserSchema.parse(req.body);
      
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }

      const hashedPassword = await bcrypt.hash(password, 12);
      const user = await storage.createUser({ email, password: hashedPassword, name });
      
      const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET);
      
      res.json({ 
        token, 
        user: { id: user.id, email: user.email, name: user.name } 
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(400).json({ message: "Invalid registration data", error: error.message });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET);
      
      res.json({ 
        token, 
        user: { id: user.id, email: user.email, name: user.name } 
      });
    } catch (error) {
      res.status(500).json({ message: "Login failed" });
    }
  });

  // Notes routes
  app.post("/api/notes/upload", authenticateToken, upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const { subject } = req.body;
      const userId = req.user?.userId;
      
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const processedFile = await FileProcessor.processFile(req.file.path, req.file.originalname);
      const embedding = await FileProcessor.createEmbedding(processedFile.content);

      const note = await storage.createNote({
        userId,
        title: processedFile.title,
        content: processedFile.content,
        subject: subject || "General",
        fileType: processedFile.fileType,
        fileName: req.file.originalname
      });

      await storage.updateNoteEmbedding(note.id, embedding);

      // Clean up uploaded file
      fs.unlinkSync(req.file.path);

      res.json({ message: "File uploaded successfully", note });
    } catch (error) {
      console.error('Upload error:', error);
      res.status(500).json({ message: "Failed to process file" });
    }
  });

  app.get("/api/notes", authenticateToken, async (req, res) => {
    try {
      const userId = getUserId(req, res);
      if (!userId) return;
      
      const { subject } = req.query;

      const notes = subject 
        ? await storage.getNotesBySubject(userId, subject)
        : await storage.getNotesByUser(userId);

      res.json(notes);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch notes" });
    }
  });

  app.get("/api/notes/search", authenticateToken, async (req, res) => {
    try {
      const userId = getUserId(req, res);
      if (!userId) return;
      
      const { q } = req.query;

      if (!q) {
        return res.status(400).json({ message: "Query parameter required" });
      }

      const notes = await storage.searchNotes(userId, q);
      res.json(notes);
    } catch (error) {
      res.status(500).json({ message: "Search failed" });
    }
  });

  app.delete("/api/notes/:noteId", authenticateToken, async (req, res) => {
    try {
      const { noteId } = req.params;
      const userId = getUserId(req, res);
      if (!userId) return;

      // Check if note belongs to user
      const note = await storage.getNoteById(noteId);
      if (!note || note.userId !== userId) {
        return res.status(404).json({ message: "Note not found" });
      }

      await storage.deleteNote(noteId);
      res.json({ message: "Note deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete note" });
    }
  });

  // GitHub routes
  app.post("/api/github/connect", authenticateToken, async (req, res) => {
    try {
      const { token } = req.body;
      const userId = getUserId(req, res);
      if (!userId) return;

      // Update user with GitHub token
      await storage.updateUser(userId, { githubToken: token });

      // Fetch repositories
      const githubService = new GitHubService(token);
      const repos = await githubService.fetchUserRepositories(userId, token);

      res.json({ message: "GitHub connected successfully", repos });
    } catch (error) {
      res.status(500).json({ message: "Failed to connect GitHub" });
    }
  });

  app.post("/api/github/connect-username", authenticateToken, async (req, res) => {
    try {
      const { username } = req.body;
      const userId = getUserId(req, res);
      if (!userId) return;

      // Extract username from GitHub URL if provided
      let githubUsername = username;
      if (username.includes('github.com/')) {
        const match = username.match(/github\.com\/([^\/\?]+)/);
        githubUsername = match ? match[1] : username;
      }

      // Fetch public repositories using GitHub API without authentication
      const response = await fetch(`https://api.github.com/users/${githubUsername}/repos?per_page=100`);
      
      if (!response.ok) {
        if (response.status === 404) {
          return res.status(404).json({ message: "GitHub user not found" });
        }
        throw new Error(`GitHub API error: ${response.status}`);
      }

      const githubRepos = await response.json();

      // Store repositories in database
      const repos = [];
      for (const repo of githubRepos) {
        const repoData = {
          userId,
          repoName: repo.name,
          description: repo.description,
          language: repo.language,
          stars: repo.stargazers_count
        };
        
        const createdRepo = await storage.createGithubRepo(repoData);
        repos.push(createdRepo);
      }

      res.json({ message: "GitHub repositories fetched successfully", repos });
    } catch (error) {
      console.error('GitHub username connection error:', error);
      res.status(500).json({ message: "Failed to fetch GitHub repositories" });
    }
  });

  app.get("/api/github/repos", authenticateToken, async (req, res) => {
    try {
      const userId = getUserId(req, res);
      if (!userId) return;
      const repos = await storage.getGithubReposByUser(userId);
      res.json(repos);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch repositories" });
    }
  });

  app.post("/api/github/analyze/:repoId", authenticateToken, async (req, res) => {
    try {
      const { repoId } = req.params;
      const userId = getUserId(req, res);
      if (!userId) return;

      const user = await storage.getUser(userId);
      if (!user?.githubToken) {
        return res.status(400).json({ message: "GitHub token not configured" });
      }

      const repos = await storage.getGithubReposByUser(userId);
      const repo = repos.find(r => r.id === repoId);
      
      if (!repo) {
        return res.status(404).json({ message: "Repository not found" });
      }

      const githubService = new GitHubService(user.githubToken);
      const analysis = await githubService.analyzeRepository(userId, repoId, repo.repoName);

      res.json({ analysis });
    } catch (error) {
      res.status(500).json({ message: "Failed to analyze repository" });
    }
  });

  // Placement questions routes
  app.post("/api/placement/questions", authenticateToken, async (req, res) => {
    try {
      const userId = getUserId(req, res);
      if (!userId) return;
      const questionData = insertPlacementQuestionSchema.parse({ ...req.body, userId });

      const question = await storage.createPlacementQuestion(questionData);
      const embedding = await FileProcessor.createEmbedding(question.question);
      await storage.updateQuestionEmbedding(question.id, embedding);

      res.json(question);
    } catch (error) {
      res.status(400).json({ message: "Failed to create question" });
    }
  });

  app.get("/api/placement/questions", authenticateToken, async (req, res) => {
    try {
      const userId = getUserId(req, res);
      if (!userId) return;
      const { company, year, difficulty, topic } = req.query;

      const filters = {};
      if (company) filters.company = company;
      if (year) filters.year = parseInt(year);
      if (difficulty) filters.difficulty = difficulty;
      if (topic) filters.topic = topic;

      const questions = await storage.searchPlacementQuestions(userId, filters);
      res.json(questions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch questions" });
    }
  });

  // Chat routes
  app.post("/api/chat/sessions", authenticateToken, async (req, res) => {
    try {
      const userId = getUserId(req, res);
      if (!userId) return;
      const { title, messages } = req.body;

      const session = await storage.createChatSession({
        userId,
        title: title || "New Chat",
        messages: messages || []
      });

      res.json(session);
    } catch (error) {
      res.status(500).json({ message: "Failed to create chat session" });
    }
  });

  app.get("/api/chat/sessions", authenticateToken, async (req, res) => {
    try {
      const userId = getUserId(req, res);
      if (!userId) return;
      const sessions = await storage.getChatSessionsByUser(userId);
      res.json(sessions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch chat sessions" });
    }
  });

  app.delete("/api/chat/sessions", authenticateToken, async (req, res) => {
    try {
      const userId = getUserId(req, res);
      if (!userId) return;
      await storage.deleteChatSessionsByUser(userId);
      res.json({ message: "All chat sessions deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete chat sessions" });
    }
  });

  app.post("/api/chat/:sessionId/message", authenticateToken, async (req, res) => {
    try {
      const { sessionId } = req.params;
      const { message } = req.body;
      const userId = getUserId(req, res);
      if (!userId) return;

      const sessions = await storage.getChatSessionsByUser(userId);
      const session = sessions.find(s => s.id === sessionId);
      
      if (!session) {
        return res.status(404).json({ message: "Chat session not found" });
      }

      const messages = [...(session.messages || []), { role: 'user', content: message }];

      // Generate RAG response
      const ragResponse = await RAGService.searchAndAnswer(userId, message);
      
      const assistantMessage = { role: 'assistant', content: ragResponse.answer, sources: ragResponse.sources };
      messages.push(assistantMessage);

      await storage.updateChatSession(sessionId, messages);

      res.json({ message: assistantMessage });
    } catch (error) {
      console.error('Chat error:', error);
      res.status(500).json({ message: "Failed to process message" });
    }
  });

  // RAG search endpoint
  app.post("/api/search", authenticateToken, async (req, res) => {
    try {
      const userId = getUserId(req, res);
      if (!userId) return;
      const { query } = req.body;

      if (!query) {
        return res.status(400).json({ message: "Query is required" });
      }

      const response = await RAGService.searchAndAnswer(userId, query);
      res.json(response);
    } catch (error) {
      res.status(500).json({ message: "Search failed" });
    }
  });

  // Dashboard stats
  app.get("/api/dashboard/stats", authenticateToken, async (req, res) => {
    try {
      const userId = getUserId(req, res);
      if (!userId) return;

      const [notes, repos, questions, sessions] = await Promise.all([
        storage.getNotesByUser(userId),
        storage.getGithubReposByUser(userId),
        storage.getPlacementQuestionsByUser(userId),
        storage.getChatSessionsByUser(userId)
      ]);

      const stats = {
        totalNotes: notes.length,
        totalRepos: repos.length,
        totalQuestions: questions.length,
        solvedQuestions: questions.filter(q => q.isSolved).length,
        chatSessions: sessions.length
      };

      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  // Health check endpoint for debugging
  app.get("/api/health", (req, res) => {
    res.json({
      status: "OK",
      environment: process.env.NODE_ENV,
      groqApiKey: process.env.GROQ_API_KEY ? "SET" : "NOT_SET",
      timestamp: new Date().toISOString()
    });
  });

  const httpServer = createServer(app);
  return httpServer;
}