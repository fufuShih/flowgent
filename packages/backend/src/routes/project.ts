import { Router } from 'express';
import { db } from '../db';
import { projects } from '../db/schema';
import { z } from 'zod';

const router = Router();

const createProjectSchema = z.object({
  name: z.string(),
});

router.post('/', async (req, res) => {
  try {
    const { name } = createProjectSchema.parse(req.body);
    const result = await db.insert(projects).values({ name }).returning();
    res.json({ success: true, data: result[0] });
  } catch (error) {
    res.status(400).json({ success: false, error: String(error) });
  }
});

router.get('/', async (req, res) => {
  try {
    const result = await db.select().from(projects);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

export const projectRoutes = router; 