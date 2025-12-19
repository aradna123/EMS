const express = require('express');
const router = express.Router();
const { getDashboard } = require('../controllers/dashboardController');
const { authenticate } = require('../middleware/auth');

// All routes require authentication
router.use(authenticate);

// Get dashboard data
router.get('/', getDashboard);
router.get('/stats', getDashboard);

module.exports = router;

