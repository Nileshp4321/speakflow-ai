import { Router } from 'express';
import { body, param } from 'express-validator';
import {
  createTranscription,
  getTranscriptions,
  getTranscriptionById,
  updateTranscription,
  deleteTranscription,
} from '../controllers/transcriptionController';
import { validate } from '../middleware/validate';

const router = Router();

// POST /api/transcriptions
router.post(
  '/',
  [
    body('transcript').notEmpty().withMessage('transcript is required'),
    body('title').optional().isString().isLength({ max: 300 }),
    body('duration').optional().isNumeric(),
    body('language').optional().isString(),
  ],
  validate,
  createTranscription,
);

// GET /api/transcriptions
router.get('/', getTranscriptions);

// GET /api/transcriptions/:id
router.get('/:id', getTranscriptionById);

// PUT /api/transcriptions/:id
router.put(
  '/:id',
  [
    body('title').optional().isString().isLength({ max: 300 }),
    body('transcript').optional().isString(),
    body('duration').optional().isNumeric(),
    body('language').optional().isString(),
  ],
  validate,
  updateTranscription,
);

// DELETE /api/transcriptions/:id
router.delete('/:id', deleteTranscription);

export default router;
