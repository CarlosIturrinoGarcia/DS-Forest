import { useState, useCallback, useRef } from 'react';
import ReactFlow, {
  addEdge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  MarkerType,
  type Node,
  type Edge,
  type Connection,
} from 'reactflow';
import 'reactflow/dist/style.css';

interface PipelineViewProps {
  projectId: string;
}

// Define ML pipeline component types
const PIPELINE_COMPONENTS = {
  'Data Source': [
    { type: 'csv_loader', label: 'CSV Loader', icon: '📄', color: '#3b82f6' },
    { type: 'database', label: 'Database', icon: '🗄️', color: '#3b82f6' },
    { type: 'api', label: 'API Data', icon: '🌐', color: '#3b82f6' },
  ],
  'Preprocessing': [
    { type: 'clean', label: 'Clean Data', icon: '🧹', color: '#10b981' },
    { type: 'normalize', label: 'Normalize', icon: '⚖️', color: '#10b981' },
    { type: 'encode', label: 'Encode', icon: '🔢', color: '#10b981' },
    { type: 'feature_engineering', label: 'Feature Engineering', icon: '⚙️', color: '#10b981' },
    { type: 'split', label: 'Train/Test Split', icon: '✂️', color: '#10b981' },
  ],
  'Models': [
    { type: 'linear_regression', label: 'Linear Regression', icon: '📈', color: '#8b5cf6' },
    { type: 'random_forest', label: 'Random Forest', icon: '🌲', color: '#8b5cf6' },
    { type: 'neural_network', label: 'Neural Network', icon: '🧠', color: '#8b5cf6' },
    { type: 'xgboost', label: 'XGBoost', icon: '🚀', color: '#8b5cf6' },
    { type: 'svm', label: 'SVM', icon: '📊', color: '#8b5cf6' },
  ],
  'Evaluation': [
    { type: 'metrics', label: 'Metrics', icon: '📏', color: '#f59e0b' },
    { type: 'cross_validation', label: 'Cross Validation', icon: '🔄', color: '#f59e0b' },
    { type: 'confusion_matrix', label: 'Confusion Matrix', icon: '📋', color: '#f59e0b' },
  ],
  'Output': [
    { type: 'export', label: 'Export Model', icon: '💾', color: '#ec4899' },
    { type: 'deploy', label: 'Deploy', icon: '🚀', color: '#ec4899' },
    { type: 'visualize', label: 'Visualize', icon: '📊', color: '#ec4899' },
  ],
};

const initialNodes: Node[] = [];
const initialEdges: Edge[] = [];

export default function PipelineView({ projectId }: PipelineViewProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedComponent, setSelectedComponent] = useState<any>(null);
  const nodeIdCounter = useRef(0);

  const onConnect = useCallback(
    (params: Connection) => {
      const edge = {
        ...params,
        type: 'smoothstep',
        animated: true,
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: '#94a3b8',
        },
        style: {
          stroke: '#94a3b8',
          strokeWidth: 2,
        },
      };
      setEdges((eds) => addEdge(edge, eds));
    },
    [setEdges]
  );

  const addNodeToCanvas = (component: any) => {
    const id = `node-${nodeIdCounter.current++}`;
    const newNode: Node = {
      id,
      type: 'default',
      position: { x: 250, y: 100 + nodes.length * 100 },
      data: {
        label: (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 12px',
            background: 'white',
            borderRadius: '8px',
            border: `2px solid ${component.color}`,
            minWidth: '150px',
          }}>
            <span style={{ fontSize: '20px' }}>{component.icon}</span>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: '#1e293b' }}>
                {component.label}
              </div>
              <div style={{ fontSize: '11px', color: '#64748b' }}>
                {component.type}
              </div>
            </div>
          </div>
        ),
      },
      style: {
        background: 'transparent',
        border: 'none',
        padding: 0,
      },
    };
    setNodes((nds) => [...nds, newNode]);
  };

  const clearPipeline = () => {
    if (confirm('Are you sure you want to clear the entire pipeline?')) {
      setNodes([]);
      setEdges([]);
      nodeIdCounter.current = 0;
    }
  };

  const exportPipeline = () => {
    const pipelineData = {
      nodes: nodes.map(n => ({
        id: n.id,
        type: n.type,
        position: n.position,
      })),
      edges: edges.map(e => ({
        source: e.source,
        target: e.target,
      })),
    };

    const blob = new Blob([JSON.stringify(pipelineData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ml-pipeline-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ display: 'flex', height: '100%', width: '100%' }}>
      {/* Component Palette */}
      <div className="glass-card" style={{
        width: '280px',
        height: '100%',
        overflowY: 'auto',
        borderRight: '1px solid rgba(226, 232, 240, 0.5)',
        padding: '20px',
      }}>
        <div style={{ marginBottom: '20px' }}>
          <h3 style={{
            fontSize: '18px',
            fontWeight: 700,
            color: '#1e293b',
            marginBottom: '8px',
            letterSpacing: '-0.01em'
          }}>
            ML Components
          </h3>
          <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '16px' }}>
            Drag components to the canvas to build your pipeline
          </p>
        </div>

        {Object.entries(PIPELINE_COMPONENTS).map(([category, components]) => (
          <div key={category} style={{ marginBottom: '24px' }}>
            <h4 style={{
              fontSize: '12px',
              fontWeight: 700,
              color: '#94a3b8',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '12px',
            }}>
              {category}
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {components.map((component) => (
                <button
                  key={component.type}
                  onClick={() => addNodeToCanvas(component)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '10px 12px',
                    background: 'rgba(255, 255, 255, 0.9)',
                    border: `2px solid ${component.color}`,
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    textAlign: 'left',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateX(4px)';
                    e.currentTarget.style.boxShadow = `0 4px 12px ${component.color}40`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateX(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <span style={{ fontSize: '20px' }}>{component.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#1e293b' }}>
                      {component.label}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}

        <div style={{
          borderTop: '2px solid rgba(226, 232, 240, 0.5)',
          paddingTop: '20px',
          marginTop: '20px',
        }}>
          <button
            onClick={exportPipeline}
            disabled={nodes.length === 0}
            style={{
              width: '100%',
              padding: '10px',
              background: nodes.length === 0 ? '#e2e8f0' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: nodes.length === 0 ? 'not-allowed' : 'pointer',
              marginBottom: '8px',
            }}
          >
            💾 Export Pipeline
          </button>
          <button
            onClick={clearPipeline}
            disabled={nodes.length === 0}
            style={{
              width: '100%',
              padding: '10px',
              background: nodes.length === 0 ? '#e2e8f0' : 'rgba(239, 68, 68, 0.1)',
              color: nodes.length === 0 ? '#94a3b8' : '#ef4444',
              border: nodes.length === 0 ? 'none' : '2px solid #ef4444',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: nodes.length === 0 ? 'not-allowed' : 'pointer',
            }}
          >
            🗑️ Clear Pipeline
          </button>
        </div>
      </div>

      {/* Canvas Area */}
      <div style={{ flex: 1, height: '100%', position: 'relative' }}>
        {nodes.length === 0 ? (
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
            zIndex: 10,
            pointerEvents: 'none',
          }}>
            <div style={{
              fontSize: '64px',
              marginBottom: '16px',
              opacity: 0.3,
            }}>
              🔧
            </div>
            <h3 style={{
              fontSize: '24px',
              fontWeight: 700,
              color: '#94a3b8',
              marginBottom: '8px',
            }}>
              Start Building Your Pipeline
            </h3>
            <p style={{
              fontSize: '16px',
              color: '#cbd5e1',
            }}>
              Click components from the left panel to add them to your ML pipeline
            </p>
          </div>
        ) : null}

        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          fitView
          style={{
            background: 'linear-gradient(135deg, #f5f7fa 0%, #e8ecf1 100%)',
          }}
        >
          <Background color="#cbd5e1" gap={16} />
          <Controls
            style={{
              button: {
                background: 'rgba(255, 255, 255, 0.9)',
                border: '1px solid #e2e8f0',
                borderRadius: '6px',
              }
            }}
          />
          <MiniMap
            nodeColor={(node) => '#667eea'}
            maskColor="rgba(0, 0, 0, 0.1)"
            style={{
              background: 'rgba(255, 255, 255, 0.9)',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
            }}
          />
        </ReactFlow>

        {/* Info Panel */}
        <div className="glass-card" style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          padding: '16px 20px',
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          borderRadius: '12px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          zIndex: 5,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div>
              <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' }}>
                Pipeline Stats
              </div>
              <div style={{ fontSize: '20px', fontWeight: 700, color: '#1e293b' }}>
                {nodes.length} <span style={{ fontSize: '14px', fontWeight: 500, color: '#64748b' }}>components</span>
              </div>
            </div>
            <div style={{ width: '1px', height: '40px', background: '#e2e8f0' }} />
            <div>
              <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' }}>
                Connections
              </div>
              <div style={{ fontSize: '20px', fontWeight: 700, color: '#1e293b' }}>
                {edges.length}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
