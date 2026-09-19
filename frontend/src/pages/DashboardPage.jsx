import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FolderKanban,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Plus,
  ArrowUpRight,
  ListTodo,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { StatCard } from '../components/common/StatCard';
import { Badge } from '../components/common/Badge';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ProjectModal } from '../components/projects/ProjectModal';
import { TaskModal } from '../components/tasks/TaskModal';
import { fetchProjects, fetchTasks, updateTask } from '../services/api';
import { useAuth } from '../context/AuthContext';

export const DashboardPage = () => {
  const { user, showToast } = useAuth();
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [projRes, tasksRes] = await Promise.all([fetchProjects(), fetchTasks()]);
      setProjects(projRes.projects || []);
      setTasks(tasksRes.tasks || []);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Compute aggregate statistics
  const totalProjects = projects.length;
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === 'Completed').length;
  const inProgressTasks = tasks.filter((t) => t.status === 'In Progress').length;
  const pendingTasks = tasks.filter((t) => t.status === 'To Do').length;

  const now = new Date();
  const overdueTasks = tasks.filter(
    (t) => t.status !== 'Completed' && t.dueDate && new Date(t.dueDate) < now
  ).length;

  const handleQuickStatusChange = async (task, newStatus, e) => {
    e.stopPropagation();
    try {
      await updateTask(task._id, { status: newStatus });
      showToast(`Task status updated to ${newStatus}`);
      loadDashboardData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.slice(0, 2).toUpperCase();
  };

  if (loading) {
    return <LoadingSpinner size="lg" text="Loading dashboard metrics..." />;
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Welcome Banner & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-primary-900/40 to-indigo-900/30 p-6 sm:p-8 rounded-3xl border border-primary-500/20 backdrop-blur-md relative overflow-hidden">
        <div className="space-y-1 relative z-10">
          <div className="flex items-center gap-2 text-xs font-bold text-primary-400 uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Workspace Overview</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Welcome back, {user?.name}! 👋
          </h1>
          <p className="text-sm text-gray-300 max-w-xl">
            Here is what is happening across your projects and tasks today.
          </p>
        </div>

        <div className="flex items-center gap-3 relative z-10">
          <button
            onClick={() => setIsTaskModalOpen(true)}
            className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white text-sm font-semibold rounded-xl border border-white/20 transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>New Task</span>
          </button>
          <button
            onClick={() => setIsProjectModalOpen(true)}
            className="px-5 py-2.5 bg-primary-600 hover:bg-primary-500 text-white text-sm font-semibold rounded-xl shadow-lg shadow-primary-500/30 transition-all hover:scale-105 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>New Project</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Grid (6 Cards) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard
          title="Total Projects"
          value={totalProjects}
          icon={FolderKanban}
          color="blue"
        />
        <StatCard
          title="Total Tasks"
          value={totalTasks}
          icon={ListTodo}
          color="purple"
        />
        <StatCard
          title="To Do Tasks"
          value={pendingTasks}
          icon={Clock}
          color="blue"
        />
        <StatCard
          title="In Progress"
          value={inProgressTasks}
          icon={Clock}
          color="amber"
        />
        <StatCard
          title="Completed"
          value={completedTasks}
          icon={CheckCircle2}
          color="emerald"
        />
        <StatCard
          title="Overdue"
          value={overdueTasks}
          icon={AlertTriangle}
          color="red"
        />
      </div>

      {/* Main Two Column Section: Recent Projects & Recent Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Projects */}
        <div className="glass-card p-6 rounded-3xl space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 tracking-tight flex items-center gap-2">
                <FolderKanban className="w-5 h-5 text-primary-500" />
                <span>Recent Projects</span>
              </h3>
              <Link
                to="/projects"
                className="text-xs font-semibold text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1"
              >
                <span>View All</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {projects.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-gray-200 dark:border-dark-border rounded-2xl">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">No active projects found.</p>
                <button
                  onClick={() => setIsProjectModalOpen(true)}
                  className="px-4 py-2 text-xs font-semibold bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors"
                >
                  Create Project
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {projects.slice(0, 4).map((p) => {
                  const progress = p.stats?.progressPercentage || 0;
                  return (
                    <Link
                      key={p._id}
                      to={`/projects/${p._id}`}
                      className="block p-4 rounded-2xl bg-gray-50 dark:bg-dark-surface border border-gray-100 dark:border-dark-border/60 hover:border-primary-500/40 transition-all hover:-translate-y-0.5"
                    >
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div>
                          <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate">
                            {p.title}
                          </h4>
                          <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1 mt-0.5">
                            {p.description || 'No description provided'}
                          </p>
                        </div>
                        <Badge variant={p.status}>{p.status}</Badge>
                      </div>

                      <div className="space-y-1 mt-3">
                        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                          <span>Progress ({p.stats?.completedTasks || 0}/{p.stats?.totalTasks || 0} tasks)</span>
                          <span className="font-bold text-gray-700 dark:text-gray-300">{progress}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-gray-200 dark:bg-dark-input rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-primary-500 to-indigo-500 rounded-full transition-all duration-300"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Recent Tasks */}
        <div className="glass-card p-6 rounded-3xl space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 tracking-tight flex items-center gap-2">
                <ListTodo className="w-5 h-5 text-indigo-500" />
                <span>Recent Tasks</span>
              </h3>
              <Link
                to="/kanban"
                className="text-xs font-semibold text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1"
              >
                <span>Kanban Board</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {tasks.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-gray-200 dark:border-dark-border rounded-2xl">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">No tasks found in your workspace.</p>
                <button
                  onClick={() => setIsTaskModalOpen(true)}
                  className="px-4 py-2 text-xs font-semibold bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors"
                >
                  Create Task
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {tasks.slice(0, 5).map((t) => {
                  const isDone = t.status === 'Completed';
                  return (
                    <div
                      key={t._id}
                      onClick={() => {
                        setSelectedTask(t);
                        setIsTaskModalOpen(true);
                      }}
                      className="p-3.5 rounded-2xl bg-gray-50 dark:bg-dark-surface border border-gray-100 dark:border-dark-border/60 hover:border-primary-500/40 transition-all flex items-center justify-between gap-3 cursor-pointer group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <button
                          onClick={(e) =>
                            handleQuickStatusChange(
                              t,
                              isDone ? 'In Progress' : 'Completed',
                              e
                            )
                          }
                          className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-colors shrink-0 ${
                            isDone
                              ? 'bg-emerald-500 border-emerald-500 text-white'
                              : 'border-gray-300 dark:border-gray-600 hover:border-primary-500'
                          }`}
                        >
                          {isDone && <CheckCircle2 className="w-4 h-4" />}
                        </button>

                        <div className="min-w-0">
                          <p
                            className={`text-sm font-bold truncate ${
                              isDone
                                ? 'line-through text-gray-400 dark:text-gray-500'
                                : 'text-gray-900 dark:text-gray-100'
                            }`}
                          >
                            {t.title}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            <span className="truncate">{t.project?.title || 'Project'}</span>
                            {t.dueDate && (
                              <span className="flex items-center gap-1">
                                <span>•</span>
                                <Calendar className="w-3 h-3" />
                                <span>{new Date(t.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <Badge variant={t.priority}>{t.priority}</Badge>
                        <Badge variant={t.status}>{t.status}</Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Global Modals */}
      <ProjectModal
        isOpen={isProjectModalOpen}
        onClose={() => setIsProjectModalOpen(false)}
        onSuccess={loadDashboardData}
      />

      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => {
          setIsTaskModalOpen(false);
          setSelectedTask(null);
        }}
        task={selectedTask}
        onSuccess={loadDashboardData}
      />
    </div>
  );
};
