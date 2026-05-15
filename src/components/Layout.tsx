import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { Menu, X } from 'lucide-react';

const Layout: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const closeSidebar = () => setIsSidebarOpen(false);

  return (
    <div className="app-container">
      {/* Mobile Header */}
      <div className="mobile-header">
        <h2 className="title-gradient" style={{ fontSize: '20px' }}>ADMIN</h2>
        <button 
          onClick={toggleSidebar}
          style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}
        >
          {isSidebarOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

      {/* Mobile Overlay */}
      <div 
        className={`overlay ${isSidebarOpen ? 'visible' : ''}`} 
        onClick={closeSidebar}
      />

      <Sidebar isOpen={isSidebarOpen} closeSidebar={closeSidebar} />
      
      <main className="main-content">
        <header className="main-header" style={{ 
          height: 'var(--header-height)', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'flex-end',
          marginBottom: '20px',
          display: window.innerWidth < 1025 ? 'none' : 'flex'
        }}>
          <div className="user-profile" style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '12px',
            background: 'var(--glass)',
            padding: '8px 16px',
            borderRadius: '50px',
            border: '1px solid var(--border)'
          }}>
            <span style={{ fontSize: '14px', fontWeight: '500' }}>Admin User</span>
            <div style={{ 
              width: '32px', 
              height: '32px', 
              borderRadius: '50%', 
              background: 'linear-gradient(135deg, var(--primary), var(--secondary))' 
            }}></div>
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
