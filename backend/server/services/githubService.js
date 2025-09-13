import { Octokit } from "@octokit/rest";
import { storage } from "../storage.js";

export class GitHubService {
  constructor(token) {
    this.octokit = null;
    if (token) {
      this.octokit = new Octokit({ auth: token });
    }
  }

  async fetchUserRepositories(userId, token) {
    try {
      this.octokit = new Octokit({ auth: token });

      const { data: repos } =
        await this.octokit.rest.repos.listForAuthenticatedUser({
          visibility: "private",
          sort: "updated",
          per_page: 50,
        });

      const savedRepos = [];

      for (const repo of repos) {
        if (repo.private) {
          const repoData = {
            userId,
            repoName: repo.full_name,
            description: repo.description || "",
            language: repo.language || "Unknown",
            stars: repo.stargazers_count || 0,
          };

          const savedRepo = await storage.createGithubRepo(repoData);
          savedRepos.push(savedRepo);
        }
      }

      return savedRepos;
    } catch (error) {
      console.error("GitHub API error:", error);
      throw new Error("Failed to fetch repositories");
    }
  }

  async analyzeRepository(userId, repoId, repoName) {
    try {
      if (!this.octokit) {
        throw new Error("GitHub token not configured");
      }

      const [owner, repo] = repoName.split("/");

      // Get repository contents
      const { data: contents } = await this.octokit.rest.repos.getContent({
        owner,
        repo,
        path: "",
      });

      // Get README content
      let readme = "";
      try {
        const { data: readmeData } = await this.octokit.rest.repos.getReadme({
          owner,
          repo,
        });
        readme = Buffer.from(readmeData.content, "base64").toString("utf-8");
      } catch {
        // README might not exist
      }

      // Analyze key files
      const keyFiles = [];

      if (Array.isArray(contents)) {
        const importantFiles = contents
          .filter(
            (item) =>
              item.type === "file" &&
              (item.name.includes("package.json") ||
                item.name.includes("requirements.txt") ||
                item.name.includes("app.js") ||
                item.name.includes("main.py") ||
                item.name.includes("index.js") ||
                item.name.includes("server.js"))
          )
          .slice(0, 3);

        for (const file of importantFiles) {
          try {
            const { data: fileData } = await this.octokit.rest.repos.getContent(
              {
                owner,
                repo,
                path: file.name,
              }
            );

            if ("content" in fileData) {
              const content = Buffer.from(fileData.content, "base64").toString(
                "utf-8"
              );
              keyFiles.push({
                name: file.name,
                content: content.substring(0, 1000), // Limit content
                purpose: this.inferFilePurpose(file.name, content),
              });
            }
          } catch {
            // Skip if file can't be read
          }
        }
      }

      // Determine technologies
      const technologies = this.extractTechnologies(keyFiles, readme);

      const analysis = {
        summary: this.generateSummary(readme, keyFiles),
        technologies,
        keyFiles,
        architecture: this.inferArchitecture(keyFiles, technologies),
      };

      // Save analysis to database
      await storage.updateGithubRepoAnalysis(repoId, analysis);

      return analysis;
    } catch (error) {
      console.error("Repository analysis error:", error);
      throw new Error("Failed to analyze repository");
    }
  }

  extractTechnologies(keyFiles, readme) {
    const techs = new Set();
    const content = (
      keyFiles.map((f) => f.content).join(" ") +
      " " +
      readme
    ).toLowerCase();

    const techMap = {
      react: ["react", "jsx", "create-react-app"],
      "node.js": ["node", "express", "npm"],
      python: ["python", "django", "flask", "pip"],
      mongodb: ["mongodb", "mongoose"],
      postgresql: ["postgresql", "postgres", "pg"],
      javascript: ["javascript", "js"],
      typescript: ["typescript", "ts"],
      html: ["html"],
      css: ["css", "styling"],
      tailwind: ["tailwind"],
      bootstrap: ["bootstrap"],
    };

    Object.entries(techMap).forEach(([tech, keywords]) => {
      if (keywords.some((keyword) => content.includes(keyword))) {
        techs.add(tech);
      }
    });

    return Array.from(techs);
  }

  inferFilePurpose(fileName, content) {
    if (fileName === "package.json")
      return "Project dependencies and configuration";
    if (fileName === "requirements.txt") return "Python dependencies";
    if (fileName.includes("app.") || fileName.includes("server."))
      return "Main application entry point";
    if (fileName.includes("index.")) return "Application entry point";
    return "Configuration or main application file";
  }

  generateSummary(readme, keyFiles) {
    if (readme) {
      const lines = readme.split("\n").filter((line) => line.trim().length > 0);
      const description = lines.find(
        (line) => !line.startsWith("#") && line.length > 20
      );
      if (description) return description.substring(0, 200);
    }

    return `Project with ${keyFiles.length} key files including ${keyFiles
      .map((f) => f.name)
      .join(", ")}`;
  }

  inferArchitecture(keyFiles, technologies) {
    const hasBackend = keyFiles.some(
      (f) =>
        f.name.includes("server") ||
        f.name.includes("app.js") ||
        f.name.includes("main.py")
    );
    const hasFrontend =
      technologies.includes("react") || technologies.includes("html");

    if (hasBackend && hasFrontend) return "Full-stack application";
    if (hasBackend) return "Backend API service";
    if (hasFrontend) return "Frontend application";
    return "Application project";
  }
}
