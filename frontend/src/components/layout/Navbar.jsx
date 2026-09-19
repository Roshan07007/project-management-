import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sun, Moon, Menu, X, User, LogOut, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { checkHealth } from '../../services/api';

export const Navbar = ({ onMobileMenuToggle, isMobileMenuOpen }) => {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [dbStatus, setDbStatus] = useState('checking');

  useEffect(() => {
    const fetchHealth = async () => {
      try {
        const res = await checkHealth();
        if (res.database?.connected) {
          setDbStatus('connected');
        } else {
          setDbStatus('degraded');
        }
      } catch {
        setDbStatus('offline');
      }
    };

    fetchHealth();
    const interval = setInterval(fetchHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header className="h-16 border-b border-gray-200 dark:border-dark-border bg-white/80 dark:bg-dark-card/80 backdrop-blur-md px-4 sm:px-8 flex items-center justify-between sticky top-0 z-30">
      {/* Left section: Mobile menu toggle */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMobileMenuToggle}
          className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 lg:hidden rounded-xl hover:bg-gray-100 dark:hover:bg-dark-surface transition-colors"
        >
          {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>

        {/* Database Connectivity Indicator */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium border bg-gray-50 dark:bg-dark-surface border-gray-200 dark:border-dark-border">
          {dbStatus === 'connected' && (
            <>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-emerald-600 dark:text-emerald-400">MongoDB Atlas Connected</span>
            </>
          )}
          {dbStatus === 'checking' && (
            <>
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-spin" />
              <span className="text-blue-500">Checking Atlas...</span>
            </>
          )}
          {dbStatus === 'offline' && (
            <>
              <span className="w-2 h-2 rounded-full bg-red-500" />
              <span className="text-red-500">Atlas Offline</span>
            </>
          )}
        </div>
      </div>

      {/* Right section: Theme toggle & Profile */}
      <div className="flex items-center gap-3">
        {/* Dark/Light mode toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-xl hover:bg-gray-100 dark:hover:bg-dark-surface transition-colors"
          title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {isDark ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-blue-600" />}
        </button>

        {/* User Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => setProfileMenuOpen((prev) => !prev)}
            className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-dark-surface transition-colors"
          >
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs font-bold shadow-sm"
              style={{ backgroundColor: user?.avatarColor || '#3b82f6' }}
            >
              {getInitials(user?.name)}
            </div>
            <span className="hidden md:block text-sm font-semibold text-gray-800 dark:text-gray-200 max-w-[120px] truncate">
              {user?.name}
            </span>
          </button>

          {profileMenuOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setProfileMenuOpen(false)}
              />
              <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border shadow-2xl p-2 z-20 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-3 py-2 border-b border-gray-100 dark:border-dark-border/60">
                  <p className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate">{user?.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user?.email}</p>
                </div>

                <div className="py-1">
                  <Link
                    to="/profile"
                    onClick={() => setProfileMenuOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-surface rounded-xl transition-colors"
                  >
                    <User className="w-4 h-4 text-primary-500" />
                    <span>My Profile</span>
                  </Link>

                  <button
                    onClick={() => {
                      setProfileMenuOpen(false);
                      handleLogout();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
