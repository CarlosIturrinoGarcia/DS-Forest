import { Router, Response } from 'express';
import prisma from '../utils/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authenticate);

// Get all models for a node
router.get('/node/:nodeId', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Verify node belongs to user's project
    const node = await prisma.node.findUnique({
      where: { id: req.params.nodeId },
      include: { project: true },
    });

    if (!node || node.project.userId !== req.userId) {
      res.status(404).json({ error: 'Node not found' });
      return;
    }

    const models = await prisma.model.findMany({
      where: { nodeId: req.params.nodeId },
      orderBy: { createdAt: 'desc' },
    });

    res.json(models);
  } catch (error) {
    console.error('Get models error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get single model
router.get('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const model = await prisma.model.findUnique({
      where: { id: req.params.id },
      include: {
        node: {
          include: { project: true },
        },
      },
    });

    if (!model || model.node.project.userId !== req.userId) {
      res.status(404).json({ error: 'Model not found' });
      return;
    }

    res.json(model);
  } catch (error) {
    console.error('Get model error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create model
router.post('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      nodeId,
      name,
      version,
      metrics,
      artifactLocation,
      deploymentStatus,
      isChampion,
      framework,
      description,
    } = req.body;

    // Verify node belongs to user's project
    const node = await prisma.node.findUnique({
      where: { id: nodeId },
      include: { project: true },
    });

    if (!node || node.project.userId !== req.userId) {
      res.status(404).json({ error: 'Node not found' });
      return;
    }

    // If this is set as champion, unset other champions for this node
    if (isChampion) {
      await prisma.model.updateMany({
        where: { nodeId },
        data: { isChampion: false },
      });
    }

    const model = await prisma.model.create({
      data: {
        nodeId,
        name,
        version,
        metrics: metrics ? JSON.stringify(metrics) : null,
        artifactLocation,
        deploymentStatus: deploymentStatus || 'development',
        isChampion: isChampion || false,
        framework,
        description,
      },
    });

    res.status(201).json(model);
  } catch (error) {
    console.error('Create model error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update model
router.put('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      name,
      version,
      metrics,
      artifactLocation,
      deploymentStatus,
      isChampion,
      framework,
      description,
    } = req.body;

    // Verify model belongs to user's project
    const model = await prisma.model.findUnique({
      where: { id: req.params.id },
      include: {
        node: {
          include: { project: true },
        },
      },
    });

    if (!model || model.node.project.userId !== req.userId) {
      res.status(404).json({ error: 'Model not found' });
      return;
    }

    // If this is set as champion, unset other champions for this node
    if (isChampion) {
      await prisma.model.updateMany({
        where: {
          nodeId: model.nodeId,
          id: { not: req.params.id },
        },
        data: { isChampion: false },
      });
    }

    const updated = await prisma.model.update({
      where: { id: req.params.id },
      data: {
        name,
        version,
        metrics: metrics ? JSON.stringify(metrics) : undefined,
        artifactLocation,
        deploymentStatus,
        isChampion,
        framework,
        description,
      },
    });

    res.json(updated);
  } catch (error) {
    console.error('Update model error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete model
router.delete('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Verify model belongs to user's project
    const model = await prisma.model.findUnique({
      where: { id: req.params.id },
      include: {
        node: {
          include: { project: true },
        },
      },
    });

    if (!model || model.node.project.userId !== req.userId) {
      res.status(404).json({ error: 'Model not found' });
      return;
    }

    await prisma.model.delete({
      where: { id: req.params.id },
    });

    res.json({ message: 'Model deleted' });
  } catch (error) {
    console.error('Delete model error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
