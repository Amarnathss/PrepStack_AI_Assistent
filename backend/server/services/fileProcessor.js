import * as fs from 'fs';
import * as path from 'path';

export class FileProcessor {
  static async processFile(filePath, originalName) {
    const extension = path.extname(originalName).toLowerCase();
    const title = path.basename(originalName, extension);

    switch (extension) {
      case '.pdf':
        return await this.processPDF(filePath, title);
      case '.docx':
        return await this.processDocx(filePath, title);
      case '.md':
        return await this.processMarkdown(filePath, title);
      case '.txt':
        return await this.processText(filePath, title);
      default:
        throw new Error(`Unsupported file type: ${extension}`);
    }
  }

  static async processPDF(filePath, title) {
    try {
      // For now, we'll provide a placeholder for PDF processing
      // In a production environment, you would use a PDF processing library
      const content = `PDF file: ${title}\n\nThis is a placeholder for PDF content extraction. To enable full PDF processing, install and configure a PDF parsing library like pdf-parse or pdfjs-dist.`;
      
      return {
        content,
        title,
        fileType: 'pdf'
      };
    } catch (error) {
      throw new Error(`Failed to process PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async processDocx(filePath, title) {
    try {
      // For now, we'll provide a placeholder for DOCX processing
      // In a production environment, you would use mammoth or similar library
      const content = `DOCX file: ${title}\n\nThis is a placeholder for DOCX content extraction. To enable full DOCX processing, install and configure the mammoth library.`;
      
      return {
        content,
        title,
        fileType: 'docx'
      };
    } catch (error) {
      throw new Error(`Failed to process DOCX: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async processMarkdown(filePath, title) {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      
      return {
        content: content.trim(),
        title,
        fileType: 'markdown'
      };
    } catch (error) {
      throw new Error(`Failed to process Markdown: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async processText(filePath, title) {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      
      return {
        content: content.trim(),
        title,
        fileType: 'text'
      };
    } catch (error) {
      throw new Error(`Failed to process text file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async createEmbedding(text) {
    // Simple text-based similarity for now
    // In production, you'd use a proper embedding service like OpenAI embeddings
    const words = text.toLowerCase().split(/\s+/);
    const wordFreq = {};
    
    words.forEach(word => {
      word = word.replace(/[^\w]/g, '');
      if (word.length > 2) {
        wordFreq[word] = (wordFreq[word] || 0) + 1;
      }
    });

    // Create a simple vector representation
    const vector = Object.entries(wordFreq)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 100)
      .map(([word, freq]) => freq);

    return JSON.stringify(vector);
  }

  static calculateSimilarity(embedding1, embedding2) {
    try {
      const vec1 = JSON.parse(embedding1);
      const vec2 = JSON.parse(embedding2);
      
      const maxLength = Math.max(vec1.length, vec2.length);
      let dotProduct = 0;
      let norm1 = 0;
      let norm2 = 0;

      for (let i = 0; i < maxLength; i++) {
        const v1 = vec1[i] || 0;
        const v2 = vec2[i] || 0;
        
        dotProduct += v1 * v2;
        norm1 += v1 * v1;
        norm2 += v2 * v2;
      }

      const magnitude = Math.sqrt(norm1) * Math.sqrt(norm2);
      return magnitude === 0 ? 0 : dotProduct / magnitude;
    } catch {
      return 0;
    }
  }
}