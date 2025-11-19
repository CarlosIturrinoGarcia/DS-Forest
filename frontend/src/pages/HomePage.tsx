import { useState, useEffect } from 'react';
import { api } from '../services/api';

interface HomePageProps {
  user: any;
  onLogout: () => void;
  onSelectProject: (projectId: string) => void;
}

interface Project {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  nodes: any[];
}

export default function HomePage({ user, onLogout, onSelectProject }: HomePageProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDescription, setNewProjectDescription] = useState('');

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const data = await api.getProjects();
      setProjects(data);
    } catch (error) {
      console.error('Failed to load projects:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;

    setIsCreating(true);
    try {
      const newProject = await api.createProject(newProjectName, newProjectDescription);
      setProjects([newProject, ...projects]);
      setNewProjectName('');
      setNewProjectDescription('');
      setShowCreateForm(false);
    } catch (error) {
      console.error('Failed to create project:', error);
      alert('Failed to create project');
    } finally {
      setIsCreating(false);
    }
  };

  if (isLoading) {
    return (
      <div style={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #f5f7fa 0%, #e8ecf1 100%)'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner" style={{
            width: '48px',
            height: '48px',
            border: '4px solid #e5e7eb',
            borderTopColor: '#3b82f6',
            borderRadius: '50%',
            margin: '0 auto 16px'
          }}></div>
          <p style={{ fontSize: '14px', color: '#6b7280', fontWeight: 500 }}>Loading your workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      width: '100vw',
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f5f7fa 0%, #e8ecf1 100%)',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Header */}
      <header className="glass-card" style={{
        height: '72px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.3)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 48px',
        position: 'sticky',
        top: 0,
        zIndex: 50
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{
            width: '44px',
            height: '44px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: 800,
            fontSize: '18px',
            boxShadow: '0 8px 16px rgba(102, 126, 234, 0.4)'
          }}>
            DS
          </div>
          <h1 style={{
            fontSize: '24px',
            fontWeight: 800,
            margin: 0,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            letterSpacing: '-0.02em'
          }}>
            DS Forest
          </h1>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ fontSize: '14px', color: '#64748b', fontWeight: 500 }}>
            {user?.name || user?.email}
          </span>
          <button
            onClick={onLogout}
            style={{
              padding: '10px 20px',
              background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)'
            }}
          >
            Logout
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="fade-in-up" style={{
        padding: '80px 48px 60px',
        textAlign: 'center',
        maxWidth: '1200px',
        margin: '0 auto',
        width: '100%'
      }}>
        <h2 style={{
          fontSize: '56px',
          fontWeight: 800,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          marginBottom: '24px',
          letterSpacing: '-0.03em',
          lineHeight: '1.1'
        }}>
          Visualize Your Data Science<br />Workflow Like Never Before
        </h2>
        <p style={{
          fontSize: '20px',
          color: '#64748b',
          maxWidth: '800px',
          margin: '0 auto 40px',
          lineHeight: '1.7',
          fontWeight: 400
        }}>
          DS Forest helps data science teams collaborate, track experiments, and manage workflows with an intuitive visual canvas. From hypothesis to deployment, keep everything organized in one place.
        </p>
        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', alignItems: 'center' }}>
          <button
            onClick={() => setShowCreateForm(true)}
            style={{
              padding: '16px 32px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              fontSize: '16px',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 8px 24px rgba(102, 126, 234, 0.4)'
            }}
          >
            Create Your First Project
          </button>
          {projects.length > 0 && (
            <button
              onClick={() => document.getElementById('projects-section')?.scrollIntoView({ behavior: 'smooth' })}
              style={{
                padding: '16px 32px',
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                color: '#667eea',
                border: '2px solid #667eea',
                borderRadius: '12px',
                fontSize: '16px',
                fontWeight: 700,
                cursor: 'pointer',
                backdropFilter: 'blur(10px)'
              }}
            >
              View My Projects
            </button>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section style={{
        padding: '40px 48px',
        maxWidth: '1400px',
        margin: '0 auto',
        width: '100%'
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '32px',
          marginBottom: '60px'
        }}>
          {/* Feature 1: Visual Canvas */}
          <div className="glass-card shadow-premium-hover slide-in" style={{
            padding: '32px',
            borderRadius: '16px',
            textAlign: 'left',
            animationDelay: '0.1s'
          }}>
            <div style={{
              width: '60px',
              height: '60px',
              background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
              borderRadius: '14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '28px',
              marginBottom: '20px',
              boxShadow: '0 8px 20px rgba(59, 130, 246, 0.3)'
            }}>
              🎨
            </div>
            <h3 style={{
              fontSize: '22px',
              fontWeight: 700,
              color: '#1e293b',
              marginBottom: '12px',
              letterSpacing: '-0.01em'
            }}>
              Visual Workflow Canvas
            </h3>
            <p style={{
              fontSize: '15px',
              color: '#64748b',
              lineHeight: '1.7',
              marginBottom: '0'
            }}>
              Build your data science pipeline with an intuitive drag-and-drop interface. Connect experiments, track dependencies, and see your entire workflow at a glance.
            </p>
          </div>

          {/* Feature 2: Experiment Tracking */}
          <div className="glass-card shadow-premium-hover slide-in" style={{
            padding: '32px',
            borderRadius: '16px',
            textAlign: 'left',
            animationDelay: '0.2s'
          }}>
            <div style={{
              width: '60px',
              height: '60px',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              borderRadius: '14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '28px',
              marginBottom: '20px',
              boxShadow: '0 8px 20px rgba(16, 185, 129, 0.3)'
            }}>
              🧪
            </div>
            <h3 style={{
              fontSize: '22px',
              fontWeight: 700,
              color: '#1e293b',
              marginBottom: '12px',
              letterSpacing: '-0.01em'
            }}>
              Smart Experiment Tracking
            </h3>
            <p style={{
              fontSize: '15px',
              color: '#64748b',
              lineHeight: '1.7',
              marginBottom: '0'
            }}>
              Log hypotheses, parameters, and results for every experiment. Upload Jupyter notebooks and visualize outcomes with color-coded connections (green for success, red for failure).
            </p>
          </div>

          {/* Feature 3: Team Collaboration */}
          <div className="glass-card shadow-premium-hover slide-in" style={{
            padding: '32px',
            borderRadius: '16px',
            textAlign: 'left',
            animationDelay: '0.3s'
          }}>
            <div style={{
              width: '60px',
              height: '60px',
              background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
              borderRadius: '14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '28px',
              marginBottom: '20px',
              boxShadow: '0 8px 20px rgba(139, 92, 246, 0.3)'
            }}>
              👥
            </div>
            <h3 style={{
              fontSize: '22px',
              fontWeight: 700,
              color: '#1e293b',
              marginBottom: '12px',
              letterSpacing: '-0.01em'
            }}>
              Team Collaboration Boards
            </h3>
            <p style={{
              fontSize: '15px',
              color: '#64748b',
              lineHeight: '1.7',
              marginBottom: '0'
            }}>
              Organize tasks with Kanban boards, assign work to team members, track progress, and collaborate seamlessly. Perfect for managing complex data science projects.
            </p>
          </div>

          {/* Feature 4: Metrics Dashboard */}
          <div className="glass-card shadow-premium-hover slide-in" style={{
            padding: '32px',
            borderRadius: '16px',
            textAlign: 'left',
            animationDelay: '0.4s'
          }}>
            <div style={{
              width: '60px',
              height: '60px',
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              borderRadius: '14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '28px',
              marginBottom: '20px',
              boxShadow: '0 8px 20px rgba(245, 158, 11, 0.3)'
            }}>
              📊
            </div>
            <h3 style={{
              fontSize: '22px',
              fontWeight: 700,
              color: '#1e293b',
              marginBottom: '12px',
              letterSpacing: '-0.01em'
            }}>
              Comprehensive Metrics
            </h3>
            <p style={{
              fontSize: '15px',
              color: '#64748b',
              lineHeight: '1.7',
              marginBottom: '0'
            }}>
              Track model performance metrics, experiment results, and key KPIs. Store and compare metrics across experiments to make data-driven decisions.
            </p>
          </div>

          {/* Feature 5: Notebook Integration */}
          <div className="glass-card shadow-premium-hover slide-in" style={{
            padding: '32px',
            borderRadius: '16px',
            textAlign: 'left',
            animationDelay: '0.5s'
          }}>
            <div style={{
              width: '60px',
              height: '60px',
              background: 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)',
              borderRadius: '14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '28px',
              marginBottom: '20px',
              boxShadow: '0 8px 20px rgba(236, 72, 153, 0.3)'
            }}>
              📓
            </div>
            <h3 style={{
              fontSize: '22px',
              fontWeight: 700,
              color: '#1e293b',
              marginBottom: '12px',
              letterSpacing: '-0.01em'
            }}>
              Jupyter Notebook Viewer
            </h3>
            <p style={{
              fontSize: '15px',
              color: '#64748b',
              lineHeight: '1.7',
              marginBottom: '0'
            }}>
              Upload and view Jupyter notebooks directly in the platform. Keep your analysis, code, and visualizations alongside your workflow for complete context.
            </p>
          </div>

          {/* Feature 6: Dataset Management */}
          <div className="glass-card shadow-premium-hover slide-in" style={{
            padding: '32px',
            borderRadius: '16px',
            textAlign: 'left',
            animationDelay: '0.6s'
          }}>
            <div style={{
              width: '60px',
              height: '60px',
              background: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
              borderRadius: '14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '28px',
              marginBottom: '20px',
              boxShadow: '0 8px 20px rgba(6, 182, 212, 0.3)'
            }}>
              🗄️
            </div>
            <h3 style={{
              fontSize: '22px',
              fontWeight: 700,
              color: '#1e293b',
              marginBottom: '12px',
              letterSpacing: '-0.01em'
            }}>
              Dataset & Model Tracking
            </h3>
            <p style={{
              fontSize: '15px',
              color: '#64748b',
              lineHeight: '1.7',
              marginBottom: '0'
            }}>
              Link datasets to experiments, track model versions, and maintain a complete lineage of your data science artifacts. Never lose track of what went into each model.
            </p>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section style={{
        padding: '60px 48px',
        maxWidth: '1200px',
        margin: '0 auto',
        width: '100%'
      }}>
        <h2 className="gradient-text" style={{
          fontSize: '40px',
          fontWeight: 800,
          textAlign: 'center',
          marginBottom: '16px',
          letterSpacing: '-0.02em'
        }}>
          How It Works
        </h2>
        <p style={{
          fontSize: '18px',
          color: '#64748b',
          textAlign: 'center',
          maxWidth: '700px',
          margin: '0 auto 60px',
          lineHeight: '1.7'
        }}>
          Get started with DS Forest in minutes. Our intuitive platform makes managing data science projects effortless.
        </p>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '40px'
        }}>
          {/* Step 1 */}
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: '80px',
              height: '80px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderRadius: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 24px',
              boxShadow: '0 12px 28px rgba(102, 126, 234, 0.4)',
              fontSize: '32px',
              fontWeight: 800,
              color: 'white'
            }}>
              1
            </div>
            <h3 style={{
              fontSize: '20px',
              fontWeight: 700,
              color: '#1e293b',
              marginBottom: '12px'
            }}>
              Create a Project
            </h3>
            <p style={{
              fontSize: '15px',
              color: '#64748b',
              lineHeight: '1.7'
            }}>
              Start by creating a new project for your data science initiative. Give it a name and description to organize your work.
            </p>
          </div>

          {/* Step 2 */}
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: '80px',
              height: '80px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderRadius: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 24px',
              boxShadow: '0 12px 28px rgba(102, 126, 234, 0.4)',
              fontSize: '32px',
              fontWeight: 800,
              color: 'white'
            }}>
              2
            </div>
            <h3 style={{
              fontSize: '20px',
              fontWeight: 700,
              color: '#1e293b',
              marginBottom: '12px'
            }}>
              Build Your Workflow
            </h3>
            <p style={{
              fontSize: '15px',
              color: '#64748b',
              lineHeight: '1.7'
            }}>
              Add experiment cards, data processing nodes, and model training steps. Connect them to visualize your pipeline and dependencies.
            </p>
          </div>

          {/* Step 3 */}
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: '80px',
              height: '80px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderRadius: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 24px',
              boxShadow: '0 12px 28px rgba(102, 126, 234, 0.4)',
              fontSize: '32px',
              fontWeight: 800,
              color: 'white'
            }}>
              3
            </div>
            <h3 style={{
              fontSize: '20px',
              fontWeight: 700,
              color: '#1e293b',
              marginBottom: '12px'
            }}>
              Track & Collaborate
            </h3>
            <p style={{
              fontSize: '15px',
              color: '#64748b',
              lineHeight: '1.7'
            }}>
              Log experiment results, upload notebooks, assign tasks to team members, and collaborate seamlessly throughout your project lifecycle.
            </p>
          </div>
        </div>
      </section>

      {/* Projects Section */}
      <section id="projects-section" style={{
        padding: '60px 48px 80px',
        maxWidth: '1200px',
        margin: '0 auto',
        width: '100%'
      }}>
        <div style={{ marginBottom: '40px' }}>
          <h2 style={{
            fontSize: '36px',
            fontWeight: 800,
            color: '#1e293b',
            marginBottom: '12px',
            letterSpacing: '-0.02em'
          }}>
            My Projects
          </h2>
          <p style={{ fontSize: '16px', color: '#64748b', fontWeight: 500 }}>
            Select a project to continue or create a new one
          </p>
        </div>

        {/* Create Project Button */}
        {!showCreateForm && (
          <button
            onClick={() => setShowCreateForm(true)}
            className="glass-card"
            style={{
              padding: '14px 28px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              fontSize: '16px',
              fontWeight: 700,
              cursor: 'pointer',
              marginBottom: '32px',
              boxShadow: '0 8px 24px rgba(102, 126, 234, 0.4)'
            }}
          >
            + Create New Project
          </button>
        )}

        {/* Create Project Form */}
        {showCreateForm && (
          <div className="glass-card shadow-premium fade-in-up" style={{
            padding: '32px',
            borderRadius: '16px',
            marginBottom: '32px'
          }}>
            <h3 style={{
              fontSize: '24px',
              fontWeight: 700,
              marginBottom: '24px',
              color: '#1e293b',
              letterSpacing: '-0.01em'
            }}>
              Create New Project
            </h3>
            <form onSubmit={handleCreateProject}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#475569',
                  marginBottom: '8px',
                  letterSpacing: '0.01em'
                }}>
                  Project Name *
                </label>
                <input
                  type="text"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="e.g., Customer Churn Prediction"
                  required
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '2px solid #e2e8f0',
                    borderRadius: '10px',
                    fontSize: '15px',
                    boxSizing: 'border-box',
                    fontWeight: 500,
                    backgroundColor: 'rgba(255, 255, 255, 0.7)'
                  }}
                />
              </div>
              <div style={{ marginBottom: '24px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#475569',
                  marginBottom: '8px',
                  letterSpacing: '0.01em'
                }}>
                  Description (optional)
                </label>
                <textarea
                  value={newProjectDescription}
                  onChange={(e) => setNewProjectDescription(e.target.value)}
                  placeholder="Brief description of your project goals and scope..."
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '2px solid #e2e8f0',
                    borderRadius: '10px',
                    fontSize: '15px',
                    boxSizing: 'border-box',
                    resize: 'vertical',
                    fontWeight: 500,
                    backgroundColor: 'rgba(255, 255, 255, 0.7)'
                  }}
                />
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  type="submit"
                  disabled={isCreating}
                  style={{
                    padding: '12px 24px',
                    background: isCreating ? '#94a3b8' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '10px',
                    fontSize: '15px',
                    fontWeight: 700,
                    cursor: isCreating ? 'not-allowed' : 'pointer',
                    boxShadow: isCreating ? 'none' : '0 6px 16px rgba(102, 126, 234, 0.4)'
                  }}
                >
                  {isCreating ? 'Creating...' : 'Create Project'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateForm(false);
                    setNewProjectName('');
                    setNewProjectDescription('');
                  }}
                  style={{
                    padding: '12px 24px',
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    color: '#475569',
                    border: '2px solid #e2e8f0',
                    borderRadius: '10px',
                    fontSize: '15px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Projects Grid */}
        {projects.length === 0 ? (
          <div className="glass-card fade-in-up" style={{
            padding: '60px',
            borderRadius: '16px',
            textAlign: 'center',
            border: '3px dashed rgba(102, 126, 234, 0.3)'
          }}>
            <div style={{
              width: '100px',
              height: '100px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderRadius: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '48px',
              margin: '0 auto 28px',
              boxShadow: '0 12px 32px rgba(102, 126, 234, 0.4)'
            }}>
              📁
            </div>
            <h3 style={{
              fontSize: '24px',
              fontWeight: 700,
              color: '#1e293b',
              marginBottom: '12px',
              letterSpacing: '-0.01em'
            }}>
              No projects yet
            </h3>
            <p style={{
              fontSize: '16px',
              color: '#64748b',
              marginBottom: '28px',
              lineHeight: '1.7'
            }}>
              Create your first project to start visualizing and managing your data science workflows
            </p>
            {!showCreateForm && (
              <button
                onClick={() => setShowCreateForm(true)}
                style={{
                  padding: '14px 28px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '16px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 8px 24px rgba(102, 126, 234, 0.4)'
                }}
              >
                Get Started
              </button>
            )}
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '24px'
          }}>
            {projects.map((project, index) => (
              <div
                key={project.id}
                onClick={() => onSelectProject(project.id)}
                className="glass-card shadow-premium-hover fade-in-up"
                style={{
                  padding: '28px',
                  borderRadius: '16px',
                  cursor: 'pointer',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  animationDelay: `${index * 0.1}s`
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <h3 style={{
                  fontSize: '20px',
                  fontWeight: 700,
                  color: '#1e293b',
                  marginBottom: '10px',
                  letterSpacing: '-0.01em'
                }}>
                  {project.name}
                </h3>
                {project.description && (
                  <p style={{
                    fontSize: '14px',
                    color: '#64748b',
                    marginBottom: '16px',
                    lineHeight: '1.6',
                    fontWeight: 500
                  }}>
                    {project.description}
                  </p>
                )}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginTop: '20px',
                  paddingTop: '20px',
                  borderTop: '2px solid rgba(226, 232, 240, 0.5)'
                }}>
                  <span className="badge" style={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    fontSize: '12px',
                    fontWeight: 700
                  }}>
                    {project.nodes?.length || 0} cards
                  </span>
                  <span style={{
                    fontSize: '12px',
                    color: '#94a3b8',
                    fontWeight: 600
                  }}>
                    {new Date(project.updatedAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Footer */}
      <footer style={{
        padding: '32px 48px',
        borderTop: '1px solid rgba(226, 232, 240, 0.5)',
        textAlign: 'center'
      }}>
        <p style={{
          fontSize: '14px',
          color: '#94a3b8',
          fontWeight: 500,
          margin: 0
        }}>
          DS Forest - Visualize Your Data Science Journey
        </p>
      </footer>
    </div>
  );
}
