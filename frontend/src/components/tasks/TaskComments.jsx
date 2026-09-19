import React, { useState, useEffect } from 'react';
import { Send, Trash2, MessageSquare } from 'lucide-react';
import { fetchTaskComments, addTaskComment, deleteTaskComment } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { LoadingSpinner } from '../common/LoadingSpinner';

export const TaskComments = ({ taskId }) => {
  const { user: currentUser, showToast } = useAuth();
  const [comments, setComments] = useState([]);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const loadComments = async () => {
      if (!taskId) return;
      try {
        setLoading(true);
        const res = await fetchTaskComments(taskId);
        setComments(res.comments || []);
      } catch (err) {
        console.error('Failed to load comments:', err.message);
      } finally {
        setLoading(false);
      }
    };

    loadComments();
  }, [taskId]);

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;

    try {
      setSubmitting(true);
      const res = await addTaskComment(taskId, { content: content.trim() });
      setComments((prev) => [...prev, res.comment]);
      setContent('');
      showToast('Comment posted.');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      await deleteTaskComment(commentId);
      setComments((prev) => prev.filter((c) => c._id !== commentId));
      showToast('Comment deleted.');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const formatTimestamp = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div className="space-y-4 pt-4 border-t border-gray-100 dark:border-dark-border/60">
      <div className="flex items-center gap-2">
        <MessageSquare className="w-4 h-4 text-primary-500" />
        <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100">
          Comments & Activity ({comments.length})
        </h4>
      </div>

      {/* Comments Stream */}
      <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
        {loading ? (
          <LoadingSpinner size="sm" text="Loading comments..." />
        ) : comments.length === 0 ? (
          <div className="text-center py-6 px-4 bg-gray-50 dark:bg-dark-surface rounded-xl border border-dashed border-gray-200 dark:border-dark-border text-xs text-gray-500">
            No comments yet. Start the conversation with your team!
          </div>
        ) : (
          comments.map((comment) => {
            const isAuthor = currentUser?._id === comment.user?._id;
            return (
              <div
                key={comment._id}
                className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 dark:bg-dark-surface border border-gray-100 dark:border-dark-border"
              >
                <div
                  className="w-7 h-7 rounded-xl flex items-center justify-center text-white text-[10px] font-bold shrink-0 shadow-sm mt-0.5"
                  style={{ backgroundColor: comment.user?.avatarColor || '#3b82f6' }}
                >
                  {getInitials(comment.user?.name)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-gray-900 dark:text-gray-100 truncate">
                      {comment.user?.name || 'Team Member'}
                    </span>
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] text-gray-400 dark:text-gray-500">
                        {formatTimestamp(comment.createdAt)}
                      </span>
                      {isAuthor && (
                        <button
                          onClick={() => handleDeleteComment(comment._id)}
                          className="p-1 text-gray-400 hover:text-red-500 rounded transition-colors"
                          title="Delete comment"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-gray-700 dark:text-gray-300 mt-1 whitespace-pre-wrap break-words">
                    {comment.content}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add Comment Input */}
      <form onSubmit={handleAddComment} className="flex gap-2">
        <input
          type="text"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write a comment or status update..."
          className="flex-1 px-3.5 py-2 rounded-xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-input text-gray-900 dark:text-gray-100 text-xs focus:ring-2 focus:ring-primary-500 outline-none transition-all"
        />
        <button
          type="submit"
          disabled={submitting || !content.trim()}
          className="px-3.5 py-2 bg-primary-600 hover:bg-primary-700 text-white text-xs font-semibold rounded-xl shadow-sm transition-all disabled:opacity-50 flex items-center gap-1.5"
        >
          <Send className="w-3.5 h-3.5" />
          <span>Post</span>
        </button>
      </form>
    </div>
  );
};
