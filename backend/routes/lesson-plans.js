const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const { auth, teacherOrAdmin } = require('../middleware/auth');

const router = express.Router();

// Get all lesson plans
router.get('/', auth, teacherOrAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', classId, subjectId, teacherId, status } = req.query;
    const offset = (page - 1) * limit;
    
    let query = `
      SELECT lp.*, 
             s.name as subject_name,
             c.name as class_name,
             u.first_name as teacher_first_name,
             u.last_name as teacher_last_name,
             sch.name as school_name
      FROM lesson_plans lp
      LEFT JOIN subjects s ON lp.subject_id = s.id
      LEFT JOIN classes c ON lp.class_id = c.id
      LEFT JOIN teachers t ON lp.teacher_id = t.id
      LEFT JOIN users u ON t.user_id = u.id
      LEFT JOIN schools sch ON lp.school_id = sch.id
    `;
    
    const params = [];
    const conditions = [];
    let paramCount = 1;
    
    if (search) {
      conditions.push(`(lp.title ILIKE $${paramCount} OR lp.description ILIKE $${paramCount})`);
      params.push(`%${search}%`);
      paramCount++;
    }
    
    if (classId) {
      conditions.push(`lp.class_id = $${paramCount}`);
      params.push(classId);
      paramCount++;
    }
    
    if (subjectId) {
      conditions.push(`lp.subject_id = $${paramCount}`);
      params.push(subjectId);
      paramCount++;
    }
    
    if (teacherId) {
      conditions.push(`lp.teacher_id = $${paramCount}`);
      params.push(teacherId);
      paramCount++;
    }
    
    if (status) {
      conditions.push(`lp.status = $${paramCount}`);
      params.push(status);
      paramCount++;
    }
    
    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }
    
    query += ` ORDER BY lp.lesson_date DESC, lp.created_at DESC 
               LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(limit, offset);
    
    const result = await db.query(query, params);
    
    // Get total count
    let countQuery = `SELECT COUNT(*) as total FROM lesson_plans lp`;
    const countParams = [];
    const countConditions = [];
    paramCount = 1;
    
    if (search) {
      countConditions.push(`(lp.title ILIKE $${paramCount} OR lp.description ILIKE $${paramCount})`);
      countParams.push(`%${search}%`);
      paramCount++;
    }
    
    if (classId) {
      countConditions.push(`lp.class_id = $${paramCount}`);
      countParams.push(classId);
      paramCount++;
    }
    
    if (subjectId) {
      countConditions.push(`lp.subject_id = $${paramCount}`);
      countParams.push(subjectId);
      paramCount++;
    }
    
    if (teacherId) {
      countConditions.push(`lp.teacher_id = $${paramCount}`);
      countParams.push(teacherId);
      paramCount++;
    }
    
    if (status) {
      countConditions.push(`lp.status = $${paramCount}`);
      countParams.push(status);
      paramCount++;
    }
    
    if (countConditions.length > 0) {
      countQuery += ` WHERE ${countConditions.join(' AND ')}`;
    }
    
    const countResult = await db.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].total);
    
    res.json({
      lessonPlans: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching lesson plans:', error);
    res.status(500).json({ error: 'Failed to fetch lesson plans' });
  }
});

// Get lesson plan by ID
router.get('/:id', auth, teacherOrAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await db.query(`
      SELECT lp.*, 
             s.name as subject_name,
             c.name as class_name,
             u.first_name as teacher_first_name,
             u.last_name as teacher_last_name,
             sch.name as school_name
      FROM lesson_plans lp
      LEFT JOIN subjects s ON lp.subject_id = s.id
      LEFT JOIN classes c ON lp.class_id = c.id
      LEFT JOIN teachers t ON lp.teacher_id = t.id
      LEFT JOIN users u ON t.user_id = u.id
      LEFT JOIN schools sch ON lp.school_id = sch.id
      WHERE lp.id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Lesson plan not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching lesson plan:', error);
    res.status(500).json({ error: 'Failed to fetch lesson plan' });
  }
});

// Create new lesson plan
router.post('/', [
  auth,
  teacherOrAdmin,
  body('title').trim().isLength({ min: 1 }),
  body('description').optional().trim(),
  body('subjectId').isInt(),
  body('classId').isInt(),
  body('objectives').optional().trim(),
  body('materials').optional().trim(),
  body('activities').optional().trim(),
  body('assessment').optional().trim(),
  body('homework').optional().trim(),
  body('durationMinutes').optional().isInt({ min: 1 }),
  body('lessonDate').optional().isISO8601(),
  body('status').optional().isIn(['draft', 'published', 'archived'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { 
      title, description, subjectId, classId, objectives, materials, 
      activities, assessment, homework, durationMinutes, lessonDate, status 
    } = req.body;
    
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
      INSERT INTO lesson_plans (title, description, subject_id, class_id, teacher_id, school_id,
                               objectives, materials, activities, assessment, homework, 
                               duration_minutes, lesson_date, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *
    `, [
      title, description || null, subjectId, classId, teacherId, schoolId,
      objectives || null, materials || null, activities || null, assessment || null, 
      homework || null, durationMinutes || 45, lessonDate || null, status || 'draft'
    ]);
    
    res.status(201).json({
      message: 'Lesson plan created successfully',
      lessonPlan: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating lesson plan:', error);
    res.status(500).json({ error: 'Failed to create lesson plan' });
  }
});

// Update lesson plan
router.put('/:id', [
  auth,
  teacherOrAdmin,
  body('title').optional().trim().isLength({ min: 1 }),
  body('description').optional().trim(),
  body('objectives').optional().trim(),
  body('materials').optional().trim(),
  body('activities').optional().trim(),
  body('assessment').optional().trim(),
  body('homework').optional().trim(),
  body('durationMinutes').optional().isInt({ min: 1 }),
  body('lessonDate').optional().isISO8601(),
  body('status').optional().isIn(['draft', 'published', 'archived'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { id } = req.params;
    const { 
      title, description, objectives, materials, activities, assessment, 
      homework, durationMinutes, lessonDate, status 
    } = req.body;
    
    // Check if lesson plan exists and user has permission
    const lessonPlanResult = await db.query(`
      SELECT lp.*, t.user_id 
      FROM lesson_plans lp
      JOIN teachers t ON lp.teacher_id = t.id
      WHERE lp.id = $1
    `, [id]);
    
    if (lessonPlanResult.rows.length === 0) {
      return res.status(404).json({ error: 'Lesson plan not found' });
    }
    
    // Check if user is the teacher who created the lesson plan or admin
    if (lessonPlanResult.rows[0].user_id !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to update this lesson plan' });
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
    if (objectives !== undefined) {
      updates.push(`objectives = $${paramCount++}`);
      params.push(objectives);
    }
    if (materials !== undefined) {
      updates.push(`materials = $${paramCount++}`);
      params.push(materials);
    }
    if (activities !== undefined) {
      updates.push(`activities = $${paramCount++}`);
      params.push(activities);
    }
    if (assessment !== undefined) {
      updates.push(`assessment = $${paramCount++}`);
      params.push(assessment);
    }
    if (homework !== undefined) {
      updates.push(`homework = $${paramCount++}`);
      params.push(homework);
    }
    if (durationMinutes !== undefined) {
      updates.push(`duration_minutes = $${paramCount++}`);
      params.push(durationMinutes);
    }
    if (lessonDate !== undefined) {
      updates.push(`lesson_date = $${paramCount++}`);
      params.push(lessonDate);
    }
    if (status !== undefined) {
      updates.push(`status = $${paramCount++}`);
      params.push(status);
    }
    
    if (updates.length > 0) {
      params.push(id);
      await db.query(`
        UPDATE lesson_plans SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
        WHERE id = $${paramCount}
      `, params);
    }
    
    res.json({ message: 'Lesson plan updated successfully' });
  } catch (error) {
    console.error('Error updating lesson plan:', error);
    res.status(500).json({ error: 'Failed to update lesson plan' });
  }
});

// Delete lesson plan
router.delete('/:id', auth, teacherOrAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if lesson plan exists and user has permission
    const lessonPlanResult = await db.query(`
      SELECT lp.*, t.user_id 
      FROM lesson_plans lp
      JOIN teachers t ON lp.teacher_id = t.id
      WHERE lp.id = $1
    `, [id]);
    
    if (lessonPlanResult.rows.length === 0) {
      return res.status(404).json({ error: 'Lesson plan not found' });
    }
    
    // Check if user is the teacher who created the lesson plan or admin
    if (lessonPlanResult.rows[0].user_id !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to delete this lesson plan' });
    }
    
    await db.query('DELETE FROM lesson_plans WHERE id = $1', [id]);
    
    res.json({ message: 'Lesson plan deleted successfully' });
  } catch (error) {
    console.error('Error deleting lesson plan:', error);
    res.status(500).json({ error: 'Failed to delete lesson plan' });
  }
});

// Get lesson plans by teacher
router.get('/teacher/:teacherId', auth, teacherOrAdmin, async (req, res) => {
  try {
    const { teacherId } = req.params;
    const { page = 1, limit = 10, status } = req.query;
    const offset = (page - 1) * limit;
    
    let query = `
      SELECT lp.*, 
             s.name as subject_name,
             c.name as class_name
      FROM lesson_plans lp
      LEFT JOIN subjects s ON lp.subject_id = s.id
      LEFT JOIN classes c ON lp.class_id = c.id
      WHERE lp.teacher_id = $1
    `;
    
    const params = [teacherId];
    let paramCount = 2;
    
    if (status) {
      query += ` AND lp.status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }
    
    query += ` ORDER BY lp.lesson_date DESC, lp.created_at DESC 
               LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(limit, offset);
    
    const result = await db.query(query, params);
    
    // Get total count
    let countQuery = `SELECT COUNT(*) as total FROM lesson_plans WHERE teacher_id = $1`;
    const countParams = [teacherId];
    
    if (status) {
      countQuery += ` AND status = $2`;
      countParams.push(status);
    }
    
    const countResult = await db.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].total);
    
    res.json({
      lessonPlans: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching teacher lesson plans:', error);
    res.status(500).json({ error: 'Failed to fetch teacher lesson plans' });
  }
});

// Get lesson plans by class
router.get('/class/:classId', auth, teacherOrAdmin, async (req, res) => {
  try {
    const { classId } = req.params;
    const { page = 1, limit = 10, status } = req.query;
    const offset = (page - 1) * limit;
    
    let query = `
      SELECT lp.*, 
             s.name as subject_name,
             u.first_name as teacher_first_name,
             u.last_name as teacher_last_name
      FROM lesson_plans lp
      LEFT JOIN subjects s ON lp.subject_id = s.id
      LEFT JOIN teachers t ON lp.teacher_id = t.id
      LEFT JOIN users u ON t.user_id = u.id
      WHERE lp.class_id = $1
    `;
    
    const params = [classId];
    let paramCount = 2;
    
    if (status) {
      query += ` AND lp.status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }
    
    query += ` ORDER BY lp.lesson_date DESC, lp.created_at DESC 
               LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(limit, offset);
    
    const result = await db.query(query, params);
    
    // Get total count
    let countQuery = `SELECT COUNT(*) as total FROM lesson_plans WHERE class_id = $1`;
    const countParams = [classId];
    
    if (status) {
      countQuery += ` AND status = $2`;
      countParams.push(status);
    }
    
    const countResult = await db.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].total);
    
    res.json({
      lessonPlans: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching class lesson plans:', error);
    res.status(500).json({ error: 'Failed to fetch class lesson plans' });
  }
});

// Get lesson plan statistics
router.get('/stats/overview', auth, teacherOrAdmin, async (req, res) => {
  try {
    const stats = await db.query(`
      SELECT 
        COUNT(*) as total_lesson_plans,
        COUNT(CASE WHEN status = 'draft' THEN 1 END) as draft_count,
        COUNT(CASE WHEN status = 'published' THEN 1 END) as published_count,
        COUNT(CASE WHEN status = 'archived' THEN 1 END) as archived_count,
        COUNT(CASE WHEN lesson_date >= CURRENT_DATE THEN 1 END) as upcoming_count,
        COUNT(CASE WHEN lesson_date < CURRENT_DATE THEN 1 END) as past_count
      FROM lesson_plans
    `);
    
    res.json(stats.rows[0]);
  } catch (error) {
    console.error('Error fetching lesson plan stats:', error);
    res.status(500).json({ error: 'Failed to fetch lesson plan statistics' });
  }
});

module.exports = router;
