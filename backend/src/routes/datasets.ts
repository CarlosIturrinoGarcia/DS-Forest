import { Router, Response } from 'express';
import prisma from '../utils/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authenticate);

// Get all datasets for a project
router.get('/project/:projectId', async (req: AuthRequest, res: Response): Promise<void> => {
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

    const datasets = await prisma.dataset.findMany({
      where: { projectId: req.params.projectId },
      include: {
        nodes: {
          include: {
            node: {
              select: {
                id: true,
                label: true,
                type: true,
              },
            },
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    res.json(datasets);
  } catch (error) {
    console.error('Get datasets error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get single dataset
router.get('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const dataset = await prisma.dataset.findUnique({
      where: { id: req.params.id },
      include: {
        project: true,
        nodes: {
          include: {
            node: {
              select: {
                id: true,
                label: true,
                type: true,
              },
            },
          },
        },
      },
    });

    if (!dataset || dataset.project.userId !== req.userId) {
      res.status(404).json({ error: 'Dataset not found' });
      return;
    }

    res.json(dataset);
  } catch (error) {
    console.error('Get dataset error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create dataset
router.post('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      projectId,
      name,
      version,
      location,
      size,
      schema,
      qualityMetrics,
      description,
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

    const dataset = await prisma.dataset.create({
      data: {
        projectId,
        name,
        version,
        location,
        size,
        schema: schema ? JSON.stringify(schema) : null,
        qualityMetrics: qualityMetrics ? JSON.stringify(qualityMetrics) : null,
        description,
      },
    });

    res.status(201).json(dataset);
  } catch (error) {
    console.error('Create dataset error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update dataset
router.put('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      name,
      version,
      location,
      size,
      schema,
      qualityMetrics,
      description,
    } = req.body;

    // Verify dataset belongs to user's project
    const dataset = await prisma.dataset.findUnique({
      where: { id: req.params.id },
      include: { project: true },
    });

    if (!dataset || dataset.project.userId !== req.userId) {
      res.status(404).json({ error: 'Dataset not found' });
      return;
    }

    const updated = await prisma.dataset.update({
      where: { id: req.params.id },
      data: {
        name,
        version,
        location,
        size,
        schema: schema ? JSON.stringify(schema) : undefined,
        qualityMetrics: qualityMetrics ? JSON.stringify(qualityMetrics) : undefined,
        description,
      },
    });

    res.json(updated);
  } catch (error) {
    console.error('Update dataset error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete dataset
router.delete('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Verify dataset belongs to user's project
    const dataset = await prisma.dataset.findUnique({
      where: { id: req.params.id },
      include: { project: true },
    });

    if (!dataset || dataset.project.userId !== req.userId) {
      res.status(404).json({ error: 'Dataset not found' });
      return;
    }

    await prisma.dataset.delete({
      where: { id: req.params.id },
    });

    res.json({ message: 'Dataset deleted' });
  } catch (error) {
    console.error('Delete dataset error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Link dataset to node
router.post('/link', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { nodeId, datasetId, role } = req.body;

    // Verify node and dataset belong to user's project
    const node = await prisma.node.findUnique({
      where: { id: nodeId },
      include: { project: true },
    });

    const dataset = await prisma.dataset.findUnique({
      where: { id: datasetId },
      include: { project: true },
    });

    if (!node || node.project.userId !== req.userId) {
      res.status(404).json({ error: 'Node not found' });
      return;
    }

    if (!dataset || dataset.project.userId !== req.userId) {
      res.status(404).json({ error: 'Dataset not found' });
      return;
    }

    const link = await prisma.nodeDataset.create({
      data: {
        nodeId,
        datasetId,
        role: role || 'input',
      },
    });

    res.status(201).json(link);
  } catch (error) {
    console.error('Link dataset error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Unlink dataset from node
router.delete('/link/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const link = await prisma.nodeDataset.findUnique({
      where: { id: req.params.id },
      include: {
        node: {
          include: { project: true },
        },
      },
    });

    if (!link || link.node.project.userId !== req.userId) {
      res.status(404).json({ error: 'Link not found' });
      return;
    }

    await prisma.nodeDataset.delete({
      where: { id: req.params.id },
    });

    res.json({ message: 'Dataset unlinked' });
  } catch (error) {
    console.error('Unlink dataset error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
