import dotenv from 'dotenv';
import path from 'path';
import express from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import { executeRoutes } from './routes/execute';
import { triggerRoutes, initializeTriggers } from './routes/trigger';
import { testConnection, initDatabase } from './db';
import { projectRoutes } from './routes/project';
import { nodeTypeRoutes } from './routes/nodeType';
import { matrixRoutes } from './routes/matrix';
// Import the generated swagger.json
import swaggerDocument from './swagger/swagger.json';

// Load environment variables
const envPath =
  process.env.NODE_ENV === 'production'
    ? path.resolve(process.cwd(), '.env.production')
    : path.resolve(process.cwd(), '.env');

dotenv.config({ path: envPath });

const app = express();
const port = process.env.PORT || 3004;

// Middleware
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(express.json());

// Swagger UI setup
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.get('/api-docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerDocument);
});

// Logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  res.status(500).json({
    success: false,
    error: 'Internal Server Error',
    message: err.message,
    path: req.path,
  });
});

// Routes
app.use('/api/project', projectRoutes);
app.use('/api/matrix', matrixRoutes);
app.use('/api/node-type', nodeTypeRoutes);
app.use('/api/execute', executeRoutes);
app.use('/api/trigger', triggerRoutes);

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    const dbConnected = await testConnection();
    res.json({
      success: true,
      status: 'ok',
      database: dbConnected ? 'connected' : 'disconnected',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(500).json({
      success: false,
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Server startup
const startServer = async () => {
  try {
    // Test database connection
    const dbConnected = await testConnection();
    if (!dbConnected) {
      throw new Error('Database connection failed');
    }

    // Initialize database tables
    const dbInitialized = await initDatabase();
    if (!dbInitialized) {
      throw new Error('Database initialization failed');
    }

    // Initialize triggers
    await initializeTriggers();

    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
      console.log(`API Documentation: http://localhost:${port}/api-docs`);
      console.log(`API URL: http://localhost:${port}/api`);
      console.log('Database connected and initialized successfully');
      console.log('Triggers initialized successfully');
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
