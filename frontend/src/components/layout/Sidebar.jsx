import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  FolderKanban,
  KanbanSquare,
  Users,
  User,
  PlusCircle,
  Layers,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const Sidebar = ({ isMobileMenuOpen, onMobileClose, onOpenCreateProject }) => {
  const { user } = useAuth();

  const navItems = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/projects', label: 'Projects', icon: FolderKanban },
    { to: '/kanban', label: 'Kanban Board', icon: KanbanSquare },
    { to: '/team', label: 'Team Members', icon: Users },
    { to: '/profile', label: 'My Profile', icon: User },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={onMobileClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 left-0 bottom-0 z-50 w-64 bg-white dark:bg-dark-card border-r border-gray-200 dark:border-dark-border flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 border-b border-gray-200 dark:border-dark-border flex items-center justify-between px-6">
          <Link
            to="/dashboard"
            onClick={onMobileClose}
            className="flex items-center gap-2.5 font-extrabold text-xl tracking-tight text-gray-900 dark:text-gray-100"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-primary-600 to-indigo-500 flex items-center justify-center text-white shadow-glow">
              <Layers className="w-5 h-5" />
            </div>
            <span>Task<span className="text-primary-500">Flow</span></span>
          </Link>
        </div>

        {/* Action Button */}
        <div className="p-4">
          <button
            onClick={() => {
              onMobileClose();
              if (onOpenCreateProject) onOpenCreateProject();
            }}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold rounded-xl shadow-md shadow-primary-500/25 transition-all hover:scale-[1.02]"
          >
            <PlusCircle className="w-4 h-4" />
            <span>New Project</span>
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 space-y-1.5 overflow-y-auto">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onMobileClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  isActive
                    ? 'bg-primary-500/10 text-primary-600 dark:text-primary-400 border border-primary-500/20'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-surface hover:text-gray-900 dark:hover:text-gray-200'
                }`
              }
            >
              <Icon className="w-5 h-5 shrink-0" />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* User Card in Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-dark-border/60">
          <Link
            to="/profile"
            onClick={onMobileClose}
            className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-dark-surface transition-colors"
          >
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-sm"
              style={{ backgroundColor: user?.avatarColor || '#3b82f6' }}
            >
              {user?.name ? user.name.slice(0, 2).toUpperCase() : 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate">
                {user?.name}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {user?.email}
              </p>
            </div>
          </Link>
        </div>
      </aside>
    </>
  );
};
