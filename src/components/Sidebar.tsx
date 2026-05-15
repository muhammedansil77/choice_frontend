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
    <aside className={`
      fixed lg:fixed inset-y-0 left-0 z-[100]
      w-[75vw] max-w-[300px] lg:w-[var(--sidebar-width)]
      bg-glass/95 backdrop-blur-2xl border-r border-border
      transition-transform duration-300 ease-in-out
      flex flex-col p-6 overflow-y-auto
      ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
    `}>
      <div className="sidebar-logo mb-10 flex items-center justify-between">
        <h2 className="title-gradient text-2xl">ADMIN PANEL</h2>
      </div>

      <nav className="sidebar-nav flex-1 space-y-2">
        {menuItems.map((item) => (
          <NavLink 
            key={item.path} 
            to={item.path}
            onClick={() => {
              if (window.innerWidth < 1024) closeSidebar();
            }}
            className={({ isActive }) => `
              flex items-center p-4 rounded-xl transition-all duration-200
              ${isActive ? 'bg-primary/10 text-primary font-semibold' : 'text-text-muted hover:bg-white/5'}
            `}
          >
            <span className="mr-3">{item.icon}</span>
            <span>{item.name}</span>
            <ChevronRight size={14} className="ml-auto opacity-50" />
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer border-t border-border pt-5 mt-auto">
        <button 
          onClick={handleLogout}
          className="btn-outline w-full flex items-center p-3 rounded-xl text-text-muted hover:text-white transition-colors"
        >
          <LogOut size={20} className="mr-3" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
