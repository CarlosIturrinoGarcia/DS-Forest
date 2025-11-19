import { CircleDot, Lightbulb, FlaskConical, GitBranch, CheckCircle, FolderOpen } from 'lucide-react';
import { useProjectStore } from '../../stores/projectStore';
import { NodeType } from '../../types';

const nodeTypes: Array<{ type: NodeType; icon: any; label: string; description: string }> = [
  {
    type: 'start',
    icon: CircleDot,
    label: 'Start',
    description: 'Problem definition or starting point',
  },
  {
    type: 'container',
    icon: FolderOpen,
    label: 'Container',
    description: 'Group related experiments together',
  },
  {
    type: 'solution',
    icon: Lightbulb,
    label: 'Solution',
    description: 'Potential solution or approach',
  },
  {
    type: 'experiment',
    icon: FlaskConical,
    label: 'Experiment',
    description: 'Test, analysis, or experiment',
  },
  {
    type: 'decision',
    icon: GitBranch,
    label: 'Decision',
    description: 'Decision point or branching',
  },
  {
    type: 'end',
    icon: CheckCircle,
    label: 'End',
    description: 'Conclusion or final result',
  },
];

export default function NodePalette() {
  const { addNode, project } = useProjectStore();

  const handleAddNode = (type: NodeType) => {
    if (!project) return;

    // Calculate a position with some randomness to avoid overlap
    const position = {
      x: Math.random() * 400 + 100,
      y: Math.random() * 400 + 100,
    };

    addNode(type, position);
  };

  if (!project) {
    return null;
  }

  return (
    <div className="w-64 bg-white border-r border-gray-200 p-4">
      <h3 className="font-semibold text-lg mb-4">Node Palette ({nodeTypes.length} types)</h3>

      <div className="space-y-2">
        {nodeTypes.map(({ type, icon: Icon, label, description }) => (
          <button
            key={type}
            onClick={() => handleAddNode(type)}
            className="w-full flex items-start gap-3 p-3 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-left"
          >
            <div className="mt-0.5 p-2 bg-blue-100 rounded">
              <Icon size={18} className="text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm text-gray-900">{label}</div>
              <div className="text-xs text-gray-600 mt-0.5">{description}</div>
            </div>
          </button>
        ))}
      </div>

      <div className="mt-6 p-3 bg-gray-50 rounded-lg">
        <p className="text-xs text-gray-600">
          💡 <strong>Tip:</strong> Click on a node type to add it to the canvas.
          Then drag to position it.
        </p>
      </div>
    </div>
  );
}
