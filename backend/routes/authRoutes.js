const express = require('express');
const router = express.Router();
const {
  register,
  login,
  logout,
  getProfile,
  updateProfile,
  requestPasswordReset,
  confirmPasswordReset,
  changePassword,
} = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const upload = require('../middleware/upload');
const {
  registerValidator,
  loginValidator,
  passwordResetValidator,
  passwordResetConfirmValidator,
  changePasswordValidator,
} = require('../utils/validators');

// Public routes
router.post('/register', registerValidator, register);
router.post('/login', loginValidator, login);
router.post('/forgot-password', passwordResetValidator, requestPasswordReset);
router.post('/reset-password', passwordResetConfirmValidator, confirmPasswordReset);

// Protected routes
router.get('/profile', authenticate, getProfile);
// Also support GET /api/auth/me for consistency
router.get('/me', authenticate, getProfile);
router.put('/profile', authenticate, upload.single('avatar'), updateProfile);
router.put('/change-password', authenticate, changePasswordValidator, changePassword);
router.post('/logout', authenticate, logout);

module.exports = router;

