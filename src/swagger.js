// swagger.js
const swaggerJSDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

// Basic swagger definition
const swaggerDefinition = {
  openapi: '3.0.0', // Use OpenAPI 3.0
  info: {
    title: 'Education API Documentation',
    version: '1.0.0',
    description: 'API documentation for the Education App',
    contact: {
      name: 'MMR Solutions',
      url: 'http://mmrsolutions.co.in',
      email: 'contact@mmrsolutions.co.in',
    },
  },
  servers: [
    {
      url: 'http://localhost:5000', // Local server
    },
    {
      url: '', // Live server
    },
  ],
  components: { // Use components for security schemes in OpenAPI 3.0
    securitySchemes: {
      bearerAuth: {
        type: 'http', // Type should be http for bearer token
        scheme: 'bearer', // The scheme
        bearerFormat: 'JWT', // Optional, if using JWT
      },
    },
  },
};

// Define options for swagger-jsdoc
const options = {
  swaggerDefinition,
  apis: ['./route/*.js'], // Path to the API docs (point to your route files)
};

// Generate swagger spec
const swaggerSpec = swaggerJSDoc(options);

// Export the middleware for use in your application
module.exports = (app) => {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
};
