import express from 'express';
import { db } from '../db';
import { projects } from '../db/schema';
import { eq } from 'drizzle-orm';

const router = express.Router();

/**
 * @openapi
 * components:
 *   schemas:
 *     Project:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         name:
 *           type: string
 *         description:
 *           type: string
 */

/**
 * @openapi
 * /api/project:
 *   get:
 *     tags:
 *       - Project
 *     summary: Get all projects
 *     responses:
 *       200:
 *         description: List of all projects
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Project'
 *   post:
 *     tags:
 *       - Project
 *     summary: Create a new project
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Project created successfully
 *
 * /api/project/{id}:
 *   get:
 *     tags:
 *       - Project
 *     summary: Get a project by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Project details
 *
 *   put:
 *     tags:
 *       - Project
 *     summary: Update a project
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Project'
 *     responses:
 *       200:
 *         description: Project updated successfully
 *
 *   delete:
 *     tags:
 *       - Project
 *     summary: Delete a project
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Project deleted successfully
 */

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
