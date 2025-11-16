import { Router, Response } from 'express';
import prisma from '../utils/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authenticate);

// Create edge
router.post('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { projectId, fromId, toId } = req.body;

    // Verify project belongs to user
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId: req.userId!,
      },
    });

    if (!project) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }

    // Verify nodes exist and belong to project
    const nodes = await prisma.node.findMany({
      where: {
        id: { in: [fromId, toId] },
        projectId,
      },
    });

    if (nodes.length !== 2) {
      res.status(400).json({ error: 'Invalid nodes' });
      return;
    }

    const edge = await prisma.edge.create({
      data: {
        projectId,
        fromId,
        toId,
      },
    });

    res.status(201).json(edge);
  } catch (error) {
    console.error('Create edge error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete edge
router.delete('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Verify edge belongs to user's project
    const edge = await prisma.edge.findUnique({
      where: { id: req.params.id },
      include: { project: true },
    });

    if (!edge || edge.project.userId !== req.userId) {
      res.status(404).json({ error: 'Edge not found' });
      return;
    }

    await prisma.edge.delete({
      where: { id: req.params.id },
    });

    res.json({ message: 'Edge deleted' });
  } catch (error) {
    console.error('Delete edge error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
