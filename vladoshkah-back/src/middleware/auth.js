import jwt from 'jsonwebtoken';
import authConfig from '../config/auth.js';
const jwtConfig = authConfig.jwt;
import logger from '../logger.js';
import usersDao from '../dao/usersDao.js';

const normalizeRole = (role) => {
  if (!role) return role;
  const value = String(role).toLowerCase();
  if (value === 'admin_shelter') return 'shelter_admin';
  return value;
};

function authenticateToken(req, res, next) {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Access token is required'
      });
    }

    jwt.verify(token, jwtConfig.secret, async (err, decoded) => {
      if (err) {
        if (err.name === 'TokenExpiredError') {
          return res.status(401).json({
            success: false,
            error: 'Token expired'
          });
        }
        if (err.name === 'JsonWebTokenError') {
          return res.status(401).json({
            success: false,
            error: 'Invalid token'
          });
        }
        return res.status(403).json({
          success: false,
          error: 'Token verification failed'
        });
      }

      const tokenRole = normalizeRole(decoded.role);

      if (process.env.NODE_ENV === 'test') {
        req.user = {
          userId: decoded.userId,
          email: decoded.email,
          role: tokenRole
        };
        return next();
      }

      try {
        const dbUser = await usersDao.getById(decoded.userId);
        if (!dbUser) {
          return res.status(401).json({
            success: false,
            error: 'User not found'
          });
        }

        req.user = {
          userId: decoded.userId,
          email: dbUser.email || decoded.email,
          role: normalizeRole(dbUser.role || tokenRole)
        };

        next();
      } catch (dbError) {
        logger.error(dbError, 'Middleware: error loading user for auth');
        res.status(500).json({
          success: false,
          error: 'Internal server error'
        });
      }
    });
  } catch (error) {
    logger.error(error, 'Middleware: error in authenticateToken');
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}

function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const userRole = normalizeRole(req.user.role);
    const normalizedAllowed = allowedRoles.map(normalizeRole);

    if (!normalizedAllowed.includes(userRole)) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions'
      });
    }

    next();
  };
}

export {
  authenticateToken,
  authorize
};
