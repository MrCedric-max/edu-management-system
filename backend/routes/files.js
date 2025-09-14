const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const { auth, teacherOrAdmin } = require('../middleware/auth');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads');
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow common file types
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|txt|mp4|mp3|zip/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images, documents, and media files are allowed.'));
    }
  }
});

// Get all files
router.get('/', auth, teacherOrAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', relatedType, schoolId } = req.query;
    const offset = (page - 1) * limit;
    
    let query = `
      SELECT f.*, 
             u.first_name as uploader_first_name,
             u.last_name as uploader_last_name,
             s.name as school_name
      FROM files f
      LEFT JOIN users u ON f.uploaded_by = u.id
      LEFT JOIN schools s ON f.school_id = s.id
    `;
    
    const params = [];
    const conditions = [];
    let paramCount = 1;
    
    if (search) {
      conditions.push(`(f.original_name ILIKE $${paramCount} OR f.filename ILIKE $${paramCount})`);
      params.push(`%${search}%`);
      paramCount++;
    }
    
    if (relatedType) {
      conditions.push(`f.related_type = $${paramCount}`);
      params.push(relatedType);
      paramCount++;
    }
    
    if (schoolId) {
      conditions.push(`f.school_id = $${paramCount}`);
      params.push(schoolId);
      paramCount++;
    }
    
    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }
    
    query += ` ORDER BY f.created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(limit, offset);
    
    const result = await db.query(query, params);
    
    // Get total count
    let countQuery = `SELECT COUNT(*) as total FROM files f`;
    const countParams = [];
    const countConditions = [];
    paramCount = 1;
    
    if (search) {
      countConditions.push(`(f.original_name ILIKE $${paramCount} OR f.filename ILIKE $${paramCount})`);
      countParams.push(`%${search}%`);
      paramCount++;
    }
    
    if (relatedType) {
      countConditions.push(`f.related_type = $${paramCount}`);
      countParams.push(relatedType);
      paramCount++;
    }
    
    if (schoolId) {
      countConditions.push(`f.school_id = $${paramCount}`);
      countParams.push(schoolId);
      paramCount++;
    }
    
    if (countConditions.length > 0) {
      countQuery += ` WHERE ${countConditions.join(' AND ')}`;
    }
    
    const countResult = await db.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].total);
    
    res.json({
      files: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching files:', error);
    res.status(500).json({ error: 'Failed to fetch files' });
  }
});

// Get file by ID
router.get('/:id', auth, teacherOrAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await db.query(`
      SELECT f.*, 
             u.first_name as uploader_first_name,
             u.last_name as uploader_last_name,
             s.name as school_name
      FROM files f
      LEFT JOIN users u ON f.uploaded_by = u.id
      LEFT JOIN schools s ON f.school_id = s.id
      WHERE f.id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching file:', error);
    res.status(500).json({ error: 'Failed to fetch file' });
  }
});

// Upload file
router.post('/upload', auth, upload.single('file'), [
  body('relatedType').optional().isIn(['lesson_plan', 'quiz', 'assignment', 'general']),
  body('relatedId').optional().isInt(),
  body('isPublic').optional().isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const { relatedType, relatedId, isPublic } = req.body;
    
    // Get school ID from user
    let schoolId = null;
    if (req.user.role === 'teacher') {
      const teacherResult = await db.query('SELECT school_id FROM teachers WHERE user_id = $1', [req.user.userId]);
      if (teacherResult.rows.length > 0) {
        schoolId = teacherResult.rows[0].school_id;
      }
    } else if (req.user.role === 'student') {
      const studentResult = await db.query('SELECT school_id FROM students WHERE user_id = $1', [req.user.userId]);
      if (studentResult.rows.length > 0) {
        schoolId = studentResult.rows[0].school_id;
      }
    }
    
    const result = await db.query(`
      INSERT INTO files (filename, original_name, file_path, file_size, mime_type, 
                        uploaded_by, related_type, related_id, school_id, is_public)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `, [
      req.file.filename,
      req.file.originalname,
      req.file.path,
      req.file.size,
      req.file.mimetype,
      req.user.userId,
      relatedType || 'general',
      relatedId || null,
      schoolId,
      isPublic === 'true' || false
    ]);
    
    res.status(201).json({
      message: 'File uploaded successfully',
      file: result.rows[0]
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({ error: 'Failed to upload file' });
  }
});

// Download file
router.get('/:id/download', auth, teacherOrAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await db.query('SELECT * FROM files WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    const file = result.rows[0];
    
    // Check if file exists on disk
    try {
      await fs.access(file.file_path);
    } catch (error) {
      return res.status(404).json({ error: 'File not found on disk' });
    }
    
    res.download(file.file_path, file.original_name);
  } catch (error) {
    console.error('Error downloading file:', error);
    res.status(500).json({ error: 'Failed to download file' });
  }
});

// Update file metadata
router.put('/:id', [
  auth,
  teacherOrAdmin,
  body('originalName').optional().trim().isLength({ min: 1 }),
  body('relatedType').optional().isIn(['lesson_plan', 'quiz', 'assignment', 'general']),
  body('relatedId').optional().isInt(),
  body('isPublic').optional().isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { id } = req.params;
    const { originalName, relatedType, relatedId, isPublic } = req.body;
    
    // Check if file exists and user has permission
    const fileResult = await db.query('SELECT * FROM files WHERE id = $1', [id]);
    if (fileResult.rows.length === 0) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    const file = fileResult.rows[0];
    
    // Check if user is the uploader or admin
    if (file.uploaded_by !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to update this file' });
    }
    
    const updates = [];
    const params = [];
    let paramCount = 1;
    
    if (originalName) {
      updates.push(`original_name = $${paramCount++}`);
      params.push(originalName);
    }
    if (relatedType !== undefined) {
      updates.push(`related_type = $${paramCount++}`);
      params.push(relatedType);
    }
    if (relatedId !== undefined) {
      updates.push(`related_id = $${paramCount++}`);
      params.push(relatedId);
    }
    if (isPublic !== undefined) {
      updates.push(`is_public = $${paramCount++}`);
      params.push(isPublic);
    }
    
    if (updates.length > 0) {
      params.push(id);
      await db.query(`
        UPDATE files SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
        WHERE id = $${paramCount}
      `, params);
    }
    
    res.json({ message: 'File updated successfully' });
  } catch (error) {
    console.error('Error updating file:', error);
    res.status(500).json({ error: 'Failed to update file' });
  }
});

// Delete file
router.delete('/:id', auth, teacherOrAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if file exists and user has permission
    const fileResult = await db.query('SELECT * FROM files WHERE id = $1', [id]);
    if (fileResult.rows.length === 0) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    const file = fileResult.rows[0];
    
    // Check if user is the uploader or admin
    if (file.uploaded_by !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to delete this file' });
    }
    
    // Delete file from disk
    try {
      await fs.unlink(file.file_path);
    } catch (error) {
      console.warn('Could not delete file from disk:', error.message);
    }
    
    // Delete file record from database
    await db.query('DELETE FROM files WHERE id = $1', [id]);
    
    res.json({ message: 'File deleted successfully' });
  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).json({ error: 'Failed to delete file' });
  }
});

// Get file statistics
router.get('/stats/overview', auth, teacherOrAdmin, async (req, res) => {
  try {
    const stats = await db.query(`
      SELECT 
        COUNT(*) as total_files,
        SUM(file_size) as total_size,
        COUNT(CASE WHEN mime_type LIKE 'image/%' THEN 1 END) as image_count,
        COUNT(CASE WHEN mime_type LIKE 'application/pdf' THEN 1 END) as pdf_count,
        COUNT(CASE WHEN mime_type LIKE 'application/msword%' THEN 1 END) as doc_count,
        COUNT(CASE WHEN mime_type LIKE 'video/%' THEN 1 END) as video_count,
        COUNT(CASE WHEN mime_type LIKE 'audio/%' THEN 1 END) as audio_count
      FROM files
    `);
    
    res.json(stats.rows[0]);
  } catch (error) {
    console.error('Error fetching file stats:', error);
    res.status(500).json({ error: 'Failed to fetch file statistics' });
  }
});

module.exports = router;
