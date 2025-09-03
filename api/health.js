// Health check endpoint for monitoring and uptime
export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const startTime = Date.now();
    
    // Basic health checks
    const checks = {
      api: true,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: process.env.npm_package_version || '1.0.0'
    };

    // Check knowledge base availability
    try {
      // This would check if we can access the knowledge base storage
      checks.knowledgeBase = await checkKnowledgeBaseHealth();
    } catch (error) {
      checks.knowledgeBase = false;
      checks.knowledgeBaseError = error.message;
    }

    // Check external dependencies
    try {
      checks.storage = await checkStorageHealth();
    } catch (error) {
      checks.storage = false;
      checks.storageError = error.message;
    }

    const responseTime = Date.now() - startTime;
    checks.responseTime = responseTime;

    // Determine overall health
    const isHealthy = checks.api && checks.knowledgeBase !== false && checks.storage !== false;
    
    const response = {
      status: isHealthy ? 'healthy' : 'degraded',
      checks: checks,
      environment: process.env.NODE_ENV || 'development',
      region: process.env.VERCEL_REGION || 'unknown'
    };

    // Return appropriate status code
    const statusCode = isHealthy ? 200 : 503;
    
    return res.status(statusCode).json(response);

  } catch (error) {
    console.error('Health check failed:', error);
    
    return res.status(500).json({
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}

// Helper function to check knowledge base health
async function checkKnowledgeBaseHealth() {
  try {
    // Check if we can access storage
    if (process.env.KV_REST_API_URL) {
      // Vercel KV health check
      const { kv } = await import('@vercel/kv');
      await kv.ping();
      return true;
    }

    if (process.env.GCS_BUCKET_NAME) {
      // Google Cloud Storage health check
      const response = await fetch(`https://storage.googleapis.com/${process.env.GCS_BUCKET_NAME}/health-check.json`, {
        method: 'HEAD'
      });
      return response.status < 500; // Accept 404 as "healthy" since file might not exist
    }

    // If no storage configured, assume healthy
    return true;

  } catch (error) {
    console.error('Knowledge base health check failed:', error);
    return false;
  }
}

// Helper function to check storage health
async function checkStorageHealth() {
  try {
    // Basic connectivity test
    const testUrl = 'https://httpbin.org/get';
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

    const response = await fetch(testUrl, {
      signal: controller.signal,
      method: 'GET'
    });

    clearTimeout(timeoutId);
    return response.ok;

  } catch (error) {
    if (error.name === 'AbortError') {
      console.error('Storage health check timed out');
    } else {
      console.error('Storage health check failed:', error);
    }
    return false;
  }
}
