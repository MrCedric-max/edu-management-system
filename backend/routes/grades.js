const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const { auth, teacherOrAdmin } = require('../middleware/auth');

const router = express.Router();

// Get all grades (with pagination)
router.get('/', auth, teacherOrAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 10, studentId, classId } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT g.id, g.assignment_name, g.points_earned, g.points_possible, 
             g.grade_percentage, g.letter_grade, g.graded_at, g.comments,
             c.name as class_name, s.name as subject_name,
             st.first_name as student_first_name, st.last_name as student_last_name,
             u.first_name as teacher_first_name, u.last_name as teacher_last_name
      FROM grades g
      JOIN classes c ON g.class_id = c.id
      JOIN subjects s ON c.subject_id = s.id
      JOIN students st ON g.student_id = st.id
      JOIN users stu ON st.user_id = stu.id
      LEFT JOIN teachers t ON g.graded_by = t.id
      LEFT JOIN users u ON t.user_id = u.id
    `;
    let countQuery = 'SELECT COUNT(*) FROM grades g';
    const conditions = [];
    const values = [];
    let paramCount = 1;

    if (studentId) {
      conditions.push(`g.student_id = $${paramCount++}`);
      values.push(studentId);
    }

    if (classId) {
      conditions.push(`g.class_id = $${paramCount++}`);
      values.push(classId);
    }

    if (conditions.length > 0) {
      const whereClause = ' WHERE ' + conditions.join(' AND ');
      query += whereClause;
      countQuery += whereClause;
    }

    query += ` ORDER BY g.graded_at DESC LIMIT $${paramCount++} OFFSET $${paramCount}`;
    values.push(limit, offset);

    const [gradesResult, countResult] = await Promise.all([
      db.query(query, values),
      db.query(countQuery, values.slice(0, -2))
    ]);

    const totalGrades = parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(totalGrades / limit);

    res.json({
      grades: gradesResult.rows.map(grade => ({
        id: grade.id,
        assignmentName: grade.assignment_name,
        pointsEarned: grade.points_earned,
        pointsPossible: grade.points_possible,
        gradePercentage: grade.grade_percentage,
        letterGrade: grade.letter_grade,
        gradedAt: grade.graded_at,
        comments: grade.comments,
        className: grade.class_name,
        subjectName: grade.subject_name,
        studentName: `${grade.student_first_name} ${grade.student_last_name}`,
        teacherName: grade.teacher_first_name ? `${grade.teacher_first_name} ${grade.teacher_last_name}` : null
      })),
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalGrades,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('Get grades error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get grades for a student
router.get('/student/:studentId', auth, teacherOrAdmin, async (req, res) => {
  try {
    const { studentId } = req.params;
    const { classId, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT g.id, g.assignment_name, g.points_earned, g.points_possible, 
             g.grade_percentage, g.letter_grade, g.graded_at, g.comments,
             c.name as class_name, s.name as subject_name,
             u.first_name as teacher_first_name, u.last_name as teacher_last_name
      FROM grades g
      JOIN classes c ON g.class_id = c.id
      JOIN subjects s ON c.subject_id = s.id
      LEFT JOIN teachers t ON g.graded_by = t.id
      LEFT JOIN users u ON t.user_id = u.id
      WHERE g.student_id = $1
    `;
    let countQuery = 'SELECT COUNT(*) FROM grades g WHERE g.student_id = $1';
    const values = [studentId];
    let paramCount = 2;

    if (classId) {
      query += ` AND g.class_id = $${paramCount}`;
      countQuery += ` AND g.class_id = $${paramCount}`;
      values.push(classId);
      paramCount++;
    }

    query += ` ORDER BY g.graded_at DESC LIMIT $${paramCount++} OFFSET $${paramCount}`;
    values.push(limit, offset);

    const [gradesResult, countResult] = await Promise.all([
      db.query(query, values),
      db.query(countQuery, values.slice(0, -2))
    ]);

    const totalGrades = parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(totalGrades / limit);

    res.json({
      grades: gradesResult.rows.map(grade => ({
        id: grade.id,
        assignmentName: grade.assignment_name,
        pointsEarned: grade.points_earned,
        pointsPossible: grade.points_possible,
        gradePercentage: grade.grade_percentage,
        letterGrade: grade.letter_grade,
        gradedAt: grade.graded_at,
        comments: grade.comments,
        className: grade.class_name,
        subjectName: grade.subject_name,
        teacherName: grade.teacher_first_name ? `${grade.teacher_first_name} ${grade.teacher_last_name}` : null
      })),
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalGrades,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('Get student grades error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get grades for a class
router.get('/class/:classId', auth, teacherOrAdmin, async (req, res) => {
  try {
    const { classId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const query = `
      SELECT g.id, g.assignment_name, g.points_earned, g.points_possible, 
             g.grade_percentage, g.letter_grade, g.graded_at, g.comments,
             st.first_name as student_first_name, st.last_name as student_last_name,
             u.first_name as teacher_first_name, u.last_name as teacher_last_name
      FROM grades g
      JOIN students s ON g.student_id = s.id
      JOIN users st ON s.user_id = st.id
      LEFT JOIN teachers t ON g.graded_by = t.id
      LEFT JOIN users u ON t.user_id = u.id
      WHERE g.class_id = $1
      ORDER BY g.graded_at DESC
      LIMIT $2 OFFSET $3
    `;

    const countQuery = 'SELECT COUNT(*) FROM grades g WHERE g.class_id = $1';

    const [gradesResult, countResult] = await Promise.all([
      db.query(query, [classId, limit, offset]),
      db.query(countQuery, [classId])
    ]);

    const totalGrades = parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(totalGrades / limit);

    res.json({
      grades: gradesResult.rows.map(grade => ({
        id: grade.id,
        assignmentName: grade.assignment_name,
        pointsEarned: grade.points_earned,
        pointsPossible: grade.points_possible,
        gradePercentage: grade.grade_percentage,
        letterGrade: grade.letter_grade,
        gradedAt: grade.graded_at,
        comments: grade.comments,
        studentName: `${grade.student_first_name} ${grade.student_last_name}`,
        teacherName: grade.teacher_first_name ? `${grade.teacher_first_name} ${grade.teacher_last_name}` : null
      })),
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalGrades,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('Get class grades error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add new grade
router.post('/', auth, teacherOrAdmin, [
  body('studentId').isInt(),
  body('classId').isInt(),
  body('assignmentName').trim().isLength({ min: 1 }),
  body('pointsEarned').isDecimal(),
  body('pointsPossible').isDecimal(),
  body('comments').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { studentId, classId, assignmentName, pointsEarned, pointsPossible, comments } = req.body;

    // Calculate grade percentage and letter grade
    const gradePercentage = (pointsEarned / pointsPossible) * 100;
    let letterGrade = 'F';
    
    if (gradePercentage >= 90) letterGrade = 'A';
    else if (gradePercentage >= 80) letterGrade = 'B';
    else if (gradePercentage >= 70) letterGrade = 'C';
    else if (gradePercentage >= 60) letterGrade = 'D';

    // Verify student and class exist
    const studentResult = await db.query('SELECT id FROM students WHERE id = $1', [studentId]);
    if (studentResult.rows.length === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }

    const classResult = await db.query('SELECT id FROM classes WHERE id = $1', [classId]);
    if (classResult.rows.length === 0) {
      return res.status(404).json({ error: 'Class not found' });
    }

    // Create grade
    const result = await db.query(`
      INSERT INTO grades (student_id, class_id, assignment_name, points_earned, points_possible, 
                         grade_percentage, letter_grade, graded_by, comments)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id, assignment_name, points_earned, points_possible, grade_percentage, 
                letter_grade, graded_at, comments
    `, [studentId, classId, assignmentName, pointsEarned, pointsPossible, 
        gradePercentage, letterGrade, req.user.userId, comments]);

    const grade = result.rows[0];

    res.status(201).json({
      message: 'Grade added successfully',
      grade: {
        id: grade.id,
        assignmentName: grade.assignment_name,
        pointsEarned: grade.points_earned,
        pointsPossible: grade.points_possible,
        gradePercentage: grade.grade_percentage,
        letterGrade: grade.letter_grade,
        gradedAt: grade.graded_at,
        comments: grade.comments
      }
    });

  } catch (error) {
    console.error('Add grade error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update grade
router.put('/:id', auth, teacherOrAdmin, [
  body('pointsEarned').optional().isDecimal(),
  body('pointsPossible').optional().isDecimal(),
  body('comments').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { pointsEarned, pointsPossible, comments } = req.body;

    // Get existing grade
    const existingGrade = await db.query(
      'SELECT points_earned, points_possible FROM grades WHERE id = $1',
      [id]
    );

    if (existingGrade.rows.length === 0) {
      return res.status(404).json({ error: 'Grade not found' });
    }

    const currentPointsEarned = pointsEarned !== undefined ? pointsEarned : existingGrade.rows[0].points_earned;
    const currentPointsPossible = pointsPossible !== undefined ? pointsPossible : existingGrade.rows[0].points_possible;

    // Recalculate grade percentage and letter grade
    const gradePercentage = (currentPointsEarned / currentPointsPossible) * 100;
    let letterGrade = 'F';
    
    if (gradePercentage >= 90) letterGrade = 'A';
    else if (gradePercentage >= 80) letterGrade = 'B';
    else if (gradePercentage >= 70) letterGrade = 'C';
    else if (gradePercentage >= 60) letterGrade = 'D';

    const updates = [];
    const values = [];
    let paramCount = 1;

    if (pointsEarned !== undefined) {
      updates.push(`points_earned = $${paramCount++}`);
      values.push(pointsEarned);
    }
    if (pointsPossible !== undefined) {
      updates.push(`points_possible = $${paramCount++}`);
      values.push(pointsPossible);
    }
    if (comments !== undefined) {
      updates.push(`comments = $${paramCount++}`);
      values.push(comments);
    }

    updates.push(`grade_percentage = $${paramCount++}`);
    values.push(gradePercentage);
    updates.push(`letter_grade = $${paramCount++}`);
    values.push(letterGrade);

    values.push(id);
    const query = `UPDATE grades SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`;

    const result = await db.query(query, values);
    const grade = result.rows[0];

    res.json({
      message: 'Grade updated successfully',
      grade: {
        id: grade.id,
        assignmentName: grade.assignment_name,
        pointsEarned: grade.points_earned,
        pointsPossible: grade.points_possible,
        gradePercentage: grade.grade_percentage,
        letterGrade: grade.letter_grade,
        comments: grade.comments
      }
    });

  } catch (error) {
    console.error('Update grade error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
