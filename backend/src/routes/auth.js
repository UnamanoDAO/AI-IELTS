import express from 'express';
import bcrypt from 'bcryptjs';
import pool from '../config/database.js';
import { generateToken } from '../middleware/auth.js';

const router = express.Router();

// User registration
router.post('/register', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  if (username.length < 3 || username.length > 50) {
    return res.status(400).json({ error: 'Username must be between 3 and 50 characters' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  try {
    // Check if username already exists
    const [existingUsers] = await pool.query(
      'SELECT id FROM users WHERE username = ?',
      [username]
    );

    if (existingUsers.length > 0) {
      return res.status(409).json({ error: 'Username already exists' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Insert new user
    const [result] = await pool.query(
      'INSERT INTO users (username, password_hash) VALUES (?, ?)',
      [username, passwordHash]
    );

    // Generate token
    const token = generateToken(result.insertId, username);

    res.status(201).json({
      message: 'User registered successfully',
      userId: result.insertId,
      username,
      token
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Failed to register user' });
  }
});

// User login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  try {
    // Find user
    const [users] = await pool.query(
      'SELECT id, username, password_hash FROM users WHERE username = ?',
      [username]
    );

    if (users.length === 0) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const user = users[0];

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    // Update last login
    await pool.query(
      'UPDATE users SET last_login = NOW() WHERE id = ?',
      [user.id]
    );

    // Generate token
    const token = generateToken(user.id, user.username);

    res.json({
      message: 'Login successful',
      userId: user.id,
      username: user.username,
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Failed to login' });
  }
});

// Get current user info (requires authentication)
router.get('/me', async (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const jwt = await import('jsonwebtoken');
    const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

    const decoded = jwt.default.verify(token, JWT_SECRET);

    const [users] = await pool.query(
      'SELECT id, username, created_at, last_login FROM users WHERE id = ?',
      [decoded.userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(users[0]);
  } catch (error) {
    console.error('Get user info error:', error);
    res.status(403).json({ error: 'Invalid or expired token' });
  }
});

export default router;
