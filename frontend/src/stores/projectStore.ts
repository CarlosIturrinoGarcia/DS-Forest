import { create } from 'zustand';
import { DSNode, DSEdge, Path, Project, NodeData, NodeType } from '../types';

// Simple ID generator
const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

interface ProjectStore {
  project: Project | null;
  selectedNodeId: string | null;
  viewMode: 'canvas' | 'matrix';

  // Actions
  initProject: (name: string, description: string) => void;
  updateProjectName: (name: string) => void;

  // Node actions
  addNode: (type: NodeType, position: { x: number; y: number }) => void;
  updateNode: (nodeId: string, data: Partial<NodeData>) => void;
  deleteNode: (nodeId: string) => void;
  selectNode: (nodeId: string | null) => void;

  // Edge actions
  addEdge: (edge: DSEdge) => void;
  deleteEdge: (edgeId: string) => void;

  // View actions
  setViewMode: (mode: 'canvas' | 'matrix') => void;

  // Persistence
  saveToStorage: () => void;
  loadFromStorage: () => void;
}

export const useProjectStore = create<ProjectStore>((set, get) => ({
  project: null,
  selectedNodeId: null,
  viewMode: 'canvas',

  initProject: (name: string, description: string) => {
    const newProject: Project = {
      id: generateId(),
      name,
      description,
      createdAt: new Date(),
      updatedAt: new Date(),
      nodes: [],
      edges: [],
      paths: [],
    };
    set({ project: newProject });
    get().saveToStorage();
  },

  updateProjectName: (name: string) => {
    const { project } = get();
    if (!project) return;

    set({
      project: {
        ...project,
        name,
        updatedAt: new Date(),
      },
    });
    get().saveToStorage();
  },

  addNode: (type: NodeType, position: { x: number; y: number }) => {
    const { project } = get();
    if (!project) return;

    const newNode: DSNode = {
      id: generateId(),
      type: 'default',
      position,
      data: {
        label: `${type.charAt(0).toUpperCase() + type.slice(1)} Node`,
        description: '',
        notes: '',
        tags: [],
        effort: 5,
        value: 5,
        status: 'active',
        type,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    };

    set({
      project: {
        ...project,
        nodes: [...project.nodes, newNode],
        updatedAt: new Date(),
      },
    });
    get().saveToStorage();
  },

  updateNode: (nodeId: string, data: Partial<NodeData>) => {
    const { project } = get();
    if (!project) return;

    const updatedNodes = project.nodes.map((node) =>
      node.id === nodeId
        ? {
            ...node,
            data: {
              ...node.data,
              ...data,
              updatedAt: new Date(),
            },
          }
        : node
    );

    set({
      project: {
        ...project,
        nodes: updatedNodes,
        updatedAt: new Date(),
      },
    });
    get().saveToStorage();
  },

  deleteNode: (nodeId: string) => {
    const { project } = get();
    if (!project) return;

    set({
      project: {
        ...project,
        nodes: project.nodes.filter((node) => node.id !== nodeId),
        edges: project.edges.filter(
          (edge) => edge.source !== nodeId && edge.target !== nodeId
        ),
        updatedAt: new Date(),
      },
      selectedNodeId: null,
    });
    get().saveToStorage();
  },

  selectNode: (nodeId: string | null) => {
    set({ selectedNodeId: nodeId });
  },

  addEdge: (edge: DSEdge) => {
    const { project } = get();
    if (!project) return;

    set({
      project: {
        ...project,
        edges: [...project.edges, edge],
        updatedAt: new Date(),
      },
    });
    get().saveToStorage();
  },

  deleteEdge: (edgeId: string) => {
    const { project } = get();
    if (!project) return;

    set({
      project: {
        ...project,
        edges: project.edges.filter((edge) => edge.id !== edgeId),
        updatedAt: new Date(),
      },
    });
    get().saveToStorage();
  },

  setViewMode: (mode: 'canvas' | 'matrix') => {
    set({ viewMode: mode });
  },

  saveToStorage: () => {
    try {
      const { project } = get();
      if (project) {
        localStorage.setItem('ds-forest-project', JSON.stringify(project));
      }
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  },

  loadFromStorage: () => {
    try {
      const stored = localStorage.getItem('ds-forest-project');
      if (stored) {
        const project = JSON.parse(stored);
        // Convert date strings back to Date objects
        project.createdAt = new Date(project.createdAt);
        project.updatedAt = new Date(project.updatedAt);
        project.nodes = project.nodes.map((node: DSNode) => ({
          ...node,
          data: {
            ...node.data,
            createdAt: new Date(node.data.createdAt),
            updatedAt: new Date(node.data.updatedAt),
          },
        }));
        set({ project });
      }
    } catch (error) {
      console.error('Error loading from localStorage:', error);
    }
  },
}));
