import { memo, useCallback } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { NodeData } from '../../types';
import { getStatusColor } from '../../lib/utils';
import {
  FolderOpen,
  Folder,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { useProjectStore } from '../../stores/projectStore';

function ContainerNode({ id, data, selected }: NodeProps<NodeData>) {
  const { updateNode } = useProjectStore();
  const borderColor = getStatusColor(data.status);
  const isExpanded = data.isExpanded ?? true;
  const childCount = data.childrenIds?.length ?? 0;

  const toggleExpanded = useCallback(() => {
    updateNode(id, { isExpanded: !isExpanded });
  }, [id, isExpanded, updateNode]);

  const Icon = isExpanded ? FolderOpen : Folder;
  const ChevronIcon = isExpanded ? ChevronDown : ChevronRight;

  return (
    <div
      className={`px-4 py-3 shadow-xl rounded-lg min-w-[280px] max-w-[350px] bg-gradient-to-br from-purple-50 to-indigo-50
        ${selected ? 'ring-2 ring-purple-500' : ''}`}
      style={{
        borderLeft: `4px solid ${borderColor}`,
        borderTop: `3px solid #8b5cf6`,
        minHeight: isExpanded ? '120px' : 'auto',
      }}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 !bg-purple-400"
      />

      <div className="flex items-start gap-2">
        <button
          onClick={toggleExpanded}
          className="mt-1 p-1.5 rounded hover:bg-purple-100 transition-colors"
          style={{ backgroundColor: '#8b5cf620' }}
        >
          <Icon
            size={18}
            className="text-purple-600"
          />
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <div className="font-semibold text-sm text-gray-900 break-words flex-1">
              {data.label}
            </div>
            <button
              onClick={toggleExpanded}
              className="p-0.5 rounded hover:bg-purple-100 transition-colors"
            >
              <ChevronIcon size={16} className="text-purple-600" />
            </button>
          </div>

          {data.description && (
            <div className="text-xs text-gray-600 mt-1 line-clamp-2">
              {data.description}
            </div>
          )}

          <div className="flex items-center gap-3 mt-2 text-xs">
            <div className="flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 rounded">
              <span className="font-medium">{childCount}</span>
              <span className="text-gray-600">
                {childCount === 1 ? 'experiment' : 'experiments'}
              </span>
            </div>
          </div>

          {data.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {data.tags.slice(0, 2).map((tag, idx) => (
                <span
                  key={idx}
                  className="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded"
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

          {isExpanded && (
            <div className="mt-3 p-2 bg-white/50 rounded border border-purple-200 border-dashed">
              <div className="text-xs text-purple-600 font-medium mb-1">
                Container Area
              </div>
              <div className="text-xs text-gray-500">
                Drag experiments here to organize them
              </div>
            </div>
          )}
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 !bg-purple-400"
      />
    </div>
  );
}

export default memo(ContainerNode);
