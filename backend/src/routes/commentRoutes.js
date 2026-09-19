const express = require('express');
const router = express.Router({ mergeParams: true });
const {
  getCommentsByTask,
  addComment,
  deleteComment,
} = require('../controllers/commentController');
const { protect } = require('../middleware/auth');

router.use(protect);

// /api/tasks/:taskId/comments
router.route('/').get(getCommentsByTask).post(addComment);

// /api/comments/:id
router.route('/:id').delete(deleteComment);

module.exports = router;
