import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  FolderKanban,
  KanbanSquare,
  Users,
  Calendar,
  Plus,
  Edit2,
  Trash2,
  Search,
  CheckCircle2,
  ArrowLeft,
  ListTodo,
  AlertTriangle,
  Clock,
  MessageSquare,
} from 'lucide-react';
import { Badge } from '../components/common/Badge';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { StatCard } from '../components/common/StatCard';
import { ProjectModal } from '../components/projects/ProjectModal';
import { MemberManageModal } from '../components/projects/MemberManageModal';
import { TaskModal } from '../components/tasks/TaskModal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { fetchProjectById, deleteProject, updateTask, deleteTask } from '../services/api';
import { useAuth } from '../context/AuthContext';

export const ProjectDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: currentUser, showToast } = useAuth();

  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);

  // Filters for embedded tasks table
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');

  // Modals state
  const [isEditProjectOpen, setIsEditProjectOpen] = useState(false);
  const [isMembersModalOpen, setIsMembersModalOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [isDeleteProjectOpen, setIsDeleteProjectOpen] = useState(false);

  const loadProject = async () => {
    try {
      setLoading(true);
      const res = await fetchProjectById(id);
      setProject(res.project);
    } catch (err) {
      showToast(err.message, 'error');
      navigate('/projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProject();
  }, [id]);

  const handleDeleteProject = async () => {
    try {
      await deleteProject(project._id);
      showToast('Project deleted successfully.');
      navigate('/projects');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleQuickStatusChange = async (task, newStatus, e) => {
    e.stopPropagation();
    try {
      await updateTask(task._id, { status: newStatus });
      showToast(`Task status changed to ${newStatus}`);
      loadProject();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleDeleteTask = async (taskId, e) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this task?')) return;
    try {
      await deleteTask(taskId);
      showToast('Task deleted successfully.');
      loadProject();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  if (loading) {
    return <LoadingSpinner size="lg" text="Loading project details..." />;
  }

  if (!project) return null;

  const isOwner = project.owner?._id === currentUser?._id;
  const isAdmin = isOwner || project.userRole === 'Admin';
  const progress = project.stats?.progressPercentage || 0;

  // Filter tasks
  const filteredTasks = (project.tasks || []).filter((t) => {
    const matchesStatus = statusFilter === 'All' || t.status === statusFilter;
    const matchesPriority = priorityFilter === 'All' || t.priority === priorityFilter;
    const matchesSearch =
      search === '' ||
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      (t.description && t.description.toLowerCase().includes(search.toLowerCase()));
    return matchesStatus && matchesPriority && matchesSearch;
  });

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.slice(0, 2).toUpperCase();
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Top Breadcrumb & Navigation */}
      <div className="flex items-center justify-between">
        <Link
          to="/projects"
          className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Projects</span>
        </Link>

        <div className="flex items-center gap-2.5">
          <Link
            to={`/kanban?project=${project._id}`}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/50 text-xs font-bold rounded-xl hover:bg-indigo-100 transition-all"
          >
            <KanbanSquare className="w-4 h-4" />
            <span>Open Kanban Board</span>
          </Link>
          <button
            onClick={() => {
              setSelectedTask(null);
              setIsTaskModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold rounded-xl shadow-md transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Task</span>
          </button>
        </div>
      </div>

      {/* Project Header Banner */}
      <div className="glass-card p-6 sm:p-8 rounded-3xl space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Badge variant={project.status} className="text-xs px-3 py-1">
                {project.status}
              </Badge>
              <Badge variant={project.userRole || 'Member'}>
                Role: {project.userRole || 'Member'}
              </Badge>
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold text-gray-900 dark:text-gray-100 tracking-tight">
              {project.title}
            </h1>

            <p className="text-sm text-gray-600 dark:text-gray-400 max-w-3xl leading-relaxed">
              {project.description || 'No detailed description provided for this project.'}
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={() => setIsMembersModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-100 dark:bg-dark-surface hover:bg-gray-200 dark:hover:bg-dark-border text-gray-800 dark:text-gray-200 text-xs font-bold rounded-xl transition-colors"
            >
              <Users className="w-4 h-4 text-primary-500" />
              <span>Team ({project.members?.length || 1})</span>
            </button>

            {isAdmin && (
              <button
                onClick={() => setIsEditProjectOpen(true)}
                className="p-2.5 bg-gray-100 dark:bg-dark-surface hover:bg-gray-200 dark:hover:bg-dark-border text-gray-700 dark:text-gray-300 rounded-xl transition-colors"
                title="Edit Project"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            )}

            {isOwner && (
              <button
                onClick={() => setIsDeleteProjectOpen(true)}
                className="p-2.5 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 text-red-600 dark:text-red-400 rounded-xl transition-colors"
                title="Delete Project"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Project Meta Info Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 border-t border-gray-100 dark:border-dark-border/60 text-xs text-gray-500 dark:text-gray-400">
          <div>
            <span className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">Project Owner</span>
            <div className="flex items-center gap-2">
              <div
                className="w-6 h-6 rounded-lg flex items-center justify-center text-white text-[10px] font-bold"
                style={{ backgroundColor: project.owner?.avatarColor || '#3b82f6' }}
              >
                {getInitials(project.owner?.name)}
              </div>
              <span className="truncate text-gray-900 dark:text-gray-100 font-medium">
                {project.owner?.name || 'Owner'}
              </span>
            </div>
          </div>

          <div>
            <span className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">Start Date</span>
            <span>📅 {formatDate(project.startDate)}</span>
          </div>

          <div>
            <span className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">Target Due Date</span>
            <span>🎯 {formatDate(project.dueDate)}</span>
          </div>

          <div>
            <span className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">Progress Completion</span>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 bg-gray-100 dark:bg-dark-input rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary-500 to-emerald-500 rounded-full"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="font-bold text-gray-900 dark:text-gray-100">{progress}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Project KPI Stats (4 Cards) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard
          title="Total Tasks"
          value={project.stats?.totalTasks || 0}
          icon={ListTodo}
          color="blue"
        />
        <StatCard
          title="Completed Tasks"
          value={project.stats?.completedTasks || 0}
          icon={CheckCircle2}
          color="emerald"
        />
        <StatCard
          title="Tasks In Progress"
          value={project.stats?.inProgressTasks || 0}
          icon={Clock}
          color="amber"
        />
        <StatCard
          title="Overdue Tasks"
          value={project.stats?.overdueTasks || 0}
          icon={AlertTriangle}
          color="red"
        />
      </div>

      {/* Embedded Project Tasks Section */}
      <div className="glass-card p-6 rounded-3xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <ListTodo className="w-5 h-5 text-primary-500" />
            <span>Project Tasks ({project.tasks?.length || 0})</span>
          </h3>

          {/* Filter Tools */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Filter tasks..."
                className="pl-9 pr-3 py-1.5 rounded-xl border border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-input text-xs text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 outline-none w-44"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-input text-xs text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 outline-none"
            >
              <option value="All">All Statuses</option>
              <option value="To Do">To Do</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
            </select>

            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-input text-xs text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 outline-none"
            >
              <option value="All">All Priorities</option>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
          </div>
        </div>

        {/* Tasks Table */}
        {filteredTasks.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-gray-200 dark:border-dark-border rounded-2xl">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">No tasks found for this project filter.</p>
            <button
              onClick={() => {
                setSelectedTask(null);
                setIsTaskModalOpen(true);
              }}
              className="px-4 py-2 text-xs font-semibold bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors"
            >
              Create New Task
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-gray-100 dark:border-dark-border text-gray-400 dark:text-gray-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">Task</th>
                  <th className="py-3 px-3">Assignee</th>
                  <th className="py-3 px-3">Priority</th>
                  <th className="py-3 px-3">Due Date</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-dark-border/40">
                {filteredTasks.map((t) => {
                  const isDone = t.status === 'Completed';
                  return (
                    <tr
                      key={t._id}
                      onClick={() => {
                        setSelectedTask(t);
                        setIsTaskModalOpen(true);
                      }}
                      className="hover:bg-gray-50/80 dark:hover:bg-dark-surface/80 cursor-pointer transition-colors"
                    >
                      <td className="py-3.5 px-3">
                        <button
                          onClick={(e) =>
                            handleQuickStatusChange(
                              t,
                              isDone ? 'In Progress' : 'Completed',
                              e
                            )
                          }
                          className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-colors ${
                            isDone
                              ? 'bg-emerald-500 border-emerald-500 text-white'
                              : 'border-gray-300 dark:border-gray-600 hover:border-primary-500'
                          }`}
                        >
                          {isDone && <CheckCircle2 className="w-3.5 h-3.5" />}
                        </button>
                      </td>

                      <td className="py-3.5 px-3">
                        <p className={`font-bold text-sm truncate max-w-xs ${isDone ? 'line-through text-gray-400' : 'text-gray-900 dark:text-gray-100'}`}>
                          {t.title}
                        </p>
                        {t.description && (
                          <p className="text-gray-500 dark:text-gray-400 line-clamp-1 text-[11px] mt-0.5">
                            {t.description}
                          </p>
                        )}
                      </td>

                      <td className="py-3.5 px-3">
                        {t.assignedTo ? (
                          <div className="flex items-center gap-2">
                            <div
                              className="w-6 h-6 rounded-lg flex items-center justify-center text-white text-[10px] font-bold shrink-0"
                              style={{ backgroundColor: t.assignedTo.avatarColor || '#3b82f6' }}
                            >
                              {getInitials(t.assignedTo.name)}
                            </div>
                            <span className="truncate max-w-[100px] text-gray-700 dark:text-gray-300">
                              {t.assignedTo.name}
                            </span>
                          </div>
                        ) : (
                          <span className="text-gray-400 italic">Unassigned</span>
                        )}
                      </td>

                      <td className="py-3.5 px-3">
                        <Badge variant={t.priority}>{t.priority}</Badge>
                      </td>

                      <td className="py-3.5 px-3 text-gray-600 dark:text-gray-400">
                        {t.dueDate ? (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-gray-400" />
                            <span>{new Date(t.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                          </span>
                        ) : (
                          '--'
                        )}
                      </td>

                      <td className="py-3.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedTask(t);
                              setIsTaskModalOpen(true);
                            }}
                            className="p-1.5 text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-surface"
                            title="Task Details & Comments"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => handleDeleteTask(t._id, e)}
                            className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10"
                            title="Delete Task"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      <ProjectModal
        isOpen={isEditProjectOpen}
        onClose={() => setIsEditProjectOpen(false)}
        project={project}
        onSuccess={loadProject}
      />

      <MemberManageModal
        isOpen={isMembersModalOpen}
        onClose={() => setIsMembersModalOpen(false)}
        project={project}
        onProjectUpdated={setProject}
      />

      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => {
          setIsTaskModalOpen(false);
          setSelectedTask(null);
        }}
        task={selectedTask}
        defaultProject={project}
        onSuccess={loadProject}
      />

      <ConfirmDialog
        isOpen={isDeleteProjectOpen}
        onClose={() => setIsDeleteProjectOpen(false)}
        onConfirm={handleDeleteProject}
        title={`Delete "${project.title}"`}
        message="Are you sure you want to delete this project? All associated tasks and comments will be permanently erased."
      />
    </div>
  );
};
