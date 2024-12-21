import express from 'express';
import { db } from '../db';
import { matrix, nodes, connections } from '../db/schema';
import { eq } from 'drizzle-orm';

const router = express.Router();

// Execute a matrix flow
router.post('/matrix/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { input } = req.body;

    // Verify matrix exists and is active
    const [targetMatrix] = await db
      .select()
      .from(matrix)
      .where(eq(matrix.id, parseInt(id)));

    if (!targetMatrix) {
      return res.status(404).json({
        success: false,
        error: 'Matrix not found',
      });
    }

    if (targetMatrix.status !== 'active') {
      return res.status(400).json({
        success: false,
        error: 'Matrix is not active',
      });
    }

    // TODO: Implement actual flow execution logic
    // This should:
    // 1. Get all nodes for this matrix
    // 2. Find the trigger node
    // 3. Execute nodes in order based on connections
    // 4. Handle success/error paths

    res.json({
      success: true,
      message: 'Matrix execution started',
      matrixId: id,
      input,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export const executeRoutes = router;
