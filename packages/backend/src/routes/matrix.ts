import { Router } from 'express';
import { db } from '../db';
import { matrices } from '../db/schema';
import { z } from 'zod';
import { eq } from 'drizzle-orm';

const router = Router();

const createMatrixSchema = z.object({
  projectId: z.number(),
  name: z.string(),
  description: z.string(),
  nodes: z.array(z.any()),
  edges: z.array(z.any()),
});

router.post('/', async (req, res) => {
  try {
    const data = createMatrixSchema.parse(req.body);
    const result = await db.insert(matrices).values({
      ...data,
      nodes: JSON.stringify(data.nodes),
      edges: JSON.stringify(data.edges),
    }).returning();
    res.json({ success: true, data: result[0] });
  } catch (error) {
    res.status(400).json({ success: false, error: String(error) });
  }
});

router.get('/:projectId', async (req, res) => {
  try {
    const projectId = parseInt(req.params.projectId);
    const result = await db
      .select()
      .from(matrices)
      .where(eq(matrices.projectId, projectId));
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

export const matrixRoutes = router; 