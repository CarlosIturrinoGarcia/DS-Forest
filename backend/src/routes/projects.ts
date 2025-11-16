import { Router, Response } from 'express';
import prisma from '../utils/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get all projects for user
router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const projects = await prisma.project.findMany({
      where: { userId: req.userId! },
      include: {
        nodes: true,
        edges: true,
      },
      orderBy: { updatedAt: 'desc' },
    });

    res.json(projects);
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get single project
router.get('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const project = await prisma.project.findFirst({
      where: {
        id: req.params.id,
        userId: req.userId!,
      },
      include: {
        nodes: true,
        edges: true,
      },
    });

    if (!project) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }

    res.json(project);
  } catch (error) {
    console.error('Get project error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create project
router.post('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, description } = req.body;

    const project = await prisma.project.create({
      data: {
        name,
        description,
        userId: req.userId!,
      },
      include: {
        nodes: true,
        edges: true,
      },
    });

    res.status(201).json(project);
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update project
router.put('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, description } = req.body;

    const project = await prisma.project.updateMany({
      where: {
        id: req.params.id,
        userId: req.userId!,
      },
      data: {
        name,
        description,
      },
    });

    if (project.count === 0) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }

    const updated = await prisma.project.findUnique({
      where: { id: req.params.id },
      include: {
        nodes: true,
        edges: true,
      },
    });

    res.json(updated);
  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete project
router.delete('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const deleted = await prisma.project.deleteMany({
      where: {
        id: req.params.id,
        userId: req.userId!,
      },
    });

    if (deleted.count === 0) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }

    res.json({ message: 'Project deleted' });
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
