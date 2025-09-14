const express = require('express');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const { auth, adminOnly, teacherOrAdmin } = require('../middleware/auth');

const router = express.Router();

// Get all parents (admin/teacher only)
router.get('/', auth, teacherOrAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    const offset = (page - 1) * limit;
    
    let query = `
      SELECT p.*, u.first_name, u.last_name, u.email, u.phone, u.is_active,
             s.name as school_name
      FROM parents p
      JOIN users u ON p.user_id = u.id
      LEFT JOIN schools s ON p.school_id = s.id
    `;
    
    const params = [];
    if (search) {
      query += ` WHERE (u.first_name ILIKE $1 OR u.last_name ILIKE $1 OR u.email ILIKE $1)`;
      params.push(`%${search}%`);
    }
    
    query += ` ORDER BY u.last_name, u.first_name LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);
    
    const result = await db.query(query, params);
    
    // Get total count
    let countQuery = `
      SELECT COUNT(*) as total
      FROM parents p
      JOIN users u ON p.user_id = u.id
    `;
    const countParams = [];
    if (search) {
      countQuery += ` WHERE (u.first_name ILIKE $1 OR u.last_name ILIKE $1 OR u.email ILIKE $1)`;
      countParams.push(`%${search}%`);
    }
    
    const countResult = await db.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].total);
    
    res.json({
      parents: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching parents:', error);
    res.status(500).json({ error: 'Failed to fetch parents' });
  }
});

// Get parent by ID
router.get('/:id', auth, teacherOrAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await db.query(`
      SELECT p.*, u.first_name, u.last_name, u.email, u.phone, u.is_active,
             s.name as school_name
      FROM parents p
      JOIN users u ON p.user_id = u.id
      LEFT JOIN schools s ON p.school_id = s.id
      WHERE p.id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Parent not found' });
    }
    
    // Get parent's children
    const childrenResult = await db.query(`
      SELECT s.*, u.first_name, u.last_name, u.email, c.name as class_name
      FROM students s
      JOIN users u ON s.user_id = u.id
      LEFT JOIN classes c ON s.class_id = c.id
      WHERE s.parent_id = $1
    `, [id]);
    
    res.json({
      ...result.rows[0],
      children: childrenResult.rows
    });
  } catch (error) {
    console.error('Error fetching parent:', error);
    res.status(500).json({ error: 'Failed to fetch parent' });
  }
});

// Create new parent
router.post('/', [
  auth,
  adminOnly,
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('firstName').trim().isLength({ min: 1 }),
  body('lastName').trim().isLength({ min: 1 }),
  body('phone').optional().isMobilePhone(),
  body('occupation').optional().trim(),
  body('workplace').optional().trim(),
  body('schoolId').optional().isInt()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { email, password, firstName, lastName, phone, occupation, workplace, schoolId } = req.body;
    
    // Check if user already exists
    const existingUser = await db.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }
    
    // Create user first
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const userResult = await db.query(`
      INSERT INTO users (email, password, first_name, last_name, phone, role, is_active)
      VALUES ($1, $2, $3, $4, $5, 'parent', true)
      RETURNING id
    `, [email, hashedPassword, firstName, lastName, phone]);
    
    const userId = userResult.rows[0].id;
    
    // Create parent record
    const parentResult = await db.query(`
      INSERT INTO parents (user_id, school_id, occupation, workplace)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `, [userId, schoolId || null, occupation || null, workplace || null]);
    
    res.status(201).json({
      message: 'Parent created successfully',
      parent: parentResult.rows[0]
    });
  } catch (error) {
    console.error('Error creating parent:', error);
    res.status(500).json({ error: 'Failed to create parent' });
  }
});

// Update parent
router.put('/:id', [
  auth,
  teacherOrAdmin,
  body('firstName').optional().trim().isLength({ min: 1 }),
  body('lastName').optional().trim().isLength({ min: 1 }),
  body('phone').optional().isMobilePhone(),
  body('occupation').optional().trim(),
  body('workplace').optional().trim(),
  body('schoolId').optional().isInt()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { id } = req.params;
    const { firstName, lastName, phone, occupation, workplace, schoolId } = req.body;
    
    // Check if parent exists
    const parentResult = await db.query('SELECT user_id FROM parents WHERE id = $1', [id]);
    if (parentResult.rows.length === 0) {
      return res.status(404).json({ error: 'Parent not found' });
    }
    
    const userId = parentResult.rows[0].user_id;
    
    // Update user info
    const userUpdates = [];
    const userParams = [];
    let paramCount = 1;
    
    if (firstName) {
      userUpdates.push(`first_name = $${paramCount++}`);
      userParams.push(firstName);
    }
    if (lastName) {
      userUpdates.push(`last_name = $${paramCount++}`);
      userParams.push(lastName);
    }
    if (phone) {
      userUpdates.push(`phone = $${paramCount++}`);
      userParams.push(phone);
    }
    
    if (userUpdates.length > 0) {
      userParams.push(userId);
      await db.query(`
        UPDATE users SET ${userUpdates.join(', ')}, updated_at = CURRENT_TIMESTAMP
        WHERE id = $${paramCount}
      `, userParams);
    }
    
    // Update parent info
    const parentUpdates = [];
    const parentParams = [];
    paramCount = 1;
    
    if (occupation !== undefined) {
      parentUpdates.push(`occupation = $${paramCount++}`);
      parentParams.push(occupation);
    }
    if (workplace !== undefined) {
      parentUpdates.push(`workplace = $${paramCount++}`);
      parentParams.push(workplace);
    }
    if (schoolId !== undefined) {
      parentUpdates.push(`school_id = $${paramCount++}`);
      parentParams.push(schoolId);
    }
    
    if (parentUpdates.length > 0) {
      parentParams.push(id);
      await db.query(`
        UPDATE parents SET ${parentUpdates.join(', ')}, updated_at = CURRENT_TIMESTAMP
        WHERE id = $${paramCount}
      `, parentParams);
    }
    
    res.json({ message: 'Parent updated successfully' });
  } catch (error) {
    console.error('Error updating parent:', error);
    res.status(500).json({ error: 'Failed to update parent' });
  }
});

// Delete parent
router.delete('/:id', auth, adminOnly, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if parent exists
    const parentResult = await db.query('SELECT user_id FROM parents WHERE id = $1', [id]);
    if (parentResult.rows.length === 0) {
      return res.status(404).json({ error: 'Parent not found' });
    }
    
    const userId = parentResult.rows[0].user_id;
    
    // Delete parent record (user will be deleted by cascade)
    await db.query('DELETE FROM parents WHERE id = $1', [id]);
    
    res.json({ message: 'Parent deleted successfully' });
  } catch (error) {
    console.error('Error deleting parent:', error);
    res.status(500).json({ error: 'Failed to delete parent' });
  }
});

// Get parent's children
router.get('/:id/children', auth, teacherOrAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await db.query(`
      SELECT s.*, u.first_name, u.last_name, u.email, c.name as class_name,
             sch.name as school_name
      FROM students s
      JOIN users u ON s.user_id = u.id
      LEFT JOIN classes c ON s.class_id = c.id
      LEFT JOIN schools sch ON s.school_id = sch.id
      WHERE s.parent_id = $1
      ORDER BY u.last_name, u.first_name
    `, [id]);
    
    res.json({ children: result.rows });
  } catch (error) {
    console.error('Error fetching parent children:', error);
    res.status(500).json({ error: 'Failed to fetch parent children' });
  }
});

module.exports = router;
