const express = require('express');
const router = express.Router();
const {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  addProjectMember,
  removeProjectMember,
} = require('../controllers/projectController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.route('/').get(getProjects).post(createProject);

router.route('/:id').get(getProjectById).put(updateProject).delete(deleteProject);

// Member management
router.route('/:id/members').post(addProjectMember);
router.route('/:id/members/:userId').delete(removeProjectMember);

module.exports = router;
