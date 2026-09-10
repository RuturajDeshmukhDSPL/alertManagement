const { Router } = require('express');
const controller = require('../controllers/dashboard.controller');

const router = Router();

// GET /api/dashboard/stats
router.get('/stats', controller.getStats);

module.exports = router;
