import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  KanbanSquare,
  Plus,
  Search,
  Calendar,
  MessageSquare,
  Trash2,
  CheckCircle2,
  Filter,
  Layers,
  ArrowRight,
  ArrowLeft,
} from 'lucide-react';
import { Badge } from '../components/common/Badge';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { TaskModal } from '../components/tasks/TaskModal';
import { fetchProjects, fetchTasks, updateTask, deleteTask } from '../services/api';
import { useAuth } from '../context/AuthContext';

export const KanbanPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialProjectId = searchParams.get('project') || 'All';

  const { showToast } = useAuth();
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedProject, setSelectedProject] = useState(initialProjectId);
  const [search, setSearch] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [assigneeFilter, setAssigneeFilter] = useState('All');

  // Modals state
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [defaultStatusForNew, setDefaultStatusForNew] = useState('To Do');

  const loadData = async () => {
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
    loadData();
  }, []);

  const handleProjectFilterChange = (projId) => {
    setSelectedProject(projId);
    if (projId === 'All') {
      searchParams.delete('project');
    } else {
      searchParams.set('project', projId);
    }
    setSearchParams(searchParams);
  };

  // Status Change Logic
  const handleUpdateStatus = async (taskId, newStatus) => {
    try {
      await updateTask(taskId, { status: newStatus });
      showToast(`Task moved to ${newStatus}`);
      loadData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Drag & Drop
  const handleDragStart = (e, taskId) => {
    e.dataTransfer.setData('text/plain', taskId);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = async (e, targetStatus) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain');
    if (taskId) {
      await handleUpdateStatus(taskId, targetStatus);
    }
  };

  const handleDeleteTask = async (taskId, e) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this task?')) return;
    try {
      await deleteTask(taskId);
      showToast('Task deleted successfully.');
      loadData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Filter tasks
  const filteredTasks = tasks.filter((t) => {
    const matchesProject =
      selectedProject === 'All' ||
      t.project?._id === selectedProject ||
      t.project === selectedProject;

    const matchesPriority = priorityFilter === 'All' || t.priority === priorityFilter;

    const matchesAssignee =
      assigneeFilter === 'All' ||
      (assigneeFilter === 'unassigned' && !t.assignedTo) ||
      (t.assignedTo && t.assignedTo._id === assigneeFilter);

    const matchesSearch =
      search === '' ||
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      (t.description && t.description.toLowerCase().includes(search.toLowerCase()));

    return matchesProject && matchesPriority && matchesAssignee && matchesSearch;
  });

  const columns = [
    { id: 'To Do', label: 'To Do', color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { id: 'In Progress', label: 'In Progress', color: 'text-amber-500', bg: 'bg-amber-500/10' },
    { id: 'Completed', label: 'Completed', color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  ];

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.slice(0, 2).toUpperCase();
  };

  // Get active project object if selected
  const activeProjectObj = projects.find((p) => p._id === selectedProject);

  if (loading) {
    return <LoadingSpinner size="lg" text="Loading Kanban workspace..." />;
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-gray-100 tracking-tight flex items-center gap-2.5">
            <KanbanSquare className="w-7 h-7 text-primary-500" />
            <span>Kanban Board</span>
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Drag and drop tasks or click status buttons to manage project progression.
          </p>
        </div>

        <button
          onClick={() => {
            setSelectedTask(null);
            setDefaultStatusForNew('To Do');
            setIsTaskModalOpen(true);
          }}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold rounded-xl shadow-lg shadow-primary-500/25 transition-all hover:scale-105"
        >
          <Plus className="w-4 h-4" />
          <span>New Task</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="glass-card p-4 rounded-2xl flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Project Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gray-500 dark:text-gray-400">Project:</span>
            <select
              value={selectedProject}
              onChange={(e) => handleProjectFilterChange(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-input text-xs font-semibold text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 outline-none"
            >
              <option value="All">All Projects</option>
              {projects.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.title}
                </option>
              ))}
            </select>
          </div>

          {/* Priority Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gray-500 dark:text-gray-400">Priority:</span>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-input text-xs font-semibold text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 outline-none"
            >
              <option value="All">All Priorities</option>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
          </div>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tasks..."
            className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-input text-xs text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 outline-none transition-all"
          />
        </div>
      </div>

      {/* 3 Column Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        {columns.map((col) => {
          const colTasks = filteredTasks.filter((t) => t.status === col.id);

          return (
            <div
              key={col.id}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, col.id)}
              className="glass-card p-4 rounded-3xl min-h-[580px] flex flex-col justify-between"
            >
              <div>
                {/* Column Header */}
                <div className="flex items-center justify-between px-2 py-1 mb-4 border-b border-gray-100 dark:border-dark-border/60 pb-3">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${col.id === 'To Do' ? 'bg-blue-500' : col.id === 'In Progress' ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                    <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 tracking-tight">
                      {col.label}
                    </h3>
                    <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 dark:bg-dark-surface text-gray-600 dark:text-gray-400">
                      {colTasks.length}
                    </span>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedTask(null);
                      setDefaultStatusForNew(col.id);
                      setIsTaskModalOpen(true);
                    }}
                    className="p-1 text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-surface transition-colors"
                    title={`Add task to ${col.label}`}
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                {/* Column Tasks List */}
                <div className="space-y-3.5 min-h-[200px]">
                  {colTasks.length === 0 ? (
                    <div className="text-center py-10 px-4 border border-dashed border-gray-200 dark:border-dark-border rounded-2xl text-xs text-gray-400">
                      Drag tasks here or click + to add
                    </div>
                  ) : (
                    colTasks.map((task) => {
                      return (
                        <div
                          key={task._id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, task._id)}
                          onClick={() => {
                            setSelectedTask(task);
                            setIsTaskModalOpen(true);
                          }}
                          className="p-4 rounded-2xl bg-white dark:bg-dark-surface border border-gray-200/90 dark:border-dark-border shadow-sm hover:shadow-md hover:border-primary-500/50 transition-all cursor-pointer group space-y-3"
                        >
                          {/* Title and Priority */}
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100 line-clamp-2">
                              {task.title}
                            </h4>
                            <Badge variant={task.priority} className="shrink-0">
                              {task.priority}
                            </Badge>
                          </div>

                          {/* Description snippet */}
                          {task.description && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                              {task.description}
                            </p>
                          )}

                          {/* Meta: Project, Assignee, Due Date */}
                          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 pt-1">
                            {/* Assignee */}
                            <div className="flex items-center gap-1.5 min-w-0">
                              {task.assignedTo ? (
                                <>
                                  <div
                                    className="w-5 h-5 rounded-lg flex items-center justify-center text-white text-[9px] font-bold shrink-0"
                                    style={{ backgroundColor: task.assignedTo.avatarColor || '#3b82f6' }}
                                    title={`Assigned to ${task.assignedTo.name}`}
                                  >
                                    {getInitials(task.assignedTo.name)}
                                  </div>
                                  <span className="truncate max-w-[80px] font-medium text-gray-700 dark:text-gray-300">
                                    {task.assignedTo.name}
                                  </span>
                                </>
                              ) : (
                                <span className="text-[11px] text-gray-400 italic">Unassigned</span>
                              )}
                            </div>

                            {/* Due date */}
                            {task.dueDate && (
                              <div className="flex items-center gap-1 text-[11px]">
                                <Calendar className="w-3 h-3 text-gray-400" />
                                <span>{new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                              </div>
                            )}
                          </div>

                          {/* Quick Status Shift Buttons & Delete */}
                          <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-dark-border/40">
                            <div className="flex items-center gap-1.5">
                              {col.id === 'To Do' && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleUpdateStatus(task._id, 'In Progress');
                                  }}
                                  className="px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 text-[10px] font-bold rounded-lg border border-amber-500/20 flex items-center gap-1 transition-colors"
                                >
                                  <span>In Progress</span>
                                  <ArrowRight className="w-3 h-3" />
                                </button>
                              )}

                              {col.id === 'In Progress' && (
                                <>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleUpdateStatus(task._id, 'To Do');
                                    }}
                                    className="px-2 py-1 bg-gray-100 dark:bg-dark-card hover:bg-gray-200 text-gray-600 dark:text-gray-400 text-[10px] font-bold rounded-lg flex items-center gap-1 transition-colors"
                                  >
                                    <ArrowLeft className="w-3 h-3" />
                                    <span>To Do</span>
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleUpdateStatus(task._id, 'Completed');
                                    }}
                                    className="px-2 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold rounded-lg border border-emerald-500/20 flex items-center gap-1 transition-colors"
                                  >
                                    <span>Done</span>
                                    <CheckCircle2 className="w-3 h-3" />
                                  </button>
                                </>
                              )}

                              {col.id === 'Completed' && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleUpdateStatus(task._id, 'In Progress');
                                  }}
                                  className="px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 text-[10px] font-bold rounded-lg border border-amber-500/20 flex items-center gap-1 transition-colors"
                                >
                                  <ArrowLeft className="w-3 h-3" />
                                  <span>Reopen</span>
                                </button>
                              )}
                            </div>

                            <button
                              onClick={(e) => handleDeleteTask(task._id, e)}
                              className="p-1 text-gray-400 hover:text-red-500 rounded transition-colors"
                              title="Delete Task"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Task Modal */}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => {
          setIsTaskModalOpen(false);
          setSelectedTask(null);
        }}
        task={selectedTask}
        defaultProject={activeProjectObj}
        defaultStatus={defaultStatusForNew}
        onSuccess={loadData}
      />
    </div>
  );
};
