import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FolderKanban,
  Search,
  Plus,
  Calendar,
  Users,
  MoreVertical,
  Edit2,
  Trash2,
  ExternalLink,
} from 'lucide-react';
import { Badge } from '../components/common/Badge';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ProjectModal } from '../components/projects/ProjectModal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { fetchProjects, deleteProject } from '../services/api';
import { useAuth } from '../context/AuthContext';

export const ProjectsPage = () => {
  const { user: currentUser, showToast } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [deletingProject, setDeletingProject] = useState(null);
  const [actionMenuOpenId, setActionMenuOpenId] = useState(null);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const res = await fetchProjects();
      setProjects(res.projects || []);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const handleDeleteConfirm = async () => {
    if (!deletingProject) return;
    try {
      await deleteProject(deletingProject._id);
      showToast('Project deleted successfully.');
      setDeletingProject(null);
      loadProjects();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Filter projects
  const filteredProjects = projects.filter((p) => {
    const matchesStatus = statusFilter === 'All' || p.status === statusFilter;
    const matchesSearch =
      search === '' ||
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(search.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.slice(0, 2).toUpperCase();
  };

  const formatDate = (dateString) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (loading) {
    return <LoadingSpinner size="lg" text="Loading projects..." />;
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-gray-100 tracking-tight">
            Projects ({projects.length})
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manage your teams, deliverables, and project lifecycles.
          </p>
        </div>

        <button
          onClick={() => {
            setEditingProject(null);
            setIsModalOpen(true);
          }}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold rounded-xl shadow-lg shadow-primary-500/25 transition-all hover:scale-105"
        >
          <Plus className="w-4 h-4" />
          <span>New Project</span>
        </button>
      </div>

      {/* Filter and Search Toolbar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 glass-card p-4 rounded-2xl">
        {/* Status Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          {['All', 'Active', 'In Progress', 'Completed', 'On Hold'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                statusFilter === st
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-surface'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search projects..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-input text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-primary-500 outline-none transition-all"
          />
        </div>
      </div>

      {/* Projects Grid */}
      {filteredProjects.length === 0 ? (
        <div className="text-center py-16 glass-card rounded-3xl border border-dashed border-gray-200 dark:border-dark-border">
          <FolderKanban className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200">No projects found</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mx-auto mt-1 mb-6">
            {search || statusFilter !== 'All'
              ? 'Try changing your search query or status filter.'
              : 'Create your first project to start tracking tasks and team progress.'}
          </p>
          <button
            onClick={() => {
              setEditingProject(null);
              setIsModalOpen(true);
            }}
            className="px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold rounded-xl shadow-md transition-all"
          >
            Create Project
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((p) => {
            const progress = p.stats?.progressPercentage || 0;
            const isOwner = p.owner?._id === currentUser?._id;
            const isAdmin = isOwner || p.userRole === 'Admin';

            return (
              <div
                key={p._id}
                className="glass-card glass-card-hover p-6 rounded-3xl flex flex-col justify-between relative group"
              >
                <div>
                  {/* Card Header: Title, Status, Action Dropdown */}
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <Link
                      to={`/projects/${p._id}`}
                      className="text-lg font-bold text-gray-900 dark:text-gray-100 hover:text-primary-600 dark:hover:text-primary-400 transition-colors line-clamp-1"
                    >
                      {p.title}
                    </Link>

                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant={p.status}>{p.status}</Badge>

                      {/* Dropdown Menu */}
                      {isAdmin && (
                        <div className="relative">
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              setActionMenuOpenId(actionMenuOpenId === p._id ? null : p._id);
                            }}
                            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg transition-colors"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>

                          {actionMenuOpenId === p._id && (
                            <>
                              <div
                                className="fixed inset-0 z-10"
                                onClick={() => setActionMenuOpenId(null)}
                              />
                              <div className="absolute right-0 mt-1 w-36 bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-xl shadow-xl p-1 z-20 animate-in fade-in duration-100">
                                <button
                                  onClick={() => {
                                    setActionMenuOpenId(null);
                                    setEditingProject(p);
                                    setIsModalOpen(true);
                                  }}
                                  className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-surface rounded-lg transition-colors"
                                >
                                  <Edit2 className="w-3.5 h-3.5 text-blue-500" />
                                  <span>Edit</span>
                                </button>
                                {isOwner && (
                                  <button
                                    onClick={() => {
                                      setActionMenuOpenId(null);
                                      setDeletingProject(p);
                                    }}
                                    className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    <span>Delete</span>
                                  </button>
                                )}
                              </div>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-4">
                    {p.description || 'No description provided.'}
                  </p>
                </div>

                {/* Progress Bar & Footer */}
                <div className="space-y-4 pt-4 border-t border-gray-100 dark:border-dark-border/60">
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                      <span>Tasks: {p.stats?.completedTasks || 0}/{p.stats?.totalTasks || 0} completed</span>
                      <span className="font-bold text-gray-800 dark:text-gray-200">{progress}%</span>
                    </div>
                    <div className="w-full h-2 bg-gray-100 dark:bg-dark-input rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-primary-500 to-indigo-500 rounded-full transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 pt-1">
                    {/* Team Members */}
                    <div className="flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-gray-400" />
                      <span>{p.members?.length || 1} members</span>
                    </div>

                    {/* Deadline */}
                    {p.dueDate && (
                      <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                        <Calendar className="w-3.5 h-3.5 text-primary-500" />
                        <span>Due {formatDate(p.dueDate)}</span>
                      </div>
                    )}
                  </div>

                  <Link
                    to={`/projects/${p._id}`}
                    className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-gray-100 dark:bg-dark-surface hover:bg-primary-50 dark:hover:bg-primary-950/40 text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 text-xs font-bold rounded-xl transition-colors"
                  >
                    <span>Open Workspace</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Project Modal */}
      <ProjectModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingProject(null);
        }}
        project={editingProject}
        onSuccess={loadProjects}
      />

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={!!deletingProject}
        onClose={() => setDeletingProject(null)}
        onConfirm={handleDeleteConfirm}
        title={`Delete "${deletingProject?.title}"`}
        message="Are you sure you want to delete this project? All associated tasks and comments will be permanently erased."
      />
    </div>
  );
};
