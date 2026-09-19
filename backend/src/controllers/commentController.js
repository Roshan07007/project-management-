import Comment from '../models/Comment.js';
import Task from '../models/Task.js';
import Project from '../models/Project.js';

const getEntityId = (entity) => {
  if (!entity) return null;
  return (entity._id || entity).toString();
};

const verifyTaskAccess = async (taskId, userId) => {
  const task = await Task.findById(taskId);
  if (!task) return { hasAccess: false, task: null, project: null };

  const project = await Project.findById(task.project);
  if (!project) return { hasAccess: false, task: null, project: null };

  const userIdStr = userId ? userId.toString() : '';
  const ownerId = getEntityId(project.owner);
  const isOwner = ownerId === userIdStr;
  const member = project.members.find((m) => getEntityId(m.user) === userIdStr);
  const role = isOwner ? 'Owner' : member ? member.role : null;

  return { hasAccess: !!role, task, project, role, isOwner };
};

export const getCommentsByTask = async (req, res, next) => {
  try {
    const { taskId } = req.params;
    const { hasAccess } = await verifyTaskAccess(taskId, req.user._id);

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to view comments for this task.',
      });
    }

    const comments = await Comment.find({ task: taskId })
      .populate('user', 'name email avatarColor bio')
      .sort({ createdAt: 1 });

    return res.status(200).json({
      success: true,
      count: comments.length,
      comments,
    });
  } catch (error) {
    next(error);
  }
};

export const addComment = async (req, res, next) => {
  try {
    const { taskId } = req.params;
    const { content } = req.body;

    if (!content || content.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Comment content cannot be empty.',
      });
    }

    const { hasAccess } = await verifyTaskAccess(taskId, req.user._id);
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to comment on this task.',
      });
    }

    const comment = await Comment.create({
      task: taskId,
      user: req.user._id,
      content: content.trim(),
    });

    const populatedComment = await Comment.findById(comment._id).populate(
      'user',
      'name email avatarColor bio'
    );

    return res.status(201).json({
      success: true,
      message: 'Comment added successfully.',
      comment: populatedComment,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteComment = async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found.',
      });
    }

    const { hasAccess, role } = await verifyTaskAccess(comment.task, req.user._id);
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Access denied.',
      });
    }

    const isAuthor = comment.user.toString() === req.user._id.toString();
    const isAdminOrOwner = role === 'Owner' || role === 'Admin';

    if (!isAuthor && !isAdminOrOwner) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own comments.',
      });
    }

    await Comment.findByIdAndDelete(comment._id);

    return res.status(200).json({
      success: true,
      message: 'Comment deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};
