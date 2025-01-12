import { Router } from 'express';
import projectRoutes from './project.routes';
import matrixRoutes from './matrix.routes';
const router = Router();

// Mount all routes
router.use('/projects', projectRoutes);
router.use('/matrix', matrixRoutes);

export default router;
