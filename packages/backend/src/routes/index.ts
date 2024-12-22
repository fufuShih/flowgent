import { Router } from 'express';
import projectRoutes from './project.routes';
import matrixRoutes from './matrix.routes';
import nodeRoutes from './node.routes';
import connectionRoutes from './connection.routes';
import connectionConditionRoutes from './connection-condition.routes';
import triggerRoutes from './trigger.routes';
const router = Router();

// Mount all routes
router.use('/projects', projectRoutes);
router.use('/matrix', matrixRoutes);
router.use('/nodes', nodeRoutes);
router.use('/connections', connectionRoutes);
router.use('/connection-conditions', connectionConditionRoutes);
router.use('/triggers', triggerRoutes);

export default router;
