// TradeMind AI - Vector Store
// In-memory vector database with cosine similarity search
// Production-ready: swap to Pinecone/Weaviate/Chroma by changing adapter

class VectorStore {
  constructor(dimensions = 1536) {
    this.dimensions = dimensions;
    this.vectors = []; // { id, vector, metadata }
    this.nextId = 1;
  }

  // Generate embedding for text (placeholder - replace with OpenAI/Custom)
  async generateEmbedding(text) {
    // Simple hash-based embedding for demo
    // In production: use OpenAI ada-002, Cohere, or custom model
    const hash = await this.hashText(text);
    const vector = new Array(this.dimensions).fill(0);
    
    // Generate deterministic "embedding" from hash
    for (let i = 0; i < hash.length; i++) {
      const charCode = hash.charCodeAt(i);
      vector[i % this.dimensions] += charCode / 255;
    }
    
    // Normalize
    const magnitude = Math.sqrt(vector.reduce((a, b) => a + b * b, 0));
    return vector.map(v => v / magnitude);
  }

  async hashText(text) {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => String.fromCharCode(b)).join('');
  }

  // Cosine similarity
  cosineSimilarity(a, b) {
    let dot = 0, normA = 0, normB = 0;
    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    return dot / (Math.sqrt(normA) * Math.sqrt(normB) + 1e-10);
  }

  // Add vector with metadata
  async add(text, metadata = {}) {
    const vector = await this.generateEmbedding(text);
    const id = this.nextId++;
    this.vectors.push({ id, vector, metadata, text });
    return id;
  }

  // Bulk add
  async addMany(items) {
    // items: [{ text, metadata }]
    const ids = [];
    for (const item of items) {
      ids.push(await this.add(item.text, item.metadata));
    }
    return ids;
  }

  // Search by similarity
  search(query, topK = 5, filter = null) {
    let results = this.vectors;
    
    // Apply filter if provided
    if (filter) {
      results = results.filter(v => {
        for (const [key, value] of Object.entries(filter)) {
          if (v.metadata[key] !== value) return false;
        }
        return true;
      });
    }

    // Calculate similarities
    const withSimilarity = results.map(v => ({
      ...v,
      similarity: this.cosineSimilarity(query, v.vector)
    }));

    // Sort and return topK
    return withSimilarity
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, topK);
  }

  // Search by text
  async searchByText(queryText, topK = 5, filter = null) {
    const queryVector = await this.generateEmbedding(queryText);
    return this.search(queryVector, topK, filter);
  }

  // Get by ID
  getById(id) {
    return this.vectors.find(v => v.id === id) || null;
  }

  // Get by metadata
  getByMetadata(filter) {
    return this.vectors.filter(v => {
      for (const [key, value] of Object.entries(filter)) {
        if (v.metadata[key] !== value) return false;
      }
      return true;
    });
  }

  // Update metadata
  updateMetadata(id, updates) {
    const vector = this.getById(id);
    if (vector) {
      vector.metadata = { ...vector.metadata, ...updates };
      return true;
    }
    return false;
  }

  // Delete
  delete(id) {
    const index = this.vectors.findIndex(v => v.id === id);
    if (index !== -1) {
      this.vectors.splice(index, 1);
      return true;
    }
    return false;
  }

  // Stats
  stats() {
    const categories = {};
    for (const v of this.vectors) {
      const cat = v.metadata.category || 'unknown';
      categories[cat] = (categories[cat] || 0) + 1;
    }
    return {
      totalVectors: this.vectors.length,
      dimensions: this.dimensions,
      categories
    };
  }
}

// Global instance
const marketStore = new VectorStore(1536);
const newsStore = new VectorStore(1536);
const tradeStore = new VectorStore(1536);
const sentimentStore = new VectorStore(1536);

export { VectorStore, marketStore, newsStore, tradeStore, sentimentStore };
