import { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import BoardView from '../components/BoardView';
import PipelineView from '../components/PipelineView';

type NodeType = 'start' | 'experiment' | 'end';
type Priority = 'low' | 'medium' | 'high' | 'critical';
type CardStatus = 'todo' | 'in_progress' | 'review' | 'done';

interface TeamMember {
  id: string;
  name: string;
  color: string;
  initials: string;
}

interface NodeData {
  id: string;
  type: NodeType;
  label: string;
  description: string;
  x: number;
  y: number;
  effort: number;
  value: number;
  assignees: string[]; // Team member IDs
  priority: Priority;
  status: CardStatus;
  dueDate?: string;
  tags: string[];
  hypothesis?: string;
  expectedOutcome?: string;
  actualResult?: string;
  learnings?: string;
  experimentId?: string;
  metrics?: any; // JSON object
  parameters?: any; // JSON object
  notebookLink?: string;
  notebookHtml?: string; // Stored HTML version of notebook
  notebookFilename?: string; // Original filename
  experimentStatus?: 'pending' | 'success' | 'failure';
  // Container support
  parentId?: string; // ID of parent container
  childrenIds?: string[]; // IDs of child nodes (only for container type)
  isExpanded?: boolean; // Whether container is expanded
}

interface Connection {
  id: string;
  from: string;
  to: string;
}

const INITIAL_TEAM: TeamMember[] = [
  { id: '1', name: 'Alice Chen', initials: 'AC', color: '#3b82f6' },
  { id: '2', name: 'Bob Smith', initials: 'BS', color: '#10b981' },
  { id: '3', name: 'Carol Wang', initials: 'CW', color: '#f59e0b' },
  { id: '4', name: 'David Lee', initials: 'DL', color: '#8b5cf6' },
];

const PRIORITY_COLORS = {
  low: '#6b7280',
  medium: '#3b82f6',
  high: '#f59e0b',
  critical: '#ef4444'
};

const STATUS_COLORS = {
  todo: '#94a3b8',
  in_progress: '#3b82f6',
  review: '#f59e0b',
  done: '#10b981'
};

const EXPERIMENT_STATUS_COLORS = {
  pending: '#ffffff',
  success: '#dcfce7',  // Light green
  failure: '#fee2e2'   // Light red
};

interface WorkspacePageProps {
  user: any;
  projectId: string;
  onLogout: () => void;
  onBackToHome: () => void;
}

export default function WorkspacePage({ user, projectId, onLogout, onBackToHome }: WorkspacePageProps) {
  const [project, setProject] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'canvas' | 'matrix' | 'boards' | 'pipeline'>('canvas');
  const [nodes, setNodes] = useState<NodeData[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [teamMembers] = useState<TeamMember[]>(INITIAL_TEAM);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  // New feature states
  const [datasets, setDatasets] = useState<any[]>([]);
  const [models, setModels] = useState<any[]>([]);
  const [comments, setComments] = useState<any[]>([]);
  const [activeTimer, setActiveTimer] = useState<any | null>(null);
  const [costEntries, setCostEntries] = useState<any[]>([]);
  const [showDatasetModal] = useState(false);
  const [showModelModal] = useState(false);
  const [showCostModal] = useState(false);
  const [editorTab, setEditorTab] = useState<'details' | 'models' | 'comments' | 'tracking'>('details');
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [connectingFrom, setConnectingFrom] = useState<string | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const lastSavedNodesRef = useRef<string>('');
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');
  const [showNotebookViewer, setShowNotebookViewer] = useState(false);
  const [uploadingNotebook, setUploadingNotebook] = useState(false);
  const [newMetricKey, setNewMetricKey] = useState('');
  const [newMetricValue, setNewMetricValue] = useState('');

  // Load project from backend
  useEffect(() => {
    const loadProject = async () => {
      try {
        const projectData = await api.getProject(projectId);
        setProject(projectData);

        // Parse nodes and handle JSON fields
        const parsedNodes = (projectData.nodes || []).map((node: any) => ({
          ...node,
          assignees: typeof node.assignees === 'string' ? JSON.parse(node.assignees || '[]') : (node.assignees || []),
          tags: typeof node.tags === 'string' ? JSON.parse(node.tags || '[]') : (node.tags || []),
          childrenIds: typeof node.childrenIds === 'string' ? JSON.parse(node.childrenIds || '[]') : (node.childrenIds || []),
          metrics: typeof node.metrics === 'string' ? JSON.parse(node.metrics || '{}') : node.metrics,
          parameters: typeof node.parameters === 'string' ? JSON.parse(node.parameters || '{}') : node.parameters,
        }));

        setNodes(parsedNodes);

        // Set the initial hash to prevent immediate save after load
        lastSavedNodesRef.current = JSON.stringify(parsedNodes.map(n => ({
          id: n.id,
          type: n.type,
          label: n.label,
          description: n.description,
          x: Math.round(n.x),
          y: Math.round(n.y),
          effort: n.effort,
          value: n.value,
          priority: n.priority,
          status: n.status,
          assignees: n.assignees,
          tags: n.tags,
          dueDate: n.dueDate,
          hypothesis: n.hypothesis,
          expectedOutcome: n.expectedOutcome,
          actualResult: n.actualResult,
          learnings: n.learnings,
          experimentId: n.experimentId,
          experimentStatus: n.experimentStatus,
          notebookLink: n.notebookLink,
          parentId: n.parentId,
          childrenIds: n.childrenIds,
          isExpanded: n.isExpanded,
        })));

        // Parse edges
        const parsedEdges = (projectData.edges || []).map((edge: any) => ({
          id: edge.id,
          from: edge.fromId,
          to: edge.toId
        }));

        setConnections(parsedEdges);
      } catch (error) {
        console.error('Failed to load project:', error);
        alert('Failed to load project');
      } finally {
        setIsLoading(false);
      }
    };

    loadProject();
  }, [projectId]);

  // Load datasets and active timer
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const [datasetsData, timerData, costsData] = await Promise.all([
          api.getDatasets(projectId),
          api.getActiveTimer(),
          api.getCostEntries(projectId),
        ]);
        setDatasets(datasetsData);
        setActiveTimer(timerData);
        setCostEntries(costsData);
      } catch (error) {
        console.error('Failed to load initial data:', error);
      }
    };

    loadInitialData();
  }, [projectId]);

  // Load node-specific data when a node is selected
  useEffect(() => {
    if (!selectedNodeId) {
      setModels([]);
      setComments([]);
      return;
    }

    const loadNodeData = async () => {
      try {
        const [modelsData, commentsData] = await Promise.all([
          api.getModels(selectedNodeId),
          api.getComments(selectedNodeId),
        ]);
        setModels(modelsData);
        setComments(commentsData);
      } catch (error) {
        console.error('Failed to load node data:', error);
      }
    };

    loadNodeData();
  }, [selectedNodeId]);

  // Auto-save nodes to backend when they change
  useEffect(() => {
    if (!project || nodes.length === 0) return;

    // Create a hash of the nodes to detect actual changes
    const nodesHash = JSON.stringify(nodes.map(n => ({
      id: n.id,
      type: n.type,
      label: n.label,
      description: n.description,
      x: Math.round(n.x), // Round to avoid saving tiny position changes
      y: Math.round(n.y),
      effort: n.effort,
      value: n.value,
      priority: n.priority,
      status: n.status,
      assignees: n.assignees,
      tags: n.tags,
      dueDate: n.dueDate,
      hypothesis: n.hypothesis,
      expectedOutcome: n.expectedOutcome,
      actualResult: n.actualResult,
      learnings: n.learnings,
      experimentId: n.experimentId,
      experimentStatus: n.experimentStatus,
      notebookLink: n.notebookLink,
      parentId: n.parentId,
      childrenIds: n.childrenIds,
      isExpanded: n.isExpanded,
    })));

    // Skip save if nothing changed
    if (nodesHash === lastSavedNodesRef.current) {
      return;
    }

    // Mark as unsaved immediately
    setSaveStatus('unsaved');

    const saveNodes = async () => {
      setSaveStatus('saving');
      try {
        // Save all nodes to backend
        await Promise.all(
          nodes.map(async (node) => {
            try {
              await api.updateNode(node.id, {
                type: node.type,
                label: node.label,
                description: node.description,
                x: Math.round(node.x),
                y: Math.round(node.y),
                effort: node.effort,
                value: node.value,
                priority: node.priority,
                status: node.status,
                assignees: JSON.stringify(Array.isArray(node.assignees) ? node.assignees : []),
                tags: JSON.stringify(Array.isArray(node.tags) ? node.tags : []),
                dueDate: node.dueDate,
                hypothesis: node.hypothesis,
                expectedOutcome: node.expectedOutcome,
                actualResult: node.actualResult,
                learnings: node.learnings,
                experimentId: node.experimentId,
                experimentStatus: node.experimentStatus,
                metrics: node.metrics ? JSON.stringify(node.metrics) : null,
                parameters: node.parameters ? JSON.stringify(node.parameters) : null,
                notebookLink: node.notebookLink,
                parentId: node.parentId,
                childrenIds: node.childrenIds ? JSON.stringify(node.childrenIds) : null,
                isExpanded: node.isExpanded,
                projectId
              });
            } catch (error) {
              // If update fails, node might not exist - this is ok for newly created nodes
              console.log(`Node ${node.id} update skipped (might be new)`);
            }
          })
        );

        // Update the last saved hash
        lastSavedNodesRef.current = nodesHash;
        setSaveStatus('saved');
        console.log('✓ Auto-saved', nodes.length, 'cards');
      } catch (error) {
        console.error('Failed to save nodes:', error);
        setSaveStatus('saved'); // Reset even on error to avoid stuck state
      }
    };

    const timeoutId = setTimeout(saveNodes, 1000); // Debounce saves
    return () => clearTimeout(timeoutId);
  }, [nodes, project, projectId]);

  // Note: Connections are saved immediately when created in completeConnection function
  // This prevents duplicate saves and ensures connections are saved as soon as they're made

  // Removed unused handleCreateProject function

  const handleNotebookUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedNodeId) return;

    if (!file.name.endsWith('.ipynb')) {
      alert('Please upload a Jupyter notebook file (.ipynb)');
      return;
    }

    setUploadingNotebook(true);
    try {
      const updatedNode = await api.uploadNotebook(selectedNodeId, file);

      // Update local state
      setNodes(nodes.map(n =>
        n.id === selectedNodeId ? { ...n, notebookHtml: updatedNode.notebookHtml, notebookFilename: updatedNode.notebookFilename } : n
      ));

      alert('Notebook uploaded successfully!');
    } catch (error: any) {
      console.error('Failed to upload notebook:', error);
      alert('Failed to upload notebook: ' + (error.message || 'Unknown error'));
    } finally {
      setUploadingNotebook(false);
    }
  };

  const handleDeleteNotebook = () => {
    if (!selectedNodeId) return;

    if (!confirm('Are you sure you want to delete this notebook?')) return;

    // Update local state to remove notebook
    setNodes(nodes.map(n =>
      n.id === selectedNodeId ? { ...n, notebookHtml: undefined, notebookFilename: undefined } : n
    ));
  };

  const handleAddMetric = () => {
    if (!selectedNodeId || !newMetricKey.trim() || !newMetricValue.trim()) return;

    const node = nodes.find(n => n.id === selectedNodeId);
    if (!node) return;

    const currentMetrics = node.metrics || {};
    const updatedMetrics = {
      ...currentMetrics,
      [newMetricKey]: newMetricValue
    };

    setNodes(nodes.map(n =>
      n.id === selectedNodeId ? { ...n, metrics: updatedMetrics } : n
    ));

    setNewMetricKey('');
    setNewMetricValue('');
  };

  const handleDeleteMetric = (key: string) => {
    if (!selectedNodeId) return;

    const node = nodes.find(n => n.id === selectedNodeId);
    if (!node) return;

    const currentMetrics = node.metrics || {};
    const { [key]: _, ...updatedMetrics } = currentMetrics;

    setNodes(nodes.map(n =>
      n.id === selectedNodeId ? { ...n, metrics: updatedMetrics } : n
    ));
  };

  const addNode = async (type: NodeType) => {
    if (!project) return;

    const newNode: NodeData = {
      id: `card-${Date.now()}`,
      type,
      label: `${type.charAt(0).toUpperCase() + type.slice(1)} Card`,
      description: '',
      x: Math.random() * 400 + 100,
      y: Math.random() * 300 + 100,
      effort: 5,
      value: 5,
      assignees: [],
      priority: 'medium',
      status: 'todo',
      tags: [],
      // Container-specific properties
      ...(type === 'container' && {
        childrenIds: [],
        isExpanded: true,
      }),
    };

    setNodes([...nodes, newNode]);

    // Save to backend
    try {
      await api.createNode({
        ...newNode,
        projectId
      });
    } catch (error) {
      console.error('Failed to create node:', error);
    }
  };

  const handleMouseDown = (e: React.MouseEvent, nodeId: string) => {
    if (e.button !== 0) return;

    const node = nodes.find(n => n.id === nodeId);
    if (!node || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    setDraggingNodeId(nodeId);
    setDragOffset({
      x: mouseX - node.x,
      y: mouseY - node.y
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!draggingNodeId || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - dragOffset.x;
    const y = e.clientY - rect.top - dragOffset.y;

    setNodes(nodes.map(n =>
      n.id === draggingNodeId ? { ...n, x, y } : n
    ));
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (!draggingNodeId) return;

    // Check if we dropped on a container
    const draggedNode = nodes.find(n => n.id === draggingNodeId);
    if (draggedNode && !canvasRef.current) {
      setDraggingNodeId(null);
      return;
    }

    const rect = canvasRef.current!.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Find if we dropped on a container
    const containerNode = nodes.find(n =>
      n.type === 'container' &&
      n.id !== draggingNodeId &&
      mouseX >= n.x && mouseX <= n.x + 600 &&
      mouseY >= n.y && mouseY <= n.y + 300
    );

    if (containerNode) {
      // Add to container
      setNodes(nodes.map(n => {
        if (n.id === containerNode.id) {
          const childrenIds = n.childrenIds || [];
          if (!childrenIds.includes(draggingNodeId)) {
            return { ...n, childrenIds: [...childrenIds, draggingNodeId] };
          }
        }
        if (n.id === draggingNodeId) {
          return { ...n, parentId: containerNode.id };
        }
        return n;
      }));
    }

    setDraggingNodeId(null);
  };

  const startConnection = (e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    setConnectingFrom(nodeId);
  };

  const completeConnection = async (e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    if (connectingFrom && connectingFrom !== nodeId) {
      const newConnection: Connection = {
        id: `conn-${Date.now()}`,
        from: connectingFrom,
        to: nodeId
      };
      setConnections([...connections, newConnection]);

      // Save connection to backend
      try {
        await api.createEdge(projectId, connectingFrom, nodeId);
      } catch (error) {
        console.error('Failed to save connection:', error);
      }
    }
    setConnectingFrom(null);
  };

  const toggleAssignee = (nodeId: string, memberId: string) => {
    setNodes(nodes.map(n => {
      if (n.id !== nodeId) return n;
      const assignees = Array.isArray(n.assignees) ? n.assignees : [];
      const hasAssignee = assignees.includes(memberId);
      return {
        ...n,
        assignees: hasAssignee
          ? assignees.filter(id => id !== memberId)
          : [...assignees, memberId]
      };
    }));
  };

  const selectedNode = nodes.find(n => n.id === selectedNodeId);

  if (isLoading) {
    return (
      <div style={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f9fafb'
      }}>
        <p style={{ fontSize: '14px', color: '#6b7280' }}>Loading project...</p>
      </div>
    );
  }

  if (!project) {
    return (
      <div style={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f9fafb'
      }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: '14px', color: '#ef4444', marginBottom: '16px' }}>Project not found</p>
          <button
            onClick={onBackToHome}
            style={{
              padding: '8px 16px',
              backgroundColor: '#3b82f6',
              color: 'white',
              borderRadius: '6px',
              border: 'none',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            Back to Projects
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#f9fafb' }}>
      {/* Header */}
      <header style={{
        height: '64px',
        backgroundColor: 'white',
        borderBottom: '1px solid #e5e7eb',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button
            onClick={onBackToHome}
            style={{
              padding: '8px 12px',
              backgroundColor: '#f3f4f6',
              color: '#374151',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            ← Back
          </button>
          <div style={{
            width: '32px',
            height: '32px',
            background: 'linear-gradient(to bottom right, #3b82f6, #9333ea)',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: 'bold'
          }}>
            DS
          </div>
          <h1 style={{ fontSize: '20px', fontWeight: 'bold', margin: 0, color: '#111827' }}>DS Forest</h1>
          <div style={{ width: '1px', height: '24px', backgroundColor: '#d1d5db' }} />
          <span style={{ fontSize: '18px', fontWeight: '500', color: '#374151' }}>{project.name}</span>

          {/* Auto-save indicator */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 10px',
            backgroundColor: saveStatus === 'saved' ? '#f0fdf4' : saveStatus === 'saving' ? '#fef3c7' : '#fef2f2',
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: '500',
            color: saveStatus === 'saved' ? '#15803d' : saveStatus === 'saving' ? '#a16207' : '#991b1b'
          }}>
            {saveStatus === 'saved' && '✓ Saved'}
            {saveStatus === 'saving' && '⟳ Saving...'}
            {saveStatus === 'unsaved' && '○ Unsaved'}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {/* Team Members */}
          <div style={{ display: 'flex', gap: '4px', marginRight: '8px' }}>
            {teamMembers.map(member => (
              <div
                key={member.id}
                title={member.name}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  backgroundColor: member.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '11px',
                  fontWeight: '600',
                  border: '2px solid white',
                  cursor: 'pointer'
                }}
              >
                {member.initials}
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '4px', backgroundColor: '#f3f4f6', padding: '4px', borderRadius: '8px' }}>
            <button
              onClick={() => setViewMode('canvas')}
              style={{
                padding: '6px 12px',
                backgroundColor: viewMode === 'canvas' ? 'white' : 'transparent',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: '500',
                color: viewMode === 'canvas' ? '#3b82f6' : '#6b7280'
              }}
            >
              Canvas
            </button>
            <button
              onClick={() => setViewMode('matrix')}
              style={{
                padding: '6px 12px',
                backgroundColor: viewMode === 'matrix' ? 'white' : 'transparent',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: '500',
                color: viewMode === 'matrix' ? '#3b82f6' : '#6b7280'
              }}
            >
              Matrix
            </button>
            <button
              onClick={() => setViewMode('boards')}
              style={{
                padding: '6px 12px',
                backgroundColor: viewMode === 'boards' ? 'white' : 'transparent',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: '500',
                color: viewMode === 'boards' ? '#3b82f6' : '#6b7280'
              }}
            >
              Boards
            </button>
            <button
              onClick={() => setViewMode('pipeline')}
              style={{
                padding: '6px 12px',
                backgroundColor: viewMode === 'pipeline' ? 'white' : 'transparent',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: '500',
                color: viewMode === 'pipeline' ? '#3b82f6' : '#6b7280'
              }}
            >
              Pipeline
            </button>
          </div>

          {/* User info and logout */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginLeft: '16px' }}>
            <span style={{ fontSize: '14px', color: '#6b7280' }}>{user?.name || user?.email}</span>
            <button
              onClick={onLogout}
              style={{
                padding: '6px 16px',
                backgroundColor: '#ef4444',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {viewMode === 'boards' ? (
          <BoardView projectId={projectId} user={user} />
        ) : viewMode === 'pipeline' ? (
          <PipelineView projectId={projectId} />
        ) : viewMode === 'canvas' ? (
          <>
            {/* Card Palette */}
            <div style={{ width: '260px', backgroundColor: 'white', borderRight: '1px solid #e5e7eb', padding: '16px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px', color: '#111827' }}>Create Card</h3>
              {(['start', 'experiment', 'end'] as NodeType[]).map((type) => (
                <button
                  key={type}
                  onClick={() => addNode(type)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    marginBottom: '8px',
                    backgroundColor: '#f9fafb',
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontSize: '14px',
                    color: '#374151',
                    fontWeight: '500'
                  }}
                >
                  📋 {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}

              <div style={{ marginTop: '20px', borderTop: '1px solid #e5e7eb', paddingTop: '16px' }}>
                <h4 style={{ fontSize: '12px', fontWeight: '600', color: '#6b7280', marginBottom: '8px' }}>TEAM</h4>
                {teamMembers.map(member => (
                  <div
                    key={member.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '6px',
                      marginBottom: '4px'
                    }}
                  >
                    <div style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      backgroundColor: member.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontSize: '10px',
                      fontWeight: '600'
                    }}>
                      {member.initials}
                    </div>
                    <span style={{ fontSize: '13px', color: '#374151' }}>{member.name}</span>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: '16px', padding: '12px', backgroundColor: '#eff6ff', borderRadius: '6px', fontSize: '11px', color: '#1e40af', lineHeight: '1.5' }}>
                💡 <strong>Tips:</strong><br/>
                • Drag cards to move<br/>
                • Drop on container to group<br/>
                • Shift+Click to connect<br/>
                • Click to edit & assign
              </div>
            </div>

            {/* Canvas */}
            <div
              ref={canvasRef}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              style={{
                flex: 1,
                position: 'relative',
                backgroundColor: '#fafafa',
                overflow: 'auto',
                cursor: draggingNodeId ? 'grabbing' : connectingFrom ? 'crosshair' : 'default'
              }}
            >
              {/* Scrollable inner container with large canvas */}
              <div style={{
                position: 'relative',
                minWidth: '3000px',
                minHeight: '3000px',
                backgroundImage: 'radial-gradient(circle, #e5e7eb 1px, transparent 1px)',
                backgroundSize: '20px 20px'
              }}
              >
              {/* Draw connections */}
              <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
                {/* Sort connections by status: gray first, then red, then green (so green renders on top) */}
                {connections
                  .slice()
                  .sort((a, b) => {
                    const getConnectionStatus = (conn: Connection) => {
                      const fromNode = nodes.find(n => n.id === conn.from);
                      const toNode = nodes.find(n => n.id === conn.to);

                      const checkStatus = (node: NodeData | undefined) => {
                        if (node?.type === 'experiment' && node.experimentStatus) {
                          return node.experimentStatus;
                        }
                        return null;
                      };

                      return checkStatus(fromNode) || checkStatus(toNode) || 'pending';
                    };

                    const statusA = getConnectionStatus(a);
                    const statusB = getConnectionStatus(b);

                    // Sort order: pending (0) < failure (1) < success (2)
                    const statusOrder: Record<string, number> = {
                      'pending': 0,
                      'failure': 1,
                      'success': 2
                    };

                    return (statusOrder[statusA] || 0) - (statusOrder[statusB] || 0);
                  })
                  .map(conn => {
                  const fromNode = nodes.find(n => n.id === conn.from);
                  const toNode = nodes.find(n => n.id === conn.to);
                  if (!fromNode || !toNode) return null;

                  const fromX = fromNode.x + 100;
                  const fromY = fromNode.y + 70;
                  const toX = toNode.x + 100;
                  const toY = toNode.y + 70;

                  // Calculate horizontal distance
                  const horizontalDistance = Math.abs(toX - fromX);

                  // If nodes are vertically aligned (within 50px tolerance), draw straight line
                  // Otherwise, draw elbow connector
                  let pathData;
                  if (horizontalDistance < 50) {
                    // Straight vertical line
                    pathData = `M ${fromX} ${fromY} L ${toX} ${toY}`;
                  } else {
                    // Elbow connector (step line)
                    const midY = fromY + (toY - fromY) / 2;
                    pathData = `M ${fromX} ${fromY} L ${fromX} ${midY} L ${toX} ${midY} L ${toX} ${toY}`;
                  }

                  // Determine line color based on experiment status
                  // Check both fromNode and toNode for experiment status
                  let lineColor = '#94a3b8'; // Default gray
                  let arrowMarker = 'url(#arrowhead)';

                  // Check if either the source or target node is an experiment with a status
                  const checkExperimentStatus = (node: NodeData) => {
                    if (node.type === 'experiment' && node.experimentStatus) {
                      return node.experimentStatus;
                    }
                    return null;
                  };

                  const fromStatus = checkExperimentStatus(fromNode);
                  const toStatus = checkExperimentStatus(toNode);

                  // Prioritize the experiment status (from source or target)
                  const experimentStatus = fromStatus || toStatus;

                  if (experimentStatus === 'success') {
                    lineColor = '#10b981'; // Green
                    arrowMarker = 'url(#arrowhead-success)';
                  } else if (experimentStatus === 'failure') {
                    lineColor = '#ef4444'; // Red
                    arrowMarker = 'url(#arrowhead-failure)';
                  }

                  return (
                    <g key={conn.id}>
                      {/* Invisible thick line for easier clicking */}
                      <path
                        d={pathData}
                        stroke="transparent"
                        strokeWidth="12"
                        fill="none"
                        style={{ cursor: 'pointer', pointerEvents: 'auto' }}
                        onClick={async (e) => {
                          e.stopPropagation();
                          if (confirm('Delete this connection?')) {
                            // Delete from backend
                            try {
                              await api.deleteEdge(conn.id);
                            } catch (error) {
                              console.error('Failed to delete connection from backend:', error);
                            }
                            // Update local state
                            setConnections(connections.filter(c => c.id !== conn.id));
                          }
                        }}
                      />
                      {/* Visible line */}
                      <path
                        d={pathData}
                        stroke={lineColor}
                        strokeWidth="2"
                        fill="none"
                        markerEnd={arrowMarker}
                        style={{ pointerEvents: 'none' }}
                      />
                    </g>
                  );
                })}
                <defs>
                  <marker
                    id="arrowhead"
                    markerWidth="10"
                    markerHeight="10"
                    refX="9"
                    refY="3"
                    orient="auto"
                  >
                    <polygon points="0 0, 10 3, 0 6" fill="#94a3b8" />
                  </marker>
                  <marker
                    id="arrowhead-success"
                    markerWidth="10"
                    markerHeight="10"
                    refX="9"
                    refY="3"
                    orient="auto"
                  >
                    <polygon points="0 0, 10 3, 0 6" fill="#10b981" />
                  </marker>
                  <marker
                    id="arrowhead-failure"
                    markerWidth="10"
                    markerHeight="10"
                    refX="9"
                    refY="3"
                    orient="auto"
                  >
                    <polygon points="0 0, 10 3, 0 6" fill="#ef4444" />
                  </marker>
                </defs>
              </svg>

              {/* Render Card Nodes */}
              {nodes.filter(n => !n.parentId).map((node) => (
                <div
                  key={node.id}
                  onMouseDown={(e) => {
                    if (e.shiftKey) {
                      if (connectingFrom) {
                        completeConnection(e, node.id);
                      } else {
                        startConnection(e, node.id);
                      }
                    } else {
                      handleMouseDown(e, node.id);
                    }
                  }}
                  onClick={(e) => {
                    if (!e.shiftKey && !draggingNodeId) {
                      setSelectedNodeId(node.id);
                    }
                  }}
                  style={{
                    position: 'absolute',
                    left: node.x,
                    top: node.y,
                    width: node.type === 'container' ? '600px' : '200px',
                    minHeight: node.type === 'container' ? '300px' : 'auto',
                    backgroundColor: node.type === 'container'
                      ? '#f9fafb'
                      : node.type === 'experiment' && node.experimentStatus
                      ? EXPERIMENT_STATUS_COLORS[node.experimentStatus]
                      : 'white',
                    border: selectedNodeId === node.id
                      ? '2px solid #3b82f6'
                      : connectingFrom === node.id
                      ? '2px solid #10b981'
                      : node.type === 'container'
                      ? '3px dashed #8b5cf6'
                      : node.type === 'experiment' && node.experimentStatus === 'success'
                      ? '2px solid #10b981'
                      : node.type === 'experiment' && node.experimentStatus === 'failure'
                      ? '2px solid #ef4444'
                      : '1px solid #e5e7eb',
                    borderRadius: '8px',
                    cursor: draggingNodeId === node.id ? 'grabbing' : node.type === 'container' ? 'move' : 'grab',
                    boxShadow: draggingNodeId === node.id
                      ? '0 10px 25px rgba(0,0,0,0.15)'
                      : '0 1px 3px rgba(0,0,0,0.1)',
                    userSelect: 'none',
                    overflow: 'visible'
                  }}
                >
                  {/* Card Header */}
                  <div style={{
                    padding: '10px 12px',
                    borderBottom: '1px solid #f3f4f6',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    backgroundColor: '#fafafa'
                  }}>
                    <div style={{
                      fontSize: '10px',
                      fontWeight: '600',
                      color: '#6b7280',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>
                      {node.type}
                    </div>
                    <div style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: PRIORITY_COLORS[node.priority]
                    }} title={`Priority: ${node.priority}`} />
                  </div>

                  {/* Card Body */}
                  <div style={{ padding: '12px' }}>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: '#111827', marginBottom: '6px' }}>
                      {node.label}
                    </div>
                    {node.description && (
                      <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px', lineHeight: '1.4' }}>
                        {node.description.slice(0, 60)}{node.description.length > 60 ? '...' : ''}
                      </div>
                    )}

                    {/* Status Badge */}
                    <div style={{
                      display: 'inline-block',
                      padding: '3px 8px',
                      backgroundColor: `${STATUS_COLORS[node.status]}20`,
                      color: STATUS_COLORS[node.status],
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: '600',
                      marginBottom: '8px'
                    }}>
                      {node.status.replace('_', ' ').toUpperCase()}
                    </div>

                    {/* Experiment Info Display */}
                    {node.type === 'experiment' && node.hypothesis && (
                      <div style={{
                        marginTop: '8px',
                        padding: '8px',
                        backgroundColor: '#eff6ff',
                        borderLeft: '3px solid #6366f1',
                        borderRadius: '4px',
                        fontSize: '11px'
                      }}>
                        <div style={{ fontWeight: '600', color: '#4338ca', marginBottom: '4px' }}>
                          Hypothesis
                        </div>
                        <div style={{ color: '#475569', lineHeight: '1.3' }}>
                          {node.hypothesis.slice(0, 50)}{node.hypothesis.length > 50 ? '...' : ''}
                        </div>
                        {node.experimentId && (
                          <div style={{ marginTop: '6px', fontSize: '10px', color: '#6366f1', fontWeight: '500' }}>
                            ID: {node.experimentId}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Container Drop Zone */}
                    {node.type === 'container' && (
                      <div style={{
                        marginTop: '12px',
                        padding: '16px',
                        backgroundColor: 'white',
                        border: '2px dashed #c7d2fe',
                        borderRadius: '6px',
                        minHeight: '180px',
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '12px',
                        alignContent: 'flex-start'
                      }}>
                        {node.childrenIds && node.childrenIds.length > 0 ? (
                          node.childrenIds.map((childId) => {
                            const childNode = nodes.find(n => n.id === childId);
                            if (!childNode) return null;
                            return (
                              <div
                                key={childId}
                                style={{
                                  width: '160px',
                                  padding: '8px',
                                  backgroundColor: childNode.type === 'experiment' && childNode.experimentStatus
                                    ? EXPERIMENT_STATUS_COLORS[childNode.experimentStatus]
                                    : 'white',
                                  border: selectedNodeId === childId
                                    ? '2px solid #3b82f6'
                                    : childNode.type === 'experiment' && childNode.experimentStatus === 'success'
                                    ? '2px solid #10b981'
                                    : childNode.type === 'experiment' && childNode.experimentStatus === 'failure'
                                    ? '2px solid #ef4444'
                                    : '1px solid #e5e7eb',
                                  borderRadius: '6px',
                                  boxShadow: selectedNodeId === childId
                                    ? '0 0 0 3px rgba(59, 130, 246, 0.1)'
                                    : '0 1px 2px rgba(0,0,0,0.05)',
                                  cursor: 'pointer',
                                  position: 'relative',
                                  transition: 'all 0.2s'
                                }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedNodeId(childId);
                                }}
                              >
                                {/* Remove from container button */}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    // Remove from container
                                    setNodes(nodes.map(n => {
                                      if (n.id === node.id) {
                                        return {
                                          ...n,
                                          childrenIds: (n.childrenIds || []).filter(id => id !== childId)
                                        };
                                      }
                                      if (n.id === childId) {
                                        const { parentId, ...rest } = n;
                                        return { ...rest };
                                      }
                                      return n;
                                    }));
                                  }}
                                  style={{
                                    position: 'absolute',
                                    top: '4px',
                                    right: '4px',
                                    width: '18px',
                                    height: '18px',
                                    padding: 0,
                                    backgroundColor: '#ef4444',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '50%',
                                    fontSize: '10px',
                                    fontWeight: 'bold',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    opacity: 0.8,
                                    transition: 'opacity 0.2s'
                                  }}
                                  onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                                  onMouseLeave={(e) => e.currentTarget.style.opacity = '0.8'}
                                  title="Remove from container"
                                >
                                  ×
                                </button>

                                <div style={{ fontSize: '11px', fontWeight: '600', color: '#111827', marginBottom: '4px', paddingRight: '20px' }}>
                                  {childNode.label}
                                </div>
                                <div style={{ fontSize: '9px', color: '#6b7280', textTransform: 'uppercase' }}>
                                  {childNode.type}
                                </div>
                                {childNode.type === 'experiment' && childNode.experimentStatus && (
                                  <div style={{
                                    marginTop: '4px',
                                    padding: '2px 6px',
                                    backgroundColor: childNode.experimentStatus === 'success' ? '#dcfce7' : childNode.experimentStatus === 'failure' ? '#fee2e2' : '#f3f4f6',
                                    color: childNode.experimentStatus === 'success' ? '#166534' : childNode.experimentStatus === 'failure' ? '#991b1b' : '#6b7280',
                                    borderRadius: '3px',
                                    fontSize: '9px',
                                    fontWeight: '600',
                                    textAlign: 'center'
                                  }}>
                                    {childNode.experimentStatus.toUpperCase()}
                                  </div>
                                )}
                                {selectedNodeId === childId && (
                                  <div style={{
                                    marginTop: '6px',
                                    padding: '4px 6px',
                                    backgroundColor: '#eff6ff',
                                    borderRadius: '4px',
                                    fontSize: '9px',
                                    color: '#3b82f6',
                                    fontWeight: '600',
                                    textAlign: 'center'
                                  }}>
                                    SELECTED - Edit in sidebar →
                                  </div>
                                )}
                              </div>
                            );
                          })
                        ) : (
                          <div style={{
                            width: '100%',
                            textAlign: 'center',
                            padding: '40px 20px',
                            color: '#9ca3af',
                            fontSize: '12px'
                          }}>
                            <div style={{ marginBottom: '8px', fontSize: '24px' }}>📁</div>
                            <div style={{ fontWeight: '500', marginBottom: '4px' }}>Drop experiments here</div>
                            <div style={{ fontSize: '11px' }}>Drag and drop experiment cards into this container</div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Card Footer */}
                  <div style={{
                    padding: '8px 12px',
                    borderTop: '1px solid #f3f4f6',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <div style={{ display: 'flex', gap: '6px', fontSize: '11px', color: '#6b7280' }}>
                      <span>E:{node.effort}</span>
                      <span>V:{node.value}</span>
                    </div>

                    {/* Assignees */}
                    <div style={{ display: 'flex', gap: '4px' }}>
                      {(Array.isArray(node.assignees) ? node.assignees : []).slice(0, 3).map(assigneeId => {
                        const member = teamMembers.find(m => m.id === assigneeId);
                        if (!member) return null;
                        return (
                          <div
                            key={member.id}
                            title={member.name}
                            style={{
                              width: '20px',
                              height: '20px',
                              borderRadius: '50%',
                              backgroundColor: member.color,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'white',
                              fontSize: '9px',
                              fontWeight: '600',
                              border: '1px solid white'
                            }}
                          >
                            {member.initials}
                          </div>
                        );
                      })}
                      {Array.isArray(node.assignees) && node.assignees.length > 3 && (
                        <div style={{
                          width: '20px',
                          height: '20px',
                          borderRadius: '50%',
                          backgroundColor: '#e5e7eb',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '9px',
                          fontWeight: '600',
                          color: '#6b7280'
                        }}>
                          +{node.assignees.length - 3}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {nodes.length === 0 && (
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  textAlign: 'center',
                  color: '#9ca3af'
                }}>
                  <p style={{ fontSize: '16px', fontWeight: '500', marginBottom: '8px' }}>No cards yet</p>
                  <p style={{ fontSize: '14px' }}>Create cards from the left panel</p>
                  <p style={{ fontSize: '12px', marginTop: '12px' }}>Drag to move • Shift+Click to connect</p>
                </div>
              )}
              </div>
            </div>

            {/* Card Editor */}
            <div style={{ width: '380px', backgroundColor: 'white', borderLeft: '1px solid #e5e7eb', padding: '20px', overflowY: 'auto' }}>
              {selectedNode ? (
                <>
                  <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px', color: '#111827' }}>Edit Card</h3>

                  {/* Tabs */}
                  <div style={{
                    display: 'flex',
                    gap: '4px',
                    backgroundColor: '#f3f4f6',
                    padding: '4px',
                    borderRadius: '8px',
                    marginBottom: '16px'
                  }}>
                    <button
                      onClick={() => setEditorTab('details')}
                      style={{
                        flex: 1,
                        padding: '8px',
                        backgroundColor: editorTab === 'details' ? 'white' : 'transparent',
                        border: 'none',
                        borderRadius: '6px',
                        fontWeight: '600',
                        fontSize: '12px',
                        color: editorTab === 'details' ? '#3b82f6' : '#6b7280',
                        cursor: 'pointer'
                      }}
                    >
                      Details
                    </button>
                    <button
                      onClick={() => setEditorTab('models')}
                      style={{
                        flex: 1,
                        padding: '8px',
                        backgroundColor: editorTab === 'models' ? 'white' : 'transparent',
                        border: 'none',
                        borderRadius: '6px',
                        fontWeight: '600',
                        fontSize: '12px',
                        color: editorTab === 'models' ? '#3b82f6' : '#6b7280',
                        cursor: 'pointer'
                      }}
                    >
                      Models ({models.length})
                    </button>
                    <button
                      onClick={() => setEditorTab('comments')}
                      style={{
                        flex: 1,
                        padding: '8px',
                        backgroundColor: editorTab === 'comments' ? 'white' : 'transparent',
                        border: 'none',
                        borderRadius: '6px',
                        fontWeight: '600',
                        fontSize: '12px',
                        color: editorTab === 'comments' ? '#3b82f6' : '#6b7280',
                        cursor: 'pointer'
                      }}
                    >
                      Comments ({comments.length})
                    </button>
                    <button
                      onClick={() => setEditorTab('tracking')}
                      style={{
                        flex: 1,
                        padding: '8px',
                        backgroundColor: editorTab === 'tracking' ? 'white' : 'transparent',
                        border: 'none',
                        borderRadius: '6px',
                        fontWeight: '600',
                        fontSize: '12px',
                        color: editorTab === 'tracking' ? '#3b82f6' : '#6b7280',
                        cursor: 'pointer'
                      }}
                    >
                      Tracking
                    </button>
                  </div>

                  {/* Details Tab */}
                  {editorTab === 'details' && (
                  <div>
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ fontSize: '12px', fontWeight: '600', display: 'block', marginBottom: '6px', color: '#374151' }}>Title</label>
                    <input
                      type="text"
                      value={selectedNode.label}
                      onChange={(e) => {
                        setNodes(nodes.map(n =>
                          n.id === selectedNodeId ? { ...n, label: e.target.value } : n
                        ));
                      }}
                      style={{ width: '100%', padding: '8px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '14px' }}
                    />
                  </div>

                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ fontSize: '12px', fontWeight: '600', display: 'block', marginBottom: '6px', color: '#374151' }}>Description</label>
                    <textarea
                      value={selectedNode.description}
                      onChange={(e) => {
                        setNodes(nodes.map(n =>
                          n.id === selectedNodeId ? { ...n, description: e.target.value } : n
                        ));
                      }}
                      rows={3}
                      style={{ width: '100%', padding: '8px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '13px', resize: 'vertical' }}
                      placeholder="Add description..."
                    />
                  </div>

                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ fontSize: '12px', fontWeight: '600', display: 'block', marginBottom: '6px', color: '#374151' }}>Status</label>
                    <select
                      value={selectedNode.status}
                      onChange={(e) => {
                        setNodes(nodes.map(n =>
                          n.id === selectedNodeId ? { ...n, status: e.target.value as CardStatus } : n
                        ));
                      }}
                      style={{ width: '100%', padding: '8px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '13px' }}
                    >
                      <option value="todo">To Do</option>
                      <option value="in_progress">In Progress</option>
                      <option value="review">Review</option>
                      <option value="done">Done</option>
                    </select>
                  </div>

                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ fontSize: '12px', fontWeight: '600', display: 'block', marginBottom: '6px', color: '#374151' }}>Priority</label>
                    <select
                      value={selectedNode.priority}
                      onChange={(e) => {
                        setNodes(nodes.map(n =>
                          n.id === selectedNodeId ? { ...n, priority: e.target.value as Priority } : n
                        ));
                      }}
                      style={{ width: '100%', padding: '8px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '13px' }}
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="critical">Critical</option>
                    </select>
                  </div>

                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ fontSize: '12px', fontWeight: '600', display: 'block', marginBottom: '8px', color: '#374151' }}>
                      Assign To
                    </label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {teamMembers.map(member => {
                        const isAssigned = selectedNode.assignees.includes(member.id);
                        return (
                          <div
                            key={member.id}
                            onClick={() => toggleAssignee(selectedNodeId!, member.id)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              padding: '8px',
                              backgroundColor: isAssigned ? `${member.color}15` : '#f9fafb',
                              border: isAssigned ? `2px solid ${member.color}` : '1px solid #e5e7eb',
                              borderRadius: '6px',
                              cursor: 'pointer'
                            }}
                          >
                            <div style={{
                              width: '28px',
                              height: '28px',
                              borderRadius: '50%',
                              backgroundColor: member.color,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'white',
                              fontSize: '11px',
                              fontWeight: '600'
                            }}>
                              {member.initials}
                            </div>
                            <span style={{ fontSize: '13px', color: '#374151', fontWeight: isAssigned ? '600' : '400' }}>
                              {member.name}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ fontSize: '12px', fontWeight: '600', display: 'block', marginBottom: '6px', color: '#374151' }}>
                      Effort (Story Points): {selectedNode.effort}
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={selectedNode.effort}
                      onChange={(e) => {
                        setNodes(nodes.map(n =>
                          n.id === selectedNodeId ? { ...n, effort: parseInt(e.target.value) } : n
                        ));
                      }}
                      style={{ width: '100%' }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#9ca3af', marginTop: '4px' }}>
                      <span>1 (Easy)</span>
                      <span>10 (Complex)</span>
                    </div>
                  </div>

                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ fontSize: '12px', fontWeight: '600', display: 'block', marginBottom: '6px', color: '#374151' }}>
                      Value (Impact): {selectedNode.value}
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={selectedNode.value}
                      onChange={(e) => {
                        setNodes(nodes.map(n =>
                          n.id === selectedNodeId ? { ...n, value: parseInt(e.target.value) } : n
                        ));
                      }}
                      style={{ width: '100%' }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#9ca3af', marginTop: '4px' }}>
                      <span>1 (Low)</span>
                      <span>10 (High)</span>
                    </div>
                  </div>

                  {/* Dataset Section for Start Cards */}
                  {selectedNode.type === 'start' && (
                    <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '2px solid #e5e7eb' }}>
                      <h4 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px', color: '#10b981' }}>
                        📊 Dataset Management
                      </h4>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <div style={{ fontSize: '12px', fontWeight: '600', color: '#374151' }}>Linked Datasets</div>
                        <button
                          onClick={() => setShowDatasetModal(true)}
                          style={{
                            padding: '4px 8px',
                            backgroundColor: '#10b981',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: '600',
                            cursor: 'pointer'
                          }}
                        >
                          + Link Dataset
                        </button>
                      </div>

                      {/* Show available datasets */}
                      <div style={{ marginBottom: '16px' }}>
                        {datasets.length === 0 ? (
                          <div style={{ textAlign: 'center', padding: '20px', backgroundColor: '#f9fafb', borderRadius: '6px', border: '1px dashed #e5e7eb' }}>
                            <p style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '8px' }}>No datasets in project</p>
                            <button
                              onClick={async () => {
                                const name = prompt('Dataset name:');
                                const version = prompt('Dataset version:', 'v1.0');
                                const location = prompt('Dataset location (path/URL):');
                                if (name && version && location) {
                                  try {
                                    const dataset = await api.createDataset({
                                      projectId,
                                      name,
                                      version,
                                      location
                                    });
                                    setDatasets([...datasets, dataset]);
                                    await api.linkDataset(selectedNodeId!, dataset.id, 'input');
                                    alert('Dataset created and linked!');
                                  } catch (error) {
                                    console.error('Failed to create dataset:', error);
                                    alert('Failed to create dataset');
                                  }
                                }
                              }}
                              style={{
                                padding: '6px 12px',
                                backgroundColor: '#10b981',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                fontSize: '12px',
                                fontWeight: '600',
                                cursor: 'pointer'
                              }}
                            >
                              Create Dataset
                            </button>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {datasets.map((dataset: any) => (
                              <div
                                key={dataset.id}
                                style={{
                                  padding: '10px',
                                  backgroundColor: '#f9fafb',
                                  borderRadius: '6px',
                                  border: '1px solid #e5e7eb'
                                }}
                              >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '6px' }}>
                                  <div>
                                    <div style={{ fontSize: '13px', fontWeight: '600', color: '#111827' }}>{dataset.name}</div>
                                    <div style={{ fontSize: '11px', color: '#6b7280' }}>{dataset.version}</div>
                                  </div>
                                  <button
                                    onClick={async () => {
                                      try {
                                        await api.linkDataset(selectedNodeId!, dataset.id, 'input');
                                        alert('Dataset linked to card!');
                                      } catch (error) {
                                        console.error('Failed to link dataset:', error);
                                        alert('Failed to link dataset');
                                      }
                                    }}
                                    style={{
                                      padding: '3px 8px',
                                      backgroundColor: '#10b981',
                                      color: 'white',
                                      border: 'none',
                                      borderRadius: '4px',
                                      fontSize: '10px',
                                      fontWeight: '600',
                                      cursor: 'pointer'
                                    }}
                                  >
                                    Link
                                  </button>
                                </div>
                                <div style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '4px', wordBreak: 'break-all' }}>
                                  📍 {dataset.location}
                                </div>
                                {dataset.size && (
                                  <div style={{ fontSize: '10px', color: '#9ca3af' }}>
                                    Size: {(dataset.size / 1024 / 1024).toFixed(2)} MB
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Quick add dataset form */}
                      <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #e5e7eb' }}>
                        <div style={{ fontSize: '12px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
                          Quick Add Dataset
                        </div>
                        <button
                          onClick={async () => {
                            const name = prompt('Dataset name:');
                            const version = prompt('Dataset version:', 'v1.0');
                            const location = prompt('Dataset location (path/URL):');
                            if (name && version && location) {
                              try {
                                const dataset = await api.createDataset({
                                  projectId,
                                  name,
                                  version,
                                  location
                                });
                                setDatasets([...datasets, dataset]);
                                await api.linkDataset(selectedNodeId!, dataset.id, 'input');
                                alert('Dataset created and linked!');
                              } catch (error) {
                                console.error('Failed to create dataset:', error);
                                alert('Failed to create dataset');
                              }
                            }
                          }}
                          style={{
                            width: '100%',
                            padding: '8px',
                            backgroundColor: '#f9fafb',
                            color: '#10b981',
                            border: '1px solid #10b981',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: '600',
                            cursor: 'pointer'
                          }}
                        >
                          + Add New Dataset
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Experiment Tracking Section */}
                  {selectedNode.type === 'experiment' && (
                    <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '2px solid #e5e7eb' }}>
                      <h4 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px', color: '#6366f1' }}>
                        Experiment Tracking
                      </h4>

                      <div style={{ marginBottom: '16px' }}>
                        <label style={{ fontSize: '12px', fontWeight: '600', display: 'block', marginBottom: '6px', color: '#374151' }}>
                          Hypothesis
                        </label>
                        <textarea
                          value={selectedNode.hypothesis || ''}
                          onChange={(e) => {
                            setNodes(nodes.map(n =>
                              n.id === selectedNodeId ? { ...n, hypothesis: e.target.value } : n
                            ));
                          }}
                          rows={2}
                          style={{ width: '100%', padding: '8px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '13px', resize: 'vertical' }}
                          placeholder="What are you testing?"
                        />
                      </div>

                      <div style={{ marginBottom: '16px' }}>
                        <label style={{ fontSize: '12px', fontWeight: '600', display: 'block', marginBottom: '6px', color: '#374151' }}>
                          Expected Outcome
                        </label>
                        <textarea
                          value={selectedNode.expectedOutcome || ''}
                          onChange={(e) => {
                            setNodes(nodes.map(n =>
                              n.id === selectedNodeId ? { ...n, expectedOutcome: e.target.value } : n
                            ));
                          }}
                          rows={2}
                          style={{ width: '100%', padding: '8px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '13px', resize: 'vertical' }}
                          placeholder="What do you expect to happen?"
                        />
                      </div>

                      <div style={{ marginBottom: '16px' }}>
                        <label style={{ fontSize: '12px', fontWeight: '600', display: 'block', marginBottom: '6px', color: '#374151' }}>
                          Actual Result
                        </label>
                        <textarea
                          value={selectedNode.actualResult || ''}
                          onChange={(e) => {
                            setNodes(nodes.map(n =>
                              n.id === selectedNodeId ? { ...n, actualResult: e.target.value } : n
                            ));
                          }}
                          rows={2}
                          style={{ width: '100%', padding: '8px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '13px', resize: 'vertical' }}
                          placeholder="What actually happened?"
                        />
                      </div>

                      <div style={{ marginBottom: '16px' }}>
                        <label style={{ fontSize: '12px', fontWeight: '600', display: 'block', marginBottom: '8px', color: '#374151' }}>
                          Experiment Metrics
                        </label>

                        {/* Metrics Table */}
                        {selectedNode.metrics && Object.keys(selectedNode.metrics).length > 0 && (
                          <div style={{
                            marginBottom: '12px',
                            border: '1px solid #e5e7eb',
                            borderRadius: '6px',
                            overflow: 'hidden'
                          }}>
                            <table style={{
                              width: '100%',
                              borderCollapse: 'collapse',
                              fontSize: '13px'
                            }}>
                              <thead>
                                <tr style={{ backgroundColor: '#f9fafb' }}>
                                  <th style={{
                                    padding: '8px 12px',
                                    textAlign: 'left',
                                    fontWeight: '600',
                                    color: '#374151',
                                    borderBottom: '1px solid #e5e7eb'
                                  }}>
                                    Metric
                                  </th>
                                  <th style={{
                                    padding: '8px 12px',
                                    textAlign: 'left',
                                    fontWeight: '600',
                                    color: '#374151',
                                    borderBottom: '1px solid #e5e7eb'
                                  }}>
                                    Value
                                  </th>
                                  <th style={{
                                    padding: '8px 12px',
                                    width: '60px',
                                    borderBottom: '1px solid #e5e7eb'
                                  }}></th>
                                </tr>
                              </thead>
                              <tbody>
                                {Object.entries(selectedNode.metrics).map(([key, value]) => (
                                  <tr key={key} style={{ borderBottom: '1px solid #f3f4f6' }}>
                                    <td style={{
                                      padding: '10px 12px',
                                      color: '#374151',
                                      fontWeight: '500'
                                    }}>
                                      {key}
                                    </td>
                                    <td style={{
                                      padding: '10px 12px',
                                      color: '#6b7280'
                                    }}>
                                      {String(value)}
                                    </td>
                                    <td style={{
                                      padding: '10px 12px',
                                      textAlign: 'center'
                                    }}>
                                      <button
                                        onClick={() => handleDeleteMetric(key)}
                                        style={{
                                          background: 'none',
                                          border: 'none',
                                          color: '#ef4444',
                                          cursor: 'pointer',
                                          fontSize: '14px',
                                          padding: '4px'
                                        }}
                                        title="Delete metric"
                                      >
                                        ✕
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}

                        {/* Add New Metric */}
                        <div style={{
                          display: 'flex',
                          gap: '8px',
                          alignItems: 'flex-end'
                        }}>
                          <div style={{ flex: 1 }}>
                            <input
                              type="text"
                              value={newMetricKey}
                              onChange={(e) => setNewMetricKey(e.target.value)}
                              placeholder="Metric name (e.g., Accuracy)"
                              style={{
                                width: '100%',
                                padding: '8px',
                                border: '1px solid #e5e7eb',
                                borderRadius: '6px',
                                fontSize: '13px'
                              }}
                            />
                          </div>
                          <div style={{ flex: 1 }}>
                            <input
                              type="text"
                              value={newMetricValue}
                              onChange={(e) => setNewMetricValue(e.target.value)}
                              placeholder="Value (e.g., 0.95)"
                              style={{
                                width: '100%',
                                padding: '8px',
                                border: '1px solid #e5e7eb',
                                borderRadius: '6px',
                                fontSize: '13px'
                              }}
                            />
                          </div>
                          <button
                            onClick={handleAddMetric}
                            disabled={!newMetricKey.trim() || !newMetricValue.trim()}
                            style={{
                              padding: '8px 16px',
                              backgroundColor: newMetricKey.trim() && newMetricValue.trim() ? '#3b82f6' : '#e5e7eb',
                              color: newMetricKey.trim() && newMetricValue.trim() ? 'white' : '#9ca3af',
                              border: 'none',
                              borderRadius: '6px',
                              fontSize: '13px',
                              fontWeight: '500',
                              cursor: newMetricKey.trim() && newMetricValue.trim() ? 'pointer' : 'not-allowed',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            + Add
                          </button>
                        </div>
                      </div>

                      <div style={{ marginBottom: '16px' }}>
                        <label style={{ fontSize: '12px', fontWeight: '600', display: 'block', marginBottom: '6px', color: '#374151' }}>
                          Key Learnings
                        </label>
                        <textarea
                          value={selectedNode.learnings || ''}
                          onChange={(e) => {
                            setNodes(nodes.map(n =>
                              n.id === selectedNodeId ? { ...n, learnings: e.target.value } : n
                            ));
                          }}
                          rows={3}
                          style={{ width: '100%', padding: '8px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '13px', resize: 'vertical' }}
                          placeholder="What did you learn from this experiment?"
                        />
                      </div>

                      <div style={{ marginBottom: '16px' }}>
                        <label style={{ fontSize: '12px', fontWeight: '600', display: 'block', marginBottom: '6px', color: '#374151' }}>
                          Experiment ID
                        </label>
                        <input
                          type="text"
                          value={selectedNode.experimentId || ''}
                          onChange={(e) => {
                            setNodes(nodes.map(n =>
                              n.id === selectedNodeId ? { ...n, experimentId: e.target.value } : n
                            ));
                          }}
                          style={{ width: '100%', padding: '8px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '14px' }}
                          placeholder="MLflow/W&B experiment ID"
                        />
                      </div>

                      <div style={{ marginBottom: '16px' }}>
                        <label style={{ fontSize: '12px', fontWeight: '600', display: 'block', marginBottom: '6px', color: '#374151' }}>
                          Jupyter Notebook
                        </label>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {!selectedNode.notebookFilename && (
                            <input
                              type="file"
                              accept=".ipynb"
                              onChange={handleNotebookUpload}
                              disabled={uploadingNotebook}
                              style={{
                                padding: '8px',
                                border: '1px solid #e5e7eb',
                                borderRadius: '6px',
                                fontSize: '13px',
                                cursor: uploadingNotebook ? 'not-allowed' : 'pointer'
                              }}
                            />
                          )}
                          {uploadingNotebook && (
                            <div style={{ fontSize: '12px', color: '#3b82f6' }}>
                              Uploading and converting notebook...
                            </div>
                          )}
                          {selectedNode.notebookFilename && (
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '8px 12px',
                              backgroundColor: '#f0fdf4',
                              border: '1px solid #86efac',
                              borderRadius: '6px'
                            }}>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontSize: '13px', fontWeight: '500', color: '#15803d' }}>
                                  📓 {selectedNode.notebookFilename}
                                </div>
                                <div style={{ fontSize: '11px', color: '#16a34a', marginTop: '2px' }}>
                                  Notebook uploaded
                                </div>
                              </div>
                              <div style={{ display: 'flex', gap: '8px' }}>
                                <button
                                  onClick={() => setShowNotebookViewer(true)}
                                  style={{
                                    padding: '6px 12px',
                                    backgroundColor: '#3b82f6',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    fontSize: '12px',
                                    fontWeight: '500',
                                    cursor: 'pointer'
                                  }}
                                >
                                  View
                                </button>
                                <button
                                  onClick={handleDeleteNotebook}
                                  style={{
                                    padding: '6px 12px',
                                    backgroundColor: '#ef4444',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    fontSize: '12px',
                                    fontWeight: '500',
                                    cursor: 'pointer'
                                  }}
                                  title="Delete notebook"
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      <div style={{ marginBottom: '16px' }}>
                        <label style={{ fontSize: '12px', fontWeight: '600', display: 'block', marginBottom: '10px', color: '#374151' }}>
                          Experiment Status
                        </label>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            onClick={() => {
                              setNodes(nodes.map(n =>
                                n.id === selectedNodeId ? { ...n, experimentStatus: 'success' } : n
                              ));
                            }}
                            style={{
                              flex: 1,
                              padding: '10px',
                              border: selectedNode.experimentStatus === 'success' ? '2px solid #10b981' : '1px solid #e5e7eb',
                              borderRadius: '6px',
                              backgroundColor: selectedNode.experimentStatus === 'success' ? '#dcfce7' : 'white',
                              color: selectedNode.experimentStatus === 'success' ? '#059669' : '#6b7280',
                              fontWeight: selectedNode.experimentStatus === 'success' ? '600' : '400',
                              fontSize: '13px',
                              cursor: 'pointer',
                              transition: 'all 0.2s'
                            }}
                          >
                            ✓ Success
                          </button>
                          <button
                            onClick={() => {
                              setNodes(nodes.map(n =>
                                n.id === selectedNodeId ? { ...n, experimentStatus: 'pending' } : n
                              ));
                            }}
                            style={{
                              flex: 1,
                              padding: '10px',
                              border: selectedNode.experimentStatus === 'pending' || !selectedNode.experimentStatus ? '2px solid #6b7280' : '1px solid #e5e7eb',
                              borderRadius: '6px',
                              backgroundColor: selectedNode.experimentStatus === 'pending' || !selectedNode.experimentStatus ? '#f3f4f6' : 'white',
                              color: selectedNode.experimentStatus === 'pending' || !selectedNode.experimentStatus ? '#374151' : '#6b7280',
                              fontWeight: selectedNode.experimentStatus === 'pending' || !selectedNode.experimentStatus ? '600' : '400',
                              fontSize: '13px',
                              cursor: 'pointer',
                              transition: 'all 0.2s'
                            }}
                          >
                            ⧗ Pending
                          </button>
                          <button
                            onClick={() => {
                              setNodes(nodes.map(n =>
                                n.id === selectedNodeId ? { ...n, experimentStatus: 'failure' } : n
                              ));
                            }}
                            style={{
                              flex: 1,
                              padding: '10px',
                              border: selectedNode.experimentStatus === 'failure' ? '2px solid #ef4444' : '1px solid #e5e7eb',
                              borderRadius: '6px',
                              backgroundColor: selectedNode.experimentStatus === 'failure' ? '#fee2e2' : 'white',
                              color: selectedNode.experimentStatus === 'failure' ? '#dc2626' : '#6b7280',
                              fontWeight: selectedNode.experimentStatus === 'failure' ? '600' : '400',
                              fontSize: '13px',
                              cursor: 'pointer',
                              transition: 'all 0.2s'
                            }}
                          >
                            ✕ Failure
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  <button
                    onClick={async () => {
                      if (!selectedNodeId) return;

                      if (confirm('Are you sure you want to delete this card?')) {
                        // Delete from backend first
                        try {
                          await api.deleteNode(selectedNodeId);

                          // Also delete any connections to/from this node
                          const edgesToDelete = connections.filter(
                            c => c.from === selectedNodeId || c.to === selectedNodeId
                          );
                          await Promise.all(
                            edgesToDelete.map(edge => api.deleteEdge(edge.id))
                          );
                        } catch (error) {
                          console.error('Failed to delete node from backend:', error);
                        }

                        // Then update local state
                        setNodes(nodes.filter(n => n.id !== selectedNodeId));
                        setConnections(connections.filter(c => c.from !== selectedNodeId && c.to !== selectedNodeId));
                        setSelectedNodeId(null);
                      }
                    }}
                    style={{
                      width: '100%',
                      padding: '10px',
                      backgroundColor: '#ef4444',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      marginTop: '8px',
                      fontWeight: '500'
                    }}
                  >
                    Delete Card
                  </button>
                  </div>
                  )}

                  {/* Models Tab */}
                  {editorTab === 'models' && (
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#111827', margin: 0 }}>Model Registry</h4>
                        <button
                          onClick={() => setShowModelModal(true)}
                          style={{
                            padding: '6px 12px',
                            backgroundColor: '#3b82f6',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: '600',
                            cursor: 'pointer'
                          }}
                        >
                          + Add Model
                        </button>
                      </div>

                      {models.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '40px 20px', backgroundColor: '#f9fafb', borderRadius: '8px', border: '1px dashed #e5e7eb' }}>
                          <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>No models yet</p>
                          <p style={{ fontSize: '12px', color: '#9ca3af' }}>Add models to track different versions</p>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          {models.map((model: any) => (
                            <div
                              key={model.id}
                              style={{
                                padding: '12px',
                                backgroundColor: model.isChampion ? '#eff6ff' : '#f9fafb',
                                border: model.isChampion ? '2px solid #3b82f6' : '1px solid #e5e7eb',
                                borderRadius: '8px'
                              }}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                                <div>
                                  <div style={{ fontSize: '14px', fontWeight: '600', color: '#111827' }}>{model.name}</div>
                                  <div style={{ fontSize: '12px', color: '#6b7280' }}>v{model.version}</div>
                                </div>
                                {model.isChampion && (
                                  <span style={{
                                    padding: '2px 8px',
                                    backgroundColor: '#3b82f6',
                                    color: 'white',
                                    borderRadius: '4px',
                                    fontSize: '10px',
                                    fontWeight: '600'
                                  }}>
                                    CHAMPION
                                  </span>
                                )}
                              </div>
                              {model.framework && (
                                <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '4px' }}>
                                  Framework: {model.framework}
                                </div>
                              )}
                              <div style={{
                                display: 'inline-block',
                                padding: '3px 8px',
                                backgroundColor: model.deploymentStatus === 'production' ? '#dcfce7' : '#f3f4f6',
                                color: model.deploymentStatus === 'production' ? '#166534' : '#6b7280',
                                borderRadius: '4px',
                                fontSize: '11px',
                                fontWeight: '600'
                              }}>
                                {model.deploymentStatus.toUpperCase()}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Comments Tab */}
                  {editorTab === 'comments' && (
                    <div>
                      <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#111827', marginBottom: '16px' }}>Comments</h4>

                      {/* Add Comment Form */}
                      <div style={{ marginBottom: '16px' }}>
                        <textarea
                          placeholder="Add a comment..."
                          style={{
                            width: '100%',
                            padding: '8px',
                            border: '1px solid #e5e7eb',
                            borderRadius: '6px',
                            fontSize: '13px',
                            resize: 'vertical',
                            minHeight: '60px'
                          }}
                          onKeyDown={async (e) => {
                            if (e.key === 'Enter' && e.ctrlKey) {
                              const content = e.currentTarget.value.trim();
                              if (content) {
                                try {
                                  const newComment = await api.createComment(selectedNodeId!, content);
                                  setComments([...comments, newComment]);
                                  e.currentTarget.value = '';
                                } catch (error) {
                                  console.error('Failed to create comment:', error);
                                  alert('Failed to create comment');
                                }
                              }
                            }
                          }}
                        />
                        <p style={{ fontSize: '11px', color: '#9ca3af', marginTop: '4px' }}>Press Ctrl+Enter to post</p>
                      </div>

                      {/* Comments List */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {comments.map((comment: any) => (
                          <div
                            key={comment.id}
                            style={{
                              padding: '12px',
                              backgroundColor: '#f9fafb',
                              borderRadius: '8px',
                              border: '1px solid #e5e7eb'
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                              <div style={{ fontSize: '12px', fontWeight: '600', color: '#111827' }}>
                                {comment.user?.name || 'Unknown'}
                              </div>
                              <div style={{ fontSize: '11px', color: '#9ca3af' }}>
                                {new Date(comment.createdAt).toLocaleDateString()}
                              </div>
                            </div>
                            <div style={{ fontSize: '13px', color: '#374151', lineHeight: '1.5', marginBottom: '8px' }}>
                              {comment.content}
                            </div>
                            {comment.isResolved && (
                              <span style={{
                                padding: '2px 6px',
                                backgroundColor: '#dcfce7',
                                color: '#166534',
                                borderRadius: '4px',
                                fontSize: '10px',
                                fontWeight: '600'
                              }}>
                                RESOLVED
                              </span>
                            )}
                          </div>
                        ))}
                        {comments.length === 0 && (
                          <div style={{ textAlign: 'center', padding: '40px 20px', backgroundColor: '#f9fafb', borderRadius: '8px', border: '1px dashed #e5e7eb' }}>
                            <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>No comments yet</p>
                            <p style={{ fontSize: '12px', color: '#9ca3af' }}>Start a discussion about this card</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Tracking Tab */}
                  {editorTab === 'tracking' && (
                    <div>
                      <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#111827', marginBottom: '16px' }}>Time & Cost Tracking</h4>

                      {/* Time Tracking */}
                      <div style={{ marginBottom: '24px', padding: '16px', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
                        <div style={{ fontSize: '12px', fontWeight: '600', color: '#374151', marginBottom: '12px' }}>⏱️ Time Tracking</div>

                        {activeTimer && activeTimer.nodeId === selectedNodeId ? (
                          <div>
                            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#3b82f6', marginBottom: '8px', fontFamily: 'monospace' }}>
                              {Math.floor((Date.now() - new Date(activeTimer.startTime).getTime()) / 60000)} min
                            </div>
                            <button
                              onClick={async () => {
                                try {
                                  await api.stopTimer(activeTimer.id);
                                  setActiveTimer(null);
                                } catch (error) {
                                  console.error('Failed to stop timer:', error);
                                  alert('Failed to stop timer');
                                }
                              }}
                              style={{
                                width: '100%',
                                padding: '8px',
                                backgroundColor: '#ef4444',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                fontSize: '14px',
                                fontWeight: '600',
                                cursor: 'pointer'
                              }}
                            >
                              Stop Timer
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={async () => {
                              try {
                                const timer = await api.startTimer(selectedNodeId!);
                                setActiveTimer(timer);
                              } catch (error: any) {
                                console.error('Failed to start timer:', error);
                                alert(error.message || 'Failed to start timer');
                              }
                            }}
                            style={{
                              width: '100%',
                              padding: '10px',
                              backgroundColor: '#10b981',
                              color: 'white',
                              border: 'none',
                              borderRadius: '6px',
                              fontSize: '14px',
                              fontWeight: '600',
                              cursor: 'pointer'
                            }}
                          >
                            ▶ Start Timer
                          </button>
                        )}
                      </div>

                      {/* Cost Tracking */}
                      <div style={{ padding: '16px', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                          <div style={{ fontSize: '12px', fontWeight: '600', color: '#374151' }}>💰 Cost Tracking</div>
                          <button
                            onClick={() => setShowCostModal(true)}
                            style={{
                              padding: '4px 8px',
                              backgroundColor: '#3b82f6',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              fontSize: '11px',
                              fontWeight: '600',
                              cursor: 'pointer'
                            }}
                          >
                            + Add Cost
                          </button>
                        </div>

                        {costEntries.filter((c: any) => c.nodeId === selectedNodeId).length === 0 ? (
                          <p style={{ fontSize: '12px', color: '#9ca3af', textAlign: 'center', padding: '20px 0' }}>
                            No costs tracked yet
                          </p>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {costEntries.filter((c: any) => c.nodeId === selectedNodeId).map((cost: any) => (
                              <div
                                key={cost.id}
                                style={{
                                  padding: '8px',
                                  backgroundColor: 'white',
                                  borderRadius: '6px',
                                  border: '1px solid #e5e7eb'
                                }}
                              >
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                  <span style={{ fontSize: '14px', fontWeight: '600', color: '#111827' }}>
                                    ${cost.amount.toFixed(2)}
                                  </span>
                                  <span style={{ fontSize: '11px', color: '#6b7280' }}>{cost.type}</span>
                                </div>
                                {cost.description && (
                                  <div style={{ fontSize: '11px', color: '#9ca3af' }}>{cost.description}</div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}

                        <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #e5e7eb' }}>
                          <div style={{ fontSize: '12px', color: '#6b7280' }}>Total for this card:</div>
                          <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#111827' }}>
                            ${costEntries.filter((c: any) => c.nodeId === selectedNodeId).reduce((sum: number, c: any) => sum + c.amount, 0).toFixed(2)}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div style={{ textAlign: 'center', paddingTop: '40px' }}>
                  <p style={{ fontSize: '14px', color: '#9ca3af' }}>Select a card to edit details</p>
                </div>
              )}
            </div>
          </>
        ) : (
          <div style={{ flex: 1, padding: '40px', overflow: 'auto' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px', color: '#111827' }}>Effort / Value Matrix</h2>
            <div style={{ position: 'relative', width: '600px', height: '600px', margin: '0 auto' }}>
              <div style={{ position: 'absolute', inset: 0, display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr', border: '2px solid #374151' }}>
                <div style={{ padding: '16px', borderRight: '2px solid #374151', borderBottom: '2px solid #374151', backgroundColor: '#dcfce750' }}>
                  <div style={{ fontWeight: 'bold', fontSize: '14px', color: '#166534' }}>Quick Wins</div>
                  <div style={{ fontSize: '12px', color: '#6b7280' }}>High Value, Low Effort</div>
                </div>
                <div style={{ padding: '16px', borderBottom: '2px solid #374151', backgroundColor: '#dbeafe50' }}>
                  <div style={{ fontWeight: 'bold', fontSize: '14px', color: '#1e40af' }}>Major Projects</div>
                  <div style={{ fontSize: '12px', color: '#6b7280' }}>High Value, High Effort</div>
                </div>
                <div style={{ padding: '16px', borderRight: '2px solid #374151', backgroundColor: '#fef9c350' }}>
                  <div style={{ fontWeight: 'bold', fontSize: '14px', color: '#a16207' }}>Fill-ins</div>
                  <div style={{ fontSize: '12px', color: '#6b7280' }}>Low Value, Low Effort</div>
                </div>
                <div style={{ padding: '16px', backgroundColor: '#fee2e250' }}>
                  <div style={{ fontWeight: 'bold', fontSize: '14px', color: '#991b1b' }}>Time Sinks</div>
                  <div style={{ fontSize: '12px', color: '#6b7280' }}>Low Value, High Effort</div>
                </div>
              </div>
              {nodes.map((node) => {
                const x = ((node.effort - 1) / 9) * 100;
                const y = ((10 - node.value) / 9) * 100;
                return (
                  <div
                    key={node.id}
                    onClick={() => setSelectedNodeId(node.id)}
                    style={{
                      position: 'absolute',
                      left: `${x}%`,
                      top: `${y}%`,
                      width: '28px',
                      height: '28px',
                      backgroundColor: PRIORITY_COLORS[node.priority],
                      borderRadius: '50%',
                      border: selectedNodeId === node.id ? '3px solid #1e40af' : '2px solid white',
                      transform: 'translate(-50%, -50%)',
                      cursor: 'pointer',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontSize: '10px',
                      fontWeight: 'bold'
                    }}
                    title={`${node.label} - ${node.priority} priority`}
                  >
                    {node.assignees.length || ''}
                  </div>
                );
              })}
            </div>
            <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '12px', color: '#6b7280' }}>
              Circle size shows priority • Number shows assigned team members
            </div>
          </div>
        )}
      </div>

      {/* Notebook Viewer Modal */}
      {showNotebookViewer && selectedNode?.notebookHtml && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000
        }}>
          <div style={{
            width: '90%',
            height: '90%',
            backgroundColor: 'white',
            borderRadius: '12px',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}>
            {/* Header */}
            <div style={{
              padding: '16px 24px',
              borderBottom: '1px solid #e5e7eb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>
                  {selectedNode.notebookFilename || 'Jupyter Notebook'}
                </h2>
                <div style={{ fontSize: '13px', color: '#6b7280', marginTop: '4px' }}>
                  {selectedNode.label}
                </div>
              </div>
              <button
                onClick={() => setShowNotebookViewer(false)}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#f3f4f6',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                Close
              </button>
            </div>

            {/* Notebook Content */}
            <div style={{
              flex: 1,
              overflow: 'auto',
              backgroundColor: '#f9fafb'
            }}>
              <iframe
                srcDoc={selectedNode.notebookHtml}
                style={{
                  width: '100%',
                  height: '100%',
                  border: 'none'
                }}
                title="Jupyter Notebook"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
