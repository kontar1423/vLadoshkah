import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import userDAO from '../dao/usersDao.js';
import logger from '../logger.js';
import authConfig from '../config/auth.js';
import kafkaProducer from '../messaging/kafka-producer.js';
const jwtConfig = authConfig.jwt;
const bcryptConfig = authConfig.bcrypt;

async function register(userData) {
  try {
    const {email, password, role = 'user'} = userData;

    const existingUser = await userDAO.getByEmail(email);
    if (existingUser) {
      const err = new Error('User with this email already exists');
      err.status = 409;
      throw err;
    }

    if (!email || !password ) {
      const err = new Error('Missing required fields: email, password');
      err.status = 400;
      throw err;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      const err = new Error('Invalid email format');
      err.status = 400;
      throw err;
    }

    if (password.length < 6) {
      const err = new Error('Password must be at least 6 characters long');
      err.status = 400;
      throw err;
    }

    const hashedPassword = await bcrypt.hash(password, bcryptConfig.saltRounds);

    const user = await userDAO.create({
      email,
      password: hashedPassword,
      role,
      firstname: null,
      lastname: null,
      gender: null,
      phone: null,
      bio: null
    });

    const { password: _, ...userWithoutPassword } = user;

    const tokens = generateTokens(user.id, user.email, user.role);

    logger.info({ userId: user.id, email: user.email }, 'User registered successfully');

    try {
      await kafkaProducer.sendEvent('user-notifications', {
        eventType: 'user.registered',
        timestamp: new Date().toISOString(),
        data: {
          userId: user.id,
          email: user.email,
          role: user.role,
          firstname: user.firstname,
          lastname: user.lastname
        }
      }, user.id.toString());
    } catch (err) {

      logger.error({ err, userId: user.id }, 'Failed to send registration event to Kafka');
    }

    return {
      user: userWithoutPassword,
      ...tokens
    };
  } catch (err) {
    logger.error(err, 'Service: error registering user');
    throw err;
  }
}

async function login(email, password) {
  try {
    if (!email || !password) {
      const err = new Error('Email and password are required');
      err.status = 400;
      throw err;
    }

    const user = await userDAO.getByEmail(email);
    if (!user) {
      const err = new Error('Invalid email or password');
      err.status = 401;
      throw err;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      const err = new Error('Invalid email or password');
      err.status = 401;
      throw err;
    }

    const { password: _, ...userWithoutPassword } = user;

    const tokens = generateTokens(user.id, user.email, user.role);

    logger.info({ userId: user.id, email: user.email }, 'User logged in successfully');

    return {
      user: userWithoutPassword,
      ...tokens
    };
  } catch (err) {
    logger.error(err, 'Service: error logging in user');
    throw err;
  }
}

async function refreshAccessToken(refreshToken) {
  try {
    if (!refreshToken) {
      const err = new Error('Refresh token is required');
      err.status = 400;
      throw err;
    }

    const decoded = jwt.verify(refreshToken, jwtConfig.secret);

    const user = await userDAO.getById(decoded.userId);
    if (!user) {
      const err = new Error('User not found');
      err.status = 401;
      throw err;
    }

    const tokens = generateTokens(user.id, user.email, user.role);

    return tokens;
  } catch (err) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      const error = new Error('Invalid or expired refresh token');
      error.status = 401;
      throw error;
    }
    logger.error(err, 'Service: error refreshing token');
    throw err;
  }
}

function generateTokens(userId, email, role) {
  const payload = {
    userId,
    email,
    role
  };

  const accessToken = jwt.sign(payload, jwtConfig.secret, {
    expiresIn: jwtConfig.expiresIn
  });

  const refreshToken = jwt.sign(payload, jwtConfig.secret, {
    expiresIn: jwtConfig.refreshExpiresIn
  });

  return {
    accessToken,
    refreshToken
  };
}

export default {
  register,
  login,
  refreshAccessToken
};
