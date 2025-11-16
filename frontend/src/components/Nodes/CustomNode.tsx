import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { NodeData } from '../../types';
import { getStatusColor, getQuadrantColor } from '../../lib/utils';
import {
  CircleDot,
  Lightbulb,
  FlaskConical,
  GitBranch,
  CheckCircle
} from 'lucide-react';

const nodeIcons = {
  start: CircleDot,
  solution: Lightbulb,
  experiment: FlaskConical,
  decision: GitBranch,
  end: CheckCircle,
};

function CustomNode({ data, selected }: NodeProps<NodeData>) {
  const Icon = nodeIcons[data.type];
  const borderColor = getStatusColor(data.status);
  const bgColor = getQuadrantColor(data.effort, data.value);

  return (
    <div
      className={`px-4 py-3 shadow-lg rounded-lg min-w-[180px] max-w-[250px] bg-white
        ${selected ? 'ring-2 ring-blue-500' : ''}`}
      style={{
        borderLeft: `4px solid ${borderColor}`,
        borderTop: `2px solid ${bgColor}20`,
      }}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 !bg-gray-400"
      />

      <div className="flex items-start gap-2">
        <div
          className="mt-1 p-1.5 rounded"
          style={{ backgroundColor: `${bgColor}20` }}
        >
          <Icon
            size={16}
            style={{ color: bgColor }}
          />
        </div>

        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm text-gray-900 break-words">
            {data.label}
          </div>

          {data.description && (
            <div className="text-xs text-gray-600 mt-1 line-clamp-2">
              {data.description}
            </div>
          )}

          <div className="flex gap-2 mt-2 text-xs">
            <div className="flex items-center gap-1">
              <span className="text-gray-500">E:</span>
              <span className="font-medium">{data.effort}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-gray-500">V:</span>
              <span className="font-medium">{data.value}</span>
            </div>
          </div>

          {data.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {data.tags.slice(0, 2).map((tag, idx) => (
                <span
                  key={idx}
                  className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded"
                >
                  {tag}
                </span>
              ))}
              {data.tags.length > 2 && (
                <span className="text-xs text-gray-500">
                  +{data.tags.length - 2}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 !bg-gray-400"
      />
    </div>
  );
}

export default memo(CustomNode);
