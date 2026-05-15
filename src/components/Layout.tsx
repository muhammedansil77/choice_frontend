import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

const Layout: React.FC = () => {
  return (
    <div className="app-container">
      <Sidebar />
      <main className="main-content">
        <header className="main-header" style={{ 
          height: 'var(--header-height)', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'flex-end',
          marginBottom: '20px'
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
