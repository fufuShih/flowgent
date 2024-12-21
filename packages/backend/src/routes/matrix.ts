import express from 'express';
import { db } from '../db';
import { connections, matrix, nodes } from '../db/schema';
import { eq } from 'drizzle-orm';

const router = express.Router();

/**
 * @openapi
 * components:
 *   schemas:
 *     Matrix:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         name:
 *           type: string
 *         description:
 *           type: string
 *         projectId:
 *           type: integer
 *         isSubMatrix:
 *           type: boolean
 *         config:
 *           type: object
 *         status:
 *           type: string
 *           enum: [active, inactive]
 */

/**
 * @openapi
 * /api/matrix:
 *   get:
 *     tags:
 *       - Matrix
 *     summary: Get all matrices
 *     responses:
 *       200:
 *         description: List of all matrices
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
 *                     $ref: '#/components/schemas/Matrix'
 *   post:
 *     tags:
 *       - Matrix
 *     summary: Create a new matrix
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - projectId
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               projectId:
 *                 type: integer
 *               isSubMatrix:
 *                 type: boolean
 *               config:
 *                 type: object
 *     responses:
 *       200:
 *         description: Matrix created successfully
 *
 * /api/matrix/{id}:
 *   get:
 *     tags:
 *       - Matrix
 *     summary: Get a matrix by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Matrix details
 *       404:
 *         description: Matrix not found
 *
 *   put:
 *     tags:
 *       - Matrix
 *     summary: Update a matrix
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
 *             $ref: '#/components/schemas/Matrix'
 *     responses:
 *       200:
 *         description: Matrix updated successfully
 *
 *   delete:
 *     tags:
 *       - Matrix
 *     summary: Delete a matrix
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Matrix deleted successfully
 *
 * /api/matrix/{id}/nodes:
 *   get:
 *     tags:
 *       - Matrix
 *     summary: Get all nodes for a matrix
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of nodes for the matrix
 *
 * /api/matrix/{id}/connections:
 *   get:
 *     tags:
 *       - Matrix
 *     summary: Get all connections for a matrix
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of connections for the matrix
 */

router.get('/', async (req, res) => {
  try {
    const allMatrices = await db.select().from(matrix);
    res.json({ status: 'success', data: allMatrices });
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
    const searchedMatrix = await db
      .select()
      .from(matrix)
      .where(eq(matrix.id, parseInt(id)));

    if (!searchedMatrix) {
      res.status(404).json({ status: 'error', error: 'Matrix not found' });
    }

    res.json({ status: 'success', data: searchedMatrix });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, description, projectId, isSubMatrix, config } = req.body;

    const newMatrix = await db
      .insert(matrix)
      .values({ name, description, projectId, isSubMatrix, config })
      .returning();

    return res.json({ status: 'success', data: newMatrix });
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
    const { name, description, projectId, isSubMatrix, config } = req.body;
    const updatedMatrix = await db
      .update(matrix)
      .set({ name, description, projectId, isSubMatrix, config })
      .where(eq(matrix.id, parseInt(id)))
      .returning();
    res.json({ status: 'success', data: updatedMatrix });
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
    await db.delete(matrix).where(eq(matrix.id, parseInt(id)));
    res.json({ status: 'success' });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

router.get('/:id/nodes', async (req, res) => {
  try {
    const { id } = req.params;

    const matrixExists = await db
      .select()
      .from(matrix)
      .where(eq(matrix.id, parseInt(id)))
      .limit(1);
    if (!matrixExists) {
      res.status(404).json({ status: 'error', error: 'Matrix not found' });
    }

    const selectedNodes = await db
      .select()
      .from(nodes)
      .where(eq(nodes.matrixId, parseInt(id)));
    res.json({ status: 'success', data: selectedNodes });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

router.get('/:id/connections', async (req, res) => {
  try {
    const { id } = req.params;
    const matrixExists = await db
      .select()
      .from(matrix)
      .where(eq(matrix.id, parseInt(id)))
      .limit(1);

    if (!matrixExists) {
      res.status(404).json({ status: 'error', error: 'Matrix not found' });
    }

    const selectedConnections = await db
      .select()
      .from(connections)
      .where(eq(connections.matrixId, parseInt(id)));
    res.json({ status: 'success', data: selectedConnections });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export const matrixRoutes = router;
