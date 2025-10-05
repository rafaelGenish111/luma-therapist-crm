const NodeCache = require('node-cache');

/**
 * Caching Middleware
 * מערכת cache מתקדמת לשיפור ביצועים
 */

// Create cache instance
const cache = new NodeCache({ 
  stdTTL: parseInt(process.env.CACHE_TTL) || 600, // 10 minutes default
  checkperiod: 120, // Check for expired keys every 2 minutes
  useClones: false, // Don't clone objects for better performance
  deleteOnExpire: true, // Automatically delete expired keys
  maxKeys: parseInt(process.env.CACHE_MAX_KEYS) || 1000 // Maximum number of keys
});

/**
 * Cache middleware factory
 * יצירת middleware cache עם זמן חיים מותאם
 */
const cacheMiddleware = (duration = 300) => {
  return (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Generate cache key
    const key = generateCacheKey(req);
    
    // Check if data exists in cache
    const cachedResponse = cache.get(key);
    
    if (cachedResponse) {
      console.log(`Cache hit for key: ${key}`);
      
      // Add cache headers
      res.setHeader('X-Cache', 'HIT');
      res.setHeader('X-Cache-Key', key);
      
      return res.json(cachedResponse);
    }
    
    console.log(`Cache miss for key: ${key}`);
    
    // Override res.json to cache the response
    const originalJson = res.json;
    res.json = (data) => {
      // Cache the response
      cache.set(key, data, duration);
      
      // Add cache headers
      res.setHeader('X-Cache', 'MISS');
      res.setHeader('X-Cache-Key', key);
      res.setHeader('X-Cache-TTL', duration);
      
      // Send the response
      originalJson.call(res, data);
    };
    
    next();
  };
};

/**
 * Generate cache key from request
 * יצירת מפתח cache מבקשה
 */
const generateCacheKey = (req) => {
  const baseKey = `${req.method}:${req.originalUrl}`;
  
  // Include query parameters in key
  const queryString = Object.keys(req.query)
    .sort()
    .map(key => `${key}=${req.query[key]}`)
    .join('&');
  
  // Include user ID if authenticated
  const userId = req.user?.id || 'anonymous';
  
  // Include language if specified
  const language = req.headers['accept-language'] || 'en';
  
  return `${baseKey}:${queryString}:${userId}:${language}`;
};

/**
 * Cache invalidation patterns
 * דפוסי ביטול cache
 */
const invalidateCache = (pattern) => {
  const keys = cache.keys();
  const regex = new RegExp(pattern);
  
  const keysToDelete = keys.filter(key => regex.test(key));
  
  if (keysToDelete.length > 0) {
    cache.del(keysToDelete);
    console.log(`Invalidated ${keysToDelete.length} cache keys matching pattern: ${pattern}`);
  }
};

/**
 * Cache statistics
 * סטטיסטיקות cache
 */
const getCacheStats = () => {
  const stats = cache.getStats();
  return {
    keys: stats.keys,
    hits: stats.hits,
    misses: stats.misses,
    hitRate: stats.hits / (stats.hits + stats.misses) * 100,
    uptime: stats.uptime
  };
};

/**
 * Clear all cache
 * ניקוי כל ה-cache
 */
const clearCache = () => {
  cache.flushAll();
  console.log('Cache cleared');
};

/**
 * Cache specific data with custom key
 * שמירת נתונים ספציפיים עם מפתח מותאם
 */
const setCache = (key, data, ttl = 600) => {
  cache.set(key, data, ttl);
};

/**
 * Get specific data from cache
 * קבלת נתונים ספציפיים מה-cache
 */
const getCache = (key) => {
  return cache.get(key);
};

/**
 * Delete specific cache key
 * מחיקת מפתח cache ספציפי
 */
const deleteCache = (key) => {
  cache.del(key);
};

/**
 * Cache middleware for specific routes
 * Cache middleware לנתיבים ספציפיים
 */
const routeCacheMiddleware = (routes) => {
  return (req, res, next) => {
    const route = routes.find(r => {
      if (typeof r.path === 'string') {
        return req.path === r.path;
      } else if (r.path instanceof RegExp) {
        return r.path.test(req.path);
      }
      return false;
    });
    
    if (route) {
      return cacheMiddleware(route.ttl)(req, res, next);
    }
    
    next();
  };
};

/**
 * Cache warming function
 * חימום cache עם נתונים נפוצים
 */
const warmCache = async () => {
  console.log('Starting cache warming...');
  
  try {
    // Warm common endpoints
    const commonEndpoints = [
      '/api/appointments/stats',
      '/api/therapists/public',
      '/api/services'
    ];
    
    // This would typically make requests to populate cache
    // Implementation depends on your specific needs
    
    console.log('Cache warming completed');
  } catch (error) {
    console.error('Cache warming failed:', error);
  }
};

/**
 * Cache health check
 * בדיקת תקינות cache
 */
const cacheHealthCheck = () => {
  try {
    const testKey = 'health-check';
    const testData = { timestamp: Date.now() };
    
    cache.set(testKey, testData, 10);
    const retrieved = cache.get(testKey);
    
    if (retrieved && retrieved.timestamp === testData.timestamp) {
      cache.del(testKey);
      return { status: 'healthy', stats: getCacheStats() };
    } else {
      return { status: 'unhealthy', error: 'Cache read/write test failed' };
    }
  } catch (error) {
    return { status: 'unhealthy', error: error.message };
  }
};

/**
 * Cache middleware with conditional caching
 * Cache middleware עם caching מותנה
 */
const conditionalCacheMiddleware = (condition, duration = 300) => {
  return (req, res, next) => {
    // Check if caching should be applied
    if (!condition(req)) {
      return next();
    }
    
    return cacheMiddleware(duration)(req, res, next);
  };
};

/**
 * Cache middleware for authenticated users only
 * Cache middleware למשתמשים מאומתים בלבד
 */
const authenticatedCacheMiddleware = (duration = 300) => {
  return conditionalCacheMiddleware(
    (req) => req.user && req.user.id,
    duration
  );
};

/**
 * Cache middleware for public endpoints only
 * Cache middleware לנתיבים ציבוריים בלבד
 */
const publicCacheMiddleware = (duration = 300) => {
  return conditionalCacheMiddleware(
    (req) => !req.user,
    duration
  );
};

// Export cache instance for direct use
module.exports = {
  cache,
  cacheMiddleware,
  generateCacheKey,
  invalidateCache,
  getCacheStats,
  clearCache,
  setCache,
  getCache,
  deleteCache,
  routeCacheMiddleware,
  warmCache,
  cacheHealthCheck,
  conditionalCacheMiddleware,
  authenticatedCacheMiddleware,
  publicCacheMiddleware
};
