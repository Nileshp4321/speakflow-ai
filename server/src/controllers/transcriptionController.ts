import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { Transcription } from '../models/Transcription';
import { createError } from '../middleware/errorHandler';

function isValidObjectId(id: string): boolean {
  return mongoose.Types.ObjectId.isValid(id);
}

// POST /api/transcriptions
export async function createTranscription(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { title, transcript, language, duration, segments, metadata } = req.body;

    if (!transcript || transcript.trim().length === 0) {
      return next(createError('Transcript cannot be empty', 400));
    }

    const wordCount = transcript.trim().split(/\s+/).filter(Boolean).length;
    
    // Convert 'auto' to 'none' for MongoDB compatibility
    const dbLanguage = language === 'auto' || !language ? 'none' : language;

    const doc = new Transcription({
      title:
        title?.trim() ||
        `Transcription – ${new Date().toLocaleDateString('en-IN', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })}, ${new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`,
      transcript: transcript.trim(),
      language: dbLanguage,
      duration: duration || 0,
      wordCount,
      segments: segments || [],
      metadata: metadata || {},
    });

    await doc.save();

    res.status(201).json({
      success: true,
      data: doc,
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/transcriptions
export async function getTranscriptions(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const {
      search,
      sortBy = 'createdAt',
      order = 'desc',
      page = '1',
      limit = '10',
      dateFrom,
      dateTo,
    } = req.query as Record<string, string>;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 10));
    const skip = (pageNum - 1) * limitNum;

    // Build query filter
    const filter: Record<string, unknown> = {};

    if (search && search.trim()) {
      filter.$or = [
        { title: { $regex: search.trim(), $options: 'i' } },
        { transcript: { $regex: search.trim(), $options: 'i' } },
      ];
    }

    if (dateFrom || dateTo) {
      const dateFilter: Record<string, Date> = {};
      if (dateFrom) dateFilter.$gte = new Date(dateFrom);
      if (dateTo) {
        const to = new Date(dateTo);
        to.setHours(23, 59, 59, 999);
        dateFilter.$lte = to;
      }
      filter.createdAt = dateFilter;
    }

    const sortOrder = order === 'asc' ? 1 : -1;
    const allowedSortFields = ['createdAt', 'updatedAt', 'title', 'duration', 'wordCount'];
    const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';

    const [docs, total] = await Promise.all([
      Transcription.find(filter)
        .sort({ [sortField]: sortOrder })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Transcription.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: docs,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/transcriptions/:id
export async function getTranscriptionById(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return next(createError('Invalid transcription ID', 400));
    }

    const doc = await Transcription.findById(id).lean();
    if (!doc) {
      return next(createError('Transcription not found', 404));
    }

    res.json({ success: true, data: doc });
  } catch (err) {
    next(err);
  }
}

// PUT /api/transcriptions/:id
export async function updateTranscription(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return next(createError('Invalid transcription ID', 400));
    }

    const { title, transcript, language, duration, segments, metadata } = req.body;

    const updateData: Record<string, unknown> = {};
    if (title !== undefined) updateData.title = title.trim();
    if (transcript !== undefined) {
      if (transcript.trim().length === 0) {
        return next(createError('Transcript cannot be empty', 400));
      }
      updateData.transcript = transcript.trim();
      updateData.wordCount = transcript.trim().split(/\s+/).filter(Boolean).length;
    }
    if (language !== undefined) updateData.language = language;
    if (duration !== undefined) updateData.duration = duration;
    if (segments !== undefined) updateData.segments = segments;
    if (metadata !== undefined) updateData.metadata = metadata;

    const doc = await Transcription.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true },
    ).lean();

    if (!doc) {
      return next(createError('Transcription not found', 404));
    }

    res.json({ success: true, data: doc });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/transcriptions/:id
export async function deleteTranscription(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return next(createError('Invalid transcription ID', 400));
    }

    const doc = await Transcription.findByIdAndDelete(id).lean();
    if (!doc) {
      return next(createError('Transcription not found', 404));
    }

    res.json({ success: true, message: 'Transcription deleted successfully' });
  } catch (err) {
    next(err);
  }
}
