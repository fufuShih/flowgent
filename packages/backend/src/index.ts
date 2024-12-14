import express from 'express';
import cors from 'cors';
import { projectRoutes } from './routes/project';
import { matrixRoutes } from './routes/matrix';

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/projects', projectRoutes);
app.use('/api/matrices', matrixRoutes);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
}); 