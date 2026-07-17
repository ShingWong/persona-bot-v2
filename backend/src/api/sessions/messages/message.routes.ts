import { Router } from 'express';
import { MessageService } from '../../../services/message.service';
import llmService from '../../../services/llm';
import { validate } from '../../../middleware/validation.middleware';
import { authenticate } from '../../../middleware/auth.middleware';
import {
  createMessageSchema,
  getMessagesQuerySchema,
  sendMessageToLLMSchema,
} from '../../../validation/session.schema';

const router = Router({ mergeParams: true });

router.post('/', authenticate, validate(createMessageSchema), async (req, res) => {
  try {
    const sessionId = req.params.id as string;
    const userId = req.user!.userId;

    // Verify session exists and belongs to user
    await MessageService.getSessionMessages(sessionId, userId, { limit: 1, offset: 0 });

    const message = await MessageService.createMessage({
      sessionId,
      role: req.body.role,
      content: req.body.content,
      inputTokens: req.body.inputTokens || 0,
      outputTokens: req.body.outputTokens || 0,
      modelId: req.body.modelId,
    });

    res.status(201).json({
      success: true,
      data: message,
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      success: false,
      error: {
        code: error.code || 'MESSAGE_CREATE_FAILED',
        message: error.message || 'Failed to create message',
      },
    });
  }
});

router.post('/llm', authenticate, validate(sendMessageToLLMSchema), async (req, res) => {
  try {
    const sessionId = req.params.id as string;
    const userId = req.user!.userId;
    const { content, stream, temperature, maxTokens } = req.body;

    // First, save the user message
    const userMessage = await MessageService.createMessage({
      sessionId,
      role: 'USER',
      content,
      inputTokens: 0, // Will be updated after LLM call
      outputTokens: 0,
    });

    if (stream) {
      // Set headers for streaming
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.flushHeaders();

      // Send streaming response
      const llmResponse = await llmService.sendStreamingMessage(
        sessionId,
        userId,
        content,
        (chunk, isComplete) => {
          if (chunk) {
            res.write(`data: ${JSON.stringify({ chunk, isComplete: false })}\n\n`);
          }
          if (isComplete) {
            res.write(`data: ${JSON.stringify({ chunk: '', isComplete: true })}\n\n`);
            res.end();
          }
        },
        { temperature, maxTokens }
      );

      // Save assistant response
      await MessageService.createMessage({
        sessionId,
        role: 'ASSISTANT',
        content: llmResponse.content,
        inputTokens: 0, // Input tokens are for the prompt, not the response
        outputTokens: llmResponse.outputTokens,
      });

      // Update user message with input token count
      await MessageService.updateMessageTokens(
        userMessage.id,
        llmResponse.inputTokens,
        0
      );

    } else {
      // Non-streaming response
      const llmResponse = await llmService.sendMessage(
        sessionId,
        userId,
        content,
        { temperature, maxTokens }
      );

      // Save assistant response
      await MessageService.createMessage({
        sessionId,
        role: 'ASSISTANT',
        content: llmResponse.content,
        inputTokens: 0, // Input tokens are for the prompt, not the response
        outputTokens: llmResponse.outputTokens,
      });

      // Update user message with input token count
      await MessageService.updateMessageTokens(
        userMessage.id,
        llmResponse.inputTokens,
        0
      );

      res.json({
        success: true,
        data: {
          message: {
            content: llmResponse.content,
            modelUsed: llmResponse.modelUsed,
            inputTokens: 0,
            outputTokens: llmResponse.outputTokens,
            totalTokens: llmResponse.outputTokens,
            latencyMs: llmResponse.latencyMs,
          },
          usage: {
            inputTokens: llmResponse.inputTokens,
            outputTokens: llmResponse.outputTokens,
            totalTokens: llmResponse.totalTokens,
            latencyMs: llmResponse.latencyMs,
          },
        },
      });
    }
  } catch (error: any) {
    console.error('LLM message error:', error);
    
    if (!res.headersSent) {
      res.status(error.statusCode || 500).json({
        success: false,
        error: {
          code: error.code || 'LLM_MESSAGE_FAILED',
          message: error.message || 'Failed to send message to LLM',
        },
      });
    }
  }
});

router.get('/', authenticate, validate(getMessagesQuerySchema, 'query'), async (req, res) => {
  try {
    const sessionId = req.params.id as string;
    const userId = req.user!.userId;
    const { limit, offset } = req.query;

    const result = await MessageService.getSessionMessages(sessionId, userId, {
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    res.status(error.statusCode || 404).json({
      success: false,
      error: {
        code: error.code || 'MESSAGES_FETCH_FAILED',
        message: error.message || 'Failed to fetch messages',
      },
    });
  }
});

router.get('/:messageId', authenticate, async (req, res) => {
  try {
    const sessionId = req.params.id as string;
    const messageId = req.params.messageId as string;
    const userId = req.user!.userId;

    const message = await MessageService.getMessageById(messageId, sessionId, userId);

    res.json({
      success: true,
      data: message,
    });
  } catch (error: any) {
    res.status(error.statusCode || 404).json({
      success: false,
      error: {
        code: error.code || 'MESSAGE_NOT_FOUND',
        message: error.message || 'Message not found',
      },
    });
  }
});

router.get('/usage/tokens', authenticate, async (req, res) => {
  try {
    const sessionId = req.params.id as string;
    const userId = req.user!.userId;

    const usage = await MessageService.getSessionTokenUsage(sessionId, userId);

    res.json({
      success: true,
      data: usage,
    });
  } catch (error: any) {
    res.status(error.statusCode || 404).json({
      success: false,
      error: {
        code: error.code || 'USAGE_FETCH_FAILED',
        message: error.message || 'Failed to fetch token usage',
      },
    });
  }
});

export default router;