interface LandingPageProps {
  onGetStarted: () => void;
}

export default function LandingPage({ onGetStarted }: LandingPageProps) {
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
          <button
            onClick={onGetStarted}
            style={{
              padding: '10px 24px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)'
            }}
          >
            Sign In
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
            onClick={onGetStarted}
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
            Get Started Free
          </button>
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

      {/* CTA Section */}
      <section style={{
        padding: '80px 48px',
        textAlign: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        marginTop: '60px'
      }}>
        <h2 style={{
          fontSize: '40px',
          fontWeight: 800,
          color: 'white',
          marginBottom: '20px',
          letterSpacing: '-0.02em'
        }}>
          Ready to Transform Your<br />Data Science Workflow?
        </h2>
        <p style={{
          fontSize: '18px',
          color: 'rgba(255, 255, 255, 0.9)',
          marginBottom: '32px',
          maxWidth: '600px',
          margin: '0 auto 32px'
        }}>
          Join data science teams who are already using DS Forest to manage their experiments and collaborate more effectively.
        </p>
        <button
          onClick={onGetStarted}
          style={{
            padding: '16px 40px',
            backgroundColor: 'white',
            color: '#667eea',
            border: 'none',
            borderRadius: '12px',
            fontSize: '16px',
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)'
          }}
        >
          Get Started Free
        </button>
      </section>

      {/* Footer */}
      <footer style={{
        padding: '32px 48px',
        borderTop: '1px solid rgba(226, 232, 240, 0.5)',
        textAlign: 'center',
        background: 'rgba(255, 255, 255, 0.5)'
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
