import React, { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  Trash2,
  FolderKanban,
  Mail,
  Shield,
  CheckCircle2,
  Search,
} from 'lucide-react';
import { Badge } from '../components/common/Badge';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { fetchProjects, addProjectMember, removeProjectMember } from '../services/api';
import { useAuth } from '../context/AuthContext';

export const TeamMembersPage = () => {
  const { user: currentUser, showToast } = useAuth();
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [loading, setLoading] = useState(true);

  // Invite state
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('Member');
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState('');

  const loadProjects = async () => {
    try {
      setLoading(true);
      const res = await fetchProjects();
      const projList = res.projects || [];
      setProjects(projList);
      if (projList.length > 0 && !selectedProjectId) {
        setSelectedProjectId(projList[0]._id);
      }
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const activeProject = projects.find((p) => p._id === selectedProjectId);

  const isOwner = activeProject?.owner?._id === currentUser?._id;
  const currentMember = activeProject?.members?.find((m) => m.user?._id === currentUser?._id);
  const isAdmin = isOwner || currentMember?.role === 'Admin';

  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!email.trim() || !selectedProjectId) return;

    try {
      setSubmitting(true);
      const res = await addProjectMember(selectedProjectId, {
        email: email.trim(),
        role,
      });
      showToast(res.message || 'Team member added!');
      setEmail('');
      loadProjects();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveMember = async (userId) => {
    if (!confirm('Are you sure you want to remove this member from the project?')) return;

    try {
      const res = await removeProjectMember(selectedProjectId, userId);
      showToast(res.message || 'Member removed successfully.');
      loadProjects();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.slice(0, 2).toUpperCase();
  };

  if (loading) {
    return <LoadingSpinner size="lg" text="Loading team members..." />;
  }

  // Filter members in current project
  const membersList = activeProject?.members || [];
  const filteredMembers = membersList.filter((m) => {
    if (!m.user) return false;
    const q = search.toLowerCase();
    return (
      m.user.name.toLowerCase().includes(q) ||
      m.user.email.toLowerCase().includes(q) ||
      m.role.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-gray-100 tracking-tight flex items-center gap-2.5">
            <Users className="w-7 h-7 text-primary-500" />
            <span>Team & Collaborators</span>
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manage project team assignments, invitations, and access permissions.
          </p>
        </div>

        {/* Project Selector */}
        {projects.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gray-500 dark:text-gray-400">Select Project:</span>
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="px-3.5 py-2 rounded-xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card text-xs font-semibold text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 outline-none"
            >
              {projects.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.title} ({p.members?.length || 1} members)
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {projects.length === 0 ? (
        <div className="text-center py-16 glass-card rounded-3xl border border-dashed border-gray-200 dark:border-dark-border">
          <FolderKanban className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200">No Projects Found</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mx-auto mt-1 mb-6">
            Create a project first before inviting team members.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Invite Form (Admins only) */}
          <div className="lg:col-span-1">
            <div className="glass-card p-6 rounded-3xl space-y-4 sticky top-24">
              <div className="flex items-center gap-2.5 text-primary-600 dark:text-primary-400">
                <UserPlus className="w-5 h-5" />
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                  Invite Member
                </h3>
              </div>

              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                Invite registered users to collaborate on <strong>{activeProject?.title}</strong>.
              </p>

              {isAdmin ? (
                <form onSubmit={handleAddMember} className="space-y-4 pt-2">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5">
                      User Email Address
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="colleague@example.com"
                        required
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-input text-gray-900 dark:text-gray-100 text-xs focus:ring-2 focus:ring-primary-500 outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5">
                      Permission Role
                    </label>
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-input text-gray-900 dark:text-gray-100 text-xs focus:ring-2 focus:ring-primary-500 outline-none"
                    >
                      <option value="Member">Member (Can create & update tasks)</option>
                      <option value="Admin">Admin (Can manage team and settings)</option>
                      <option value="Viewer">Viewer (Read-only access)</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting || !email.trim()}
                    className="w-full py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-bold text-xs rounded-xl shadow-md shadow-primary-500/25 transition-all disabled:opacity-50"
                  >
                    {submitting ? 'Adding Member...' : 'Send Invitation'}
                  </button>
                </form>
              ) : (
                <div className="p-4 bg-gray-50 dark:bg-dark-surface rounded-2xl border border-gray-200 dark:border-dark-border text-xs text-gray-500 text-center">
                  Only project owners and admins can invite new members.
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Members List */}
          <div className="lg:col-span-2 space-y-4">
            <div className="glass-card p-6 rounded-3xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                  Project Members ({filteredMembers.length})
                </h3>

                <div className="relative w-full sm:w-56">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search member..."
                    className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-input text-xs text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 outline-none"
                  />
                </div>
              </div>

              {filteredMembers.length === 0 ? (
                <div className="text-center py-10 text-xs text-gray-400 border border-dashed border-gray-200 dark:border-dark-border rounded-2xl">
                  No members match your search criteria.
                </div>
              ) : (
                <div className="divide-y divide-gray-100 dark:divide-dark-border/60">
                  {filteredMembers.map((memberItem) => {
                    const u = memberItem.user;
                    if (!u) return null;
                    const isProjectOwner = activeProject.owner?._id === u._id;
                    const isSelf = currentUser?._id === u._id;

                    return (
                      <div
                        key={u._id}
                        className="py-4 flex items-center justify-between gap-4 first:pt-0 last:pb-0"
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          <div
                            className="w-10 h-10 rounded-2xl flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-sm"
                            style={{ backgroundColor: u.avatarColor || '#3b82f6' }}
                          >
                            {getInitials(u.name)}
                          </div>

                          <div className="min-w-0">
                            <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate">
                              {u.name} {isSelf && <span className="text-xs text-primary-500 font-normal">(You)</span>}
                            </h4>
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                              {u.email}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <Badge variant={isProjectOwner ? 'Owner' : memberItem.role}>
                            {isProjectOwner ? 'Project Owner' : memberItem.role}
                          </Badge>

                          {!isProjectOwner && (isAdmin || isSelf) && (
                            <button
                              onClick={() => handleRemoveMember(u._id)}
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
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
