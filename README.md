# DS Forest 🌲

A visual workflow tool for data scientists to map, track, and evaluate solution paths. Create interactive decision trees, explore multiple solution approaches, and prioritize work using an effort/value matrix.

![DS Forest](https://img.shields.io/badge/status-MVP-green)
![License](https://img.shields.io/badge/license-MIT-blue)

## Features

### 🎨 Interactive Canvas
- Drag-and-drop interface for creating workflow diagrams
- Multiple node types: Start, Solution, Experiment, Decision, End
- Connect nodes to visualize solution paths
- Pan, zoom, and navigate large workflows
- Mini-map for easy navigation

### 📊 Effort/Value Matrix
- Visualize solutions in a 2x2 matrix
- Four quadrants: Quick Wins, Major Projects, Fill-ins, Time Sinks
- Click nodes to highlight them across views
- Prioritize work based on effort and value scores

### 🎯 Node Management
- Rich node metadata: title, description, notes, tags
- Effort and value scoring (1-10 scale)
- Status tracking: Active, Completed, Paused, Abandoned
- Color-coded nodes based on status and value

### 💾 Data Persistence
- Auto-save to localStorage
- No backend required for MVP
- Export/import capabilities (coming soon)

## Getting Started

### Prerequisites
- Node.js 20+
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/ds-forest.git
cd ds-forest
```

2. Install frontend dependencies:
```bash
cd frontend
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser to `http://localhost:5173`

## Usage

### Creating a Project
1. Click "Create Project" in the header
2. Enter a project name
3. Start adding nodes to the canvas

### Adding Nodes
1. Use the Node Palette on the left sidebar
2. Click a node type to add it to the canvas
3. Drag nodes to position them
4. Connect nodes by dragging from the bottom handle of one node to the top handle of another

### Editing Nodes
1. Click on any node to select it
2. Use the right sidebar to edit properties:
   - Label and description
   - Node type
   - Status (Active, Completed, Paused, Abandoned)
   - Effort score (1-10)
   - Value score (1-10)
   - Tags
   - Notes

### Using the Effort/Value Matrix
1. Click the "Matrix" button in the header
2. View all nodes plotted based on their effort and value scores
3. Click nodes in the matrix to select them
4. Use the quadrant stats to understand your solution distribution

### Node Types

- **Start Node** 🎯: Problem definition or starting point
- **Solution Node** 💡: Potential solution or approach
- **Experiment Node** 🧪: Test, analysis, or experiment
- **Decision Node** 🔀: Decision point or branching
- **End Node** ✅: Conclusion or final result

### Keyboard Shortcuts (Coming Soon)
- `Cmd/Ctrl + Z`: Undo
- `Cmd/Ctrl + Y`: Redo
- `Delete`: Delete selected node
- `Space + Drag`: Pan canvas

## Project Structure

```
ds-forest/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Canvas/        # Canvas and React Flow components
│   │   │   ├── Matrix/        # Effort/Value matrix
│   │   │   ├── Nodes/         # Custom node components
│   │   │   ├── Sidebar/       # Node palette and editor
│   │   │   └── ui/            # Reusable UI components
│   │   ├── stores/            # Zustand state management
│   │   ├── types/             # TypeScript types
│   │   ├── lib/               # Utility functions
│   │   └── utils/             # Helper utilities
│   └── package.json
├── backend/                   # Backend (planned)
└── PROJECT_PLAN.md           # Detailed project plan
```

## Technology Stack

### Frontend
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **React Flow** - Canvas and node visualization
- **Zustand** - State management
- **Tailwind CSS** - Styling
- **Lucide React** - Icons

### Future Backend (Planned)
- Node.js + Express
- PostgreSQL
- Redis
- WebSockets for real-time collaboration

## Roadmap

### ✅ Phase 1: MVP (Current)
- [x] Basic canvas with React Flow
- [x] Node creation and editing
- [x] Effort/Value matrix
- [x] Local storage persistence
- [x] Multiple node types

### 🚧 Phase 2: Enhanced Features (Next)
- [ ] Path system for tracking solution journeys
- [ ] Path comparison view
- [ ] Undo/redo functionality
- [ ] Backend API and database
- [ ] User authentication
- [ ] Export to PNG/PDF/JSON

### 📅 Phase 3: Collaboration
- [ ] Real-time collaboration
- [ ] Project sharing
- [ ] Comments and annotations
- [ ] Version history
- [ ] Team workspace

### 🚀 Phase 4: Advanced Features
- [ ] Templates for common workflows
- [ ] Jupyter notebook integration
- [ ] Git integration
- [ ] Advanced analytics
- [ ] API access
- [ ] Plugin system

## Development

### Running Tests (Coming Soon)
```bash
npm test
```

### Building for Production
```bash
npm run build
```

### Linting
```bash
npm run lint
```

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Built with [React Flow](https://reactflow.dev/)
- Icons by [Lucide](https://lucide.dev/)
- UI inspired by modern data science tools

## Support

For issues and questions:
- Open an issue on GitHub
- Email: support@dsforest.dev (coming soon)

---

**DS Forest** - Navigate your data science solutions like a forest explorer 🌲🔍
