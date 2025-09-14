const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const { auth, teacherOrAdmin } = require('../middleware/auth');

// Database connection guard
const checkDatabase = (req, res, next) => {
  if (!db || !db.query) {
    return res.status(503).json({ 
      error: 'Database service unavailable',
      message: 'Please ensure PostgreSQL is running and configured'
    });
  }
  next();
};

const router = express.Router();

// Get all students
router.get('/', auth, teacherOrAdmin, checkDatabase, async (req, res) => {
  try {
    const { page = 1, limit = 10, gradeLevel, search } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT s.id, s.student_id, s.grade_level, s.date_of_birth, s.address, 
             s.emergency_contact, s.emergency_phone, s.created_at,
             u.first_name, u.last_name, u.email, u.phone, u.is_active
      FROM students s
      JOIN users u ON s.user_id = u.id
    `;
    let countQuery = 'SELECT COUNT(*) FROM students s JOIN users u ON s.user_id = u.id';
    const conditions = [];
    const values = [];
    let paramCount = 1;

    if (gradeLevel) {
      conditions.push(`s.grade_level = $${paramCount++}`);
      values.push(gradeLevel);
    }

    if (search) {
      conditions.push(`(u.first_name ILIKE $${paramCount} OR u.last_name ILIKE $${paramCount} OR s.student_id ILIKE $${paramCount})`);
      values.push(`%${search}%`);
      paramCount++;
    }

    if (conditions.length > 0) {
      const whereClause = ' WHERE ' + conditions.join(' AND ');
      query += whereClause;
      countQuery += whereClause;
    }

    query += ` ORDER BY s.created_at DESC LIMIT $${paramCount++} OFFSET $${paramCount}`;
    values.push(limit, offset);

    const [studentsResult, countResult] = await Promise.all([
      db.query(query, values),
      db.query(countQuery, values.slice(0, -2))
    ]);

    const totalStudents = parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(totalStudents / limit);

    res.json({
      students: studentsResult.rows.map(student => ({
        id: student.id,
        studentId: student.student_id,
        firstName: student.first_name,
        lastName: student.last_name,
        email: student.email,
        phone: student.phone,
        gradeLevel: student.grade_level,
        dateOfBirth: student.date_of_birth,
        address: student.address,
        emergencyContact: student.emergency_contact,
        emergencyPhone: student.emergency_phone,
        isActive: student.is_active,
        createdAt: student.created_at
      })),
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalStudents,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('Get students error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get student by ID
router.get('/:id', auth, teacherOrAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query(`
      SELECT s.id, s.student_id, s.grade_level, s.date_of_birth, s.address, 
             s.emergency_contact, s.emergency_phone, s.created_at,
             u.first_name, u.last_name, u.email, u.phone, u.is_active
      FROM students s
      JOIN users u ON s.user_id = u.id
      WHERE s.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }

    const student = result.rows[0];
    res.json({
      id: student.id,
      studentId: student.student_id,
      firstName: student.first_name,
      lastName: student.last_name,
      email: student.email,
      phone: student.phone,
      gradeLevel: student.grade_level,
      dateOfBirth: student.date_of_birth,
      address: student.address,
      emergencyContact: student.emergency_contact,
      emergencyPhone: student.emergency_phone,
      isActive: student.is_active,
      createdAt: student.created_at
    });

  } catch (error) {
    console.error('Get student error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new student
router.post('/', auth, teacherOrAdmin, [
  body('userId').isInt(),
  body('studentId').trim().isLength({ min: 1 }),
  body('gradeLevel').isInt({ min: 1, max: 12 }),
  body('dateOfBirth').isISO8601().toDate(),
  body('address').optional().trim(),
  body('emergencyContact').optional().trim(),
  body('emergencyPhone').optional().isMobilePhone()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { userId, studentId, gradeLevel, dateOfBirth, address, emergencyContact, emergencyPhone } = req.body;

    // Check if student ID already exists
    const existingStudent = await db.query(
      'SELECT id FROM students WHERE student_id = $1',
      [studentId]
    );

    if (existingStudent.rows.length > 0) {
      return res.status(400).json({ error: 'Student ID already exists' });
    }

    // Check if user exists and has student role
    const userResult = await db.query(
      'SELECT id, role FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (userResult.rows[0].role !== 'student') {
      return res.status(400).json({ error: 'User must have student role' });
    }

    // Create student record
    const result = await db.query(`
      INSERT INTO students (user_id, student_id, grade_level, date_of_birth, address, emergency_contact, emergency_phone)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, student_id, grade_level, date_of_birth, created_at
    `, [userId, studentId, gradeLevel, dateOfBirth, address, emergencyContact, emergencyPhone]);

    const student = result.rows[0];

    res.status(201).json({
      message: 'Student created successfully',
      student: {
        id: student.id,
        studentId: student.student_id,
        gradeLevel: student.grade_level,
        dateOfBirth: student.date_of_birth,
        createdAt: student.created_at
      }
    });

  } catch (error) {
    console.error('Create student error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
