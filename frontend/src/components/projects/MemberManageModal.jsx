import React, { useState } from 'react';
import { UserPlus, Trash2, Shield, UserCheck, Eye } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Badge } from '../common/Badge';
import { addProjectMember, removeProjectMember } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export const MemberManageModal = ({ isOpen, onClose, project, onProjectUpdated }) => {
  const { user: currentUser, showToast } = useAuth();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('Member');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!project) return null;

  const isOwner = project.owner?._id === currentUser?._id;
  const currentMemberRecord = project.members?.find(
    (m) => m.user?._id === currentUser?._id
  );
  const isAdmin = isOwner || currentMemberRecord?.role === 'Admin';

  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;

    try {
      setLoading(true);
      setError('');
      const res = await addProjectMember(project._id, { email: email.trim(), role });
      showToast(res.message || 'Member added to project!');
      setEmail('');
      if (onProjectUpdated) onProjectUpdated(res.project);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = async (targetUserId) => {
    if (!confirm('Are you sure you want to remove this member from the project?')) return;

    try {
      setLoading(true);
      const res = await removeProjectMember(project._id, targetUserId);
      showToast(res.message || 'Member removed successfully.');
      if (onProjectUpdated) onProjectUpdated(res.project);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Project Team & Permissions">
      <div className="space-y-6">
        {/* Add Member Form (Admin/Owner only) */}
        {isAdmin && (
          <form onSubmit={handleAddMember} className="space-y-3 bg-gray-50 dark:bg-dark-surface p-4 rounded-2xl border border-gray-200 dark:border-dark-border">
            <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-primary-500" />
              <span>Invite New Team Member</span>
            </h4>

            {error && (
              <div className="p-2.5 bg-red-500/10 border border-red-500/20 rounded-xl text-red-600 dark:text-red-400 text-xs">
                {error}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="colleague@example.com"
                required
                className="flex-1 px-3 py-2 rounded-xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-input text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-primary-500 outline-none"
              />

              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="px-3 py-2 rounded-xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-input text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-primary-500 outline-none"
              >
                <option value="Member">Member</option>
                <option value="Admin">Admin</option>
                <option value="Viewer">Viewer</option>
              </select>

              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold rounded-xl shadow-sm transition-all disabled:opacity-50 shrink-0"
              >
                {loading ? 'Adding...' : 'Add'}
              </button>
            </div>
          </form>
        )}

        {/* Members List */}
        <div>
          <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">
            Current Members ({project.members?.length || 0})
          </h4>

          <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
            {project.members?.map((memberItem) => {
              const u = memberItem.user;
              if (!u) return null;
              const isProjectOwner = project.owner?._id === u._id;
              const isSelf = currentUser?._id === u._id;

              return (
                <div
                  key={u._id}
                  className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-dark-surface border border-gray-100 dark:border-dark-border"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-sm"
                      style={{ backgroundColor: u.avatarColor || '#3b82f6' }}
                    >
                      {getInitials(u.name)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate">
                        {u.name} {isSelf && <span className="text-xs text-primary-500 font-normal">(You)</span>}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{u.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0">
                    <Badge variant={isProjectOwner ? 'Owner' : memberItem.role}>
                      {isProjectOwner ? 'Owner' : memberItem.role}
                    </Badge>

                    {!isProjectOwner && (isAdmin || isSelf) && (
                      <button
                        onClick={() => handleRemoveMember(u._id)}
                        disabled={loading}
                        className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                        title={isSelf ? 'Leave Project' : 'Remove Member'}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-gray-100 dark:border-dark-border/60">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-xl transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </Modal>
  );
};
