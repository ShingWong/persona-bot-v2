import { Router } from 'express';
import { AuthService } from '../../services/auth.service';
import { validate } from '../../middleware/validation.middleware';
import { registerSchema, loginSchema, refreshTokenSchema } from '../../validation/auth.schema';
import { authenticate } from '../../middleware/auth.middleware';

const router = Router();

router.post('/register', validate(registerSchema), async (req, res) => {
  try {
    const { email, password, name } = req.body;
    const result = await AuthService.register(email, password, name);
    
    res.status(201).json({
      success: true,
      data: result,
    });
  } catch (error) {
    const authError = error as any;
    res.status(authError.statusCode || 500).json({
      success: false,
      error: {
        code: authError.code || 'REGISTRATION_FAILED',
        message: authError.message || 'Registration failed',
      },
    });
  }
});

router.post('/login', validate(loginSchema), async (req, res) => {
  try {
    const { email, password } = req.body;
    const userAgent = req.headers['user-agent'];
    const ipAddress = req.ip;
    
    const result = await AuthService.login(email, password, userAgent, ipAddress);
    
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    const authError = error as any;
    res.status(authError.statusCode || 401).json({
      success: false,
      error: {
        code: authError.code || 'LOGIN_FAILED',
        message: authError.message || 'Login failed',
      },
    });
  }
});

router.post('/refresh', validate(refreshTokenSchema), async (req, res) => {
  try {
    const { refreshToken } = req.body;
    const result = await AuthService.refreshTokens(refreshToken);
    
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    const authError = error as any;
    res.status(authError.statusCode || 401).json({
      success: false,
      error: {
        code: authError.code || 'REFRESH_FAILED',
        message: authError.message || 'Token refresh failed',
      },
    });
  }
});

router.post('/logout', validate(refreshTokenSchema), async (req, res) => {
  try {
    const { refreshToken } = req.body;
    await AuthService.logout(refreshToken);
    
    res.json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    const authError = error as any;
    res.status(authError.statusCode || 400).json({
      success: false,
      error: {
        code: authError.code || 'LOGOUT_FAILED',
        message: authError.message || 'Logout failed',
      },
    });
  }
});

router.get('/me', authenticate, async (req, res) => {
  try {
    const user = req.user;
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'NOT_AUTHENTICATED',
          message: 'Not authenticated',
        },
      });
    }
    
    return res.json({
      success: true,
      data: {
        user,
      },
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Internal server error',
      },
    });
  }
});

export default router;