import express from 'express';
import { nodeTypeEnum } from '../db/schema';

const router = express.Router();

router.get('/', (req, res) => {
  try {
    // Return the enum values as an array
    const nodeTypes = nodeTypeEnum.enumValues;
    res.json({ success: true, data: nodeTypes });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export const nodeTypeRoutes = router;
