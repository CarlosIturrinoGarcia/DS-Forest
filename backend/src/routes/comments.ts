import { Router, Response } from 'express';
import prisma from '../utils/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authenticate);

// Get all comments for a node
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

    const comments = await prisma.comment.findMany({
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
      orderBy: { createdAt: 'asc' },
    });

    res.json(comments);
  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create comment
router.post('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { nodeId, content, mentions } = req.body;

    // Verify node belongs to user's project
    const node = await prisma.node.findUnique({
      where: { id: nodeId },
      include: { project: true },
    });

    if (!node || node.project.userId !== req.userId) {
      res.status(404).json({ error: 'Node not found' });
      return;
    }

    const comment = await prisma.comment.create({
      data: {
        nodeId,
        userId: req.userId!,
        content,
        mentions: mentions ? JSON.stringify(mentions) : null,
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

    res.status(201).json(comment);
  } catch (error) {
    console.error('Create comment error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update comment
router.put('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { content, isResolved } = req.body;

    // Verify comment belongs to user
    const comment = await prisma.comment.findUnique({
      where: { id: req.params.id },
      include: {
        node: {
          include: { project: true },
        },
      },
    });

    if (!comment) {
      res.status(404).json({ error: 'Comment not found' });
      return;
    }

    // User must be comment author or project owner to update
    if (comment.userId !== req.userId && comment.node.project.userId !== req.userId) {
      res.status(403).json({ error: 'Not authorized' });
      return;
    }

    const updated = await prisma.comment.update({
      where: { id: req.params.id },
      data: {
        content,
        isResolved,
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
    console.error('Update comment error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete comment
router.delete('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Verify comment belongs to user
    const comment = await prisma.comment.findUnique({
      where: { id: req.params.id },
      include: {
        node: {
          include: { project: true },
        },
      },
    });

    if (!comment) {
      res.status(404).json({ error: 'Comment not found' });
      return;
    }

    // User must be comment author or project owner to delete
    if (comment.userId !== req.userId && comment.node.project.userId !== req.userId) {
      res.status(403).json({ error: 'Not authorized' });
      return;
    }

    await prisma.comment.delete({
      where: { id: req.params.id },
    });

    res.json({ message: 'Comment deleted' });
  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
