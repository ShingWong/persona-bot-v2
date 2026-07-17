/**
 * Embedding Service
 * Handles vector embeddings for semantic search
 */

import axios from 'axios';
import { EmbeddingModel } from './memory.types';

export class EmbeddingService {
  private model: EmbeddingModel;
  private apiKey?: string;

  constructor(model: EmbeddingModel, apiKey?: string) {
    this.model = model;
    this.apiKey = apiKey;
  }

  /**
   * Generate embedding for text
   */
  async generateEmbedding(text: string): Promise<number[]> {
    if (!text || text.trim().length === 0) {
      throw new Error('Text cannot be empty');
    }

    switch (this.model.provider) {
      case 'openai':
        return this.generateOpenAIEmbedding(text);
      case 'local':
        return this.generateLocalEmbedding(text);
      case 'huggingface':
        return this.generateHuggingFaceEmbedding(text);
      default:
        throw new Error(`Unsupported embedding provider: ${this.model.provider}`);
    }
  }

  /**
   * Generate embeddings for multiple texts
   */
  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    const embeddings: number[][] = [];
    
    for (const text of texts) {
      const embedding = await this.generateEmbedding(text);
      embeddings.push(embedding);
    }
    
    return embeddings;
  }

  /**
   * Calculate cosine similarity between two embeddings
   */
  cosineSimilarity(embeddingA: number[], embeddingB: number[]): number {
    if (embeddingA.length !== embeddingB.length) {
      throw new Error('Embeddings must have the same dimensions');
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < embeddingA.length; i++) {
      dotProduct += embeddingA[i] * embeddingB[i];
      normA += embeddingA[i] * embeddingA[i];
      normB += embeddingB[i] * embeddingB[i];
    }

    normA = Math.sqrt(normA);
    normB = Math.sqrt(normB);

    if (normA === 0 || normB === 0) {
      return 0;
    }

    return dotProduct / (normA * normB);
  }

  /**
   * Find most similar embeddings
   */
  findMostSimilar(
    queryEmbedding: number[],
    embeddings: number[][],
    k: number = 5
  ): Array<{ index: number; similarity: number }> {
    const similarities = embeddings.map((embedding, index) => ({
      index,
      similarity: this.cosineSimilarity(queryEmbedding, embedding),
    }));

    // Sort by similarity (descending)
    similarities.sort((a, b) => b.similarity - a.similarity);

    // Return top k
    return similarities.slice(0, k);
  }

  /**
   * Generate OpenAI embedding
   */
  private async generateOpenAIEmbedding(text: string): Promise<number[]> {
    if (!this.apiKey) {
      throw new Error('OpenAI API key is required');
    }

    try {
      const response = await axios.post(
        'https://api.openai.com/v1/embeddings',
        {
          model: this.model.name,
          input: text,
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return response.data.data[0].embedding;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`OpenAI embedding failed: ${error.response?.data?.error?.message || error.message}`);
      }
      throw new Error(`OpenAI embedding failed: ${error}`);
    }
  }

  /**
   * Generate local embedding (mock implementation)
   */
  private async generateLocalEmbedding(text: string): Promise<number[]> {
    // Mock implementation - in production, use a local model like sentence-transformers
    // This creates a deterministic "embedding" based on text hash
    const hash = this.stringHash(text);
    const dimensions = this.model.dimensions;
    const embedding: number[] = new Array(dimensions).fill(0);
    
    // Simple deterministic "embedding" for demo purposes
    for (let i = 0; i < dimensions; i++) {
      const seed = hash + i;
      embedding[i] = Math.sin(seed) * 0.5 + 0.5; // Normalize to 0-1
    }
    
    // Normalize to unit vector
    const norm = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    if (norm > 0) {
      return embedding.map(val => val / norm);
    }
    
    return embedding;
  }

  /**
   * Generate HuggingFace embedding
   */
  private async generateHuggingFaceEmbedding(text: string): Promise<number[]> {
    if (!this.apiKey) {
      throw new Error('HuggingFace API key is required');
    }

    try {
      const response = await axios.post(
        `https://api-inference.huggingface.co/pipeline/feature-extraction/${this.model.name}`,
        {
          inputs: text,
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`HuggingFace embedding failed: ${error.response?.data?.error || error.message}`);
      }
      throw new Error(`HuggingFace embedding failed: ${error}`);
    }
  }

  /**
   * Simple string hash function
   */
  private stringHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Encode embedding to string for storage
   */
  encodeEmbedding(embedding: number[]): string {
    return JSON.stringify(embedding);
  }

  /**
   * Decode embedding from string
   */
  decodeEmbedding(encoded: string): number[] {
    try {
      return JSON.parse(encoded);
    } catch {
      throw new Error('Failed to decode embedding');
    }
  }

  /**
   * Validate embedding dimensions
   */
  validateEmbedding(embedding: number[]): boolean {
    return Array.isArray(embedding) && 
           embedding.length === this.model.dimensions &&
           embedding.every(val => typeof val === 'number' && !isNaN(val));
  }

  /**
   * Get model information
   */
  getModelInfo(): EmbeddingModel {
    return { ...this.model };
  }
}