// Simple test component to verify app is rendering
import { useProjectStore } from './stores/projectStore';

export default function AppTest() {
  const { project } = useProjectStore();

  return (
    <div style={{ padding: '20px', background: 'white' }}>
      <h1 style={{ color: 'black' }}>DS Forest App Test</h1>
      <p style={{ color: 'black' }}>App is rendering correctly!</p>
      <p style={{ color: 'black' }}>Project: {project ? project.name : 'No project loaded'}</p>
    </div>
  );
}
