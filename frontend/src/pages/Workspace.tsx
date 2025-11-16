import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

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

export default function Workspace() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [project, setProject] = useState<{ name: string } | null>(null);
  const [viewMode, setViewMode] = useState<'canvas' | 'matrix'>('canvas');
  const [nodes, setNodes] = useState<NodeData[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [teamMembers] = useState<TeamMember[]>(INITIAL_TEAM);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [connectingFrom, setConnectingFrom] = useState<string | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  // Load from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('ds-forest-jira');
    if (stored) {
      try {
        const data = JSON.parse(stored);
        setProject(data.project);
        setNodes(data.nodes || []);
        setConnections(data.connections || []);
      } catch (e) {
        console.error('Error loading:', e);
      }
    }
  }, []);

  // Save to localStorage
  useEffect(() => {
    if (project) {
      localStorage.setItem('ds-forest-jira', JSON.stringify({ project, nodes, connections }));
    }
  }, [project, nodes, connections]);

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

  if (!project) {
    return (
      <div style={{
        width: '100vw',
        height: '100vh',
        backgroundColor: '#f9fafb',
        display: 'flex',
        flexDirection: 'column'
      }}>
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
            <span style={{ fontSize: '14px', color: '#6b7280', marginLeft: '8px' }}>Data Science Project Management</span>
          </div>
          <button
            onClick={handleCreateProject}
            style={{
              padding: '8px 16px',
              backgroundColor: '#3b82f6',
              color: 'white',
              borderRadius: '6px',
              border: 'none',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            Create Project
          </button>
        </header>
        <div style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{ textAlign: 'center', color: '#6b7280', maxWidth: '500px' }}>
            <h2 style={{ fontSize: '28px', fontWeight: 'bold', color: '#111827', marginBottom: '12px' }}>
              Welcome to DS Forest
            </h2>
            <p style={{ fontSize: '16px', marginBottom: '8px' }}>Jira-like project management for Data Science teams</p>
            <p style={{ fontSize: '14px' }}>Track experiments, assign tasks, and visualize workflows</p>
          </div>
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
          </div>

          {/* User info and logout */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginLeft: '8px' }}>
            <span style={{ fontSize: '14px', color: '#6b7280' }}>{user?.name}</span>
            <button
              onClick={() => {
                logout();
                navigate('/');
              }}
              style={{
                padding: '6px 12px',
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
        {viewMode === 'canvas' ? (
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
                    backgroundColor: 'white',
                    border: selectedNodeId === node.id
                      ? '2px solid #3b82f6'
                      : connectingFrom === node.id
                      ? '2px solid #10b981'
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
            <div style={{ width: '320px', backgroundColor: 'white', borderLeft: '1px solid #e5e7eb', padding: '20px', overflowY: 'auto' }}>
              {selectedNode ? (
                <>
                  <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px', color: '#111827' }}>Edit Card</h3>

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
