const express = require('express');
const router = express.Router();
const {
  getEmployees,
  getEmployee,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  uploadPhoto,
  exportEmployees,
} = require('../controllers/employeeController');
const { authenticate, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { employeeValidator, employeeUpdateValidator, idValidator } = require('../utils/validators');

// All routes require authentication
router.use(authenticate);

// Export employees to CSV (Admin/Manager only) - Must be before /:id route
router.get('/export/csv', authorize('admin', 'manager'), exportEmployees);

// Get all employees (with filters)
router.get('/', getEmployees);

// Get single employee
router.get('/:id', idValidator, getEmployee);

// Create employee (Admin/Manager only)
router.post('/', authorize('admin', 'manager'), employeeValidator, createEmployee);

// Update employee (Admin/Manager only)
router.put('/:id', authorize('admin', 'manager'), idValidator, employeeUpdateValidator, updateEmployee);

// Delete employee (Admin/Manager only)
router.delete('/:id', authorize('admin', 'manager'), idValidator, deleteEmployee);

// Upload employee photo
router.post('/:id/photo', authorize('admin', 'manager'), idValidator, upload.single('photo'), uploadPhoto);

module.exports = router;

