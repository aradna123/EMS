const { body, param, query, validationResult } = require('express-validator');

// Validation result handler
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log('Validation errors:', JSON.stringify(errors.array(), null, 2));
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// Auth validators
const registerValidator = [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ min: 2, max: 100 }),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').optional().isIn(['admin', 'manager', 'employee']).withMessage('Invalid role'),
  handleValidationErrors,
];

const loginValidator = [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
  handleValidationErrors,
];

const passwordResetValidator = [
  body('email').isEmail().withMessage('Valid email is required'),
  handleValidationErrors,
];

const passwordResetConfirmValidator = [
  body('token').notEmpty().withMessage('Token is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  handleValidationErrors,
];

// Employee validators
const employeeValidator = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('employee_code').trim().notEmpty().withMessage('Employee code is required'),
  body('department_id').optional().isInt().withMessage('Department ID must be an integer'),
  body('position').optional().trim(),
  body('salary').optional().isFloat({ min: 0 }).withMessage('Salary must be a positive number'),
  body('join_date').isISO8601().withMessage('Valid join date is required'),
  body('phone').optional().trim(),
  body('address').optional().trim(),
  handleValidationErrors,
];

const employeeUpdateValidator = [
  body('name').optional().trim().notEmpty(),
  body('email').optional().isEmail(),
  body('department_id').optional().isInt(),
  body('position').optional().trim(),
  body('salary').optional().isFloat({ min: 0 }),
  body('status').optional().isIn(['active', 'on_leave', 'terminated']),
  body('phone').optional().trim(),
  body('address').optional().trim(),
  handleValidationErrors,
];

// Department validators
const departmentValidator = [
  body('name').trim().notEmpty().withMessage('Department name is required'),
  body('description').optional().trim(),
  body('parent_id').optional().isInt().withMessage('Parent ID must be an integer'),
  body('manager_id').optional().isInt().withMessage('Manager ID must be an integer'),
  handleValidationErrors,
];

// Attendance validators
const attendanceCheckInValidator = [
  body('date').optional().isISO8601().withMessage('Valid date is required'),
  handleValidationErrors,
];

const attendanceValidator = [
  body('employee_id').isInt().withMessage('Employee ID is required'),
  body('date').isISO8601().withMessage('Valid date is required'),
  body('check_in').optional().matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Invalid time format (HH:MM)'),
  body('check_out').optional().matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Invalid time format (HH:MM)'),
  body('status').optional().isIn(['present', 'absent', 'late', 'half_day']),
  body('notes').optional().trim(),
  handleValidationErrors,
];

// Leave validators
const leaveRequestValidator = [
  body('leave_type').isIn(['sick', 'vacation', 'personal', 'emergency']).withMessage('Valid leave type is required'),
  body('start_date').isISO8601().withMessage('Valid start date is required'),
  body('end_date').isISO8601().withMessage('Valid end date is required'),
  body('reason').optional().trim(),
  handleValidationErrors,
];

const leaveUpdateValidator = [
  body('leave_type').optional().isIn(['sick', 'vacation', 'personal', 'emergency']).withMessage('Valid leave type is required'),
  body('start_date').optional().isISO8601().withMessage('Valid start date is required'),
  body('end_date').optional().isISO8601().withMessage('Valid end date is required'),
  body('reason').optional().trim(),
  handleValidationErrors,
];

const leaveApprovalValidator = [
  body('status').isIn(['approved', 'rejected']).withMessage('Status must be approved or rejected'),
  handleValidationErrors,
];

const changePasswordValidator = [
  body('current_password').notEmpty().withMessage('Current password is required'),
  body('new_password').isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
  handleValidationErrors,
];

// ID param validator
const idValidator = [
  param('id').isInt().withMessage('Invalid ID'),
  handleValidationErrors,
];

module.exports = {
  registerValidator,
  loginValidator,
  passwordResetValidator,
  passwordResetConfirmValidator,
  employeeValidator,
  employeeUpdateValidator,
  departmentValidator,
  attendanceCheckInValidator,
  attendanceValidator,
  leaveRequestValidator,
  leaveUpdateValidator,
  leaveApprovalValidator,
  changePasswordValidator,
  idValidator,
  handleValidationErrors,
};

