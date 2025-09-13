import express from "express";
import fs from "fs";
import path from "path";

export function log(message, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

export async function setupVite(app, server) {
  // Only import vite in development mode
  const { createServer: createViteServer, createLogger } = await import("vite");
  
  // Use a basic config instead of importing the full vite.config
  const basicViteConfig = {
    root: path.resolve(import.meta.dirname, "..", "client"),
    plugins: []
  };
  
  const { nanoid } = await import("nanoid");

  const viteLogger = createLogger();

  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true,
  };

  const vite = await createViteServer({
    ...basicViteConfig,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      },
    },
    server: serverOptions,
    appType: "custom",
  });

  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    try {
      const clientTemplate = path.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html",
      );

      // always reload the index.html file from disk incase it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      const { nanoid: nanoIdFunc } = await import("nanoid");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.jsx?v=${nanoIdFunc()}"`,
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}

export function serveStatic(app) {
  // Try multiple possible paths for the static files
  const possiblePaths = [
    path.resolve(process.cwd(), "public"),           // If files are in workspace root (/workspace/public)
    path.resolve(process.cwd(), "dist", "public"),   // If running from root (/workspace/dist/public)
    path.resolve(import.meta.dirname, "dist", "public"),       // If running from dist/ (/workspace/dist/dist/public)
    path.resolve(import.meta.dirname, "public"),               // If files are in same dir as server
  ];
  
  let distPath = null;
  
  for (const testPath of possiblePaths) {
    if (fs.existsSync(testPath)) {
      distPath = testPath;
      break;
    }
  }

  if (!distPath) {
    const pathsChecked = possiblePaths.join(", ");
    throw new Error(
      `Could not find the build directory in any of these locations: ${pathsChecked}. Make sure to build the client first.`,
    );
  }

  log(`Serving static files from: ${distPath}`);
  app.use(express.static(distPath));

  // fall through to index.html if the file doesn't exist
  app.use("*", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}