import Task from '../models/Task.js';
import Project from '../models/Project.js';
import Comment from '../models/Comment.js';

const getEntityId = (entity) => {
  if (!entity) return null;
  return (entity._id || entity).toString();
};

const verifyProjectAccess = async (projectId, userId) => {
  const project = await Project.findById(projectId);
  if (!project) return { hasAccess: false, project: null };

  const userIdStr = userId ? userId.toString() : '';
  const ownerId = getEntityId(project.owner);
  const isOwner = ownerId === userIdStr;
  const isMember = project.members.some((m) => getEntityId(m.user) === userIdStr);

  return { hasAccess: isOwner || isMember, project };
};

export const getTasks = async (req, res, next) => {
  try {
    const { project: projectId, status, priority, assignedTo, search } = req.query;

    const userProjects = await Project.find({
      $or: [{ owner: req.user._id }, { 'members.user': req.user._id }],
    }).select('_id');

    const userProjectIds = userProjects.map((p) => p._id);
    let query = { project: { $in: userProjectIds } };

    if (projectId) {
      query.project = projectId;
    }

    if (status && status !== 'All') {
      query.status = status;
    }

    if (priority && priority !== 'All') {
      query.priority = priority;
    }

    if (assignedTo && assignedTo !== 'All') {
      query.assignedTo = assignedTo === 'unassigned' ? null : assignedTo;
    }

    if (search && search.trim() !== '') {
      query.$or = [
        { title: { $regex: search.trim(), $options: 'i' } },
        { description: { $regex: search.trim(), $options: 'i' } },
      ];
    }

    const tasks = await Task.find(query)
      .populate('project', 'title status')
      .populate('assignedTo', 'name email avatarColor')
      .populate('createdBy', 'name email avatarColor')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: tasks.length,
      tasks,
    });
  } catch (error) {
    next(error);
  }
};

export const getTaskById = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('project', 'title owner status members')
      .populate('assignedTo', 'name email avatarColor')
      .populate('createdBy', 'name email avatarColor');

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found.',
      });
    }

    const { hasAccess } = await verifyProjectAccess(task.project._id, req.user._id);
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to view this task.',
      });
    }

    const comments = await Comment.find({ task: task._id })
      .populate('user', 'name email avatarColor')
      .sort({ createdAt: 1 });

    return res.status(200).json({
      success: true,
      task: {
        ...task.toObject(),
        comments,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const createTask = async (req, res, next) => {
  try {
    const { title, description, project: projectId, assignedTo, status, priority, dueDate } = req.body;

    if (!title || title.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Please provide a task title.',
      });
    }

    if (!projectId) {
      return res.status(400).json({
        success: false,
        message: 'Task must be associated with a valid project.',
      });
    }

    const { hasAccess, project } = await verifyProjectAccess(projectId, req.user._id);
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to add tasks to this project.',
      });
    }

    if (assignedTo) {
      const assignedToStr = assignedTo.toString();
      const isOwner = getEntityId(project.owner) === assignedToStr;
      const isMember = project.members.some((m) => getEntityId(m.user) === assignedToStr);

      if (!isOwner && !isMember) {
        return res.status(400).json({
          success: false,
          message: 'Cannot assign task to a user who is not a project member.',
        });
      }
    }

    const task = await Task.create({
      title: title.trim(),
      description: description ? description.trim() : '',
      project: projectId,
      assignedTo: assignedTo || null,
      createdBy: req.user._id,
      status: status || 'To Do',
      priority: priority || 'Medium',
      dueDate: dueDate ? new Date(dueDate) : null,
    });

    const populatedTask = await Task.findById(task._id)
      .populate('project', 'title status')
      .populate('assignedTo', 'name email avatarColor')
      .populate('createdBy', 'name email avatarColor');

    return res.status(201).json({
      success: true,
      message: 'Task created successfully!',
      task: populatedTask,
    });
  } catch (error) {
    next(error);
  }
};

export const updateTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found.',
      });
    }

    const { hasAccess, project } = await verifyProjectAccess(task.project, req.user._id);
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to update this task.',
      });
    }

    const { title, description, status, priority, dueDate, assignedTo } = req.body;

    if (title) task.title = title.trim();
    if (description !== undefined) task.description = description.trim();
    if (status) task.status = status;
    if (priority) task.priority = priority;
    if (dueDate !== undefined) task.dueDate = dueDate ? new Date(dueDate) : null;

    if (assignedTo !== undefined) {
      if (assignedTo && assignedTo !== '') {
        const assignedToStr = assignedTo.toString();
        const isOwner = getEntityId(project.owner) === assignedToStr;
        const isMember = project.members.some((m) => getEntityId(m.user) === assignedToStr);
        if (!isOwner && !isMember) {
          return res.status(400).json({
            success: false,
            message: 'Cannot assign task to a user who is not a project member.',
          });
        }
        task.assignedTo = assignedTo;
      } else {
        task.assignedTo = null;
      }
    }

    await task.save();

    const populatedTask = await Task.findById(task._id)
      .populate('project', 'title status')
      .populate('assignedTo', 'name email avatarColor')
      .populate('createdBy', 'name email avatarColor');

    return res.status(200).json({
      success: true,
      message: 'Task updated successfully.',
      task: populatedTask,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found.',
      });
    }

    const { hasAccess } = await verifyProjectAccess(task.project, req.user._id);
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to delete this task.',
      });
    }

    await Comment.deleteMany({ task: task._id });
    await Task.findByIdAndDelete(task._id);

    return res.status(200).json({
      success: true,
      message: 'Task and comments deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};
