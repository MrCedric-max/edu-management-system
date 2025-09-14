const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const { auth, adminOnly, teacherOrAdmin } = require('../middleware/auth');

const router = express.Router();

// Get all notifications for current user
router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, limit = 20, unreadOnly = false } = req.query;
    const offset = (page - 1) * limit;
    
    let query = `
      SELECT n.*, 
             u.first_name as sender_first_name,
             u.last_name as sender_last_name
      FROM notifications n
      LEFT JOIN users u ON n.sender_id = u.id
      WHERE n.user_id = $1
    `;
    
    const params = [req.user.userId];
    let paramCount = 2;
    
    if (unreadOnly === 'true') {
      query += ` AND n.is_read = false`;
    }
    
    query += ` ORDER BY n.created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(limit, offset);
    
    const result = await db.query(query, params);
    
    // Get total count
    let countQuery = `SELECT COUNT(*) as total FROM notifications WHERE user_id = $1`;
    const countParams = [req.user.userId];
    
    if (unreadOnly === 'true') {
      countQuery += ` AND is_read = false`;
    }
    
    const countResult = await db.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].total);
    
    res.json({
      notifications: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// Get notification by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await db.query(`
      SELECT n.*, 
             u.first_name as sender_first_name,
             u.last_name as sender_last_name
      FROM notifications n
      LEFT JOIN users u ON n.sender_id = u.id
      WHERE n.id = $1 AND n.user_id = $2
    `, [id, req.user.userId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    
    // Mark as read
    await db.query('UPDATE notifications SET is_read = true WHERE id = $1', [id]);
    
    res.json({
      ...result.rows[0],
      is_read: true
    });
  } catch (error) {
    console.error('Error fetching notification:', error);
    res.status(500).json({ error: 'Failed to fetch notification' });
  }
});

// Create new notification (admin/teacher only)
router.post('/', [
  auth,
  teacherOrAdmin,
  body('title').trim().isLength({ min: 1 }),
  body('message').trim().isLength({ min: 1 }),
  body('type').optional().isIn(['info', 'warning', 'success', 'error']),
  body('userId').optional().isInt(),
  body('userRole').optional().isIn(['admin', 'teacher', 'student', 'parent']),
  body('schoolId').optional().isInt()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { title, message, type = 'info', userId, userRole, schoolId } = req.body;
    
    let targetUsers = [];
    
    if (userId) {
      // Send to specific user
      const userResult = await db.query('SELECT id FROM users WHERE id = $1', [userId]);
      if (userResult.rows.length === 0) {
        return res.status(404).json({ error: 'Target user not found' });
      }
      targetUsers = [{ id: userId }];
    } else if (userRole) {
      // Send to all users with specific role
      let query = 'SELECT id FROM users WHERE role = $1';
      const params = [userRole];
      
      if (schoolId) {
        query += ' AND school_id = $2';
        params.push(schoolId);
      }
      
      const result = await db.query(query, params);
      targetUsers = result.rows;
    } else if (schoolId) {
      // Send to all users in school
      const result = await db.query('SELECT id FROM users WHERE school_id = $1', [schoolId]);
      targetUsers = result.rows;
    } else {
      return res.status(400).json({ error: 'Must specify userId, userRole, or schoolId' });
    }
    
    if (targetUsers.length === 0) {
      return res.status(400).json({ error: 'No target users found' });
    }
    
    // Create notifications for all target users
    const notifications = targetUsers.map(user => [
      user.id,
      title,
      message,
      type,
      req.user.userId
    ]);
    
    const values = notifications.map((_, index) => {
      const base = index * 5;
      return `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5})`;
    }).join(', ');
    
    const flatParams = notifications.flat();
    
    await db.query(`
      INSERT INTO notifications (user_id, title, message, type, sender_id)
      VALUES ${values}
    `, flatParams);
    
    res.status(201).json({
      message: 'Notifications created successfully',
      count: targetUsers.length
    });
  } catch (error) {
    console.error('Error creating notifications:', error);
    res.status(500).json({ error: 'Failed to create notifications' });
  }
});

// Mark notification as read
router.put('/:id/read', auth, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await db.query(`
      UPDATE notifications 
      SET is_read = true 
      WHERE id = $1 AND user_id = $2
      RETURNING id
    `, [id, req.user.userId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    
    res.json({ message: 'Notification marked as read' });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
});

// Mark all notifications as read
router.put('/read-all', auth, async (req, res) => {
  try {
    await db.query(`
      UPDATE notifications 
      SET is_read = true 
      WHERE user_id = $1 AND is_read = false
    `, [req.user.userId]);
    
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ error: 'Failed to mark all notifications as read' });
  }
});

// Delete notification
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await db.query(`
      DELETE FROM notifications 
      WHERE id = $1 AND user_id = $2
      RETURNING id
    `, [id, req.user.userId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    
    res.json({ message: 'Notification deleted successfully' });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ error: 'Failed to delete notification' });
  }
});

// Delete all notifications
router.delete('/all', auth, async (req, res) => {
  try {
    await db.query('DELETE FROM notifications WHERE user_id = $1', [req.user.userId]);
    
    res.json({ message: 'All notifications deleted successfully' });
  } catch (error) {
    console.error('Error deleting all notifications:', error);
    res.status(500).json({ error: 'Failed to delete all notifications' });
  }
});

// Get notification statistics
router.get('/stats/overview', auth, async (req, res) => {
  try {
    const stats = await db.query(`
      SELECT 
        COUNT(*) as total_notifications,
        COUNT(CASE WHEN is_read = false THEN 1 END) as unread_count,
        COUNT(CASE WHEN type = 'info' THEN 1 END) as info_count,
        COUNT(CASE WHEN type = 'warning' THEN 1 END) as warning_count,
        COUNT(CASE WHEN type = 'success' THEN 1 END) as success_count,
        COUNT(CASE WHEN type = 'error' THEN 1 END) as error_count
      FROM notifications
      WHERE user_id = $1
    `, [req.user.userId]);
    
    res.json(stats.rows[0]);
  } catch (error) {
    console.error('Error fetching notification stats:', error);
    res.status(500).json({ error: 'Failed to fetch notification statistics' });
  }
});

// Get unread count (for header/badge)
router.get('/unread/count', auth, async (req, res) => {
  try {
    const result = await db.query(`
      SELECT COUNT(*) as unread_count
      FROM notifications
      WHERE user_id = $1 AND is_read = false
    `, [req.user.userId]);
    
    res.json({ unreadCount: parseInt(result.rows[0].unread_count) });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({ error: 'Failed to fetch unread count' });
  }
});

module.exports = router;
