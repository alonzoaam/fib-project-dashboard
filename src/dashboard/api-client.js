// Modern API Client for Fibonacci Project Dashboard
// Handles all communication with the cloud-based knowledge base API

class KnowledgeBaseClient {
  constructor(options = {}) {
    this.baseUrl = options.baseUrl || 'https://fib-project-dashboard.vercel.app/api';
    this.cache = new Map();
    this.version = null;
    this.retryAttempts = options.retryAttempts || 3;
    this.retryDelay = options.retryDelay || 1000;
    this.eventSource = null;
    this.listeners = new Map();
  }

  // Main method to load knowledge base data
  async loadKnowledgeBase(options = {}) {
    try {
      console.log('📡 Loading knowledge base from API...');
      
      // Check cache first
      const cacheKey = this.getCacheKey(options);
      if (this.cache.has(cacheKey) && !options.forceRefresh) {
        console.log('📋 Using cached knowledge base');
        return this.cache.get(cacheKey);
      }

      // Fetch from API with retry logic
      const response = await this.fetchWithRetry('/knowledge-base', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Cache-Control': options.noCache ? 'no-cache' : 'max-age=300'
        }
      });

      const result = await response.json();

      if (result.success) {
        // Cache the result
        this.cache.set(cacheKey, result.data);
        this.version = result.metadata?.version;
        
        // Set up real-time updates if not already connected
        if (!this.eventSource && options.realTime !== false) {
          this.setupRealTimeUpdates();
        }
        
        console.log('✅ Knowledge base loaded successfully');
        console.log(`📊 Loaded ${result.data.communications?.length || 0} communications`);
        console.log(`👥 Found ${Object.keys(result.data.people || {}).length} people`);
        console.log(`📁 Found ${Object.keys(result.data.projectGroups || {}).length} project groups`);
        
        return result.data;
      }

      throw new Error(result.error || 'Failed to load knowledge base');

    } catch (error) {
      console.error('❌ Knowledge base loading failed:', error);
      
      // Return cached data as fallback
      const fallbackData = this.cache.get(this.getCacheKey(options));
      if (fallbackData) {
        console.log('📋 Using fallback cached data');
        return fallbackData;
      }
      
      // Return empty knowledge base structure
      return this.getEmptyKnowledgeBase();
    }
  }

  // Advanced query method for filtered data
  async queryKnowledgeBase(query, filters = {}, options = {}) {
    try {
      console.log('🔍 Querying knowledge base...', { query, filters });

      const response = await this.fetchWithRetry('/knowledge-base', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          query: query,
          filters: filters,
          sort: options.sort || { field: 'date', direction: 'desc' },
          pagination: {
            page: options.page || 1,
            limit: options.limit || 50
          }
        })
      });

      const result = await response.json();

      if (result.success) {
        console.log(`✅ Query returned ${result.data.length} results`);
        return {
          data: result.data,
          pagination: result.pagination,
          totalResults: result.pagination?.total || result.data.length
        };
      }

      throw new Error(result.error || 'Query failed');

    } catch (error) {
      console.error('❌ Query failed:', error);
      return {
        data: [],
        pagination: { page: 1, limit: 50, total: 0, totalPages: 0 },
        totalResults: 0,
        error: error.message
      };
    }
  }

  // Get specific data subsets
  async getProjects(options = {}) {
    const kb = await this.loadKnowledgeBase(options);
    return kb.projectGroups || {};
  }

  async getPeople(options = {}) {
    const kb = await this.loadKnowledgeBase(options);
    return kb.people || {};
  }

  async getCommunications(filters = {}, options = {}) {
    if (Object.keys(filters).length > 0) {
      return await this.queryKnowledgeBase('', filters, options);
    }
    
    const kb = await this.loadKnowledgeBase(options);
    return {
      data: kb.communications || [],
      totalResults: kb.communications?.length || 0
    };
  }

  // Real-time updates via Server-Sent Events
  setupRealTimeUpdates() {
    try {
      const eventsUrl = `${this.baseUrl}/events`;
      this.eventSource = new EventSource(eventsUrl);

      this.eventSource.onopen = () => {
        console.log('🔄 Real-time updates connected');
      };

      this.eventSource.onmessage = (event) => {
        try {
          const update = JSON.parse(event.data);
          this.handleRealTimeUpdate(update);
        } catch (error) {
          console.error('❌ Error parsing real-time update:', error);
        }
      };

      this.eventSource.onerror = (error) => {
        console.error('❌ Real-time updates connection error:', error);
        // Attempt to reconnect after delay
        setTimeout(() => {
          if (this.eventSource?.readyState === EventSource.CLOSED) {
            this.setupRealTimeUpdates();
          }
        }, 10000);
      };

    } catch (error) {
      console.warn('⚠️ Real-time updates not available:', error.message);
    }
  }

  // Handle real-time update notifications
  handleRealTimeUpdate(update) {
    console.log('🔄 Received real-time update:', update);

    if (update.type === 'knowledge-base-updated' && update.version !== this.version) {
      console.log('📡 Knowledge base updated, clearing cache...');
      this.cache.clear();
      this.version = update.version;
      
      // Notify listeners
      this.notifyListeners('knowledge-base-updated', update);
    }
  }

  // Event listener management
  addEventListener(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  removeEventListener(event, callback) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  notifyListeners(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('❌ Error in event listener:', error);
        }
      });
    }
  }

  // Utility methods
  async fetchWithRetry(endpoint, options = {}, attempt = 1) {
    try {
      const url = this.baseUrl + endpoint;
      const response = await fetch(url, {
        ...options,
        headers: {
          'User-Agent': 'FibonacciDashboard/1.0',
          ...options.headers
        }
      });

      if (response.ok) {
        return response;
      }

      throw new Error(`HTTP ${response.status}: ${response.statusText}`);

    } catch (error) {
      console.error(`❌ Fetch attempt ${attempt} failed:`, error.message);

      if (attempt < this.retryAttempts) {
        console.log(`🔄 Retrying in ${this.retryDelay * attempt}ms...`);
        await new Promise(resolve => setTimeout(resolve, this.retryDelay * attempt));
        return this.fetchWithRetry(endpoint, options, attempt + 1);
      }

      throw error;
    }
  }

  getCacheKey(options) {
    return JSON.stringify({
      filter: options.filter,
      limit: options.limit,
      offset: options.offset
    });
  }

  getEmptyKnowledgeBase() {
    return {
      projects: {},
      people: {},
      keywords: {},
      communications: [],
      projectGroups: {},
      initialConfig: {
        projectPatterns: [],
        peoplePatterns: [],
        keywordPatterns: [],
        clientPatterns: [],
        statusKeywords: []
      },
      metadata: {
        buildDate: null,
        totalProjects: 0,
        totalCommunications: 0,
        lastUpdated: null,
        version: '0.0.0'
      }
    };
  }

  // Health check
  async checkHealth() {
    try {
      const response = await fetch(`${this.baseUrl}/health`);
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  // Clean up resources
  disconnect() {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    this.cache.clear();
    this.listeners.clear();
  }

  // Get API status and metadata
  async getStatus() {
    try {
      const response = await this.fetchWithRetry('/status');
      return await response.json();
    } catch (error) {
      return {
        status: 'error',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}

// Export for use in modules or global scope
if (typeof module !== 'undefined' && module.exports) {
  module.exports = KnowledgeBaseClient;
} else if (typeof window !== 'undefined') {
  window.KnowledgeBaseClient = KnowledgeBaseClient;
}

// Example usage:
/*
const client = new KnowledgeBaseClient({
  baseUrl: 'https://fib-project-dashboard.vercel.app/api'
});

// Load full knowledge base
const kb = await client.loadKnowledgeBase();

// Query specific data
const results = await client.queryKnowledgeBase('RLHF', {
  source: 'email',
  dateRange: { start: '2024-01-01', end: '2024-12-31' }
});

// Get specific subsets
const projects = await client.getProjects();
const people = await client.getPeople();

// Listen for real-time updates
client.addEventListener('knowledge-base-updated', (data) => {
  console.log('Knowledge base updated!', data);
  // Refresh dashboard
});
*/
