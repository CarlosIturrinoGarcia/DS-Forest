import { useEffect, useState } from 'react';
import { X, Trash2, FolderOpen, XCircle } from 'lucide-react';
import { useProjectStore } from '../../stores/projectStore';
import { NodeData, NodeStatus, NodeType } from '../../types';

export default function NodeEditor() {
  const {
    project,
    selectedNodeId,
    selectNode,
    updateNode,
    deleteNode,
    addNodeToContainer,
    removeNodeFromContainer,
  } = useProjectStore();

  const selectedNode = project?.nodes.find(
    (node) => node.id === selectedNodeId
  );

  const [formData, setFormData] = useState<Partial<NodeData>>({});

  useEffect(() => {
    if (selectedNode) {
      setFormData(selectedNode.data);
    }
  }, [selectedNode]);

  if (!selectedNode) {
    return (
      <div className="w-80 bg-white border-l border-gray-200 p-6 flex items-center justify-center">
        <p className="text-gray-500 text-center">
          Select a node to edit its properties
        </p>
      </div>
    );
  }

  const handleUpdate = (field: keyof NodeData, value: any) => {
    const newData = { ...formData, [field]: value };
    setFormData(newData);
    updateNode(selectedNodeId!, { [field]: value });
  };

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this node?')) {
      deleteNode(selectedNodeId!);
    }
  };

  return (
    <div className="w-80 bg-white border-l border-gray-200 flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h3 className="font-semibold text-lg">Edit Node</h3>
        <button
          onClick={() => selectNode(null)}
          className="p-1 hover:bg-gray-100 rounded"
        >
          <X size={20} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Node Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Node Type
          </label>
          <select
            value={formData.type}
            onChange={(e) => handleUpdate('type', e.target.value as NodeType)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="start">Start</option>
            <option value="container">Container</option>
            <option value="solution">Solution</option>
            <option value="experiment">Experiment</option>
            <option value="decision">Decision</option>
            <option value="end">End</option>
          </select>
        </div>

        {/* Label */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Label *
          </label>
          <input
            type="text"
            value={formData.label}
            onChange={(e) => handleUpdate('label', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Node title"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => handleUpdate('description', e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Brief description"
          />
        </div>

        {/* Status */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Status
          </label>
          <select
            value={formData.status}
            onChange={(e) => handleUpdate('status', e.target.value as NodeStatus)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="paused">Paused</option>
            <option value="abandoned">Abandoned</option>
          </select>
        </div>

        {/* Container Management */}
        {formData.type === 'container' ? (
          // Show children for container nodes
          <div className="bg-purple-50 border border-purple-200 rounded-md p-3">
            <div className="flex items-center gap-2 mb-2">
              <FolderOpen size={16} className="text-purple-600" />
              <label className="text-sm font-medium text-gray-700">
                Container Contents ({formData.childrenIds?.length || 0})
              </label>
            </div>
            {formData.childrenIds && formData.childrenIds.length > 0 ? (
              <div className="space-y-1">
                {formData.childrenIds.map((childId) => {
                  const childNode = project?.nodes.find((n) => n.id === childId);
                  return (
                    <div
                      key={childId}
                      className="flex items-center justify-between bg-white px-2 py-1.5 rounded text-sm"
                    >
                      <span className="text-gray-700 truncate">
                        {childNode?.data.label || 'Unknown'}
                      </span>
                      <button
                        onClick={() => removeNodeFromContainer(childId)}
                        className="p-0.5 hover:bg-red-100 rounded text-red-600"
                        title="Remove from container"
                      >
                        <XCircle size={14} />
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-gray-500 italic">
                No experiments in this container yet
              </p>
            )}
          </div>
        ) : (
          // Show parent container selector for non-container nodes
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Container
            </label>
            <select
              value={formData.parentId || ''}
              onChange={(e) => {
                const newParentId = e.target.value;
                if (newParentId) {
                  addNodeToContainer(selectedNodeId!, newParentId);
                } else if (formData.parentId) {
                  removeNodeFromContainer(selectedNodeId!);
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">No container</option>
              {project?.nodes
                .filter((n) => n.data.type === 'container' && n.id !== selectedNodeId)
                .map((container) => (
                  <option key={container.id} value={container.id}>
                    {container.data.label}
                  </option>
                ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Group this node in a container
            </p>
          </div>
        )}

        {/* Effort Slider */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Effort: {formData.effort}/10
          </label>
          <input
            type="range"
            min="1"
            max="10"
            value={formData.effort}
            onChange={(e) => handleUpdate('effort', parseInt(e.target.value))}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>Low</span>
            <span>High</span>
          </div>
        </div>

        {/* Value Slider */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Value: {formData.value}/10
          </label>
          <input
            type="range"
            min="1"
            max="10"
            value={formData.value}
            onChange={(e) => handleUpdate('value', parseInt(e.target.value))}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>Low</span>
            <span>High</span>
          </div>
        </div>

        {/* Tags */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tags
          </label>
          <input
            type="text"
            value={formData.tags?.join(', ')}
            onChange={(e) =>
              handleUpdate(
                'tags',
                e.target.value.split(',').map((t) => t.trim()).filter(Boolean)
              )
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="tag1, tag2, tag3"
          />
          <p className="text-xs text-gray-500 mt-1">Separate tags with commas</p>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Notes
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) => handleUpdate('notes', e.target.value)}
            rows={5}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Detailed notes..."
          />
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200">
        <button
          onClick={handleDelete}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
        >
          <Trash2 size={16} />
          Delete Node
        </button>
      </div>
    </div>
  );
}
