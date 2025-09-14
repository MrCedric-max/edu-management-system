const jwt = require('jsonwebtoken');
const db = require('../config/database');

const auth = (req, res, next) => {
  const authenticate = async () => {
    try {
      const token = req.header('Authorization')?.replace('Bearer ', '');
      
      if (!token) {
        return res.status(401).json({ error: 'Access denied. No token provided.' });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
      
      // Verify user still exists and is active
      const result = await db.query(
        'SELECT id, email, role, is_active FROM users WHERE id = $1',
        [decoded.userId]
      );

      if (result.rows.length === 0) {
        return res.status(401).json({ error: 'Invalid token. User not found.' });
      }

      const user = result.rows[0];
      if (!user.is_active) {
        return res.status(401).json({ error: 'Account is deactivated.' });
      }

      req.user = {
        userId: user.id,
        email: user.email,
        role: user.role
      };

      next();
    } catch (error) {
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({ error: 'Invalid token.' });
      }
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ error: 'Token expired.' });
      }
      
      console.error('Auth middleware error:', error);
      res.status(500).json({ error: 'Internal server error.' });
    }
  };
  
  authenticate();
};

// Role-based authorization middleware
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Access denied. No user found.' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Access denied. Insufficient permissions.' });
    }

    next();
  };
};

// Admin only middleware
const adminOnly = authorize('admin');

// Teacher or Admin middleware
const teacherOrAdmin = authorize('teacher', 'admin');

// Student, Teacher, or Admin middleware
const studentTeacherOrAdmin = authorize('student', 'teacher', 'admin');

module.exports = {
  auth,
  authorize,
  adminOnly,
  teacherOrAdmin,
  studentTeacherOrAdmin
};
