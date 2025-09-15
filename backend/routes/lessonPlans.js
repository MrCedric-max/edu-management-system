const express = require('express');
const router = express.Router();
const db = require('../config/database');
const auth = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

// Get all lesson plans
router.get('/', auth, async (req, res) => {
    try {
        const result = await db.query(`
            SELECT lp.*, u.first_name, u.last_name 
            FROM lesson_plans lp 
            LEFT JOIN users u ON lp.created_by = u.id 
            ORDER BY lp.created_at DESC
        `);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching lesson plans:', error);
        res.status(500).json({ error: 'Failed to fetch lesson plans' });
    }
});

// Get lesson plan by ID
router.get('/:id', auth, async (req, res) => {
    try {
        const { id } = req.params;
        const result = await db.query(`
            SELECT lp.*, u.first_name, u.last_name 
            FROM lesson_plans lp 
            LEFT JOIN users u ON lp.created_by = u.id 
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
router.post('/', auth, [
    body('title').trim().isLength({ min: 1 }).withMessage('Title is required'),
    body('subject').trim().isLength({ min: 1 }).withMessage('Subject is required'),
    body('class_level').isInt({ min: 1, max: 6 }).withMessage('Class level must be between 1 and 6'),
    body('duration').isInt({ min: 30, max: 180 }).withMessage('Duration must be between 30 and 180 minutes'),
    body('objectives').isArray({ min: 1 }).withMessage('At least one objective is required'),
    body('materials').optional().isArray(),
    body('activities').isArray({ min: 1 }).withMessage('At least one activity is required'),
    body('assessment').optional().isString()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { 
            title, 
            subject, 
            class_level, 
            duration, 
            objectives, 
            materials, 
            activities, 
            assessment,
            education_system 
        } = req.body;
        const created_by = req.user.id;

        const result = await db.query(`
            INSERT INTO lesson_plans (
                title, subject, class_level, duration, objectives, 
                materials, activities, assessment, created_by, education_system
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            RETURNING *
        `, [
            title, 
            subject, 
            class_level, 
            duration, 
            JSON.stringify(objectives), 
            JSON.stringify(materials || []), 
            JSON.stringify(activities), 
            assessment || null,
            created_by,
            education_system || 'anglophone'
        ]);

        res.status(201).json({
            message: 'Lesson plan created successfully',
            lesson_plan: result.rows[0]
        });

    } catch (error) {
        console.error('Error creating lesson plan:', error);
        res.status(500).json({ error: 'Failed to create lesson plan' });
    }
});

// Update lesson plan
router.put('/:id', auth, [
    body('title').optional().trim().isLength({ min: 1 }),
    body('subject').optional().trim().isLength({ min: 1 }),
    body('class_level').optional().isInt({ min: 1, max: 6 }),
    body('duration').optional().isInt({ min: 30, max: 180 })
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { id } = req.params;
        const { 
            title, 
            subject, 
            class_level, 
            duration, 
            objectives, 
            materials, 
            activities, 
            assessment 
        } = req.body;

        const result = await db.query(`
            UPDATE lesson_plans 
            SET title = COALESCE($1, title),
                subject = COALESCE($2, subject),
                class_level = COALESCE($3, class_level),
                duration = COALESCE($4, duration),
                objectives = COALESCE($5, objectives),
                materials = COALESCE($6, materials),
                activities = COALESCE($7, activities),
                assessment = COALESCE($8, assessment),
                updated_at = NOW()
            WHERE id = $9 AND created_by = $10
            RETURNING *
        `, [
            title, 
            subject, 
            class_level, 
            duration, 
            objectives ? JSON.stringify(objectives) : null,
            materials ? JSON.stringify(materials) : null,
            activities ? JSON.stringify(activities) : null,
            assessment,
            id, 
            req.user.id
        ]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Lesson plan not found or unauthorized' });
        }

        res.json({
            message: 'Lesson plan updated successfully',
            lesson_plan: result.rows[0]
        });

    } catch (error) {
        console.error('Error updating lesson plan:', error);
        res.status(500).json({ error: 'Failed to update lesson plan' });
    }
});

// Delete lesson plan
router.delete('/:id', auth, async (req, res) => {
    try {
        const { id } = req.params;

        const result = await db.query(`
            DELETE FROM lesson_plans 
            WHERE id = $1 AND created_by = $2
            RETURNING *
        `, [id, req.user.id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Lesson plan not found or unauthorized' });
        }

        res.json({ message: 'Lesson plan deleted successfully' });

    } catch (error) {
        console.error('Error deleting lesson plan:', error);
        res.status(500).json({ error: 'Failed to delete lesson plan' });
    }
});

// Get lesson plans by teacher
router.get('/teacher/:teacher_id', auth, async (req, res) => {
    try {
        const { teacher_id } = req.params;
        const result = await db.query(`
            SELECT lp.*, u.first_name, u.last_name 
            FROM lesson_plans lp 
            LEFT JOIN users u ON lp.created_by = u.id 
            WHERE lp.created_by = $1
            ORDER BY lp.created_at DESC
        `, [teacher_id]);
        
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching teacher lesson plans:', error);
        res.status(500).json({ error: 'Failed to fetch teacher lesson plans' });
    }
});

// Get lesson plans by class level
router.get('/class/:class_level', auth, async (req, res) => {
    try {
        const { class_level } = req.params;
        const result = await db.query(`
            SELECT lp.*, u.first_name, u.last_name 
            FROM lesson_plans lp 
            LEFT JOIN users u ON lp.created_by = u.id 
            WHERE lp.class_level = $1
            ORDER BY lp.created_at DESC
        `, [class_level]);
        
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching lesson plans by class:', error);
        res.status(500).json({ error: 'Failed to fetch lesson plans by class' });
    }
});

module.exports = router;
