const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const { auth, teacherOrAdmin } = require('../middleware/auth');

const router = express.Router();

// Get all teachers
router.get('/', auth, teacherOrAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 10, department, search } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT t.id, t.employee_id, t.department, t.hire_date, t.salary, t.created_at,
             u.first_name, u.last_name, u.email, u.phone, u.is_active
      FROM teachers t
      JOIN users u ON t.user_id = u.id
    `;
    let countQuery = 'SELECT COUNT(*) FROM teachers t JOIN users u ON t.user_id = u.id';
    const conditions = [];
    const values = [];
    let paramCount = 1;

    if (department) {
      conditions.push(`t.department = $${paramCount++}`);
      values.push(department);
    }

    if (search) {
      conditions.push(`(u.first_name ILIKE $${paramCount} OR u.last_name ILIKE $${paramCount} OR t.employee_id ILIKE $${paramCount})`);
      values.push(`%${search}%`);
      paramCount++;
    }

    if (conditions.length > 0) {
      const whereClause = ' WHERE ' + conditions.join(' AND ');
      query += whereClause;
      countQuery += whereClause;
    }

    query += ` ORDER BY t.created_at DESC LIMIT $${paramCount++} OFFSET $${paramCount}`;
    values.push(limit, offset);

    const [teachersResult, countResult] = await Promise.all([
      db.query(query, values),
      db.query(countQuery, values.slice(0, -2))
    ]);

    const totalTeachers = parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(totalTeachers / limit);

    res.json({
      teachers: teachersResult.rows.map(teacher => ({
        id: teacher.id,
        employeeId: teacher.employee_id,
        firstName: teacher.first_name,
        lastName: teacher.last_name,
        email: teacher.email,
        phone: teacher.phone,
        department: teacher.department,
        hireDate: teacher.hire_date,
        salary: teacher.salary,
        isActive: teacher.is_active,
        createdAt: teacher.created_at
      })),
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalTeachers,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('Get teachers error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get teacher by ID
router.get('/:id', auth, teacherOrAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query(`
      SELECT t.id, t.employee_id, t.department, t.hire_date, t.salary, t.created_at,
             u.first_name, u.last_name, u.email, u.phone, u.is_active
      FROM teachers t
      JOIN users u ON t.user_id = u.id
      WHERE t.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Teacher not found' });
    }

    const teacher = result.rows[0];
    res.json({
      id: teacher.id,
      employeeId: teacher.employee_id,
      firstName: teacher.first_name,
      lastName: teacher.last_name,
      email: teacher.email,
      phone: teacher.phone,
      department: teacher.department,
      hireDate: teacher.hire_date,
      salary: teacher.salary,
      isActive: teacher.is_active,
      createdAt: teacher.created_at
    });

  } catch (error) {
    console.error('Get teacher error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new teacher
router.post('/', auth, teacherOrAdmin, [
  body('userId').isInt(),
  body('employeeId').trim().isLength({ min: 1 }),
  body('department').trim().isLength({ min: 1 }),
  body('hireDate').isISO8601().toDate(),
  body('salary').optional().isDecimal()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { userId, employeeId, department, hireDate, salary } = req.body;

    // Check if employee ID already exists
    const existingTeacher = await db.query(
      'SELECT id FROM teachers WHERE employee_id = $1',
      [employeeId]
    );

    if (existingTeacher.rows.length > 0) {
      return res.status(400).json({ error: 'Employee ID already exists' });
    }

    // Check if user exists and has teacher role
    const userResult = await db.query(
      'SELECT id, role FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (userResult.rows[0].role !== 'teacher') {
      return res.status(400).json({ error: 'User must have teacher role' });
    }

    // Create teacher record
    const result = await db.query(`
      INSERT INTO teachers (user_id, employee_id, department, hire_date, salary)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, employee_id, department, hire_date, salary, created_at
    `, [userId, employeeId, department, hireDate, salary]);

    const teacher = result.rows[0];

    res.status(201).json({
      message: 'Teacher created successfully',
      teacher: {
        id: teacher.id,
        employeeId: teacher.employee_id,
        department: teacher.department,
        hireDate: teacher.hire_date,
        salary: teacher.salary,
        createdAt: teacher.created_at
      }
    });

  } catch (error) {
    console.error('Create teacher error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
