const express = require('express');
const router = express.Router();
const {
  getDepartments,
  getDepartment,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  getDepartmentStats,
  getDepartmentHierarchy,
} = require('../controllers/departmentController');
const { authenticate, authorize } = require('../middleware/auth');
const { departmentValidator, idValidator } = require('../utils/validators');

// All routes require authentication
router.use(authenticate);

// Get all departments
router.get('/', getDepartments);

// Get department hierarchy
router.get('/hierarchy', getDepartmentHierarchy);

// Get single department
router.get('/:id', idValidator, getDepartment);

// Get department statistics
router.get('/:id/stats', idValidator, getDepartmentStats);

// Create department (Admin/Manager only)
router.post('/', authorize('admin', 'manager'), departmentValidator, createDepartment);

// Update department (Admin/Manager only)
router.put('/:id', authorize('admin', 'manager'), idValidator, departmentValidator, updateDepartment);

// Delete department (Admin/Manager only)
router.delete('/:id', authorize('admin', 'manager'), idValidator, deleteDepartment);

module.exports = router;

