import { useCallback, useMemo } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  NodeTypes,
  BackgroundVariant,
} from 'reactflow';
import 'reactflow/dist/style.css';

import CustomNode from '../Nodes/CustomNode';
import ContainerNode from '../Nodes/ContainerNode';
import { useProjectStore } from '../../stores/projectStore';
import { DSEdge } from '../../types';

const nodeTypes: NodeTypes = {
  default: CustomNode,
  container: ContainerNode,
};

export default function Canvas() {
  const {
    project,
    addEdge: addEdgeToStore,
    selectNode,
    selectedNodeId,
  } = useProjectStore();

  const [nodes, setNodes, onNodesChange] = useNodesState(project?.nodes || []);
  const [edges, setEdges, onEdgesChange] = useEdgesState(project?.edges || []);

  // Sync nodes and edges with the store
  useMemo(() => {
    if (project) {
      setNodes(project.nodes);
      setEdges(project.edges);
    }
  }, [project, setNodes, setEdges]);

  const onConnect = useCallback(
    (params: Connection) => {
      const newEdge: DSEdge = {
        id: `${params.source}-${params.target}-${Date.now()}`,
        source: params.source!,
        target: params.target!,
        type: 'smoothstep',
        animated: true,
      };

      setEdges((eds) => addEdge(params, eds));
      addEdgeToStore(newEdge);
    },
    [setEdges, addEdgeToStore]
  );

  const onNodeClick = useCallback(
    (_event: React.MouseEvent, node: any) => {
      selectNode(node.id);
    },
    [selectNode]
  );

  const onPaneClick = useCallback(() => {
    selectNode(null);
  }, [selectNode]);

  if (!project) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-700 mb-2">
            No Project Loaded
          </h2>
          <p className="text-gray-500">
            Create a new project to get started
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        nodeTypes={nodeTypes}
        fitView
        snapToGrid
        snapGrid={[15, 15]}
        defaultEdgeOptions={{
          type: 'smoothstep',
          animated: true,
          style: { stroke: '#b1b1b7', strokeWidth: 2 },
        }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={15}
          size={1}
          color="#d1d5db"
        />
        <Controls />
        <MiniMap
          nodeColor={(node: any) => {
            const status = node.data?.status;
            if (status === 'completed') return '#22c55e';
            if (status === 'abandoned') return '#6b7280';
            if (status === 'paused') return '#f59e0b';
            return '#3b82f6';
          }}
          nodeStrokeWidth={3}
          zoomable
          pannable
        />
      </ReactFlow>
    </div>
  );
}
