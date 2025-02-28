const sanitizeInput = require('../utils/sanatizeInput');

const sanitizeMiddleware = (req, res, next) => {
    // Use multer to handle file uploads
        // Sanitize the body, params, and query
        if (req.body) {
            req.body = sanitizeInput(req.body);
        }
        if (req.params) {
            req.params = sanitizeInput(req.params);
        }
        if (req.query) {
            req.query = sanitizeInput(req.query);
        }
        next();

};

module.exports = sanitizeMiddleware;
