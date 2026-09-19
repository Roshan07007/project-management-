import express from 'express';
import {
  getCommentsByTask,
  addComment,
  deleteComment,
} from '../controllers/commentController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router({ mergeParams: true });

router.use(protect);

router.route('/').get(getCommentsByTask).post(addComment);
router.route('/:id').delete(deleteComment);

export default router;
