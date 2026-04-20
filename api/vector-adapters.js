// TradeMind AI - Vector DB Adapters
// Swap between in-memory, Pinecone, Weaviate, or Chroma

// ============================================
// ADAPTER: In-Memory (Current Implementation)
// ============================================

class InMemoryVectorStore {
  constructor(dimensions = 1536) {
    this.dimensions = dimensions;
    this.vectors = [];
    this.nextId = 1;
  }

  async upsert(items) {
    const ids = [];
    for (const item of items) {
      const id = this.nextId++;
      this.vectors.push({ id, ...item });
      ids.push(id);
    }
    return { ids };
  }

  async query({ vector, topK = 10, filter }) {
    let results = this.vectors;
    if (filter) {
      results = results.filter(v => {
        for (const [key, value] of Object.entries(filter)) {
          if (v.metadata?.[key] !== value) return false;
        }
        return true;
      });
    }
    return { matches: results.slice(0, topK) };
  }

  async delete(deleteAll = false) {
    this.vectors = [];
    return { deleted: true };
  }
}

// ============================================
// ADAPTER: Pinecone (Production)
// ============================================

class PineconeVectorStore {
  constructor(apiKey, environment, indexName) {
    this.apiKey = apiKey;
    this.environment = environment;
    this.indexName = indexName;
    this.baseUrl = `https://${indexName}-${environment}.svc.pinecone.io`;
  }

  async upsert(items) {
    const response = await fetch(`${this.baseUrl}/vectors/upsert`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Api-Key': this.apiKey
      },
      body: JSON.stringify({
        vectors: items.map((item, i) => ({
          id: item.id || String(i),
          values: item.vector,
          metadata: item.metadata
        })),
        namespace: 'trademind'
      })
    });
    return response.json();
  }

  async query({ vector, topK = 10, filter }) {
    const response = await fetch(`${this.baseUrl}/vectors/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Api-Key': this.apiKey
      },
      body: JSON.stringify({
        vector,
        topK,
        namespace: 'trademind',
        filter,
        includeMetadata: true
      })
    });
    return response.json();
  }

  async delete(deleteAll = false) {
    const endpoint = deleteAll ? 'delete-all' : 'delete';
    const response = await fetch(`${this.baseUrl}/namespaces/trademind/${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Api-Key': this.apiKey
      }
    });
    return response.json();
  }
}

// ============================================
// ADAPTER: Weaviate (Production)
// ============================================

class WeaviateVectorStore {
  constructor(url, apiKey) {
    this.url = url.replace(/\/$/, '');
    this.apiKey = apiKey;
  }

  async upsert(items) {
    const response = await fetch(`${this.url}/v1/batch/objects`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        objects: items.map((item, i) => ({
          class: 'TradingData',
          id: item.id || undefined,
          vector: item.vector,
          properties: item.metadata
        }))
      })
    });
    return response.json();
  }

  async query({ text, vector, topK = 10, filter }) {
    const queryBody = vector 
      ? { vector, limit: topK }
      : { ask: { question: text, properties: ['text'] }, limit: topK };

    if (filter) {
      queryBody.where = filter;
    }

    const response = await fetch(`${this.url}/v1/graphql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        query: `{ Get { TradingData(${Object.entries(queryBody).map(([k,v]) => `${k}:${JSON.stringify(v)}`).join(', ')}) { text metadata { ... } _additional { distance } } } }`
      })
    });
    return response.json();
  }

  async delete(deleteAll = false) {
    if (deleteAll) {
      await fetch(`${this.url}/v1/schema/TradingData`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${this.apiKey}` }
      });
    }
    return { deleted: true };
  }
}

// ============================================
// ADAPTER: Chroma (Local/Production)
// ============================================

class ChromaVectorStore {
  constructor(url = 'http://localhost:8000') {
    this.url = url;
  }

  async upsert(collectionName, items) {
    const response = await fetch(`${this.url}/api/v1/collections/${collectionName}/add`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ids: items.map((item, i) => item.id || String(i)),
        embeddings: items.map(item => item.vector),
        documents: items.map(item => item.text || JSON.stringify(item.metadata)),
        metadatas: items.map(item => item.metadata)
      })
    });
    return response.json();
  }

  async query(collectionName, { queryText, queryEmbeddings, n = 10 }) {
    const response = await fetch(`${this.url}/api/v1/collections/${collectionName}/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query_texts: queryText ? [queryText] : undefined,
        query_embeddings: queryEmbeddings,
        n_results: n
      })
    });
    return response.json();
  }

  async delete(collectionName) {
    const response = await fetch(`${this.url}/api/v1/collections/${collectionName}`, {
      method: 'DELETE'
    });
    return response.json();
  }
}

// ============================================
// FACTORY: Get appropriate adapter
// ============================================

export function getVectorAdapter(type = 'memory', config = {}) {
  switch (type) {
    case 'pinecone':
      return new PineconeVectorStore(
        config.apiKey || process.env.PINECONE_API_KEY,
        config.environment || 'us-east-1',
        config.indexName || 'trademind'
      );
    
    case 'weaviate':
      return new WeaviateVectorStore(
        config.url || 'https://trademind.weaviate.cloud',
        config.apiKey || process.env.WEAVIATE_API_KEY
      );
    
    case 'chroma':
      return new ChromaVectorStore(config.url || 'http://localhost:8000');
    
    case 'memory':
    default:
      return new InMemoryVectorStore(config.dimensions || 1536);
  }
}

// Pre-configured adapters for production use
export const adapters = {
  memory: getVectorAdapter('memory'),
  pinecone: () => getVectorAdapter('pinecone', {
    apiKey: process.env.PINECONE_API_KEY,
    environment: process.env.PINECONE_ENV || 'us-east-1',
    indexName: 'trademind-market'
  }),
  weaviate: () => getVectorAdapter('weaviate', {
    url: process.env.WEAVIATE_URL,
    apiKey: process.env.WEAVIATE_API_KEY
  }),
  chroma: () => getVectorAdapter('chroma', {
    url: process.env.CHROMA_URL || 'http://localhost:8000'
  })
};

export { InMemoryVectorStore, PineconeVectorStore, WeaviateVectorStore, ChromaVectorStore };
