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

  // Container actions
  addNodeToContainer: (nodeId: string, containerId: string) => void;
  removeNodeFromContainer: (nodeId: string) => void;

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
      type: type === 'container' ? 'container' : 'default',
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
        // Container-specific properties
        ...(type === 'container' && {
          childrenIds: [],
          isExpanded: true,
        }),
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

    const nodeToDelete = project.nodes.find((n) => n.id === nodeId);
    if (!nodeToDelete) return;

    let updatedNodes = project.nodes.filter((node) => node.id !== nodeId);

    // If deleting a container, orphan all its children
    if (nodeToDelete.data.type === 'container' && nodeToDelete.data.childrenIds) {
      updatedNodes = updatedNodes.map((node) => {
        if (nodeToDelete.data.childrenIds?.includes(node.id)) {
          const { parentId, ...restData } = node.data;
          return {
            ...node,
            data: {
              ...restData,
              updatedAt: new Date(),
            },
          };
        }
        return node;
      });
    }

    // If deleting a child node, remove it from parent's children list
    if (nodeToDelete.data.parentId) {
      updatedNodes = updatedNodes.map((node) => {
        if (node.id === nodeToDelete.data.parentId && node.data.type === 'container') {
          return {
            ...node,
            data: {
              ...node.data,
              childrenIds: (node.data.childrenIds || []).filter((id) => id !== nodeId),
              updatedAt: new Date(),
            },
          };
        }
        return node;
      });
    }

    set({
      project: {
        ...project,
        nodes: updatedNodes,
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

  addNodeToContainer: (nodeId: string, containerId: string) => {
    const { project } = get();
    if (!project) return;

    const updatedNodes = project.nodes.map((node) => {
      // Update the container to include this node
      if (node.id === containerId && node.data.type === 'container') {
        const childrenIds = node.data.childrenIds || [];
        return {
          ...node,
          data: {
            ...node.data,
            childrenIds: [...childrenIds, nodeId],
            updatedAt: new Date(),
          },
        };
      }
      // Update the node to have this parent
      if (node.id === nodeId) {
        return {
          ...node,
          data: {
            ...node.data,
            parentId: containerId,
            updatedAt: new Date(),
          },
        };
      }
      return node;
    });

    set({
      project: {
        ...project,
        nodes: updatedNodes,
        updatedAt: new Date(),
      },
    });
    get().saveToStorage();
  },

  removeNodeFromContainer: (nodeId: string) => {
    const { project } = get();
    if (!project) return;

    const node = project.nodes.find((n) => n.id === nodeId);
    if (!node || !node.data.parentId) return;

    const parentId = node.data.parentId;

    const updatedNodes = project.nodes.map((n) => {
      // Remove node from parent's children list
      if (n.id === parentId && n.data.type === 'container') {
        return {
          ...n,
          data: {
            ...n.data,
            childrenIds: (n.data.childrenIds || []).filter((id) => id !== nodeId),
            updatedAt: new Date(),
          },
        };
      }
      // Remove parent reference from node
      if (n.id === nodeId) {
        const { parentId, ...restData } = n.data;
        return {
          ...n,
          data: {
            ...restData,
            updatedAt: new Date(),
          },
        };
      }
      return n;
    });

    set({
      project: {
        ...project,
        nodes: updatedNodes,
        updatedAt: new Date(),
      },
    });
    get().saveToStorage();
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
