import authService from '../services/authService.js';
import logger from '../logger.js';

/**
 * Регистрация нового пользователя
 */
async function register(req, res) {
  try {
    const userData = req.body;
    
    const result = await authService.register(userData);
    
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      ...result
    });
  } catch (err) {
    const log = req.log || logger;
    log.error(err, 'Controller: error registering user');
    res.status(err.status || 500).json({
      success: false,
      error: err.message
    });
  }
}

/**
 * Вход пользователя
 */
async function login(req, res) {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required'
      });
    }
    
    const result = await authService.login(email, password);
    
    res.json({
      success: true,
      message: 'Login successful',
      ...result
    });
  } catch (err) {
    const log = req.log || logger;
    log.error(err, 'Controller: error logging in user');
    res.status(err.status || 500).json({
      success: false,
      error: err.message
    });
  }
}

/**
 * Обновление access токена
 */
async function refreshToken(req, res) {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        error: 'Refresh token is required'
      });
    }
    
    const tokens = await authService.refreshAccessToken(refreshToken);
    
    res.json({
      success: true,
      message: 'Token refreshed successfully',
      ...tokens
    });
  } catch (err) {
    const log = req.log || logger;
    log.error(err, 'Controller: error refreshing token');
    res.status(err.status || 500).json({
      success: false,
      error: err.message
    });
  }
}

export default {
  register,
  login,
  refreshToken
};

