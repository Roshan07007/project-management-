import React, { useState } from 'react';
import {
  User,
  Mail,
  Lock,
  Calendar,
  Save,
  KeyRound,
  CheckCircle2,
  LogOut,
  Palette,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { updateMyProfile, changeMyPassword } from '../services/api';

export const ProfilePage = () => {
  const { user, updateUser, logout, showToast } = useAuth();

  // Profile Form state
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    bio: user?.bio || '',
    avatarColor: user?.avatarColor || '#3b82f6',
  });
  const [savingProfile, setSavingProfile] = useState(false);

  // Password Form state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  const colorPalette = [
    '#3b82f6', // blue
    '#8b5cf6', // purple
    '#ec4899', // pink
    '#10b981', // emerald
    '#f59e0b', // amber
    '#06b6d4', // cyan
    '#6366f1', // indigo
    '#14b8a6', // teal
  ];

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    if (!profileData.name.trim()) {
      showToast('Name cannot be empty', 'error');
      return;
    }

    try {
      setSavingProfile(true);
      const res = await updateMyProfile(profileData);
      updateUser(res.user);
      showToast('Profile updated successfully!');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordError('');

    if (passwordData.newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters.');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }

    try {
      setChangingPassword(true);
      await changeMyPassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      showToast('Password changed successfully!');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setPasswordError(err.message);
    } finally {
      setChangingPassword(false);
    }
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-200">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-gray-100 tracking-tight flex items-center gap-2.5">
          <User className="w-7 h-7 text-primary-500" />
          <span>My Profile & Settings</span>
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Personalize your avatar, update account info, and manage security settings.
        </p>
      </div>

      {/* User Hero Summary Card */}
      <div className="glass-card p-6 sm:p-8 rounded-3xl flex flex-col sm:flex-row items-center gap-6">
        <div
          className="w-20 h-20 rounded-3xl flex items-center justify-center text-white text-2xl font-black shadow-lg shadow-primary-500/20 shrink-0"
          style={{ backgroundColor: profileData.avatarColor || '#3b82f6' }}
        >
          {getInitials(user?.name)}
        </div>

        <div className="flex-1 text-center sm:text-left min-w-0">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 truncate">
            {user?.name}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 truncate mt-0.5">
            {user?.email}
          </p>

          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 mt-3 text-xs text-gray-500 dark:text-gray-400">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-primary-500" />
              <span>
                Joined {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'Recently'}
              </span>
            </span>
          </div>
        </div>

        <button
          onClick={logout}
          className="px-4 py-2.5 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 text-red-600 dark:text-red-400 text-xs font-bold rounded-xl transition-colors flex items-center gap-2 shrink-0"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Profile Details Form */}
        <div className="glass-card p-6 sm:p-8 rounded-3xl space-y-6">
          <div className="flex items-center gap-2.5 text-primary-600 dark:text-primary-400">
            <User className="w-5 h-5" />
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
              Personal Information
            </h3>
          </div>

          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                value={profileData.name}
                onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                required
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-input text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-primary-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5">
                Email Address (Read-Only)
              </label>
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-dark-border bg-gray-100 dark:bg-dark-surface text-gray-500 text-sm cursor-not-allowed outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5">
                Bio / Role Description
              </label>
              <textarea
                value={profileData.bio}
                onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                placeholder="Senior Full Stack Engineer..."
                rows={3}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-input text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-primary-500 outline-none resize-y"
              />
            </div>

            {/* Avatar Color Palette */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5" />
                <span>Avatar Theme Accent</span>
              </label>
              <div className="flex items-center gap-2.5">
                {colorPalette.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setProfileData({ ...profileData, avatarColor: color })}
                    className={`w-7 h-7 rounded-xl transition-all ${
                      profileData.avatarColor === color ? 'scale-125 ring-2 ring-primary-500 ring-offset-2 dark:ring-offset-dark-card' : 'hover:scale-110'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={savingProfile}
              className="w-full py-3 bg-primary-600 hover:bg-primary-700 text-white font-bold text-sm rounded-xl shadow-md shadow-primary-500/25 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>{savingProfile ? 'Saving Changes...' : 'Save Profile'}</span>
            </button>
          </form>
        </div>

        {/* Change Password Form */}
        <div className="glass-card p-6 sm:p-8 rounded-3xl space-y-6">
          <div className="flex items-center gap-2.5 text-indigo-600 dark:text-indigo-400">
            <KeyRound className="w-5 h-5" />
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
              Security & Password
            </h3>
          </div>

          {passwordError && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-600 dark:text-red-400 text-xs">
              {passwordError}
            </div>
          )}

          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5">
                Current Password
              </label>
              <input
                type="password"
                value={passwordData.currentPassword}
                onChange={(e) =>
                  setPasswordData({ ...passwordData, currentPassword: e.target.value })
                }
                required
                placeholder="••••••••"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-input text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-primary-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5">
                New Password (Min. 6 chars)
              </label>
              <input
                type="password"
                value={passwordData.newPassword}
                onChange={(e) =>
                  setPasswordData({ ...passwordData, newPassword: e.target.value })
                }
                required
                placeholder="••••••••"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-input text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-primary-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5">
                Confirm New Password
              </label>
              <input
                type="password"
                value={passwordData.confirmPassword}
                onChange={(e) =>
                  setPasswordData({ ...passwordData, confirmPassword: e.target.value })
                }
                required
                placeholder="••••••••"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-input text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-primary-500 outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={changingPassword}
              className="w-full py-3 bg-gray-800 dark:bg-dark-surface hover:bg-gray-900 dark:hover:bg-dark-border text-white font-bold text-sm rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Lock className="w-4 h-4" />
              <span>{changingPassword ? 'Updating Password...' : 'Change Password'}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
