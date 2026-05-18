import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, 
  Users, 
  Package, 
  Tags, 
  ShoppingCart, 
  LogOut,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  closeSidebar: () => void;
  isCollapsed: boolean;
  toggleCollapse: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, closeSidebar, isCollapsed, toggleCollapse }) => {
  const location = useLocation();
  
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

  const desktopWidth = isCollapsed ? 88 : 280;

  return (
    <motion.aside 
      className={`sidebar ${isOpen ? 'open' : ''}`}
      animate={{ 
        width: window.innerWidth < 1025 ? '75%' : desktopWidth 
      }}
      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
      style={{
        boxSizing: 'border-box'
      }}
    >
      <div className="sidebar-logo" style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', minHeight: '40px' }}>
        <AnimatePresence mode="wait">
          {!isCollapsed ? (
            <motion.h2 
              key="expanded"
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.2 }}
              className="title-gradient" 
              style={{ fontSize: '18px', fontWeight: '700', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}
            >
              Choice Electricals <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--primary)', boxShadow: '0 0 10px var(--primary)' }}></span>
            </motion.h2>
          ) : (
            <motion.h2 
              key="collapsed"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.2 }}
              className="title-gradient" 
              style={{ 
                fontSize: '18px', 
                fontWeight: '700', 
                margin: '0 auto', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                width: '40px', 
                height: '40px', 
                borderRadius: '12px', 
                background: 'rgba(168, 85, 247, 0.1)', 
                border: '1px solid rgba(168, 85, 247, 0.2)',
                boxShadow: '0 0 10px rgba(168, 85, 247, 0.05)'
              }}
            >
              CE
            </motion.h2>
          )}
        </AnimatePresence>
      </div>

      {/* Mobile User Profile */}
      {window.innerWidth < 1025 && (
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '12px',
          background: 'rgba(255,255,255,0.03)',
          padding: '12px',
          borderRadius: '16px',
          border: '1px solid var(--border)',
          marginBottom: '32px'
        }}>
          <div style={{ 
            width: '40px', 
            height: '40px', 
            borderRadius: '50%', 
            background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
            boxShadow: '0 0 10px rgba(168, 85, 247, 0.3)'
          }}></div>
          <div>
            <p style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text)' }}>Admin User</p>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Administrator</p>
          </div>
        </div>
      )}

      <nav className="sidebar-nav" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <NavLink 
              key={item.path} 
              to={item.path}
              onClick={() => {
                if (window.innerWidth < 1025) closeSidebar();
              }}
              className="nav-link"
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '14px 16px',
                borderRadius: '12px',
                color: isActive ? '#f9fafb' : '#9ca3af',
                textDecoration: 'none',
                marginBottom: '4px',
                transition: 'all 0.3s ease',
                fontWeight: isActive ? '600' : '400',
                position: 'relative',
                justifyContent: isCollapsed && window.innerWidth >= 1025 ? 'center' : 'flex-start'
              }}
            >
              {/* Shared active tab slide-pill background */}
              {isActive && (
                <motion.div 
                  layoutId="activeNavPill"
                  className="nav-link-bg"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}

              {/* Glowing left edge indicator */}
              {isActive && !isCollapsed && (
                <motion.div 
                  layoutId="activeIndicator"
                  style={{
                    position: 'absolute',
                    left: '4px',
                    top: '25%',
                    height: '50%',
                    width: '3px',
                    borderRadius: '2px',
                    background: 'var(--primary)',
                    boxShadow: '0 0 10px var(--primary)'
                  }}
                />
              )}

              <span style={{ 
                marginRight: isCollapsed && window.innerWidth >= 1025 ? '0' : '14px',
                color: isActive ? 'var(--primary)' : 'inherit',
                display: 'flex',
                alignItems: 'center'
              }}>
                {item.icon}
              </span>

              <AnimatePresence>
                {(!isCollapsed || window.innerWidth < 1025) && (
                  <motion.span
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.15 }}
                    style={{ fontSize: '14px', whiteSpace: 'nowrap' }}
                  >
                    {item.name}
                  </motion.span>
                )}
              </AnimatePresence>

              {(!isCollapsed || window.innerWidth < 1025) && isActive && (
                <ChevronRight size={14} style={{ marginLeft: 'auto', opacity: 0.5 }} />
              )}
            </NavLink>
          );
        })}
      </nav>

      <div className="sidebar-footer" style={{ borderTop: '1px solid var(--border)', paddingTop: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Toggle Collapse Button for desktop */}
        {window.innerWidth >= 1025 && (
          <button 
            onClick={toggleCollapse}
            className="btn btn-outline"
            style={{ 
              width: '100%', 
              justifyContent: isCollapsed ? 'center' : 'flex-start',
              padding: '10px',
              borderRadius: '12px',
              color: 'var(--text-muted)'
            }}
          >
            {isCollapsed ? <PanelLeftOpen size={20} /> : (
              <>
                <PanelLeftClose size={20} style={{ marginRight: '10px' }} />
                <span style={{ fontSize: '13px' }}>Collapse Menu</span>
              </>
            )}
          </button>
        )}

        <button 
          onClick={handleLogout}
          className="btn btn-outline" 
          style={{ 
            width: '100%', 
            justifyContent: isCollapsed && window.innerWidth >= 1025 ? 'center' : 'flex-start',
            padding: '12px',
            borderRadius: '12px',
            borderColor: 'rgba(239, 68, 68, 0.2)',
            color: 'rgba(255, 255, 255, 0.8)',
            display: 'flex',
            alignItems: 'center',
            background: 'transparent',
            transition: 'all 0.3s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.4)';
            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.05)';
            e.currentTarget.style.boxShadow = '0 0 10px rgba(239, 68, 68, 0.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.2)';
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          <LogOut size={20} style={{ color: 'var(--danger)', marginRight: isCollapsed && window.innerWidth >= 1025 ? '0' : '10px' }} />
          {(!isCollapsed || window.innerWidth < 1025) && <span style={{ fontSize: '14px', fontWeight: '500' }}>Logout</span>}
        </button>
      </div>
    </motion.aside>
  );
};

export default Sidebar;
