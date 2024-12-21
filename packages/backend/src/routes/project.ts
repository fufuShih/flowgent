import express from 'express';
import { db } from '../db';
import { projects } from '../db/schema';
import { eq } from 'drizzle-orm';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const allProjects = await db.select().from(projects);
    res.json({ status: 'success', data: allProjects });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const project = await db
      .select()
      .from(projects)
      .where(eq(projects.id, parseInt(id)));
    res.json({ status: 'success', data: project });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, description } = req.body;
    const newProject = await db.insert(projects).values({ name, description }).returning();
    res.json({ status: 'success', data: newProject });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    const updatedProject = await db
      .update(projects)
      .set({ name, description })
      .where(eq(projects.id, parseInt(id)))
      .returning();
    res.json({ status: 'success', data: updatedProject });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.delete(projects).where(eq(projects.id, parseInt(id)));
    res.json({ status: 'success' });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export const projectRoutes = router;
