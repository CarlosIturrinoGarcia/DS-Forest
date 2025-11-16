import { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import BoardView from '../components/BoardView';

type NodeType = 'start' | 'solution' | 'experiment' | 'decision' | 'end';
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
  experimentStatus?: 'pending' | 'success' | 'failure';
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
  const [viewMode, setViewMode] = useState<'canvas' | 'matrix' | 'boards'>('canvas');
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
  const [showDatasetModal, setShowDatasetModal] = useState(false);
  const [showModelModal, setShowModelModal] = useState(false);
  const [showCostModal, setShowCostModal] = useState(false);
  const [editorTab, setEditorTab] = useState<'details' | 'models' | 'comments' | 'tracking'>('details');
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [connectingFrom, setConnectingFrom] = useState<string | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  // Load project from backend
  useEffect(() => {
    const loadProject = async () => {
      try {
        const projectData = await api.getProject(projectId);
        setProject(projectData);
        setNodes(projectData.nodes || []);
        setConnections(projectData.edges || []);
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

  const handleCreateProject = () => {
    const name = prompt('Enter project name:', 'My DS Project');
    if (name) {
      setProject({ name });
    }
  };

  const addNode = (type: NodeType) => {
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
      tags: []
    };

    setNodes([...nodes, newNode]);
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

  const handleMouseUp = () => {
    setDraggingNodeId(null);
  };

  const startConnection = (e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    setConnectingFrom(nodeId);
  };

  const completeConnection = (e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    if (connectingFrom && connectingFrom !== nodeId) {
      const newConnection: Connection = {
        id: `conn-${Date.now()}`,
        from: connectingFrom,
        to: nodeId
      };
      setConnections([...connections, newConnection]);
    }
    setConnectingFrom(null);
  };

  const toggleAssignee = (nodeId: string, memberId: string) => {
    setNodes(nodes.map(n => {
      if (n.id !== nodeId) return n;
      const hasAssignee = n.assignees.includes(memberId);
      return {
        ...n,
        assignees: hasAssignee
          ? n.assignees.filter(id => id !== memberId)
          : [...n.assignees, memberId]
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
        ) : viewMode === 'canvas' ? (
          <>
            {/* Card Palette */}
            <div style={{ width: '260px', backgroundColor: 'white', borderRight: '1px solid #e5e7eb', padding: '16px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px', color: '#111827' }}>Create Card</h3>
              {(['start', 'solution', 'experiment', 'decision', 'end'] as NodeType[]).map((type) => (
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
                overflow: 'hidden',
                cursor: draggingNodeId ? 'grabbing' : connectingFrom ? 'crosshair' : 'default'
              }}
            >
              {/* Draw connections */}
              <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
                {connections.map(conn => {
                  const fromNode = nodes.find(n => n.id === conn.from);
                  const toNode = nodes.find(n => n.id === conn.to);
                  if (!fromNode || !toNode) return null;

                  const fromX = fromNode.x + 100;
                  const fromY = fromNode.y + 70;
                  const toX = toNode.x + 100;
                  const toY = toNode.y + 70;

                  return (
                    <g key={conn.id}>
                      <line
                        x1={fromX}
                        y1={fromY}
                        x2={toX}
                        y2={toY}
                        stroke="#94a3b8"
                        strokeWidth="2"
                        markerEnd="url(#arrowhead)"
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
                </defs>
              </svg>

              {/* Render Card Nodes */}
              {nodes.map((node) => (
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
                    width: '200px',
                    backgroundColor: node.type === 'experiment' && node.experimentStatus
                      ? EXPERIMENT_STATUS_COLORS[node.experimentStatus]
                      : 'white',
                    border: selectedNodeId === node.id
                      ? '2px solid #3b82f6'
                      : connectingFrom === node.id
                      ? '2px solid #10b981'
                      : node.type === 'experiment' && node.experimentStatus === 'success'
                      ? '2px solid #10b981'
                      : node.type === 'experiment' && node.experimentStatus === 'failure'
                      ? '2px solid #ef4444'
                      : '1px solid #e5e7eb',
                    borderRadius: '8px',
                    cursor: draggingNodeId === node.id ? 'grabbing' : 'grab',
                    boxShadow: draggingNodeId === node.id
                      ? '0 10px 25px rgba(0,0,0,0.15)'
                      : '0 1px 3px rgba(0,0,0,0.1)',
                    userSelect: 'none',
                    overflow: 'hidden'
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
                      {node.assignees.slice(0, 3).map(assigneeId => {
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
                      {node.assignees.length > 3 && (
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
                          Notebook Link
                        </label>
                        <input
                          type="text"
                          value={selectedNode.notebookLink || ''}
                          onChange={(e) => {
                            setNodes(nodes.map(n =>
                              n.id === selectedNodeId ? { ...n, notebookLink: e.target.value } : n
                            ));
                          }}
                          style={{ width: '100%', padding: '8px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '14px' }}
                          placeholder="Jupyter notebook URL"
                        />
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
                    onClick={() => {
                      setNodes(nodes.filter(n => n.id !== selectedNodeId));
                      setConnections(connections.filter(c => c.from !== selectedNodeId && c.to !== selectedNodeId));
                      setSelectedNodeId(null);
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
    </div>
  );
}
