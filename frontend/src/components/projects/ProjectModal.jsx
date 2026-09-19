import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { createProject, updateProject } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export const ProjectModal = ({ isOpen, onClose, project = null, onSuccess }) => {
  const { showToast } = useAuth();
  const isEditing = !!project;

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'Active',
    startDate: new Date().toISOString().split('T')[0],
    dueDate: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (project) {
      setFormData({
        title: project.title || '',
        description: project.description || '',
        status: project.status || 'Active',
        startDate: project.startDate ? project.startDate.split('T')[0] : '',
        dueDate: project.dueDate ? project.dueDate.split('T')[0] : '',
      });
    } else {
      setFormData({
        title: '',
        description: '',
        status: 'Active',
        startDate: new Date().toISOString().split('T')[0],
        dueDate: '',
      });
    }
    setError('');
  }, [project, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      setError('Please provide a project title.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      let result;

      if (isEditing) {
        result = await updateProject(project._id, formData);
        showToast('Project updated successfully!');
      } else {
        result = await createProject(formData);
        showToast('Project created successfully!');
      }

      if (onSuccess) onSuccess(result.project);
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
      title={isEditing ? 'Edit Project' : 'Create New Project'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-600 dark:text-red-400 text-sm">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
            Project Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="e.g. Website Redesign & SEO"
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
            placeholder="Outline project goals, scope and milestones..."
            rows={3}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-input text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-primary-500 outline-none transition-all resize-y"
          />
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
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-input text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-primary-500 outline-none transition-all"
            >
              <option value="Active">Active</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
              <option value="On Hold">On Hold</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              Start Date
            </label>
            <input
              type="date"
              name="startDate"
              value={formData.startDate}
              onChange={handleChange}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-input text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-primary-500 outline-none transition-all"
            />
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
              className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-input text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-primary-500 outline-none transition-all"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 dark:border-dark-border/60">
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
            {loading ? 'Saving...' : isEditing ? 'Update Project' : 'Create Project'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
