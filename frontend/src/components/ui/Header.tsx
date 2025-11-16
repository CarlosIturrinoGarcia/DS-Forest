import { useState } from 'react';
import { LayoutGrid, ScatterChart, Save, Settings } from 'lucide-react';
import { useProjectStore } from '../../stores/projectStore';

export default function Header() {
  const { project, viewMode, setViewMode, initProject, updateProjectName } =
    useProjectStore();
  const [isEditingName, setIsEditingName] = useState(false);
  const [projectName, setProjectName] = useState(project?.name || '');

  const handleCreateProject = () => {
    const name = prompt('Enter project name:', 'My DS Project');
    if (name) {
      initProject(name, '');
    }
  };

  const handleSaveName = () => {
    if (projectName.trim()) {
      updateProjectName(projectName.trim());
    }
    setIsEditingName(false);
  };

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
      {/* Left Section */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">DS</span>
          </div>
          <h1 className="text-xl font-bold text-gray-900">DS Forest</h1>
        </div>

        {project && (
          <>
            <div className="w-px h-6 bg-gray-300" />
            {isEditingName ? (
              <input
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                onBlur={handleSaveName}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveName();
                  if (e.key === 'Escape') {
                    setProjectName(project.name);
                    setIsEditingName(false);
                  }
                }}
                autoFocus
                className="px-2 py-1 border border-blue-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            ) : (
              <button
                onClick={() => {
                  setProjectName(project.name);
                  setIsEditingName(true);
                }}
                className="text-lg font-medium text-gray-700 hover:text-gray-900 hover:underline"
              >
                {project.name}
              </button>
            )}
          </>
        )}
      </div>

      {/* Center Section - View Toggle */}
      {project && (
        <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setViewMode('canvas')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
              viewMode === 'canvas'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <LayoutGrid size={18} />
            <span className="font-medium">Canvas</span>
          </button>
          <button
            onClick={() => setViewMode('matrix')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
              viewMode === 'matrix'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <ScatterChart size={18} />
            <span className="font-medium">Matrix</span>
          </button>
        </div>
      )}

      {/* Right Section */}
      <div className="flex items-center gap-2">
        {project && (
          <>
            <button className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors">
              <Save size={18} />
              <span className="text-sm">Saved</span>
            </button>
            <button className="p-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors">
              <Settings size={20} />
            </button>
          </>
        )}

        {!project && (
          <button
            onClick={handleCreateProject}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
          >
            Create Project
          </button>
        )}
      </div>
    </header>
  );
}
