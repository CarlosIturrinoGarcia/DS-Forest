import { useMemo } from 'react';
import { useProjectStore } from '../../stores/projectStore';
import { getQuadrantColor, getQuadrantName } from '../../lib/utils';

export default function EffortValueMatrix() {
  const { project, selectNode, selectedNodeId } = useProjectStore();

  const quadrants = useMemo(
    () => [
      {
        name: 'Quick Wins',
        description: 'High Value, Low Effort',
        color: '#22c55e',
        position: 'top-left',
      },
      {
        name: 'Major Projects',
        description: 'High Value, High Effort',
        color: '#3b82f6',
        position: 'top-right',
      },
      {
        name: 'Fill-ins',
        description: 'Low Value, Low Effort',
        color: '#facc15',
        position: 'bottom-left',
      },
      {
        name: 'Time Sinks',
        description: 'Low Value, High Effort',
        color: '#ef4444',
        position: 'bottom-right',
      },
    ],
    []
  );

  if (!project) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-700 mb-2">
            No Project Loaded
          </h2>
          <p className="text-gray-500">
            Create a new project to view the effort/value matrix
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            Effort / Value Matrix
          </h2>
          <p className="text-gray-600 mt-1">
            Visualize and prioritize your solutions based on effort and value
          </p>
        </div>

        {/* Matrix Container */}
        <div className="relative bg-white rounded-lg shadow-lg p-8">
          {/* Axes Labels */}
          <div className="absolute -left-20 top-1/2 -translate-y-1/2 -rotate-90">
            <span className="text-sm font-semibold text-gray-700">
              VALUE →
            </span>
          </div>
          <div className="absolute -bottom-8 left-1/2 -translate-x-1/2">
            <span className="text-sm font-semibold text-gray-700">
              EFFORT →
            </span>
          </div>

          {/* Matrix Grid */}
          <div className="grid grid-cols-2 gap-0 aspect-square max-w-3xl mx-auto border-2 border-gray-300">
            {/* Top Left - Quick Wins */}
            <div
              className="relative border-r-2 border-b-2 border-gray-300 p-4"
              style={{ backgroundColor: `${quadrants[0].color}10` }}
            >
              <div className="absolute top-2 left-2">
                <div className="font-semibold text-sm">{quadrants[0].name}</div>
                <div className="text-xs text-gray-600">
                  {quadrants[0].description}
                </div>
              </div>
            </div>

            {/* Top Right - Major Projects */}
            <div
              className="relative border-b-2 border-gray-300 p-4"
              style={{ backgroundColor: `${quadrants[1].color}10` }}
            >
              <div className="absolute top-2 left-2">
                <div className="font-semibold text-sm">{quadrants[1].name}</div>
                <div className="text-xs text-gray-600">
                  {quadrants[1].description}
                </div>
              </div>
            </div>

            {/* Bottom Left - Fill-ins */}
            <div
              className="relative border-r-2 border-gray-300 p-4"
              style={{ backgroundColor: `${quadrants[2].color}10` }}
            >
              <div className="absolute top-2 left-2">
                <div className="font-semibold text-sm">{quadrants[2].name}</div>
                <div className="text-xs text-gray-600">
                  {quadrants[2].description}
                </div>
              </div>
            </div>

            {/* Bottom Right - Time Sinks */}
            <div
              className="relative p-4"
              style={{ backgroundColor: `${quadrants[3].color}10` }}
            >
              <div className="absolute top-2 left-2">
                <div className="font-semibold text-sm">{quadrants[3].name}</div>
                <div className="text-xs text-gray-600">
                  {quadrants[3].description}
                </div>
              </div>
            </div>

            {/* Plot Nodes */}
            {project.nodes.map((node) => {
              const effort = node.data.effort;
              const value = node.data.value;

              // Convert effort/value (1-10) to position (0-100%)
              const x = ((effort - 1) / 9) * 100;
              const y = ((10 - value) / 9) * 100; // Inverted because CSS top is 0

              const color = getQuadrantColor(effort, value);
              const isSelected = node.id === selectedNodeId;

              return (
                <button
                  key={node.id}
                  onClick={() => selectNode(node.id)}
                  className={`absolute w-8 h-8 rounded-full shadow-lg border-2 border-white
                    transform -translate-x-1/2 -translate-y-1/2
                    hover:scale-125 transition-transform cursor-pointer
                    ${isSelected ? 'ring-4 ring-blue-500 scale-125' : ''}`}
                  style={{
                    backgroundColor: color,
                    left: `${x}%`,
                    top: `${y}%`,
                  }}
                  title={`${node.data.label} (E: ${effort}, V: ${value})`}
                >
                  <span className="sr-only">{node.data.label}</span>
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="mt-8 flex flex-wrap gap-4 justify-center">
            {project.nodes.slice(0, 5).map((node) => {
              const color = getQuadrantColor(node.data.effort, node.data.value);
              return (
                <div
                  key={node.id}
                  className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-full"
                >
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: color }}
                  />
                  <span className="text-sm font-medium">{node.data.label}</span>
                  <span className="text-xs text-gray-600">
                    E:{node.data.effort} V:{node.data.value}
                  </span>
                </div>
              );
            })}
            {project.nodes.length > 5 && (
              <div className="px-3 py-1.5 text-sm text-gray-600">
                +{project.nodes.length - 5} more
              </div>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="mt-6 grid grid-cols-4 gap-4">
          {quadrants.map((quadrant) => {
            const nodesInQuadrant = project.nodes.filter((node) => {
              const quadrantName = getQuadrantName(
                node.data.effort,
                node.data.value
              );
              return quadrantName === quadrant.name;
            });

            return (
              <div
                key={quadrant.name}
                className="bg-white rounded-lg shadow p-4"
              >
                <div
                  className="w-3 h-3 rounded-full mb-2"
                  style={{ backgroundColor: quadrant.color }}
                />
                <div className="font-semibold text-2xl">
                  {nodesInQuadrant.length}
                </div>
                <div className="text-sm text-gray-600">{quadrant.name}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
