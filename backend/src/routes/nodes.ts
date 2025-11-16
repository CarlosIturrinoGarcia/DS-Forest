import { Router, Response } from 'express';
import prisma from '../utils/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authenticate);

// Create node
router.post('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      projectId,
      type,
      label,
      description,
      x,
      y,
      effort,
      value,
      priority,
      status,
      assignees,
      tags,
      dueDate,
      hypothesis,
      expectedOutcome,
      actualResult,
      learnings,
      experimentId,
      metrics,
      parameters,
      notebookLink,
    } = req.body;

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

    const node = await prisma.node.create({
      data: {
        projectId,
        type,
        label,
        description,
        x,
        y,
        effort: effort || 5,
        value: value || 5,
        priority: priority || 'medium',
        status: status || 'todo',
        assignees: assignees ? JSON.stringify(assignees) : null,
        tags: tags ? JSON.stringify(tags) : null,
        dueDate,
        hypothesis,
        expectedOutcome,
        actualResult,
        learnings,
        experimentId,
        metrics: metrics ? JSON.stringify(metrics) : null,
        parameters: parameters ? JSON.stringify(parameters) : null,
        notebookLink,
      },
    });

    res.status(201).json(node);
  } catch (error) {
    console.error('Create node error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update node
router.put('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      label,
      description,
      x,
      y,
      effort,
      value,
      priority,
      status,
      assignees,
      tags,
      dueDate,
      hypothesis,
      expectedOutcome,
      actualResult,
      learnings,
      experimentId,
      metrics,
      parameters,
      notebookLink,
    } = req.body;

    // Verify node belongs to user's project
    const node = await prisma.node.findUnique({
      where: { id: req.params.id },
      include: { project: true },
    });

    if (!node || node.project.userId !== req.userId) {
      res.status(404).json({ error: 'Node not found' });
      return;
    }

    const updated = await prisma.node.update({
      where: { id: req.params.id },
      data: {
        label,
        description,
        x,
        y,
        effort,
        value,
        priority,
        status,
        assignees: assignees ? JSON.stringify(assignees) : undefined,
        tags: tags ? JSON.stringify(tags) : undefined,
        dueDate,
        hypothesis,
        expectedOutcome,
        actualResult,
        learnings,
        experimentId,
        metrics: metrics ? JSON.stringify(metrics) : undefined,
        parameters: parameters ? JSON.stringify(parameters) : undefined,
        notebookLink,
      },
    });

    res.json(updated);
  } catch (error) {
    console.error('Update node error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete node
router.delete('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Verify node belongs to user's project
    const node = await prisma.node.findUnique({
      where: { id: req.params.id },
      include: { project: true },
    });

    if (!node || node.project.userId !== req.userId) {
      res.status(404).json({ error: 'Node not found' });
      return;
    }

    await prisma.node.delete({
      where: { id: req.params.id },
    });

    res.json({ message: 'Node deleted' });
  } catch (error) {
    console.error('Delete node error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
