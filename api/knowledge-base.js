// Vercel API Route for Knowledge Base
// This creates a scalable REST API endpoint for the knowledge base data

export default async function handler(req, res) {
  // CORS headers for global access
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  try {
    switch (req.method) {
      case 'GET':
        return await getKnowledgeBase(req, res);
      case 'PUT':
        return await updateKnowledgeBase(req, res);
      case 'POST':
        return await queryKnowledgeBase(req, res);
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
  }
}

// GET /api/knowledge-base - Fetch knowledge base data
async function getKnowledgeBase(req, res) {
  try {
    // In production, this would fetch from Google Cloud Storage, Firebase, or similar
    // For now, we'll use Vercel KV or environment variables as a simple solution
    
    const { filter, limit, offset } = req.query;
    
    // Fetch from cloud storage (placeholder implementation)
    const knowledgeBase = await fetchFromCloudStorage();
    
    if (!knowledgeBase) {
      return res.status(404).json({ 
        error: 'Knowledge base not found',
        message: 'No data available. Please run the Google Apps Script to populate data.'
      });
    }
    
    // Apply filters if provided
    let filteredData = knowledgeBase;
    if (filter) {
      filteredData = applyFilters(knowledgeBase, filter);
    }
    
    // Apply pagination if provided
    if (limit || offset) {
      filteredData = applyPagination(filteredData, parseInt(limit) || 100, parseInt(offset) || 0);
    }
    
    return res.status(200).json({
      success: true,
      data: filteredData,
      metadata: {
        lastUpdated: knowledgeBase.metadata?.lastUpdated,
        version: knowledgeBase.metadata?.version || '1.0.0',
        totalRecords: knowledgeBase.communications?.length || 0,
        buildDate: knowledgeBase.metadata?.buildDate
      }
    });
    
  } catch (error) {
    console.error('Error fetching knowledge base:', error);
    return res.status(500).json({ error: 'Failed to fetch knowledge base' });
  }
}

// PUT /api/knowledge-base - Update knowledge base (from Google Apps Script)
async function updateKnowledgeBase(req, res) {
  try {
    // Verify authorization (in production, use proper API keys)
    const authHeader = req.headers.authorization;
    if (!authHeader || !isValidApiKey(authHeader)) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const { data, timestamp, version } = req.body;
    
    if (!data) {
      return res.status(400).json({ error: 'Missing data in request body' });
    }
    
    // Validate data structure
    if (!isValidKnowledgeBase(data)) {
      return res.status(400).json({ error: 'Invalid knowledge base structure' });
    }
    
    // Store in cloud storage
    const success = await storeInCloudStorage(data, { timestamp, version });
    
    if (success) {
      // Optionally trigger cache invalidation or real-time updates
      await notifyClients('knowledge-base-updated', { version, timestamp });
      
      return res.status(200).json({
        success: true,
        message: 'Knowledge base updated successfully',
        version: version,
        timestamp: timestamp
      });
    } else {
      return res.status(500).json({ error: 'Failed to store knowledge base' });
    }
    
  } catch (error) {
    console.error('Error updating knowledge base:', error);
    return res.status(500).json({ error: 'Failed to update knowledge base' });
  }
}

// POST /api/knowledge-base - Query knowledge base with advanced filters
async function queryKnowledgeBase(req, res) {
  try {
    const { query, filters, sort, pagination } = req.body;
    
    const knowledgeBase = await fetchFromCloudStorage();
    
    if (!knowledgeBase) {
      return res.status(404).json({ error: 'Knowledge base not found' });
    }
    
    let results = knowledgeBase.communications || [];
    
    // Apply text search if query provided
    if (query) {
      results = searchCommunications(results, query);
    }
    
    // Apply advanced filters
    if (filters) {
      results = applyAdvancedFilters(results, filters);
    }
    
    // Apply sorting
    if (sort) {
      results = applySorting(results, sort);
    }
    
    // Apply pagination
    const { page = 1, limit = 50 } = pagination || {};
    const offset = (page - 1) * limit;
    const paginatedResults = results.slice(offset, offset + limit);
    
    return res.status(200).json({
      success: true,
      data: paginatedResults,
      pagination: {
        page,
        limit,
        total: results.length,
        totalPages: Math.ceil(results.length / limit)
      },
      query: query,
      filters: filters
    });
    
  } catch (error) {
    console.error('Error querying knowledge base:', error);
    return res.status(500).json({ error: 'Failed to query knowledge base' });
  }
}

// Helper Functions

async function fetchFromCloudStorage() {
  // Implementation depends on chosen storage solution
  
  // Option 1: Google Cloud Storage
  if (process.env.GCS_BUCKET_NAME) {
    return await fetchFromGoogleCloudStorage();
  }
  
  // Option 2: Vercel KV (Redis-like key-value store)
  if (process.env.KV_REST_API_URL) {
    return await fetchFromVercelKV();
  }
  
  // Option 3: Environment variable (for testing)
  if (process.env.KNOWLEDGE_BASE_JSON) {
    return JSON.parse(process.env.KNOWLEDGE_BASE_JSON);
  }
  
  return null;
}

async function fetchFromGoogleCloudStorage() {
  try {
    const bucketName = process.env.GCS_BUCKET_NAME;
    const fileName = 'knowledge-base.json';
    const url = `https://storage.googleapis.com/${bucketName}/${fileName}`;
    
    const response = await fetch(url);
    if (response.ok) {
      return await response.json();
    }
    return null;
  } catch (error) {
    console.error('Error fetching from Google Cloud Storage:', error);
    return null;
  }
}

async function fetchFromVercelKV() {
  try {
    // Vercel KV implementation
    const { kv } = await import('@vercel/kv');
    return await kv.get('knowledge-base');
  } catch (error) {
    console.error('Error fetching from Vercel KV:', error);
    return null;
  }
}

async function storeInCloudStorage(data, metadata) {
  try {
    // Add metadata to the data
    const enrichedData = {
      ...data,
      metadata: {
        ...data.metadata,
        ...metadata,
        storedAt: new Date().toISOString()
      }
    };
    
    // Store in multiple locations for redundancy
    const promises = [];
    
    // Google Cloud Storage
    if (process.env.GCS_BUCKET_NAME) {
      promises.push(storeInGoogleCloudStorage(enrichedData));
    }
    
    // Vercel KV
    if (process.env.KV_REST_API_URL) {
      promises.push(storeInVercelKV(enrichedData));
    }
    
    const results = await Promise.allSettled(promises);
    
    // Return true if at least one storage succeeded
    return results.some(result => result.status === 'fulfilled' && result.value === true);
    
  } catch (error) {
    console.error('Error storing in cloud storage:', error);
    return false;
  }
}

async function storeInGoogleCloudStorage(data) {
  // This would require Google Cloud Storage client setup
  // For now, return true as placeholder
  console.log('Would store in Google Cloud Storage');
  return true;
}

async function storeInVercelKV(data) {
  try {
    const { kv } = await import('@vercel/kv');
    await kv.set('knowledge-base', data);
    return true;
  } catch (error) {
    console.error('Error storing in Vercel KV:', error);
    return false;
  }
}

function isValidApiKey(authHeader) {
  const token = authHeader.replace('Bearer ', '');
  return token === process.env.API_SECRET_KEY;
}

function isValidKnowledgeBase(data) {
  return data && 
         typeof data === 'object' && 
         Array.isArray(data.communications) &&
         typeof data.projects === 'object' &&
         typeof data.people === 'object';
}

function applyFilters(knowledgeBase, filter) {
  // Simple filter implementation
  const filters = filter.split(',');
  let filtered = { ...knowledgeBase };
  
  filters.forEach(f => {
    const [key, value] = f.split(':');
    if (key === 'source' && filtered.communications) {
      filtered.communications = filtered.communications.filter(comm => 
        comm.source === value
      );
    }
  });
  
  return filtered;
}

function applyPagination(data, limit, offset) {
  if (data.communications) {
    data.communications = data.communications.slice(offset, offset + limit);
  }
  return data;
}

function searchCommunications(communications, query) {
  const searchTerm = query.toLowerCase();
  return communications.filter(comm => 
    (comm.content && comm.content.toLowerCase().includes(searchTerm)) ||
    (comm.from && comm.from.toLowerCase().includes(searchTerm)) ||
    (comm.subject && comm.subject.toLowerCase().includes(searchTerm))
  );
}

function applyAdvancedFilters(communications, filters) {
  let filtered = communications;
  
  if (filters.source) {
    filtered = filtered.filter(comm => comm.source === filters.source);
  }
  
  if (filters.dateRange) {
    const { start, end } = filters.dateRange;
    filtered = filtered.filter(comm => {
      const commDate = new Date(comm.date);
      return commDate >= new Date(start) && commDate <= new Date(end);
    });
  }
  
  if (filters.projects) {
    filtered = filtered.filter(comm => 
      comm.projects_mentioned && 
      comm.projects_mentioned.some(project => filters.projects.includes(project))
    );
  }
  
  return filtered;
}

function applySorting(communications, sort) {
  const { field, direction = 'desc' } = sort;
  
  return communications.sort((a, b) => {
    let aValue = a[field];
    let bValue = b[field];
    
    if (field === 'date') {
      aValue = new Date(aValue);
      bValue = new Date(bValue);
    }
    
    if (direction === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });
}

async function notifyClients(event, data) {
  // Placeholder for real-time updates (WebSockets, Server-Sent Events, etc.)
  console.log(`Would notify clients of ${event}:`, data);
}
