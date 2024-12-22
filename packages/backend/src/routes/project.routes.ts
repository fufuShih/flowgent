import { Router } from 'express';
import { and, desc, eq, ilike, sql } from 'drizzle-orm';
import { db } from '../db';
import { projects } from '../db/schema';
import { z } from 'zod';

const router = Router();

// Validation schemas
const createProjectSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
});

const updateProjectSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
});

const queryParamsSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  search: z.string().optional(),
});

// GET /projects
router.get('/', async (req, res) => {
  try {
    const { page, limit, search } = queryParamsSchema.parse(req.query);
    const offset = (page - 1) * limit;

    // Build query conditions
    const conditions = [];
    if (search) {
      conditions.push(ilike(projects.name, `%${search}%`));
    }

    // Get total count for pagination
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(projects)
      .where(and(...conditions));

    // Get paginated results
    const results = await db
      .select()
      .from(projects)
      .where(and(...conditions))
      .limit(limit)
      .offset(offset)
      .orderBy(desc(projects.created));

    res.json({
      data: results,
      pagination: {
        total: Number(count),
        page,
        limit,
        totalPages: Math.ceil(Number(count) / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(400).json({ error: 'Invalid request parameters' });
  }
});

// GET /projects/:projectId
router.get('/:projectId', async (req, res) => {
  try {
    const projectId = parseInt(req.params.projectId);
    if (isNaN(projectId)) {
      return res.status(400).json({ error: 'Invalid project ID' });
    }

    const project = await db.select().from(projects).where(eq(projects.id, projectId)).limit(1);

    if (!project.length) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json(project[0]);
  } catch (error) {
    console.error('Error fetching project:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /projects
router.post('/', async (req, res) => {
  try {
    const validatedData = createProjectSchema.parse(req.body);

    // Check for duplicate name
    const existing = await db
      .select()
      .from(projects)
      .where(eq(projects.name, validatedData.name))
      .limit(1);

    if (existing.length) {
      return res.status(409).json({ error: 'Project name already exists' });
    }

    const [newProject] = await db
      .insert(projects)
      .values({
        name: validatedData.name,
        description: validatedData.description,
      })
      .returning();

    res.status(201).json(newProject);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Error creating project:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /projects/:projectId
router.patch('/:projectId', async (req, res) => {
  try {
    const projectId = parseInt(req.params.projectId);
    if (isNaN(projectId)) {
      return res.status(400).json({ error: 'Invalid project ID' });
    }

    const validatedData = updateProjectSchema.parse(req.body);

    // Check if project exists
    const existingProject = await db
      .select()
      .from(projects)
      .where(eq(projects.id, projectId))
      .limit(1);

    if (!existingProject.length) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Check for name uniqueness if name is being updated
    if (validatedData.name) {
      const duplicateName = await db
        .select()
        .from(projects)
        .where(and(eq(projects.name, validatedData.name), sql`id != ${projectId}`))
        .limit(1);

      if (duplicateName.length) {
        return res.status(409).json({ error: 'Project name already exists' });
      }
    }

    const [updatedProject] = await db
      .update(projects)
      .set({
        ...validatedData,
        updated: new Date(),
      })
      .where(eq(projects.id, projectId))
      .returning();

    res.json(updatedProject);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Error updating project:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /projects/:projectId
router.delete('/:projectId', async (req, res) => {
  try {
    const projectId = parseInt(req.params.projectId);
    if (isNaN(projectId)) {
      return res.status(400).json({ error: 'Invalid project ID' });
    }

    // Check if project exists
    const existingProject = await db
      .select()
      .from(projects)
      .where(eq(projects.id, projectId))
      .limit(1);

    if (!existingProject.length) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Delete project (cascade deletion will handle associated records)
    await db.delete(projects).where(eq(projects.id, projectId));

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting project:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
