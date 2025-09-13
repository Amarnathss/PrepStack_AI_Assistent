import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import { registerRoutes } from "./routes.js";

// Load environment variables
dotenv.config();

// Fallback environment variables for production if DigitalOcean doesn't load them properly
if (process.env.NODE_ENV === 'production' && !process.env.GROQ_API_KEY) {
  console.log('⚠️ Environment variables not loaded, trying fallback...');
  // These would normally be set in DigitalOcean environment variables
  // This is a temporary fallback for debugging
}

console.log('🔧 Environment Check:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('GROQ_API_KEY:', process.env.GROQ_API_KEY ? 'SET (' + process.env.GROQ_API_KEY.length + ' chars)' : 'NOT_SET');
console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'SET' : 'NOT_SET');

// Simple logging function
function log(message, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

const app = express();

// CORS configuration
const corsOptions = {
  origin: process.env.NODE_ENV === "production" 
    ? [
        "https://ragstackgen.vercel.app", 
        "https://*.vercel.app",
        "https://ragstackgen.onrender.com"
      ] 
    : ["http://localhost:5173", "http://localhost:3000"],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (process.env.NODE_ENV === "development") {
    try {
      const viteModule = await import("./vite.js");
      await viteModule.setupVite(app, server);
    } catch (error) {
      log(`Failed to load Vite in development mode: ${error}`);
    }
  } else {
    // In production, serve static files
    try {
      const viteModule = await import("./vite.js");
      viteModule.serveStatic(app);
      log("Serving static files in production mode");
    } catch (error) {
      log(`Failed to set up static file serving: ${error}`);
    }
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5001', 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();