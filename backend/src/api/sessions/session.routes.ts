import { Router } from 'express';
import { SessionService } from '../../services/session.service';
import { validate } from '../../middleware/validation.middleware';
import { authenticate } from '../../middleware/auth.middleware';
import {
  createSessionSchema,
  updateSessionSchema,
  getSessionsQuerySchema,
} from '../../validation/session.schema';

const router = Router();

router.post('/', authenticate, validate(createSessionSchema), async (req, res) => {
  try {
    const userId = req.user!.userId;
    const userAgent = req.headers['user-agent'];
    const ipAddress = req.ip;

    const session = await SessionService.createSession({
      userId,
      title: req.body.title,
      personaId: req.body.personaId,
      aiModelId: req.body.aiModelId,
      modelOverride: req.body.modelOverride,
      userAgent,
      ipAddress,
    });

    res.status(201).json({
      success: true,
      data: session,
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      success: false,
      error: {
        code: error.code || 'SESSION_CREATE_FAILED',
        message: error.message || 'Failed to create session',
      },
    });
  }
});

router.get('/', authenticate, validate(getSessionsQuerySchema, 'query'), async (req, res) => {
  try {
    const userId = req.user!.userId;
    const { status, limit, offset } = req.query;

    const result = await SessionService.getUserSessions(userId, {
      status: status as 'ACTIVE' | 'ARCHIVED' | 'DELETED' | undefined,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      success: false,
      error: {
        code: error.code || 'SESSIONS_FETCH_FAILED',
        message: error.message || 'Failed to fetch sessions',
      },
    });
  }
});

router.get('/:id', authenticate, async (req, res) => {
  try {
    const userId = req.user!.userId;
    const sessionId = req.params.id as string;

    const session = await SessionService.getSessionById(sessionId, userId);

    res.json({
      success: true,
      data: session,
    });
  } catch (error: any) {
    res.status(error.statusCode || 404).json({
      success: false,
      error: {
        code: error.code || 'SESSION_NOT_FOUND',
        message: error.message || 'Session not found',
      },
    });
  }
});

router.put('/:id', authenticate, validate(updateSessionSchema), async (req, res) => {
  try {
    const userId = req.user!.userId;
    const sessionId = req.params.id as string;

    const session = await SessionService.updateSession(sessionId, userId, req.body);

    res.json({
      success: true,
      data: session,
    });
  } catch (error: any) {
    res.status(error.statusCode || 400).json({
      success: false,
      error: {
        code: error.code || 'SESSION_UPDATE_FAILED',
        message: error.message || 'Failed to update session',
      },
    });
  }
});

router.delete('/:id', authenticate, async (req, res) => {
  try {
    const userId = req.user!.userId;
    const sessionId = req.params.id as string;

    const result = await SessionService.deleteSession(sessionId, userId);

    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    res.status(error.statusCode || 400).json({
      success: false,
      error: {
        code: error.code || 'SESSION_DELETE_FAILED',
        message: error.message || 'Failed to delete session',
      },
    });
  }
});

export default router;