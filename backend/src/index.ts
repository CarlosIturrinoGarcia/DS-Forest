import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth';
import projectRoutes from './routes/projects';
import nodeRoutes from './routes/nodes';
import edgeRoutes from './routes/edges';
import datasetRoutes from './routes/datasets';
import modelRoutes from './routes/models';
import commentRoutes from './routes/comments';
import trackingRoutes from './routes/tracking';
import boardRoutes from './routes/boards';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/nodes', nodeRoutes);
app.use('/api/edges', edgeRoutes);
app.use('/api/datasets', datasetRoutes);
app.use('/api/models', modelRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/tracking', trackingRoutes);
app.use('/api/boards', boardRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'DS Forest API is running' });
});

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
