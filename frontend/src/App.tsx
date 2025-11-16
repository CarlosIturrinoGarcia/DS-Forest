import { useState, useEffect } from 'react';
import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';
import WorkspacePage from './pages/WorkspacePage';
import { api } from './services/api';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [error, setError] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  // Check if already logged in
  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    const savedUser = localStorage.getItem('auth_user');

    if (token && savedUser) {
      try {
        setUser(JSON.parse(savedUser));
        setIsAuthenticated(true);
      } catch (e) {
        console.error('Failed to parse user', e);
      }
    }
    setIsLoading(false);
  }, []);

  const handleLogin = async (email: string, password: string, name?: string) => {
    setError('');
    try {
      let response;

      if (name) {
        // Register
        response = await api.register(email, password, name);
      } else {
        // Login
        response = await api.login(email, password);
      }

      // Save token and user
      api.setToken(response.token);
      setUser(response.user);
      localStorage.setItem('auth_user', JSON.stringify(response.user));
      setIsAuthenticated(true);
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
      alert('Login failed: ' + (err.message || 'Please try again'));
    }
  };

  const handleLogout = () => {
    api.clearToken();
    setUser(null);
    localStorage.removeItem('auth_user');
    setIsAuthenticated(false);
  };

  if (isLoading) {
    return (
      <div style={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f9fafb'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '64px',
            height: '64px',
            background: 'linear-gradient(to bottom right, #3b82f6, #9333ea)',
            borderRadius: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: 'bold',
            fontSize: '24px',
            margin: '0 auto 16px'
          }}>
            DS
          </div>
          <p style={{ fontSize: '14px', color: '#6b7280' }}>Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage onLogin={handleLogin} />;
  }

  if (!selectedProjectId) {
    return (
      <HomePage
        user={user}
        onLogout={handleLogout}
        onSelectProject={setSelectedProjectId}
      />
    );
  }

  return (
    <WorkspacePage
      user={user}
      projectId={selectedProjectId}
      onLogout={handleLogout}
      onBackToHome={() => setSelectedProjectId(null)}
    />
  );
}
