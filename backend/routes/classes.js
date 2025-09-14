const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const { auth, teacherOrAdmin } = require('../middleware/auth');

const router = express.Router();

// Get all classes
router.get('/', auth, teacherOrAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 10, semester, academicYear, search } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT c.id, c.name, c.room_number, c.schedule_days, c.start_time, c.end_time, 
             c.max_students, c.semester, c.academic_year, c.created_at,
             s.name as subject_name, s.code as subject_code,
             u.first_name as teacher_first_name, u.last_name as teacher_last_name
      FROM classes c
      LEFT JOIN subjects s ON c.subject_id = s.id
      LEFT JOIN teachers t ON c.teacher_id = t.id
      LEFT JOIN users u ON t.user_id = u.id
    `;
    let countQuery = 'SELECT COUNT(*) FROM classes c';
    const conditions = [];
    const values = [];
    let paramCount = 1;

    if (semester) {
      conditions.push(`c.semester = $${paramCount++}`);
      values.push(semester);
    }

    if (academicYear) {
      conditions.push(`c.academic_year = $${paramCount++}`);
      values.push(academicYear);
    }

    if (search) {
      conditions.push(`(c.name ILIKE $${paramCount} OR s.name ILIKE $${paramCount})`);
      values.push(`%${search}%`);
      paramCount++;
    }

    if (conditions.length > 0) {
      const whereClause = ' WHERE ' + conditions.join(' AND ');
      query += whereClause;
      countQuery += whereClause;
    }

    query += ` ORDER BY c.created_at DESC LIMIT $${paramCount++} OFFSET $${paramCount}`;
    values.push(limit, offset);

    const [classesResult, countResult] = await Promise.all([
      db.query(query, values),
      db.query(countQuery, values.slice(0, -2))
    ]);

    const totalClasses = parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(totalClasses / limit);

    res.json({
      classes: classesResult.rows.map(cls => ({
        id: cls.id,
        name: cls.name,
        roomNumber: cls.room_number,
        scheduleDays: cls.schedule_days,
        startTime: cls.start_time,
        endTime: cls.end_time,
        maxStudents: cls.max_students,
        semester: cls.semester,
        academicYear: cls.academic_year,
        subjectName: cls.subject_name,
        subjectCode: cls.subject_code,
        teacherName: cls.teacher_first_name ? `${cls.teacher_first_name} ${cls.teacher_last_name}` : null,
        createdAt: cls.created_at
      })),
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalClasses,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('Get classes error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get class by ID
router.get('/:id', auth, teacherOrAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query(`
      SELECT c.id, c.name, c.room_number, c.schedule_days, c.start_time, c.end_time, 
             c.max_students, c.semester, c.academic_year, c.created_at,
             s.name as subject_name, s.code as subject_code,
             u.first_name as teacher_first_name, u.last_name as teacher_last_name
      FROM classes c
      LEFT JOIN subjects s ON c.subject_id = s.id
      LEFT JOIN teachers t ON c.teacher_id = t.id
      LEFT JOIN users u ON t.user_id = u.id
      WHERE c.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Class not found' });
    }

    const cls = result.rows[0];
    res.json({
      id: cls.id,
      name: cls.name,
      roomNumber: cls.room_number,
      scheduleDays: cls.schedule_days,
      startTime: cls.start_time,
      endTime: cls.end_time,
      maxStudents: cls.max_students,
      semester: cls.semester,
      academicYear: cls.academic_year,
      subjectName: cls.subject_name,
      subjectCode: cls.subject_code,
      teacherName: cls.teacher_first_name ? `${cls.teacher_first_name} ${cls.teacher_last_name}` : null,
      createdAt: cls.created_at
    });

  } catch (error) {
    console.error('Get class error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new class
router.post('/', auth, teacherOrAdmin, [
  body('name').trim().isLength({ min: 1 }),
  body('subjectId').isInt(),
  body('teacherId').isInt(),
  body('roomNumber').optional().trim(),
  body('scheduleDays').trim().isLength({ min: 1 }),
  body('startTime').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Invalid time format'),
  body('endTime').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Invalid time format'),
  body('maxStudents').isInt({ min: 1 }),
  body('semester').trim().isLength({ min: 1 }),
  body('academicYear').trim().isLength({ min: 1 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, subjectId, teacherId, roomNumber, scheduleDays, startTime, endTime, maxStudents, semester, academicYear } = req.body;

    // Verify subject exists
    const subjectResult = await db.query('SELECT id FROM subjects WHERE id = $1', [subjectId]);
    if (subjectResult.rows.length === 0) {
      return res.status(404).json({ error: 'Subject not found' });
    }

    // Verify teacher exists
    const teacherResult = await db.query('SELECT id FROM teachers WHERE id = $1', [teacherId]);
    if (teacherResult.rows.length === 0) {
      return res.status(404).json({ error: 'Teacher not found' });
    }

    // Create class
    const result = await db.query(`
      INSERT INTO classes (name, subject_id, teacher_id, room_number, schedule_days, start_time, end_time, max_students, semester, academic_year)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING id, name, room_number, schedule_days, start_time, end_time, max_students, semester, academic_year, created_at
    `, [name, subjectId, teacherId, roomNumber, scheduleDays, startTime, endTime, maxStudents, semester, academicYear]);

    const cls = result.rows[0];

    res.status(201).json({
      message: 'Class created successfully',
      class: {
        id: cls.id,
        name: cls.name,
        roomNumber: cls.room_number,
        scheduleDays: cls.schedule_days,
        startTime: cls.start_time,
        endTime: cls.end_time,
        maxStudents: cls.max_students,
        semester: cls.semester,
        academicYear: cls.academic_year,
        createdAt: cls.created_at
      }
    });

  } catch (error) {
    console.error('Create class error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
