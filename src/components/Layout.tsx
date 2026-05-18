// Triggering new Vercel build
import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { Menu, X, Search, Bell } from 'lucide-react';

const Layout: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const closeSidebar = () => setIsSidebarOpen(false);
  const toggleSidebarCollapse = () => setIsSidebarCollapsed(!isSidebarCollapsed);

  return (
    <div 
      className="app-container" 
      style={{ 
        '--active-sidebar-width': isSidebarCollapsed ? '88px' : '280px' 
      } as React.CSSProperties}
    >
      {/* Mobile Header */}
      <div className="mobile-header">
        <h2 className="title-gradient" style={{ fontSize: '20px', fontWeight: '700', margin: 0 }}>Choice Electricals</h2>
        <button 
          onClick={toggleSidebar}
          style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
        >
          {isSidebarOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

      {/* Mobile Overlay */}
      <div 
        className={`overlay ${isSidebarOpen ? 'visible' : ''}`} 
        onClick={closeSidebar}
      />

      <Sidebar 
        isOpen={isSidebarOpen} 
        closeSidebar={closeSidebar} 
        isCollapsed={isSidebarCollapsed}
        toggleCollapse={toggleSidebarCollapse}
      />
      
      <main className="main-content">
        <header className="main-header">
          {/* Futuristic Search bar on topbar left */}
          <div className="search-box">
            <Search size={18} style={{ color: 'var(--text-muted)' }} />
            <input type="text" placeholder="Search billing, clients, inventory..." />
            <span className="search-shortcut">⌘K</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            {/* Notification Bell with neon badge */}
            <div className="notification-btn">
              <Bell size={20} />
              <span className="notification-badge"></span>
            </div>

            {/* Glowing Admin profile */}
            <div className="user-profile" style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '12px',
              background: 'rgba(255, 255, 255, 0.02)',
              padding: '6px 14px 6px 6px',
              borderRadius: '50px',
              border: '1px solid var(--border)',
              cursor: 'pointer'
            }}>
              <div className="avatar-glow">
                <div className="avatar-inner" style={{
                  background: 'linear-gradient(135deg, var(--primary), var(--secondary))'
                }}></div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
                <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text)' }}>Admin User</span>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '500' }}>Choice Main</span>
              </div>
            </div>
          </div>
        </header>

        <div className="page-wrapper animate-fade-in">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;
