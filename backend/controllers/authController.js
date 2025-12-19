const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const pool = require('../config/database');
const nodemailer = require('nodemailer');

// Configure email transporter (only if email credentials are provided)
let transporter = null;
if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
  transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: process.env.EMAIL_PORT || 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
}

// Register user
const register = async (req, res, next) => {
  try {
    const { name, email, password, role = 'employee' } = req.body;

    // Check if user exists
    const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user and employee record in transaction
    await pool.query('BEGIN');

    try {
      // Create user
      const result = await pool.query(
        'INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role, created_at',
        [name, email, hashedPassword, role]
      );

      const user = result.rows[0];

      // Create employee record if role is employee
      if (role === 'employee' || role === 'manager') {
        // Generate employee code
        const codeResult = await pool.query('SELECT COUNT(*) as count FROM employees');
        const employeeCode = `EMP${String(parseInt(codeResult.rows[0].count) + 1).padStart(4, '0')}`;

        await pool.query(
          'INSERT INTO employees (user_id, employee_code, status, join_date) VALUES ($1, $2, $3, CURRENT_DATE)',
          [user.id, employeeCode, 'active']
        );
      }

      await pool.query('COMMIT');

      // Generate JWT
      const token = jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRE || '7d' }
      );

      res.status(201).json({
        message: 'User registered successfully',
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      });
    } catch (err) {
      await pool.query('ROLLBACK');
      throw err;
    }
  } catch (error) {
    next(error);
  }
};

// Login user
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    console.log('Login attempt:', { email, passwordLength: password?.length });

    // Find user
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    console.log('User query result:', { found: result.rows.length > 0 });
    if (result.rows.length === 0) {
      console.log('User not found');
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const user = result.rows[0];
    console.log('User details:', { id: user.id, email: user.email, role: user.role, is_active: user.is_active });

    // Check if user is active
    if (!user.is_active) {
      console.log('User is inactive');
      return res.status(401).json({ message: 'Account is inactive' });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    console.log('Password match:', isMatch);
    if (!isMatch) {
      console.log('Password mismatch');
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate JWT
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get current user profile
const getProfile = async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT u.id, u.name, u.email, u.role, u.avatar, u.created_at, u.is_active,
              e.id as employee_id, e.employee_code, e.position, e.department_id, e.status
       FROM users u
       LEFT JOIN employees e ON u.id = e.user_id
       WHERE u.id = $1`,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = result.rows[0];
    
    // Return user data even if no employee record exists (for admin users)
    res.json(user);
  } catch (error) {
    next(error);
  }
};

// Update profile
const updateProfile = async (req, res, next) => {
  try {
    const { name, phone, address } = req.body;
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (name) {
      updates.push(`name = $${paramCount++}`);
      values.push(name);
    }

    if (req.file) {
      updates.push(`avatar = $${paramCount++}`);
      values.push(req.file.filename);
    }

    if (updates.length === 0) {
      return res.status(400).json({ message: 'No fields to update' });
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(req.user.id);

    const query = `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING id, name, email, role, avatar`;
    const result = await pool.query(query, values);

    res.json({
      message: 'Profile updated successfully',
      user: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
};

// Request password reset
const requestPasswordReset = async (req, res, next) => {
  try {
    const { email } = req.body;

    const result = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      // Don't reveal if email exists
      return res.json({ message: 'If email exists, password reset link has been sent' });
    }

    const userId = result.rows[0].id;
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 3600000); // 1 hour

    // Delete old tokens
    await pool.query('DELETE FROM password_reset_tokens WHERE user_id = $1', [userId]);

    // Create new token
    await pool.query(
      'INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
      [userId, token, expiresAt]
    );

    // Send email (in production, use proper email service)
    const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${token}`;
    
    if (transporter) {
      try {
        await transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: email,
          subject: 'Password Reset Request',
          html: `<p>Click <a href="${resetLink}">here</a> to reset your password. This link expires in 1 hour.</p>`,
        });
        console.log(`✅ Password reset email sent to ${email}`);
      } catch (emailError) {
        console.error('❌ Error sending email:', emailError);
        // Still log the link for development
        console.log(`\n📧 Password Reset Link (Email failed):\n${resetLink}\n`);
      }
    } else {
      // In development, log the reset link to console
      console.log(`\n📧 Password Reset Link for ${email}:\n${resetLink}\n`);
      console.log('⚠️  Email not configured. Copy the link above to reset your password.');
    }

    res.json({ message: 'If email exists, password reset link has been sent' });
  } catch (error) {
    next(error);
  }
};

// Confirm password reset
const confirmPasswordReset = async (req, res, next) => {
  try {
    const { token, password } = req.body;

    // Find valid token
    const tokenResult = await pool.query(
      'SELECT user_id FROM password_reset_tokens WHERE token = $1 AND expires_at > NOW()',
      [token]
    );

    if (tokenResult.rows.length === 0) {
      return res.status(400).json({ message: 'Invalid or expired token' });
    }

    const userId = tokenResult.rows[0].user_id;

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Update password
    await pool.query('UPDATE users SET password = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [
      hashedPassword,
      userId,
    ]);

    // Delete token
    await pool.query('DELETE FROM password_reset_tokens WHERE token = $1', [token]);

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    next(error);
  }
};

// Change password (for authenticated users)
const changePassword = async (req, res, next) => {
  try {
    const { current_password, new_password } = req.body;
    const userId = req.user.id;

    // Get current user
    const userResult = await pool.query('SELECT password FROM users WHERE id = $1', [userId]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = userResult.rows[0];

    // Verify current password
    const isMatch = await bcrypt.compare(current_password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(new_password, salt);

    // Update password
    await pool.query('UPDATE users SET password = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [
      hashedPassword,
      userId,
    ]);

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    next(error);
  }
};

// Logout (optional - for token blacklisting if needed)
const logout = async (req, res, next) => {
  try {
    // Since we're using JWT, logout is typically handled client-side by removing the token
    // However, if you want to implement token blacklisting, you would:
    // 1. Store the token in a blacklist table/Redis
    // 2. Check blacklist in authenticate middleware
    
    // For now, we'll just return success
    // In a production system with token refresh, you might want to:
    // - Invalidate refresh tokens
    // - Add current token to blacklist
    // - Clear session data if using sessions

    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  logout,
  getProfile,
  updateProfile,
  requestPasswordReset,
  confirmPasswordReset,
  changePassword,
};

