const express = require('express');
const router = express.Router();
const {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
} = require('../controllers/taskController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.route('/').get(getTasks).post(createTask);

router.route('/:id').get(getTaskById).put(updateTask).delete(deleteTask);

module.exports = router;
