// cache.js
const NodeCache = require('node-cache');
const cache = new NodeCache({
    // stdTTL: 1800,            // Default TTL of 30 minutes
    checkperiod: 300,        // Check every 5 minutes for expired keys
    // useClones: false,     // Use references instead of cloning objects (faster for large data)
    deleteOnExpire: true,    // Automatically delete expired entries
    maxKeys: 1000            // Maximum 1000 cache entries
});

module.exports = cache;
