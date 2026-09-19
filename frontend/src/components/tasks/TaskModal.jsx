import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { TaskComments } from './TaskComments';
import { createTask, updateTask, fetchProjects, fetchProjectById } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export const TaskModal = ({
  isOpen,
  onClose,
  task = null,
  defaultProject = null,
  defaultStatus = 'To Do',
  onSuccess,
}) => {
  const { showToast } = useAuth();
  const isEditing = !!task;

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    project: defaultProject?._id || '',
    assignedTo: '',
    status: defaultStatus,
    priority: 'Medium',
    dueDate: '',
  });

  const [projects, setProjects] = useState([]);
  const [projectMembers, setProjectMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Load projects list if not pre-locked
  useEffect(() => {
    const loadProjects = async () => {
      try {
        const res = await fetchProjects();
        setProjects(res.projects || []);
      } catch (err) {
        console.error('Failed to load projects:', err);
      }
    };
    if (isOpen) loadProjects();
  }, [isOpen]);

  // Load project members when project selection changes
  useEffect(() => {
    const targetProjectId = formData.project || defaultProject?._id;
    if (!targetProjectId) {
      setProjectMembers([]);
      return;
    }

    const loadMembers = async () => {
      try {
        const res = await fetchProjectById(targetProjectId);
        if (res.project) {
          const membersList = [];
          if (res.project.owner) {
            membersList.push({ ...res.project.owner, role: 'Owner' });
          }
          (res.project.members || []).forEach((m) => {
            if (m.user && m.user._id !== res.project.owner?._id) {
              membersList.push({ ...m.user, role: m.role });
            }
          });
          setProjectMembers(membersList);
        }
      } catch (err) {
        console.error('Failed to load members for task:', err);
      }
    };

    loadMembers();
  }, [formData.project, defaultProject]);

  // Initialize form state
  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title || '',
        description: task.description || '',
        project: task.project?._id || task.project || defaultProject?._id || '',
        assignedTo: task.assignedTo?._id || task.assignedTo || '',
        status: task.status || 'To Do',
        priority: task.priority || 'Medium',
        dueDate: task.dueDate ? task.dueDate.split('T')[0] : '',
      });
    } else {
      setFormData({
        title: '',
        description: '',
        project: defaultProject?._id || '',
        assignedTo: '',
        status: defaultStatus || 'To Do',
        priority: 'Medium',
        dueDate: '',
      });
    }
    setError('');
  }, [task, defaultProject, defaultStatus, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      setError('Please provide a task title.');
      return;
    }

    if (!formData.project) {
      setError('Please select a project for this task.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      let result;

      const payload = {
        ...formData,
        assignedTo: formData.assignedTo || null,
        dueDate: formData.dueDate || null,
      };

      if (isEditing) {
        result = await updateTask(task._id, payload);
        showToast('Task updated successfully!');
      } else {
        result = await createTask(payload);
        showToast('Task created successfully!');
      }

      if (onSuccess) onSuccess(result.task);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Task Details & Activity' : 'Create New Task'}
      maxWidth="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-600 dark:text-red-400 text-sm">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
            Task Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="e.g. Design authentication modal in Figma"
            required
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-input text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-primary-500 outline-none transition-all"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
            Description
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Detailed requirements, specifications, and acceptance criteria..."
            rows={3}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-input text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-primary-500 outline-none transition-all resize-y"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              Project <span className="text-red-500">*</span>
            </label>
            <select
              name="project"
              value={formData.project}
              onChange={handleChange}
              disabled={!!defaultProject || isEditing}
              required
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-input text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-primary-500 outline-none disabled:opacity-75"
            >
              <option value="">-- Select Project --</option>
              {projects.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              Assign To (Project Members Only)
            </label>
            <select
              name="assignedTo"
              value={formData.assignedTo}
              onChange={handleChange}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-input text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-primary-500 outline-none"
            >
              <option value="">-- Unassigned --</option>
              {projectMembers.map((m) => (
                <option key={m._id} value={m._id}>
                  {m.name} ({m.email}) - {m.role}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              Status
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-input text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-primary-500 outline-none"
            >
              <option value="To Do">To Do</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              Priority
            </label>
            <select
              name="priority"
              value={formData.priority}
              onChange={handleChange}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-input text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-primary-500 outline-none"
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              Due Date
            </label>
            <input
              type="date"
              name="dueDate"
              value={formData.dueDate}
              onChange={handleChange}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-input text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-primary-500 outline-none"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-surface rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2.5 text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-xl shadow-md shadow-primary-500/25 transition-all disabled:opacity-50"
          >
            {loading ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Task'}
          </button>
        </div>
      </form>

      {/* Embedded Comments for existing tasks */}
      {isEditing && task?._id && <TaskComments taskId={task._id} />}
    </Modal>
  );
};
