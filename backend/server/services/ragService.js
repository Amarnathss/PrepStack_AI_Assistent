import { storage } from '../storage.js';
import { FileProcessor } from './fileProcessor.js';
import { GroqService } from './groqService.js';

export class RAGService {
  static getGroqService() {
    if (!this._groqService) {
      this._groqService = new GroqService();
    }
    return this._groqService;
  }

  static async searchAndAnswer(userId, query) {
    try {
      // Create embedding for the query
      const queryEmbedding = await FileProcessor.createEmbedding(query);

      // Search through notes
      const notes = await storage.getNotesByUser(userId);
      const relevantNotes = this.findRelevantNotes(notes, queryEmbedding, query);

      // Search through placement questions
      const questions = await storage.getPlacementQuestionsByUser(userId);
      const relevantQuestions = this.findRelevantQuestions(questions, queryEmbedding, query);

      // Search through GitHub repositories
      const githubRepos = await storage.getGithubReposByUser(userId);
      const relevantRepos = this.findRelevantRepos(githubRepos, queryEmbedding, query);

      // Combine all sources
      const sources = [
        ...relevantNotes.map(note => ({
          type: 'note',
          title: note.title,
          content: note.content.substring(0, 500) + (note.content.length > 500 ? '...' : ''),
          relevance: this.calculateRelevance(note.content, query)
        })),
        ...relevantQuestions.map(question => ({
          type: 'question',
          title: `${question.company} - ${question.topic}`,
          content: question.question,
          relevance: this.calculateRelevance(question.question, query)
        })),
        ...relevantRepos.map(repo => {
          return {
            type: 'github',
            title: repo.repoName,
            content: this.formatRepoContent(repo),
            relevance: this.calculateRelevance(`${repo.repoName} ${repo.description} ${JSON.stringify(repo.analysis)}`, query)
          };
        })
      ].sort((a, b) => b.relevance - a.relevance).slice(0, 5);

      // Generate answer using Grok
      const context = sources.map(source => 
        `[${source.type.toUpperCase()}] ${source.title}:\n${source.content}`
      ).join('\n\n');

      const answer = await this.getGroqService().generateAnswer(query, context);

      return {
        answer,
        sources
      };
    } catch (error) {
      console.error('RAG Service error:', error);
      throw new Error('Failed to generate answer');
    }
  }

  static findRelevantNotes(notes, queryEmbedding, query) {
    return notes
      .filter(note => {
        // Simple text matching as fallback
        const queryLower = query.toLowerCase();
        const contentLower = note.content.toLowerCase();
        const titleLower = note.title.toLowerCase();
        
        return contentLower.includes(queryLower) || titleLower.includes(queryLower) ||
               this.calculateTextSimilarity(note.embedding || '', queryEmbedding) > 0.3;
      })
      .slice(0, 3);
  }

  static findRelevantQuestions(questions, queryEmbedding, query) {
    return questions
      .filter(question => {
        const queryLower = query.toLowerCase();
        const questionLower = question.question.toLowerCase();
        const topicLower = question.topic.toLowerCase();
        
        return questionLower.includes(queryLower) || topicLower.includes(queryLower) ||
               this.calculateTextSimilarity(question.embedding || '', queryEmbedding) > 0.3;
      })
      .slice(0, 2);
  }

  static calculateTextSimilarity(embedding1, embedding2) {
    if (!embedding1 || !embedding2) return 0;
    return FileProcessor.calculateSimilarity(embedding1, embedding2);
  }

  static calculateRelevance(content, query) {
    const queryWords = query.toLowerCase().split(/\s+/);
    const contentLower = content.toLowerCase();
    
    let matches = 0;
    queryWords.forEach(word => {
      if (contentLower.includes(word)) {
        matches++;
      }
    });
    
    return matches / queryWords.length;
  }

  static findRelevantRepos(repos, queryEmbedding, query) {
    const queryLower = query.toLowerCase();
    
    const isProjectQuery = queryLower.includes('file') ||
                          queryLower.includes('structure') ||
                          queryLower.includes('project') ||
                          queryLower.includes('repo') ||
                          queryLower.includes('code') ||
                          queryLower.includes('folder') ||
                          queryLower.includes('directory') ||
                          queryLower.includes('architecture') ||
                          queryLower.includes('technology') ||
                          queryLower.includes('stack') ||
                          queryLower.includes('github');
    
    const relevantRepos = repos.filter(repo => {
      const repoNameLower = repo.repoName.toLowerCase();
      const descriptionLower = (repo.description || '').toLowerCase();
      const analysisText = repo.analysis ? JSON.stringify(repo.analysis).toLowerCase() : '';
      
      // Enhanced matching - check for partial matches and common variations
      const queryWords = queryLower.split(/\s+/);
      const exactMatch = repoNameLower.includes(queryLower) || 
                        descriptionLower.includes(queryLower) ||
                        analysisText.includes(queryLower);
      
      // Check if any query word matches repo name (e.g., "movies" matches "movies_website")
      const partialMatch = queryWords.some(word => 
        word.length > 2 && (repoNameLower.includes(word) || descriptionLower.includes(word))
      );
      
      // If it's a project-related query and the repo has analysis, include it
      const shouldInclude = exactMatch || partialMatch || (isProjectQuery && repo.analysis);
      
      return shouldInclude;
    });
    
    // If no repos found but it's a project query, return analyzed repos anyway
    if (relevantRepos.length === 0 && isProjectQuery && repos.length > 0) {
      return repos.filter(repo => repo.analysis).slice(0, 3);
    }
    
    return relevantRepos.slice(0, 3);
  }

  static formatRepoContent(repo) {
    let content = `Repository: ${repo.repoName}\n`;
    
    if (repo.description) {
      content += `Description: ${repo.description}\n`;
    }
    
    if (repo.language) {
      content += `Primary Language: ${repo.language}\n`;
    }
    
    if (repo.stars) {
      content += `Stars: ${repo.stars}\n`;
    }
    
    if (repo.analysis) {
      const analysis = repo.analysis;
      if (analysis.summary) {
        content += `\nSummary: ${analysis.summary}\n`;
      }
      if (analysis.technologies && Array.isArray(analysis.technologies)) {
        content += `Technologies: ${analysis.technologies.join(', ')}\n`;
      }
      if (analysis.architecture) {
        content += `Architecture: ${analysis.architecture}\n`;
      }
      if (analysis.keyFiles && Array.isArray(analysis.keyFiles)) {
        content += `\nKey Files:\n`;
        analysis.keyFiles.slice(0, 3).forEach((file) => {
          content += `- ${file.name}: ${file.purpose || 'No description'}\n`;
        });
      }
    }
    
    return content;
  }
}