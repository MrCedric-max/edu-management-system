const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const { auth, adminOnly } = require('../middleware/auth');

const router = express.Router();

// Get all schools
router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    const offset = (page - 1) * limit;
    
    let query = `
      SELECT s.*, 
             COUNT(u.id) as user_count,
             COUNT(st.id) as student_count,
             COUNT(t.id) as teacher_count
      FROM schools s
      LEFT JOIN users u ON s.id = u.school_id
      LEFT JOIN students st ON s.id = st.school_id
      LEFT JOIN teachers t ON s.id = t.school_id
    `;
    
    const params = [];
    if (search) {
      query += ` WHERE s.name ILIKE $1 OR s.address ILIKE $1`;
      params.push(`%${search}%`);
    }
    
    query += ` GROUP BY s.id ORDER BY s.name LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);
    
    const result = await db.query(query, params);
    
    // Get total count
    let countQuery = `SELECT COUNT(*) as total FROM schools s`;
    const countParams = [];
    if (search) {
      countQuery += ` WHERE s.name ILIKE $1 OR s.address ILIKE $1`;
      countParams.push(`%${search}%`);
    }
    
    const countResult = await db.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].total);
    
    res.json({
      schools: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching schools:', error);
    res.status(500).json({ error: 'Failed to fetch schools' });
  }
});

// Get school by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await db.query(`
      SELECT s.*, 
             COUNT(DISTINCT u.id) as user_count,
             COUNT(DISTINCT st.id) as student_count,
             COUNT(DISTINCT t.id) as teacher_count,
             COUNT(DISTINCT c.id) as class_count
      FROM schools s
      LEFT JOIN users u ON s.id = u.school_id
      LEFT JOIN students st ON s.id = st.school_id
      LEFT JOIN teachers t ON s.id = t.school_id
      LEFT JOIN classes c ON s.id = c.school_id
      WHERE s.id = $1
      GROUP BY s.id
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'School not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching school:', error);
    res.status(500).json({ error: 'Failed to fetch school' });
  }
});

// Create new school
router.post('/', [
  auth,
  adminOnly,
  body('name').trim().isLength({ min: 1 }),
  body('address').optional().trim(),
  body('phone').optional().isMobilePhone(),
  body('email').optional().isEmail().normalizeEmail(),
  body('website').optional().isURL(),
  body('principalName').optional().trim(),
  body('establishedYear').optional().isInt({ min: 1800, max: new Date().getFullYear() })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { name, address, phone, email, website, principalName, establishedYear } = req.body;
    
    const result = await db.query(`
      INSERT INTO schools (name, address, phone, email, website, principal_name, established_year)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [name, address || null, phone || null, email || null, website || null, principalName || null, establishedYear || null]);
    
    res.status(201).json({
      message: 'School created successfully',
      school: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating school:', error);
    res.status(500).json({ error: 'Failed to create school' });
  }
});

// Update school
router.put('/:id', [
  auth,
  adminOnly,
  body('name').optional().trim().isLength({ min: 1 }),
  body('address').optional().trim(),
  body('phone').optional().isMobilePhone(),
  body('email').optional().isEmail().normalizeEmail(),
  body('website').optional().isURL(),
  body('principalName').optional().trim(),
  body('establishedYear').optional().isInt({ min: 1800, max: new Date().getFullYear() })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { id } = req.params;
    const { name, address, phone, email, website, principalName, establishedYear } = req.body;
    
    // Check if school exists
    const schoolResult = await db.query('SELECT id FROM schools WHERE id = $1', [id]);
    if (schoolResult.rows.length === 0) {
      return res.status(404).json({ error: 'School not found' });
    }
    
    const updates = [];
    const params = [];
    let paramCount = 1;
    
    if (name) {
      updates.push(`name = $${paramCount++}`);
      params.push(name);
    }
    if (address !== undefined) {
      updates.push(`address = $${paramCount++}`);
      params.push(address);
    }
    if (phone !== undefined) {
      updates.push(`phone = $${paramCount++}`);
      params.push(phone);
    }
    if (email !== undefined) {
      updates.push(`email = $${paramCount++}`);
      params.push(email);
    }
    if (website !== undefined) {
      updates.push(`website = $${paramCount++}`);
      params.push(website);
    }
    if (principalName !== undefined) {
      updates.push(`principal_name = $${paramCount++}`);
      params.push(principalName);
    }
    if (establishedYear !== undefined) {
      updates.push(`established_year = $${paramCount++}`);
      params.push(establishedYear);
    }
    
    if (updates.length > 0) {
      params.push(id);
      await db.query(`
        UPDATE schools SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
        WHERE id = $${paramCount}
      `, params);
    }
    
    res.json({ message: 'School updated successfully' });
  } catch (error) {
    console.error('Error updating school:', error);
    res.status(500).json({ error: 'Failed to update school' });
  }
});

// Delete school
router.delete('/:id', auth, adminOnly, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if school exists
    const schoolResult = await db.query('SELECT id FROM schools WHERE id = $1', [id]);
    if (schoolResult.rows.length === 0) {
      return res.status(404).json({ error: 'School not found' });
    }
    
    // Check if school has users
    const userCount = await db.query('SELECT COUNT(*) as count FROM users WHERE school_id = $1', [id]);
    if (parseInt(userCount.rows[0].count) > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete school with existing users. Please transfer or remove users first.' 
      });
    }
    
    await db.query('DELETE FROM schools WHERE id = $1', [id]);
    
    res.json({ message: 'School deleted successfully' });
  } catch (error) {
    console.error('Error deleting school:', error);
    res.status(500).json({ error: 'Failed to delete school' });
  }
});

// Get school statistics
router.get('/:id/stats', auth, async (req, res) => {
  try {
    const { id } = req.params;
    
    const stats = await db.query(`
      SELECT 
        (SELECT COUNT(*) FROM users WHERE school_id = $1) as total_users,
        (SELECT COUNT(*) FROM students WHERE school_id = $1) as total_students,
        (SELECT COUNT(*) FROM teachers WHERE school_id = $1) as total_teachers,
        (SELECT COUNT(*) FROM classes WHERE school_id = $1) as total_classes,
        (SELECT COUNT(*) FROM subjects WHERE school_id = $1) as total_subjects
    `, [id]);
    
    res.json(stats.rows[0]);
  } catch (error) {
    console.error('Error fetching school stats:', error);
    res.status(500).json({ error: 'Failed to fetch school statistics' });
  }
});

module.exports = router;
