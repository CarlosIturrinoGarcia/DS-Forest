import { useState, useCallback, useEffect } from 'react';
import ReactFlow, {
  Node,
  Edge,
  addEdge,
  Background,
  Controls,
  Connection,
  useNodesState,
  useEdgesState,
  BackgroundVariant,
  ReactFlowProvider,
} from 'reactflow';
import 'reactflow/dist/style.css';

// Types
type NodeType = 'start' | 'solution' | 'experiment' | 'decision' | 'end';
type NodeStatus = 'active' | 'completed' | 'abandoned' | 'paused';

interface NodeData {
  label: string;
  description: string;
  effort: number;
  value: number;
  status: NodeStatus;
  nodeType: NodeType;
}

// Main App Component
function DSForestApp() {
  const [project, setProject] = useState<{ name: string } | null>(null);
  const [viewMode, setViewMode] = useState<'canvas' | 'matrix'>('canvas');
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('ds-forest-simple');
    if (stored) {
      try {
        const data = JSON.parse(stored);
        setProject(data.project);
        setNodes(data.nodes || []);
        setEdges(data.edges || []);
      } catch (e) {
        console.error('Error loading:', e);
      }
    }
  }, []);

  // Save to localStorage whenever data changes
  useEffect(() => {
    if (project) {
      localStorage.setItem('ds-forest-simple', JSON.stringify({ project, nodes, edges }));
    }
  }, [project, nodes, edges]);

  const handleCreateProject = () => {
    const name = prompt('Enter project name:', 'My DS Project');
    if (name) {
      setProject({ name });
    }
  };

  const addNode = (type: NodeType) => {
    if (!project) return;

    const newNode: Node<NodeData> = {
      id: `node-${Date.now()}`,
      type: 'default',
      position: { x: Math.random() * 400 + 100, y: Math.random() * 400 + 100 },
      data: {
        label: `${type.charAt(0).toUpperCase() + type.slice(1)} Node`,
        description: '',
        effort: 5,
        value: 5,
        status: 'active',
        nodeType: type,
      },
    };

    setNodes((nds) => [...nds, newNode]);
  };

  const onConnect = useCallback(
    (connection: Connection) => {
      setEdges((eds) => addEdge(connection, eds));
    },
    [setEdges]
  );

  const selectedNode = nodes.find((n) => n.id === selectedNodeId);

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
            <h1 style={{ fontSize: '20px', fontWeight: 'bold', margin: 0 }}>DS Forest</h1>
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
          <div style={{ textAlign: 'center', color: '#6b7280' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#374151', marginBottom: '8px' }}>
              Welcome to DS Forest
            </h2>
            <p>Click "Create Project" to get started</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column' }}>
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
          <h1 style={{ fontSize: '20px', fontWeight: 'bold', margin: 0 }}>DS Forest</h1>
          <div style={{ width: '1px', height: '24px', backgroundColor: '#d1d5db' }} />
          <span style={{ fontSize: '18px', fontWeight: '500' }}>{project.name}</span>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
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
        </div>
      </header>

      {/* Main Content */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {viewMode === 'canvas' ? (
          <>
            {/* Node Palette */}
            <div style={{ width: '240px', backgroundColor: 'white', borderRight: '1px solid #e5e7eb', padding: '16px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px' }}>Add Nodes</h3>
              {(['start', 'solution', 'experiment', 'decision', 'end'] as NodeType[]).map((type) => (
                <button
                  key={type}
                  onClick={() => addNode(type)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    marginBottom: '8px',
                    backgroundColor: '#f9fafb',
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontSize: '14px'
                  }}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
              <div style={{ marginTop: '16px', padding: '12px', backgroundColor: '#eff6ff', borderRadius: '6px', fontSize: '12px', color: '#1e40af' }}>
                💡 Click a node type to add it to the canvas
              </div>
            </div>

            {/* Canvas */}
            <div style={{ flex: 1, position: 'relative' }}>
              <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onNodeClick={(_, node) => setSelectedNodeId(node.id)}
                onPaneClick={() => setSelectedNodeId(null)}
                fitView
              >
                <Background variant={BackgroundVariant.Dots} />
                <Controls />
              </ReactFlow>
            </div>

            {/* Node Editor */}
            <div style={{ width: '280px', backgroundColor: 'white', borderLeft: '1px solid #e5e7eb', padding: '16px' }}>
              {selectedNode ? (
                <>
                  <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px' }}>Edit Node</h3>
                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ fontSize: '12px', fontWeight: '500', display: 'block', marginBottom: '4px' }}>Label</label>
                    <input
                      type="text"
                      value={selectedNode.data.label}
                      onChange={(e) => {
                        setNodes((nds) =>
                          nds.map((n) =>
                            n.id === selectedNodeId
                              ? { ...n, data: { ...n.data, label: e.target.value } }
                              : n
                          )
                        );
                      }}
                      style={{ width: '100%', padding: '6px', border: '1px solid #e5e7eb', borderRadius: '4px' }}
                    />
                  </div>
                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ fontSize: '12px', fontWeight: '500', display: 'block', marginBottom: '4px' }}>
                      Effort: {selectedNode.data.effort}
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={selectedNode.data.effort}
                      onChange={(e) => {
                        setNodes((nds) =>
                          nds.map((n) =>
                            n.id === selectedNodeId
                              ? { ...n, data: { ...n.data, effort: parseInt(e.target.value) } }
                              : n
                          )
                        );
                      }}
                      style={{ width: '100%' }}
                    />
                  </div>
                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ fontSize: '12px', fontWeight: '500', display: 'block', marginBottom: '4px' }}>
                      Value: {selectedNode.data.value}
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={selectedNode.data.value}
                      onChange={(e) => {
                        setNodes((nds) =>
                          nds.map((n) =>
                            n.id === selectedNodeId
                              ? { ...n, data: { ...n.data, value: parseInt(e.target.value) } }
                              : n
                          )
                        );
                      }}
                      style={{ width: '100%' }}
                    />
                  </div>
                  <button
                    onClick={() => {
                      setNodes((nds) => nds.filter((n) => n.id !== selectedNodeId));
                      setSelectedNodeId(null);
                    }}
                    style={{
                      width: '100%',
                      padding: '8px',
                      backgroundColor: '#ef4444',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      marginTop: '12px'
                    }}
                  >
                    Delete Node
                  </button>
                </>
              ) : (
                <p style={{ fontSize: '14px', color: '#6b7280' }}>Select a node to edit</p>
              )}
            </div>
          </>
        ) : (
          <div style={{ flex: 1, padding: '40px', overflow: 'auto' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px' }}>Effort / Value Matrix</h2>
            <div style={{ position: 'relative', width: '600px', height: '600px', margin: '0 auto' }}>
              <div style={{ position: 'absolute', inset: 0, display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr', border: '2px solid #374151' }}>
                <div style={{ padding: '16px', borderRight: '2px solid #374151', borderBottom: '2px solid #374151', backgroundColor: '#dcfce750' }}>
                  <div style={{ fontWeight: 'bold', fontSize: '14px' }}>Quick Wins</div>
                  <div style={{ fontSize: '12px', color: '#6b7280' }}>High Value, Low Effort</div>
                </div>
                <div style={{ padding: '16px', borderBottom: '2px solid #374151', backgroundColor: '#dbeafe50' }}>
                  <div style={{ fontWeight: 'bold', fontSize: '14px' }}>Major Projects</div>
                  <div style={{ fontSize: '12px', color: '#6b7280' }}>High Value, High Effort</div>
                </div>
                <div style={{ padding: '16px', borderRight: '2px solid #374151', backgroundColor: '#fef9c350' }}>
                  <div style={{ fontWeight: 'bold', fontSize: '14px' }}>Fill-ins</div>
                  <div style={{ fontSize: '12px', color: '#6b7280' }}>Low Value, Low Effort</div>
                </div>
                <div style={{ padding: '16px', backgroundColor: '#fee2e250' }}>
                  <div style={{ fontWeight: 'bold', fontSize: '14px' }}>Time Sinks</div>
                  <div style={{ fontSize: '12px', color: '#6b7280' }}>Low Value, High Effort</div>
                </div>
              </div>
              {nodes.map((node) => {
                const x = ((node.data.effort - 1) / 9) * 100;
                const y = ((10 - node.data.value) / 9) * 100;
                return (
                  <div
                    key={node.id}
                    style={{
                      position: 'absolute',
                      left: `${x}%`,
                      top: `${y}%`,
                      width: '24px',
                      height: '24px',
                      backgroundColor: '#3b82f6',
                      borderRadius: '50%',
                      border: '2px solid white',
                      transform: 'translate(-50%, -50%)',
                      cursor: 'pointer'
                    }}
                    title={node.data.label}
                  />
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ReactFlowProvider>
      <DSForestApp />
    </ReactFlowProvider>
  );
}
