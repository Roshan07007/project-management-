const Task = require('../models/Task');
const Project = require('../models/Project');
const Comment = require('../models/Comment');
const User = require('../models/User');

const getEntityId = (entity) => {
  if (!entity) return null;
  return (entity._id || entity).toString();
};

/**
 * Helper to check project membership
 */
const verifyProjectAccess = async (projectId, userId) => {
  const project = await Project.findById(projectId);
  if (!project) return { hasAccess: false, project: null };

  const userIdStr = userId ? userId.toString() : '';
  const ownerId = getEntityId(project.owner);
  const isOwner = ownerId === userIdStr;
  const isMember = project.members.some((m) => getEntityId(m.user) === userIdStr);

  return { hasAccess: isOwner || isMember, project };
};

/**
 * @desc    Get all tasks accessible by current user (with search & filters)
 * @route   GET /api/tasks
 * @access  Private
 */
exports.getTasks = async (req, res, next) => {
  try {
    const { project: projectId, status, priority, assignedTo, search } = req.query;

    // Find all projects where user is owner or member
    const userProjects = await Project.find({
      $or: [{ owner: req.user._id }, { 'members.user': req.user._id }],
    }).select('_id');

    const userProjectIds = userProjects.map((p) => p._id);

    let query = { project: { $in: userProjectIds } };

    // Filter by specific project
    if (projectId) {
      query.project = projectId;
    }

    // Filter by status ('To Do', 'In Progress', 'Completed')
    if (status && status !== 'All') {
      query.status = status;
    }

    // Filter by priority ('Low', 'Medium', 'High')
    if (priority && priority !== 'All') {
      query.priority = priority;
    }

    // Filter by assigned user
    if (assignedTo && assignedTo !== 'All') {
      query.assignedTo = assignedTo === 'unassigned' ? null : assignedTo;
    }

    // Search by title or description
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

/**
 * @desc    Get single task by ID with populated comments
 * @route   GET /api/tasks/:id
 * @access  Private
 */
exports.getTaskById = async (req, res, next) => {
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

/**
 * @desc    Create a new task
 * @route   POST /api/tasks
 * @access  Private
 */
exports.createTask = async (req, res, next) => {
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

    // Verify assignedTo is a valid project member or owner
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

/**
 * @desc    Update task details (status, priority, due date, assignee, etc.)
 * @route   PUT /api/tasks/:id
 * @access  Private
 */
exports.updateTask = async (req, res, next) => {
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

/**
 * @desc    Delete task and its comments
 * @route   DELETE /api/tasks/:id
 * @access  Private
 */
exports.deleteTask = async (req, res, next) => {
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
