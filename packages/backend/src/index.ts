import express from 'express';
import cors from 'cors';
import { projectRoutes } from './routes/project';
import { matrixRoutes } from './routes/matrix';
import { testConnection } from './db';

const app = express();
const port = process.env.PORT || 3004;

app.use(cors());
app.use(express.json());

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    error: 'Internal Server Error',
    message: err.message,
  });
});

// Health check endpoint
app.get('/api/health', async (req, res) => {
  const dbConnected = await testConnection();
  res.json({
    status: 'ok',
    database: dbConnected ? 'connected' : 'disconnected',
  });
});

// Routes
app.use('/api/projects', projectRoutes);
app.use('/api/matrices', matrixRoutes);

// Test database connection before starting the server
const startServer = async () => {
  try {
    await testConnection();
    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
