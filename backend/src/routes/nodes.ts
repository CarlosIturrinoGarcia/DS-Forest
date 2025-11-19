import { Router, Response } from 'express';
import multer from 'multer';
import prisma from '../utils/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';

// Configure multer for file uploads (memory storage)
const upload = multer({ storage: multer.memoryStorage() });

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

// Upload Jupyter notebook
router.post('/:id/notebook', upload.single('notebook'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const file = req.file;

    if (!file) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }

    // Verify node exists and belongs to user's project
    const node = await prisma.node.findFirst({
      where: {
        id,
        project: {
          userId: req.userId!,
        },
      },
    });

    if (!node) {
      res.status(404).json({ error: 'Node not found' });
      return;
    }

    // Convert notebook to HTML
    // For .ipynb files, we need to parse JSON and convert to HTML
    const notebookContent = file.buffer.toString('utf-8');
    let notebookHtml: string;

    try {
      const notebook = JSON.parse(notebookContent);
      notebookHtml = convertNotebookToHtml(notebook);
    } catch (error) {
      res.status(400).json({ error: 'Invalid notebook file format' });
      return;
    }

    // Update node with notebook HTML
    const updatedNode = await prisma.node.update({
      where: { id },
      data: {
        notebookHtml,
        notebookFilename: file.originalname,
      },
    });

    res.json(updatedNode);
  } catch (error) {
    console.error('Upload notebook error:', error);
    res.status(500).json({ error: 'Failed to upload notebook' });
  }
});

// Helper function to convert Jupyter notebook JSON to HTML
function convertNotebookToHtml(notebook: any): string {
  const cells = notebook.cells || [];

  let html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; padding: 20px; max-width: 1200px; margin: 0 auto; }
        .cell { margin-bottom: 20px; }
        .code-cell { background: #f6f8fa; border-left: 3px solid #0969da; padding: 12px; border-radius: 6px; }
        .markdown-cell { line-height: 1.6; }
        pre { background: #f6f8fa; padding: 12px; border-radius: 6px; overflow-x: auto; }
        code { background: #f6f8fa; padding: 2px 6px; border-radius: 3px; font-family: 'Monaco', 'Courier New', monospace; font-size: 14px; }
        .output { background: #fff; border-left: 3px solid #1a7f37; padding: 12px; margin-top: 8px; border-radius: 6px; }
        h1, h2, h3, h4, h5, h6 { color: #24292f; margin-top: 24px; margin-bottom: 16px; }
        h1 { border-bottom: 1px solid #d0d7de; padding-bottom: 8px; }
        img { max-width: 100%; height: auto; }
        table { border-collapse: collapse; width: 100%; margin: 16px 0; }
        th, td { border: 1px solid #d0d7de; padding: 8px 12px; text-align: left; }
        th { background: #f6f8fa; font-weight: 600; }
      </style>
    </head>
    <body>
  `;

  cells.forEach((cell: any) => {
    if (cell.cell_type === 'markdown') {
      const source = Array.isArray(cell.source) ? cell.source.join('') : cell.source;
      html += `<div class="cell markdown-cell">${markdownToHtml(source)}</div>`;
    } else if (cell.cell_type === 'code') {
      const source = Array.isArray(cell.source) ? cell.source.join('') : cell.source;
      html += `<div class="cell code-cell">`;
      html += `<pre><code>${escapeHtml(source)}</code></pre>`;

      // Add outputs if any
      if (cell.outputs && cell.outputs.length > 0) {
        cell.outputs.forEach((output: any) => {
          if (output.output_type === 'stream') {
            const text = Array.isArray(output.text) ? output.text.join('') : output.text;
            html += `<div class="output"><pre>${escapeHtml(text)}</pre></div>`;
          } else if (output.output_type === 'execute_result' || output.output_type === 'display_data') {
            if (output.data) {
              if (output.data['text/html']) {
                const htmlData = Array.isArray(output.data['text/html'])
                  ? output.data['text/html'].join('')
                  : output.data['text/html'];
                html += `<div class="output">${htmlData}</div>`;
              } else if (output.data['image/png']) {
                html += `<div class="output"><img src="data:image/png;base64,${output.data['image/png']}" /></div>`;
              } else if (output.data['text/plain']) {
                const text = Array.isArray(output.data['text/plain'])
                  ? output.data['text/plain'].join('')
                  : output.data['text/plain'];
                html += `<div class="output"><pre>${escapeHtml(text)}</pre></div>`;
              }
            }
          } else if (output.output_type === 'error') {
            const traceback = output.traceback ? output.traceback.join('\n') : '';
            html += `<div class="output" style="border-color: #cf222e; background: #fff8f8;"><pre style="color: #cf222e;">${escapeHtml(traceback)}</pre></div>`;
          }
        });
      }
      html += `</div>`;
    }
  });

  html += `</body></html>`;
  return html;
}

function escapeHtml(text: string): string {
  const map: { [key: string]: string } = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}

function markdownToHtml(markdown: string): string {
  // Basic markdown conversion (headers, bold, italic, code, links)
  let html = markdown;

  // Headers
  html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');

  // Bold
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

  // Italic
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');

  // Code
  html = html.replace(/`(.*?)`/g, '<code>$1</code>');

  // Links
  html = html.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank">$1</a>');

  // Line breaks
  html = html.replace(/\n/g, '<br>');

  return html;
}

export default router;
