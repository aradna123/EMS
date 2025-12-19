const express = require('express');
const router = express.Router();
const {
  checkIn,
  checkOut,
  getAttendance,
  createAttendance,
  getMonthlyReport,
  getAttendanceStats,
} = require('../controllers/attendanceController');
const { authenticate, authorize } = require('../middleware/auth');
const { attendanceCheckInValidator, attendanceValidator } = require('../utils/validators');

// All routes require authentication
router.use(authenticate);

// Employee routes
router.post('/check-in', attendanceCheckInValidator, checkIn);
router.post('/check-out', attendanceCheckInValidator, checkOut);
router.put('/:id/check-out', checkOut);

// Get attendance records
router.get('/', getAttendance);

// Get monthly report
router.get('/monthly', getMonthlyReport);

// Get attendance statistics
router.get('/stats', getAttendanceStats);

// Admin/Manager routes
router.post('/record', authorize('admin', 'manager'), attendanceValidator, createAttendance);

module.exports = router;

