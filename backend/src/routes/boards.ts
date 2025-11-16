import { Router, Response } from 'express';
import prisma from '../utils/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// ============ BOARD ROUTES ============

// Get all boards for a project
router.get('/project/:projectId', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { projectId } = req.params;

    // Verify user owns the project
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

    const boards = await prisma.board.findMany({
      where: { projectId },
      include: {
        columns: {
          include: {
            cards: {
              include: {
                assignedTo: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                  },
                },
              },
              orderBy: { order: 'asc' },
            },
          },
          orderBy: { order: 'asc' },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    res.json(boards);
  } catch (error) {
    console.error('Get boards error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get single board
router.get('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const board = await prisma.board.findUnique({
      where: { id: req.params.id },
      include: {
        project: true,
        columns: {
          include: {
            cards: {
              include: {
                assignedTo: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                  },
                },
              },
              orderBy: { order: 'asc' },
            },
          },
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!board) {
      res.status(404).json({ error: 'Board not found' });
      return;
    }

    // Verify user owns the project
    if (board.project.userId !== req.userId) {
      res.status(403).json({ error: 'Unauthorized' });
      return;
    }

    res.json(board);
  } catch (error) {
    console.error('Get board error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create board
router.post('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, description, projectId, columns } = req.body;

    // Verify user owns the project
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

    // Create board with default columns if not provided
    const defaultColumns = columns || [
      { title: 'To Do', order: 0 },
      { title: 'In Progress', order: 1 },
      { title: 'Review', order: 2 },
      { title: 'Done', order: 3 },
    ];

    const board = await prisma.board.create({
      data: {
        name,
        description,
        projectId,
        columns: {
          create: defaultColumns,
        },
      },
      include: {
        columns: {
          orderBy: { order: 'asc' },
        },
      },
    });

    res.status(201).json(board);
  } catch (error) {
    console.error('Create board error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update board
router.put('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, description } = req.body;

    // Get board to verify ownership
    const board = await prisma.board.findUnique({
      where: { id: req.params.id },
      include: { project: true },
    });

    if (!board) {
      res.status(404).json({ error: 'Board not found' });
      return;
    }

    if (board.project.userId !== req.userId) {
      res.status(403).json({ error: 'Unauthorized' });
      return;
    }

    const updated = await prisma.board.update({
      where: { id: req.params.id },
      data: { name, description },
      include: {
        columns: {
          include: {
            cards: {
              orderBy: { order: 'asc' },
            },
          },
          orderBy: { order: 'asc' },
        },
      },
    });

    res.json(updated);
  } catch (error) {
    console.error('Update board error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete board
router.delete('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Get board to verify ownership
    const board = await prisma.board.findUnique({
      where: { id: req.params.id },
      include: { project: true },
    });

    if (!board) {
      res.status(404).json({ error: 'Board not found' });
      return;
    }

    if (board.project.userId !== req.userId) {
      res.status(403).json({ error: 'Unauthorized' });
      return;
    }

    await prisma.board.delete({
      where: { id: req.params.id },
    });

    res.json({ message: 'Board deleted' });
  } catch (error) {
    console.error('Delete board error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ============ COLUMN ROUTES ============

// Create column
router.post('/:boardId/columns', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { boardId } = req.params;
    const { title, order } = req.body;

    // Get board to verify ownership
    const board = await prisma.board.findUnique({
      where: { id: boardId },
      include: { project: true },
    });

    if (!board) {
      res.status(404).json({ error: 'Board not found' });
      return;
    }

    if (board.project.userId !== req.userId) {
      res.status(403).json({ error: 'Unauthorized' });
      return;
    }

    const column = await prisma.column.create({
      data: {
        title,
        order,
        boardId,
      },
    });

    res.status(201).json(column);
  } catch (error) {
    console.error('Create column error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update column
router.put('/columns/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { title, order } = req.body;

    // Get column to verify ownership
    const column = await prisma.column.findUnique({
      where: { id: req.params.id },
      include: {
        board: {
          include: { project: true },
        },
      },
    });

    if (!column) {
      res.status(404).json({ error: 'Column not found' });
      return;
    }

    if (column.board.project.userId !== req.userId) {
      res.status(403).json({ error: 'Unauthorized' });
      return;
    }

    const updated = await prisma.column.update({
      where: { id: req.params.id },
      data: { title, order },
    });

    res.json(updated);
  } catch (error) {
    console.error('Update column error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete column
router.delete('/columns/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Get column to verify ownership
    const column = await prisma.column.findUnique({
      where: { id: req.params.id },
      include: {
        board: {
          include: { project: true },
        },
      },
    });

    if (!column) {
      res.status(404).json({ error: 'Column not found' });
      return;
    }

    if (column.board.project.userId !== req.userId) {
      res.status(403).json({ error: 'Unauthorized' });
      return;
    }

    await prisma.column.delete({
      where: { id: req.params.id },
    });

    res.json({ message: 'Column deleted' });
  } catch (error) {
    console.error('Delete column error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ============ CARD ROUTES ============

// Create card
router.post('/:boardId/cards', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { boardId } = req.params;
    const { title, description, columnId, order, assignedToId, priority, tags, dueDate, estimatedHours } = req.body;

    // Get board to verify ownership
    const board = await prisma.board.findUnique({
      where: { id: boardId },
      include: { project: true },
    });

    if (!board) {
      res.status(404).json({ error: 'Board not found' });
      return;
    }

    if (board.project.userId !== req.userId) {
      res.status(403).json({ error: 'Unauthorized' });
      return;
    }

    const card = await prisma.card.create({
      data: {
        title,
        description,
        columnId,
        boardId,
        order,
        assignedToId,
        priority,
        tags,
        dueDate,
        estimatedHours,
      },
      include: {
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    res.status(201).json(card);
  } catch (error) {
    console.error('Create card error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update card
router.put('/cards/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { title, description, assignedToId, priority, tags, dueDate, estimatedHours } = req.body;

    // Get card to verify ownership
    const card = await prisma.card.findUnique({
      where: { id: req.params.id },
      include: {
        board: {
          include: { project: true },
        },
      },
    });

    if (!card) {
      res.status(404).json({ error: 'Card not found' });
      return;
    }

    if (card.board.project.userId !== req.userId) {
      res.status(403).json({ error: 'Unauthorized' });
      return;
    }

    const updated = await prisma.card.update({
      where: { id: req.params.id },
      data: {
        title,
        description,
        assignedToId,
        priority,
        tags,
        dueDate,
        estimatedHours,
      },
      include: {
        assignedTo: {
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
    console.error('Update card error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Move card (change column and/or order)
router.patch('/cards/:id/move', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { columnId, order } = req.body;

    // Get card to verify ownership
    const card = await prisma.card.findUnique({
      where: { id: req.params.id },
      include: {
        board: {
          include: { project: true },
        },
      },
    });

    if (!card) {
      res.status(404).json({ error: 'Card not found' });
      return;
    }

    if (card.board.project.userId !== req.userId) {
      res.status(403).json({ error: 'Unauthorized' });
      return;
    }

    const updated = await prisma.card.update({
      where: { id: req.params.id },
      data: {
        columnId,
        order,
      },
      include: {
        assignedTo: {
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
    console.error('Move card error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete card
router.delete('/cards/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Get card to verify ownership
    const card = await prisma.card.findUnique({
      where: { id: req.params.id },
      include: {
        board: {
          include: { project: true },
        },
      },
    });

    if (!card) {
      res.status(404).json({ error: 'Card not found' });
      return;
    }

    if (card.board.project.userId !== req.userId) {
      res.status(403).json({ error: 'Unauthorized' });
      return;
    }

    await prisma.card.delete({
      where: { id: req.params.id },
    });

    res.json({ message: 'Card deleted' });
  } catch (error) {
    console.error('Delete card error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
