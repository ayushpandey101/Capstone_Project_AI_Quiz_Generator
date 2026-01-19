// Request deduplication and caching utility
// Prevents duplicate API calls and implements request caching

const pendingRequests = new Map();
const requestCache = new Map();

/**
 * Deduplicates API requests - if the same request is already pending, 
 * returns the existing promise instead of making a new request
 */
export const deduplicateRequest = (key, requestFn, cacheDuration = 0) => {
  // Check if there's a cached response
  if (cacheDuration > 0 && requestCache.has(key)) {
    const cached = requestCache.get(key);
    if (Date.now() - cached.timestamp < cacheDuration) {
      return Promise.resolve(cached.data);
    }
    requestCache.delete(key);
  }

  // Check if request is already pending
  if (pendingRequests.has(key)) {
    return pendingRequests.get(key);
  }

  // Make new request
  const promise = requestFn()
    .then(data => {
      // Cache the response if cacheDuration is set
      if (cacheDuration > 0) {
        requestCache.set(key, {
          data,
          timestamp: Date.now()
        });
      }
      pendingRequests.delete(key);
      return data;
    })
    .catch(error => {
      pendingRequests.delete(key);
      throw error;
    });

  pendingRequests.set(key, promise);
  return promise;
};

/**
 * Clear cached request data
 */
export const clearCache = (key) => {
  if (key) {
    requestCache.delete(key);
  } else {
    requestCache.clear();
  }
};

/**
 * Debounce function to limit API call frequency
 */
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};
