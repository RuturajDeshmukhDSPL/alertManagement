const { Router } = require('express');
const controller = require('../controllers/alert.controller');

const router = Router();

// GET    /api/alerts
router.get('/', controller.getAlerts);
// GET    /api/alerts/:id
router.get('/:id', controller.getAlertById);
// POST   /api/alerts
router.post('/', controller.createAlert);
// PUT    /api/alerts/:id
router.put('/:id', controller.updateAlert);

module.exports = router;
