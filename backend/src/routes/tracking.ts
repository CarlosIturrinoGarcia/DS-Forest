import { Router, Response } from 'express';
import prisma from '../utils/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authenticate);

// ===== TIME TRACKING =====

// Get all time entries for a node
router.get('/time/node/:nodeId', async (req: AuthRequest, res: Response): Promise<void> => {
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

    const timeEntries = await prisma.timeEntry.findMany({
      where: { nodeId: req.params.nodeId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { startTime: 'desc' },
    });

    res.json(timeEntries);
  } catch (error) {
    console.error('Get time entries error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Start time tracking
router.post('/time/start', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { nodeId, description } = req.body;

    // Verify node belongs to user's project
    const node = await prisma.node.findUnique({
      where: { id: nodeId },
      include: { project: true },
    });

    if (!node || node.project.userId !== req.userId) {
      res.status(404).json({ error: 'Node not found' });
      return;
    }

    // Check if there's already an active timer for this user
    const activeTimer = await prisma.timeEntry.findFirst({
      where: {
        userId: req.userId!,
        endTime: null,
      },
    });

    if (activeTimer) {
      res.status(400).json({ error: 'You already have an active timer. Stop it first.' });
      return;
    }

    const timeEntry = await prisma.timeEntry.create({
      data: {
        nodeId,
        userId: req.userId!,
        startTime: new Date(),
        description,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    res.status(201).json(timeEntry);
  } catch (error) {
    console.error('Start time tracking error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Stop time tracking
router.post('/time/stop/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Verify time entry belongs to user
    const timeEntry = await prisma.timeEntry.findUnique({
      where: { id: req.params.id },
      include: {
        node: {
          include: { project: true },
        },
      },
    });

    if (!timeEntry || timeEntry.userId !== req.userId) {
      res.status(404).json({ error: 'Time entry not found' });
      return;
    }

    if (timeEntry.endTime) {
      res.status(400).json({ error: 'Timer already stopped' });
      return;
    }

    const endTime = new Date();
    const duration = Math.floor((endTime.getTime() - timeEntry.startTime.getTime()) / 60000); // minutes

    const updated = await prisma.timeEntry.update({
      where: { id: req.params.id },
      data: {
        endTime,
        duration,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    res.json(updated);
  } catch (error) {
    console.error('Stop time tracking error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get active timer for current user
router.get('/time/active', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const activeTimer = await prisma.timeEntry.findFirst({
      where: {
        userId: req.userId!,
        endTime: null,
      },
      include: {
        node: {
          select: {
            id: true,
            label: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    res.json(activeTimer);
  } catch (error) {
    console.error('Get active timer error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete time entry
router.delete('/time/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Verify time entry belongs to user
    const timeEntry = await prisma.timeEntry.findUnique({
      where: { id: req.params.id },
      include: {
        node: {
          include: { project: true },
        },
      },
    });

    if (!timeEntry) {
      res.status(404).json({ error: 'Time entry not found' });
      return;
    }

    // User must be time entry owner or project owner to delete
    if (timeEntry.userId !== req.userId && timeEntry.node.project.userId !== req.userId) {
      res.status(403).json({ error: 'Not authorized' });
      return;
    }

    await prisma.timeEntry.delete({
      where: { id: req.params.id },
    });

    res.json({ message: 'Time entry deleted' });
  } catch (error) {
    console.error('Delete time entry error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ===== COST TRACKING =====

// Get all cost entries for a project
router.get('/cost/project/:projectId', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Verify project belongs to user
    const project = await prisma.project.findFirst({
      where: {
        id: req.params.projectId,
        userId: req.userId!,
      },
    });

    if (!project) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }

    const costEntries = await prisma.costEntry.findMany({
      where: {
        OR: [
          { projectId: req.params.projectId },
          {
            node: {
              projectId: req.params.projectId,
            },
          },
        ],
      },
      include: {
        node: {
          select: {
            id: true,
            label: true,
          },
        },
      },
      orderBy: { date: 'desc' },
    });

    res.json(costEntries);
  } catch (error) {
    console.error('Get cost entries error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all cost entries for a node
router.get('/cost/node/:nodeId', async (req: AuthRequest, res: Response): Promise<void> => {
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

    const costEntries = await prisma.costEntry.findMany({
      where: { nodeId: req.params.nodeId },
      orderBy: { date: 'desc' },
    });

    res.json(costEntries);
  } catch (error) {
    console.error('Get cost entries error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create cost entry
router.post('/cost', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { amount, currency, type, description, nodeId, projectId } = req.body;

    // Must provide either nodeId or projectId
    if (!nodeId && !projectId) {
      res.status(400).json({ error: 'Must provide either nodeId or projectId' });
      return;
    }

    // Verify ownership
    if (nodeId) {
      const node = await prisma.node.findUnique({
        where: { id: nodeId },
        include: { project: true },
      });

      if (!node || node.project.userId !== req.userId) {
        res.status(404).json({ error: 'Node not found' });
        return;
      }
    }

    if (projectId) {
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
    }

    const costEntry = await prisma.costEntry.create({
      data: {
        amount,
        currency: currency || 'USD',
        type,
        description,
        nodeId,
        projectId,
      },
    });

    res.status(201).json(costEntry);
  } catch (error) {
    console.error('Create cost entry error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update cost entry
router.put('/cost/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { amount, currency, type, description } = req.body;

    // Verify cost entry belongs to user's project
    const costEntry = await prisma.costEntry.findUnique({
      where: { id: req.params.id },
      include: {
        node: {
          include: { project: true },
        },
        project: true,
      },
    });

    if (!costEntry) {
      res.status(404).json({ error: 'Cost entry not found' });
      return;
    }

    const isOwner = costEntry.node?.project.userId === req.userId || costEntry.project?.userId === req.userId;

    if (!isOwner) {
      res.status(403).json({ error: 'Not authorized' });
      return;
    }

    const updated = await prisma.costEntry.update({
      where: { id: req.params.id },
      data: {
        amount,
        currency,
        type,
        description,
      },
    });

    res.json(updated);
  } catch (error) {
    console.error('Update cost entry error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete cost entry
router.delete('/cost/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Verify cost entry belongs to user's project
    const costEntry = await prisma.costEntry.findUnique({
      where: { id: req.params.id },
      include: {
        node: {
          include: { project: true },
        },
        project: true,
      },
    });

    if (!costEntry) {
      res.status(404).json({ error: 'Cost entry not found' });
      return;
    }

    const isOwner = costEntry.node?.project.userId === req.userId || costEntry.project?.userId === req.userId;

    if (!isOwner) {
      res.status(403).json({ error: 'Not authorized' });
      return;
    }

    await prisma.costEntry.delete({
      where: { id: req.params.id },
    });

    res.json({ message: 'Cost entry deleted' });
  } catch (error) {
    console.error('Delete cost entry error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
