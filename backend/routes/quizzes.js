const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const { auth, teacherOrAdmin } = require('../middleware/auth');

const router = express.Router();

// Get all quizzes
router.get('/', auth, teacherOrAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', classId, subjectId, teacherId } = req.query;
    const offset = (page - 1) * limit;
    
    let query = `
      SELECT q.*, 
             s.name as subject_name,
             c.name as class_name,
             u.first_name as teacher_first_name,
             u.last_name as teacher_last_name,
             COUNT(qs.id) as submission_count
      FROM quizzes q
      LEFT JOIN subjects s ON q.subject_id = s.id
      LEFT JOIN classes c ON q.class_id = c.id
      LEFT JOIN teachers t ON q.teacher_id = t.id
      LEFT JOIN users u ON t.user_id = u.id
      LEFT JOIN quiz_submissions qs ON q.id = qs.quiz_id
    `;
    
    const params = [];
    const conditions = [];
    let paramCount = 1;
    
    if (search) {
      conditions.push(`(q.title ILIKE $${paramCount} OR q.description ILIKE $${paramCount})`);
      params.push(`%${search}%`);
      paramCount++;
    }
    
    if (classId) {
      conditions.push(`q.class_id = $${paramCount}`);
      params.push(classId);
      paramCount++;
    }
    
    if (subjectId) {
      conditions.push(`q.subject_id = $${paramCount}`);
      params.push(subjectId);
      paramCount++;
    }
    
    if (teacherId) {
      conditions.push(`q.teacher_id = $${paramCount}`);
      params.push(teacherId);
      paramCount++;
    }
    
    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }
    
    query += ` GROUP BY q.id, s.name, c.name, u.first_name, u.last_name 
               ORDER BY q.created_at DESC 
               LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(limit, offset);
    
    const result = await db.query(query, params);
    
    // Get total count
    let countQuery = `SELECT COUNT(*) as total FROM quizzes q`;
    const countParams = [];
    const countConditions = [];
    paramCount = 1;
    
    if (search) {
      countConditions.push(`(q.title ILIKE $${paramCount} OR q.description ILIKE $${paramCount})`);
      countParams.push(`%${search}%`);
      paramCount++;
    }
    
    if (classId) {
      countConditions.push(`q.class_id = $${paramCount}`);
      countParams.push(classId);
      paramCount++;
    }
    
    if (subjectId) {
      countConditions.push(`q.subject_id = $${paramCount}`);
      countParams.push(subjectId);
      paramCount++;
    }
    
    if (teacherId) {
      countConditions.push(`q.teacher_id = $${paramCount}`);
      countParams.push(teacherId);
      paramCount++;
    }
    
    if (countConditions.length > 0) {
      countQuery += ` WHERE ${countConditions.join(' AND ')}`;
    }
    
    const countResult = await db.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].total);
    
    res.json({
      quizzes: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching quizzes:', error);
    res.status(500).json({ error: 'Failed to fetch quizzes' });
  }
});

// Get quiz by ID
router.get('/:id', auth, teacherOrAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    const quizResult = await db.query(`
      SELECT q.*, 
             s.name as subject_name,
             c.name as class_name,
             u.first_name as teacher_first_name,
             u.last_name as teacher_last_name
      FROM quizzes q
      LEFT JOIN subjects s ON q.subject_id = s.id
      LEFT JOIN classes c ON q.class_id = c.id
      LEFT JOIN teachers t ON q.teacher_id = t.id
      LEFT JOIN users u ON t.user_id = u.id
      WHERE q.id = $1
    `, [id]);
    
    if (quizResult.rows.length === 0) {
      return res.status(404).json({ error: 'Quiz not found' });
    }
    
    // Get quiz questions
    const questionsResult = await db.query(`
      SELECT * FROM quiz_questions 
      WHERE quiz_id = $1 
      ORDER BY order_index, id
    `, [id]);
    
    // Get quiz submissions
    const submissionsResult = await db.query(`
      SELECT qs.*, 
             u.first_name as student_first_name,
             u.last_name as student_last_name
      FROM quiz_submissions qs
      JOIN students st ON qs.student_id = st.id
      JOIN users u ON st.user_id = u.id
      WHERE qs.quiz_id = $1
      ORDER BY qs.submitted_at DESC
    `, [id]);
    
    res.json({
      ...quizResult.rows[0],
      questions: questionsResult.rows,
      submissions: submissionsResult.rows
    });
  } catch (error) {
    console.error('Error fetching quiz:', error);
    res.status(500).json({ error: 'Failed to fetch quiz' });
  }
});

// Create new quiz
router.post('/', [
  auth,
  teacherOrAdmin,
  body('title').trim().isLength({ min: 1 }),
  body('description').optional().trim(),
  body('subjectId').isInt(),
  body('classId').isInt(),
  body('timeLimitMinutes').optional().isInt({ min: 1 }),
  body('totalMarks').optional().isDecimal(),
  body('passingMarks').optional().isDecimal(),
  body('startDate').optional().isISO8601(),
  body('endDate').optional().isISO8601()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { title, description, subjectId, classId, timeLimitMinutes, totalMarks, passingMarks, startDate, endDate } = req.body;
    
    // Get teacher ID from user
    const teacherResult = await db.query('SELECT id FROM teachers WHERE user_id = $1', [req.user.userId]);
    if (teacherResult.rows.length === 0) {
      return res.status(403).json({ error: 'Teacher profile not found' });
    }
    
    const teacherId = teacherResult.rows[0].id;
    
    // Get school ID from teacher
    const schoolResult = await db.query('SELECT school_id FROM teachers WHERE id = $1', [teacherId]);
    const schoolId = schoolResult.rows[0].school_id;
    
    const result = await db.query(`
      INSERT INTO quizzes (title, description, subject_id, class_id, teacher_id, school_id, 
                          time_limit_minutes, total_marks, passing_marks, start_date, end_date)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `, [title, description || null, subjectId, classId, teacherId, schoolId, 
        timeLimitMinutes || 60, totalMarks || null, passingMarks || null, 
        startDate || null, endDate || null]);
    
    res.status(201).json({
      message: 'Quiz created successfully',
      quiz: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating quiz:', error);
    res.status(500).json({ error: 'Failed to create quiz' });
  }
});

// Update quiz
router.put('/:id', [
  auth,
  teacherOrAdmin,
  body('title').optional().trim().isLength({ min: 1 }),
  body('description').optional().trim(),
  body('timeLimitMinutes').optional().isInt({ min: 1 }),
  body('totalMarks').optional().isDecimal(),
  body('passingMarks').optional().isDecimal(),
  body('startDate').optional().isISO8601(),
  body('endDate').optional().isISO8601(),
  body('isPublished').optional().isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { id } = req.params;
    const { title, description, timeLimitMinutes, totalMarks, passingMarks, startDate, endDate, isPublished } = req.body;
    
    // Check if quiz exists and user has permission
    const quizResult = await db.query(`
      SELECT q.*, t.user_id 
      FROM quizzes q
      JOIN teachers t ON q.teacher_id = t.id
      WHERE q.id = $1
    `, [id]);
    
    if (quizResult.rows.length === 0) {
      return res.status(404).json({ error: 'Quiz not found' });
    }
    
    // Check if user is the teacher who created the quiz or admin
    if (quizResult.rows[0].user_id !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to update this quiz' });
    }
    
    const updates = [];
    const params = [];
    let paramCount = 1;
    
    if (title) {
      updates.push(`title = $${paramCount++}`);
      params.push(title);
    }
    if (description !== undefined) {
      updates.push(`description = $${paramCount++}`);
      params.push(description);
    }
    if (timeLimitMinutes !== undefined) {
      updates.push(`time_limit_minutes = $${paramCount++}`);
      params.push(timeLimitMinutes);
    }
    if (totalMarks !== undefined) {
      updates.push(`total_marks = $${paramCount++}`);
      params.push(totalMarks);
    }
    if (passingMarks !== undefined) {
      updates.push(`passing_marks = $${paramCount++}`);
      params.push(passingMarks);
    }
    if (startDate !== undefined) {
      updates.push(`start_date = $${paramCount++}`);
      params.push(startDate);
    }
    if (endDate !== undefined) {
      updates.push(`end_date = $${paramCount++}`);
      params.push(endDate);
    }
    if (isPublished !== undefined) {
      updates.push(`is_published = $${paramCount++}`);
      params.push(isPublished);
    }
    
    if (updates.length > 0) {
      params.push(id);
      await db.query(`
        UPDATE quizzes SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
        WHERE id = $${paramCount}
      `, params);
    }
    
    res.json({ message: 'Quiz updated successfully' });
  } catch (error) {
    console.error('Error updating quiz:', error);
    res.status(500).json({ error: 'Failed to update quiz' });
  }
});

// Delete quiz
router.delete('/:id', auth, teacherOrAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if quiz exists and user has permission
    const quizResult = await db.query(`
      SELECT q.*, t.user_id 
      FROM quizzes q
      JOIN teachers t ON q.teacher_id = t.id
      WHERE q.id = $1
    `, [id]);
    
    if (quizResult.rows.length === 0) {
      return res.status(404).json({ error: 'Quiz not found' });
    }
    
    // Check if user is the teacher who created the quiz or admin
    if (quizResult.rows[0].user_id !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to delete this quiz' });
    }
    
    await db.query('DELETE FROM quizzes WHERE id = $1', [id]);
    
    res.json({ message: 'Quiz deleted successfully' });
  } catch (error) {
    console.error('Error deleting quiz:', error);
    res.status(500).json({ error: 'Failed to delete quiz' });
  }
});

// Add question to quiz
router.post('/:id/questions', [
  auth,
  teacherOrAdmin,
  body('questionText').trim().isLength({ min: 1 }),
  body('questionType').isIn(['multiple_choice', 'true_false', 'short_answer', 'essay']),
  body('options').optional().isArray(),
  body('correctAnswer').optional().trim(),
  body('points').optional().isDecimal(),
  body('orderIndex').optional().isInt()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { id } = req.params;
    const { questionText, questionType, options, correctAnswer, points, orderIndex } = req.body;
    
    // Check if quiz exists and user has permission
    const quizResult = await db.query(`
      SELECT q.*, t.user_id 
      FROM quizzes q
      JOIN teachers t ON q.teacher_id = t.id
      WHERE q.id = $1
    `, [id]);
    
    if (quizResult.rows.length === 0) {
      return res.status(404).json({ error: 'Quiz not found' });
    }
    
    if (quizResult.rows[0].user_id !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to add questions to this quiz' });
    }
    
    const result = await db.query(`
      INSERT INTO quiz_questions (quiz_id, question_text, question_type, options, correct_answer, points, order_index)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [id, questionText, questionType, options ? JSON.stringify(options) : null, 
        correctAnswer || null, points || 1.0, orderIndex || 0]);
    
    res.status(201).json({
      message: 'Question added successfully',
      question: result.rows[0]
    });
  } catch (error) {
    console.error('Error adding question:', error);
    res.status(500).json({ error: 'Failed to add question' });
  }
});

// Submit quiz (for students)
router.post('/:id/submit', [
  auth,
  body('answers').isObject(),
  body('timeTakenMinutes').optional().isInt({ min: 0 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { id } = req.params;
    const { answers, timeTakenMinutes } = req.body;
    
    // Check if user is a student
    if (req.user.role !== 'student') {
      return res.status(403).json({ error: 'Only students can submit quizzes' });
    }
    
    // Get student ID
    const studentResult = await db.query('SELECT id FROM students WHERE user_id = $1', [req.user.userId]);
    if (studentResult.rows.length === 0) {
      return res.status(404).json({ error: 'Student profile not found' });
    }
    
    const studentId = studentResult.rows[0].id;
    
    // Check if quiz exists and is published
    const quizResult = await db.query(`
      SELECT * FROM quizzes 
      WHERE id = $1 AND is_published = true 
      AND (start_date IS NULL OR start_date <= NOW())
      AND (end_date IS NULL OR end_date >= NOW())
    `, [id]);
    
    if (quizResult.rows.length === 0) {
      return res.status(404).json({ error: 'Quiz not found or not available' });
    }
    
    // Check if already submitted
    const existingSubmission = await db.query(`
      SELECT id FROM quiz_submissions 
      WHERE quiz_id = $1 AND student_id = $2
    `, [id, studentId]);
    
    if (existingSubmission.rows.length > 0) {
      return res.status(400).json({ error: 'Quiz already submitted' });
    }
    
    // Calculate score (basic implementation)
    const questionsResult = await db.query(`
      SELECT id, correct_answer, points FROM quiz_questions 
      WHERE quiz_id = $1
    `, [id]);
    
    let score = 0;
    let totalPossible = 0;
    
    questionsResult.rows.forEach(question => {
      totalPossible += parseFloat(question.points);
      const studentAnswer = answers[question.id];
      if (studentAnswer && studentAnswer.toString().toLowerCase() === question.correct_answer?.toLowerCase()) {
        score += parseFloat(question.points);
      }
    });
    
    const percentage = totalPossible > 0 ? (score / totalPossible) * 100 : 0;
    
    const result = await db.query(`
      INSERT INTO quiz_submissions (quiz_id, student_id, answers, score, total_possible, percentage, time_taken_minutes, is_graded)
      VALUES ($1, $2, $3, $4, $5, $6, $7, true)
      RETURNING *
    `, [id, studentId, JSON.stringify(answers), score, totalPossible, percentage, timeTakenMinutes || 0]);
    
    res.status(201).json({
      message: 'Quiz submitted successfully',
      submission: result.rows[0]
    });
  } catch (error) {
    console.error('Error submitting quiz:', error);
    res.status(500).json({ error: 'Failed to submit quiz' });
  }
});

module.exports = router;
