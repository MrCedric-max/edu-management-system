const express = require('express');
const router = express.Router();
const db = require('../config/database');
const auth = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

// Get all quizzes
router.get('/', auth, async (req, res) => {
    try {
        const result = await db.query(`
            SELECT q.*, u.first_name, u.last_name 
            FROM quizzes q 
            LEFT JOIN users u ON q.created_by = u.id 
            ORDER BY q.created_at DESC
        `);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching quizzes:', error);
        res.status(500).json({ error: 'Failed to fetch quizzes' });
    }
});

// Get quiz by ID
router.get('/:id', auth, async (req, res) => {
    try {
        const { id } = req.params;
        const result = await db.query(`
            SELECT q.*, u.first_name, u.last_name 
            FROM quizzes q 
            LEFT JOIN users u ON q.created_by = u.id 
            WHERE q.id = $1
        `, [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Quiz not found' });
        }
        
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error fetching quiz:', error);
        res.status(500).json({ error: 'Failed to fetch quiz' });
    }
});

// Create new quiz
router.post('/', auth, [
    body('title').trim().isLength({ min: 1 }).withMessage('Title is required'),
    body('subject').trim().isLength({ min: 1 }).withMessage('Subject is required'),
    body('class_level').isInt({ min: 1, max: 6 }).withMessage('Class level must be between 1 and 6'),
    body('duration').isInt({ min: 5, max: 180 }).withMessage('Duration must be between 5 and 180 minutes'),
    body('questions').isArray({ min: 1 }).withMessage('At least one question is required')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { title, subject, class_level, duration, questions, education_system } = req.body;
        const created_by = req.user.id;

        // Create quiz
        const quizResult = await db.query(`
            INSERT INTO quizzes (title, subject, class_level, duration, created_by, education_system, status)
            VALUES ($1, $2, $3, $4, $5, $6, 'active')
            RETURNING *
        `, [title, subject, class_level, duration, created_by, education_system || 'anglophone']);

        const quiz = quizResult.rows[0];

        // Create quiz questions
        for (let i = 0; i < questions.length; i++) {
            const question = questions[i];
            const questionResult = await db.query(`
                INSERT INTO quiz_questions (quiz_id, question_text, question_type, question_order, options, correct_answer)
                VALUES ($1, $2, $3, $4, $5, $6)
                RETURNING *
            `, [
                quiz.id,
                question.text,
                question.type,
                i + 1,
                JSON.stringify(question.options || []),
                question.correct_answer || null
            ]);
        }

        res.status(201).json({
            message: 'Quiz created successfully',
            quiz: quiz
        });

    } catch (error) {
        console.error('Error creating quiz:', error);
        res.status(500).json({ error: 'Failed to create quiz' });
    }
});

// Update quiz
router.put('/:id', auth, [
    body('title').optional().trim().isLength({ min: 1 }),
    body('subject').optional().trim().isLength({ min: 1 }),
    body('class_level').optional().isInt({ min: 1, max: 6 }),
    body('duration').optional().isInt({ min: 5, max: 180 })
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { id } = req.params;
        const { title, subject, class_level, duration, status } = req.body;

        const result = await db.query(`
            UPDATE quizzes 
            SET title = COALESCE($1, title),
                subject = COALESCE($2, subject),
                class_level = COALESCE($3, class_level),
                duration = COALESCE($4, duration),
                status = COALESCE($5, status),
                updated_at = NOW()
            WHERE id = $6 AND created_by = $7
            RETURNING *
        `, [title, subject, class_level, duration, status, id, req.user.id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Quiz not found or unauthorized' });
        }

        res.json({
            message: 'Quiz updated successfully',
            quiz: result.rows[0]
        });

    } catch (error) {
        console.error('Error updating quiz:', error);
        res.status(500).json({ error: 'Failed to update quiz' });
    }
});

// Delete quiz
router.delete('/:id', auth, async (req, res) => {
    try {
        const { id } = req.params;

        const result = await db.query(`
            DELETE FROM quizzes 
            WHERE id = $1 AND created_by = $2
            RETURNING *
        `, [id, req.user.id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Quiz not found or unauthorized' });
        }

        res.json({ message: 'Quiz deleted successfully' });

    } catch (error) {
        console.error('Error deleting quiz:', error);
        res.status(500).json({ error: 'Failed to delete quiz' });
    }
});

// Submit quiz answers
router.post('/:id/submit', auth, [
    body('answers').isArray().withMessage('Answers must be an array')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { id } = req.params;
        const { answers } = req.body;
        const student_id = req.user.id;

        // Get quiz questions
        const quizResult = await db.query(`
            SELECT q.*, qq.id as question_id, qq.question_text, qq.question_type, qq.options, qq.correct_answer
            FROM quizzes q
            JOIN quiz_questions qq ON q.id = qq.quiz_id
            WHERE q.id = $1
            ORDER BY qq.question_order
        `, [id]);

        if (quizResult.rows.length === 0) {
            return res.status(404).json({ error: 'Quiz not found' });
        }

        const quiz = quizResult.rows[0];
        const questions = quizResult.rows;

        // Calculate score
        let correctAnswers = 0;
        const totalQuestions = questions.length;

        questions.forEach((question, index) => {
            const userAnswer = answers[index];
            const correctAnswer = question.correct_answer;
            
            if (userAnswer === correctAnswer) {
                correctAnswers++;
            }
        });

        const score = Math.round((correctAnswers / totalQuestions) * 100);

        // Save quiz submission
        const submissionResult = await db.query(`
            INSERT INTO quiz_submissions (quiz_id, student_id, answers, score, submitted_at)
            VALUES ($1, $2, $3, $4, NOW())
            RETURNING *
        `, [id, student_id, JSON.stringify(answers), score]);

        res.json({
            message: 'Quiz submitted successfully',
            score: score,
            correctAnswers: correctAnswers,
            totalQuestions: totalQuestions,
            submission: submissionResult.rows[0]
        });

    } catch (error) {
        console.error('Error submitting quiz:', error);
        res.status(500).json({ error: 'Failed to submit quiz' });
    }
});

// Get quiz results for a student
router.get('/:id/results', auth, async (req, res) => {
    try {
        const { id } = req.params;
        const student_id = req.user.id;

        const result = await db.query(`
            SELECT qs.*, q.title, q.subject
            FROM quiz_submissions qs
            JOIN quizzes q ON qs.quiz_id = q.id
            WHERE qs.quiz_id = $1 AND qs.student_id = $2
            ORDER BY qs.submitted_at DESC
        `, [id, student_id]);

        res.json(result.rows);

    } catch (error) {
        console.error('Error fetching quiz results:', error);
        res.status(500).json({ error: 'Failed to fetch quiz results' });
    }
});

module.exports = router;