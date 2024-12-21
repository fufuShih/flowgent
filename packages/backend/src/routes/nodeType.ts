import express from 'express';
import { nodeTypeEnum } from '../db/schema';

const router = express.Router();

/**
 * @openapi
 * /api/node-type:
 *   get:
 *     tags:
 *       - Node Type
 *     summary: Get all available node types
 *     description: Returns a list of all possible node types in the system
 *     responses:
 *       200:
 *         description: List of node types
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: string
 *       500:
 *         description: Internal server error
 */

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
