const xss = require('xss');
const ApiErrors = require('./ApiResponse/ApiError');
// 422
function containsDangerousPatterns(input) {
    // Check for dangerous patterns
    const dangerousPatterns = [
        // /<script.*?>.*?<\/script>/gi, // Inline <script> tags
        /eval/gi,
        /javascript:/gi,             // JavaScript scheme
        /data:/gi,                   // Data URI scheme
        /vbscript:/gi,               // VBScript scheme
        /expression\(/gi,            // CSS expression
        /on\w+\s*=/gi,               // Event handlers (e.g., onerror=, onclick=)
        // /<iframe.*?>.*?<\/iframe>/gi, // Iframes
        // /<svg.*?>.*?<\/svg>/gi,      // SVG with scripts
        /&#x3C;.*?&#x3E;/gi,
        /file:/gi,
        /about:/gi,
        /chrome:/gi,
        /data:text\/html,/gi
    ];

    return dangerousPatterns.some(pattern => pattern.test(input));
}

function sanitizeInput(input) 
{
        // console.log({input});
    try 
    {
        if (Array.isArray(input)) {
            return input.map(item => sanitizeInput(item));
        } else if (typeof input === 'number' || typeof input === 'boolean') {
            return input; // Return as-is
        } else if (typeof input === 'object' && input !== null) {
            for (const key in input) {
                if (Object.hasOwnProperty.call(input, key)) {
                    input[key] = sanitizeInput(input[key]); 
                }
            }
        } else if (typeof input === 'string') {

            if (containsDangerousPatterns(input)) {
                throw new Error(`Input contains disallowed patterns.`);
            }
            else 
            {
                const sanitized = xss(input);
                const stripped = sanitized.replace(/<[^>]*>/g, ''); // Remove all HTML tags 
                if (stripped !== input) {
                    throw new Error(`Input contains disallowed HTML tags.`);
                }
                else{
                    return stripped; 
                }
            }
        }
        return input; // Return as-is for other types
    } 
    catch (error) 
    {
        console.log("Error sanitizing input:", error.message);
        throw new Error(`Sanitization Error: ${error.message}`);
    }
}

module.exports = sanitizeInput; 