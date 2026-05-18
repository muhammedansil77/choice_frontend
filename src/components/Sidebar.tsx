import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Package, 
  Tags, 
  ShoppingCart, 
  LogOut,
  ChevronRight
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  closeSidebar: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, closeSidebar }) => {
  const menuItems = [
    { name: 'Dashboard', path: '/', icon: <LayoutDashboard size={20} /> },
    { name: 'Users', path: '/users', icon: <Users size={20} /> },
    { name: 'Products', path: '/products', icon: <Package size={20} /> },
    { name: 'Categories', path: '/categories', icon: <Tags size={20} /> },
    { name: 'Orders', path: '/orders', icon: <ShoppingCart size={20} /> },
  ];

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    window.location.href = '/login';
  };

  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`} style={{ width: window.innerWidth < 1025 ? '75%' : 'var(--sidebar-width)' }}>
      <div className="sidebar-logo" style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 className="title-gradient" style={{ fontSize: '20px', fontWeight: '700', letterSpacing: '-0.02em' }}>Choice Electricals</h2>
      </div>

      {/* Mobile User Profile */}
      {window.innerWidth < 1025 && (
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '12px',
          background: 'rgba(255,255,255,0.05)',
          padding: '12px',
          borderRadius: '16px',
          border: '1px solid var(--border)',
          marginBottom: '32px'
        }}>
          <div style={{ 
            width: '40px', 
            height: '40px', 
            borderRadius: '50%', 
            background: 'linear-gradient(135deg, var(--primary), var(--secondary))' 
          }}></div>
          <div>
            <p style={{ fontSize: '14px', fontWeight: '600' }}>Admin User</p>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Administrator</p>
          </div>
        </div>
      )}

      <nav className="sidebar-nav" style={{ flex: 1 }}>
        {menuItems.map((item) => (
          <NavLink 
            key={item.path} 
            to={item.path}
            onClick={() => {
              if (window.innerWidth < 1025) closeSidebar();
            }}
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              padding: '14px 16px',
              borderRadius: '12px',
              color: isActive ? 'var(--primary)' : 'var(--text-muted)',
              textDecoration: 'none',
              marginBottom: '8px',
              background: isActive ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
              transition: 'all 0.3s ease',
              fontWeight: isActive ? '600' : '400',
              position: 'relative'
            })}
          >
            <span style={{ marginRight: '12px' }}>{item.icon}</span>
            <span>{item.name}</span>
            <ChevronRight size={14} style={{ marginLeft: 'auto', opacity: 0.5 }} />
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer" style={{ borderTop: '1px solid var(--border)', paddingTop: '20px' }}>
        <button 
          onClick={handleLogout}
          className="btn btn-outline" 
          style={{ width: '100%', justifyContent: 'flex-start' }}
        >
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
