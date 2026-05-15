import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { Menu, X } from 'lucide-react';

const Layout: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const closeSidebar = () => setIsSidebarOpen(false);

  return (
    <div className="app-container flex min-h-screen bg-background overflow-x-hidden">
      {/* Mobile Header - Fixed at Top */}
      <div className="mobile-header lg:hidden fixed top-0 left-0 right-0 h-[var(--header-height)] bg-glass/80 backdrop-blur-xl border-b border-border z-[60] flex items-center justify-between px-5">
        <h2 className="title-gradient text-xl">ADMIN</h2>
        <button 
          onClick={toggleSidebar}
          className="p-2 text-white hover:bg-white/5 rounded-lg transition-colors"
        >
          {isSidebarOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

      {/* Mobile Overlay - Dark transparent background */}
      <div 
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity duration-300 ${
          isSidebarOpen ? 'opacity-100 visible' : 'opacity-0 invisible'
        } lg:hidden`}
        onClick={closeSidebar}
      />

      <Sidebar isOpen={isSidebarOpen} closeSidebar={closeSidebar} />
      
      <main className={`flex-1 min-h-screen transition-all duration-300 lg:ml-[var(--sidebar-width)] ${
        isSidebarOpen ? 'max-lg:overflow-hidden' : ''
      }`}>
        <header className="main-header hidden lg:flex h-[var(--header-height)] items-center justify-end px-8 mb-5">
          <div className="user-profile flex items-center gap-3 bg-glass px-4 py-2 rounded-full border border-border">
            <span className="text-sm font-medium">Admin User</span>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary"></div>
          </div>
        </header>
        <div className="page-wrapper animate-fade-in px-4 lg:px-8 py-5 max-lg:pt-24">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;
