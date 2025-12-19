const express = require('express');
const router = express.Router();
const {
  submitLeaveRequest,
  getLeaveRequests,
  getLeaveRequest,
  updateLeaveRequest,
  deleteLeaveRequest,
  approveLeaveRequest,
  getLeaveBalance,
  getLeaveCalendar,
} = require('../controllers/leaveController');
const { authenticate, authorize } = require('../middleware/auth');
const { leaveRequestValidator, leaveUpdateValidator, leaveApprovalValidator, idValidator } = require('../utils/validators');

// All routes require authentication
router.use(authenticate);

// Submit leave request
router.post('/request', leaveRequestValidator, submitLeaveRequest);
// Also support POST /api/leaves for consistency
router.post('/', leaveRequestValidator, submitLeaveRequest);

// Get leave requests
router.get('/requests', getLeaveRequests);
// Also support GET /api/leaves for consistency
router.get('/', getLeaveRequests);

// Get leave balance (must be before /:id route)
router.get('/balance', getLeaveBalance);
// Also support GET /api/leaves/my-balance for consistency
router.get('/my-balance', getLeaveBalance);

// Get leave calendar (must be before /:id route)
router.get('/calendar', getLeaveCalendar);

// Approve/Reject leave request (Manager/Admin only) - must be before /:id route
router.put('/requests/:id/approve', authorize('admin', 'manager'), idValidator, leaveApprovalValidator, approveLeaveRequest);
// Also support PATCH endpoints for consistency with requirements
router.patch('/:id/approve', authorize('admin', 'manager'), idValidator, leaveApprovalValidator, approveLeaveRequest);
// Reject route - automatically sets status to 'rejected'
router.patch('/:id/reject', authorize('admin', 'manager'), idValidator, (req, res, next) => {
  req.body.status = 'rejected';
  next();
}, leaveApprovalValidator, approveLeaveRequest);

// Get single leave request
router.get('/:id', idValidator, getLeaveRequest);

// Update own pending leave request
router.put('/:id', idValidator, leaveUpdateValidator, updateLeaveRequest);

// Delete own pending leave request
router.delete('/:id', idValidator, deleteLeaveRequest);

module.exports = router;

