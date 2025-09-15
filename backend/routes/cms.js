const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const { auth, adminOnly } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/content/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|ppt|pptx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only images, PDFs, and office documents are allowed'));
    }
  }
});

// Content types
const CONTENT_TYPES = {
  QUIZ: 'quiz',
  LESSON_PLAN: 'lesson_plan',
  SCHEME_OF_WORK: 'scheme_of_work',
  PEDAGOGIC_PROJECT: 'pedagogic_project',
  RESOURCE: 'resource'
};

// Create premium content
router.post('/content', auth, adminOnly, upload.single('file'), [
  body('title').trim().isLength({ min: 1 }).withMessage('Title is required'),
  body('description').optional().trim(),
  body('content_type').isIn(Object.values(CONTENT_TYPES)).withMessage('Invalid content type'),
  body('subject').optional().trim(),
  body('class_level').optional().isInt({ min: 1, max: 6 }),
  body('education_system').optional().isIn(['anglophone', 'francophone']),
  body('is_premium').optional().isBoolean(),
  body('price').optional().isFloat({ min: 0 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      title,
      description,
      content_type,
      subject,
      class_level,
      education_system,
      is_premium = false,
      price = 0
    } = req.body;

    const file_path = req.file ? req.file.path : null;

    const result = await db.query(
      `INSERT INTO premium_content 
       (title, description, content_type, subject, class_level, education_system, 
        is_premium, price, file_path, created_by, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
       RETURNING id, title, content_type, is_premium, price`,
      [title, description, content_type, subject, class_level, education_system, 
       is_premium, price, file_path, req.user.userId]
    );

    res.status(201).json({
      message: 'Content created successfully',
      content: result.rows[0]
    });

  } catch (error) {
    console.error('Content creation error:', error);
    res.status(500).json({ error: 'Failed to create content' });
  }
});

// Get all premium content
router.get('/content', auth, adminOnly, async (req, res) => {
  try {
    const { page = 1, limit = 10, content_type, education_system, is_premium } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT pc.*, u.first_name, u.last_name,
             COUNT(s.id) as subscription_count
      FROM premium_content pc
      LEFT JOIN users u ON pc.created_by = u.id
      LEFT JOIN content_subscriptions s ON pc.id = s.content_id
    `;

    const conditions = [];
    const params = [];
    let paramCount = 0;

    if (content_type) {
      conditions.push(`pc.content_type = $${++paramCount}`);
      params.push(content_type);
    }

    if (education_system) {
      conditions.push(`pc.education_system = $${++paramCount}`);
      params.push(education_system);
    }

    if (is_premium !== undefined) {
      conditions.push(`pc.is_premium = $${++paramCount}`);
      params.push(is_premium === 'true');
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += `
      GROUP BY pc.id, u.first_name, u.last_name
      ORDER BY pc.created_at DESC
      LIMIT $${++paramCount} OFFSET $${++paramCount}
    `;

    params.push(limit, offset);

    const result = await db.query(query, params);

    // Get total count
    let countQuery = 'SELECT COUNT(*) FROM premium_content pc';
    if (conditions.length > 0) {
      countQuery += ' WHERE ' + conditions.join(' AND ');
    }

    const countResult = await db.query(countQuery, params.slice(0, -2));
    const total = parseInt(countResult.rows[0].count);

    res.json({
      content: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching content:', error);
    res.status(500).json({ error: 'Failed to fetch content' });
  }
});

// Create subscription package
router.post('/packages', auth, adminOnly, [
  body('name').trim().isLength({ min: 1 }).withMessage('Package name is required'),
  body('description').optional().trim(),
  body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('duration_days').isInt({ min: 1 }).withMessage('Duration must be at least 1 day'),
  body('content_ids').isArray().withMessage('Content IDs must be an array')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, description, price, duration_days, content_ids } = req.body;

    const result = await db.query(
      `INSERT INTO subscription_packages 
       (name, description, price, duration_days, created_by, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       RETURNING id, name, price, duration_days`,
      [name, description, price, duration_days, req.user.userId]
    );

    const packageId = result.rows[0].id;

    // Add content to package
    for (const contentId of content_ids) {
      await db.query(
        'INSERT INTO package_content (package_id, content_id) VALUES ($1, $2)',
        [packageId, contentId]
      );
    }

    res.status(201).json({
      message: 'Package created successfully',
      package: result.rows[0]
    });

  } catch (error) {
    console.error('Package creation error:', error);
    res.status(500).json({ error: 'Failed to create package' });
  }
});

// Get subscription packages
router.get('/packages', auth, adminOnly, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const result = await db.query(
      `SELECT sp.*, u.first_name, u.last_name,
              COUNT(s.id) as active_subscriptions
       FROM subscription_packages sp
       LEFT JOIN users u ON sp.created_by = u.id
       LEFT JOIN subscriptions s ON sp.id = s.package_id AND s.status = 'active'
       GROUP BY sp.id, u.first_name, u.last_name
       ORDER BY sp.created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    res.json({
      packages: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Error fetching packages:', error);
    res.status(500).json({ error: 'Failed to fetch packages' });
  }
});

// Get analytics and reporting data
router.get('/analytics', auth, adminOnly, async (req, res) => {
  try {
    const { period = '30' } = req.query; // days

    // Get overall KPIs
    const [schoolsRes, usersRes, contentRes, subscriptionsRes] = await Promise.all([
      db.query('SELECT COUNT(*) as total FROM schools WHERE is_active = true'),
      db.query('SELECT COUNT(*) as total FROM users WHERE is_active = true'),
      db.query('SELECT COUNT(*) as total FROM premium_content'),
      db.query('SELECT COUNT(*) as total FROM subscriptions WHERE status = $1', ['active'])
    ]);

    // Get revenue metrics
    const revenueRes = await db.query(
      `SELECT 
         SUM(amount) as total_revenue,
         COUNT(*) as total_transactions
       FROM subscriptions 
       WHERE status = 'active' AND created_at >= NOW() - INTERVAL '${period} days'`
    );

    // Get content performance
    const contentPerformanceRes = await db.query(
      `SELECT 
         pc.content_type,
         COUNT(s.id) as subscription_count,
         SUM(pc.price) as revenue
       FROM premium_content pc
       LEFT JOIN content_subscriptions s ON pc.id = s.content_id
       WHERE pc.created_at >= NOW() - INTERVAL '${period} days'
       GROUP BY pc.content_type`
    );

    res.json({
      kpis: {
        total_schools: parseInt(schoolsRes.rows[0].total),
        total_users: parseInt(usersRes.rows[0].total),
        total_content: parseInt(contentRes.rows[0].total),
        active_subscriptions: parseInt(subscriptionsRes.rows[0].total)
      },
      revenue: {
        total_revenue: parseFloat(revenueRes.rows[0].total_revenue || 0),
        total_transactions: parseInt(revenueRes.rows[0].total_transactions || 0)
      },
      content_performance: contentPerformanceRes.rows
    });

  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

module.exports = router;
