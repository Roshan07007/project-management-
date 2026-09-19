import Project from '../models/Project.js';
import Task from '../models/Task.js';
import Comment from '../models/Comment.js';
import User from '../models/User.js';

const getEntityId = (entity) => {
  if (!entity) return null;
  return (entity._id || entity).toString();
};

const checkProjectAccess = (project, userId) => {
  const userIdStr = userId ? userId.toString() : '';
  const ownerId = getEntityId(project.owner);
  const isOwner = ownerId === userIdStr;
  const member = project.members?.find((m) => getEntityId(m.user) === userIdStr);
  const role = isOwner ? 'Owner' : member ? member.role : null;
  return { hasAccess: !!role, role, isOwner };
};

export const getProjects = async (req, res, next) => {
  try {
    const projects = await Project.find({
      $or: [{ owner: req.user._id }, { 'members.user': req.user._id }],
    })
      .populate('owner', 'name email avatarColor')
      .populate('members.user', 'name email avatarColor')
      .sort({ createdAt: -1 });

    const projectsWithStats = await Promise.all(
      projects.map(async (p) => {
        const tasks = await Task.find({ project: p._id });
        const totalTasks = tasks.length;
        const completedTasks = tasks.filter((t) => t.status === 'Completed').length;
        const inProgressTasks = tasks.filter((t) => t.status === 'In Progress').length;
        const todoTasks = tasks.filter((t) => t.status === 'To Do').length;

        const now = new Date();
        const overdueTasks = tasks.filter(
          (t) => t.status !== 'Completed' && t.dueDate && new Date(t.dueDate) < now
        ).length;

        const { role } = checkProjectAccess(p, req.user._id);

        return {
          ...p.toObject(),
          userRole: role,
          stats: {
            totalTasks,
            completedTasks,
            inProgressTasks,
            todoTasks,
            overdueTasks,
            memberCount: p.members.length,
            progressPercentage: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
          },
        };
      })
    );

    return res.status(200).json({
      success: true,
      count: projectsWithStats.length,
      projects: projectsWithStats,
    });
  } catch (error) {
    next(error);
  }
};

export const getProjectById = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('owner', 'name email avatarColor bio')
      .populate('members.user', 'name email avatarColor bio');

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found.',
      });
    }

    const { hasAccess, role, isOwner } = checkProjectAccess(project, req.user._id);
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to view this project.',
      });
    }

    const tasks = await Task.find({ project: project._id })
      .populate('assignedTo', 'name email avatarColor')
      .populate('createdBy', 'name email avatarColor')
      .sort({ createdAt: -1 });

    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((t) => t.status === 'Completed').length;
    const inProgressTasks = tasks.filter((t) => t.status === 'In Progress').length;
    const todoTasks = tasks.filter((t) => t.status === 'To Do').length;

    const now = new Date();
    const overdueTasks = tasks.filter(
      (t) => t.status !== 'Completed' && t.dueDate && new Date(t.dueDate) < now
    ).length;

    return res.status(200).json({
      success: true,
      project: {
        ...project.toObject(),
        userRole: role,
        isOwner,
        tasks,
        stats: {
          totalTasks,
          completedTasks,
          inProgressTasks,
          todoTasks,
          overdueTasks,
          memberCount: project.members.length,
          progressPercentage: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const createProject = async (req, res, next) => {
  try {
    const { title, description, status, startDate, dueDate } = req.body;

    if (!title || title.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Please provide a project title.',
      });
    }

    const project = await Project.create({
      title: title.trim(),
      description: description ? description.trim() : '',
      status: status || 'Active',
      startDate: startDate ? new Date(startDate) : new Date(),
      dueDate: dueDate ? new Date(dueDate) : null,
      owner: req.user._id,
      members: [
        {
          user: req.user._id,
          role: 'Admin',
          joinedAt: new Date(),
        },
      ],
    });

    const populatedProject = await Project.findById(project._id)
      .populate('owner', 'name email avatarColor')
      .populate('members.user', 'name email avatarColor');

    return res.status(201).json({
      success: true,
      message: 'Project created successfully!',
      project: {
        ...populatedProject.toObject(),
        userRole: 'Owner',
        isOwner: true,
        stats: {
          totalTasks: 0,
          completedTasks: 0,
          inProgressTasks: 0,
          todoTasks: 0,
          overdueTasks: 0,
          memberCount: 1,
          progressPercentage: 0,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found.',
      });
    }

    const { role } = checkProjectAccess(project, req.user._id);
    if (role !== 'Owner' && role !== 'Admin') {
      return res.status(403).json({
        success: false,
        message: 'Only the project owner or admins can update project details.',
      });
    }

    const { title, description, status, startDate, dueDate } = req.body;

    if (title) project.title = title.trim();
    if (description !== undefined) project.description = description.trim();
    if (status) project.status = status;
    if (startDate !== undefined) project.startDate = startDate ? new Date(startDate) : null;
    if (dueDate !== undefined) project.dueDate = dueDate ? new Date(dueDate) : null;

    await project.save();

    const updatedProject = await Project.findById(project._id)
      .populate('owner', 'name email avatarColor')
      .populate('members.user', 'name email avatarColor');

    return res.status(200).json({
      success: true,
      message: 'Project updated successfully.',
      project: updatedProject,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found.',
      });
    }

    if (getEntityId(project.owner) !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only the project owner can delete this project.',
      });
    }

    const tasks = await Task.find({ project: project._id }).select('_id');
    const taskIds = tasks.map((t) => t._id);

    await Comment.deleteMany({ task: { $in: taskIds } });
    await Task.deleteMany({ project: project._id });
    await Project.findByIdAndDelete(project._id);

    return res.status(200).json({
      success: true,
      message: 'Project and all associated tasks and comments have been deleted.',
    });
  } catch (error) {
    next(error);
  }
};

export const addProjectMember = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found.',
      });
    }

    const { role: userRole } = checkProjectAccess(project, req.user._id);
    if (userRole !== 'Owner' && userRole !== 'Admin') {
      return res.status(403).json({
        success: false,
        message: 'Only the project owner or admins can invite new members.',
      });
    }

    const { email, userId, role } = req.body;

    let targetUser;
    if (userId) {
      targetUser = await User.findById(userId);
    } else if (email) {
      targetUser = await User.findOne({ email: email.toLowerCase().trim() });
    }

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'No registered user found with the provided email address.',
      });
    }

    const alreadyMember = project.members.some(
      (m) => getEntityId(m.user) === targetUser._id.toString()
    );

    if (alreadyMember) {
      return res.status(400).json({
        success: false,
        message: 'User is already a member of this project.',
      });
    }

    project.members.push({
      user: targetUser._id,
      role: role && ['Admin', 'Member', 'Viewer'].includes(role) ? role : 'Member',
      joinedAt: new Date(),
    });

    await project.save();

    const updatedProject = await Project.findById(project._id)
      .populate('owner', 'name email avatarColor')
      .populate('members.user', 'name email avatarColor');

    return res.status(201).json({
      success: true,
      message: `${targetUser.name} has been added to the project.`,
      project: updatedProject,
    });
  } catch (error) {
    next(error);
  }
};

export const removeProjectMember = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found.',
      });
    }

    const targetUserId = req.params.userId;

    if (getEntityId(project.owner) === targetUserId.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot remove the project owner.',
      });
    }

    const { role: requesterRole } = checkProjectAccess(project, req.user._id);
    const isSelf = req.user._id.toString() === targetUserId.toString();

    if (!isSelf && requesterRole !== 'Owner' && requesterRole !== 'Admin') {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to remove members from this project.',
      });
    }

    project.members = project.members.filter(
      (m) => getEntityId(m.user) !== targetUserId.toString()
    );

    await project.save();

    await Task.updateMany(
      { project: project._id, assignedTo: targetUserId },
      { $set: { assignedTo: null } }
    );

    const updatedProject = await Project.findById(project._id)
      .populate('owner', 'name email avatarColor')
      .populate('members.user', 'name email avatarColor');

    return res.status(200).json({
      success: true,
      message: 'Member removed from project successfully.',
      project: updatedProject,
    });
  } catch (error) {
    next(error);
  }
};
