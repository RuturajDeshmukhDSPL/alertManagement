const { Router } = require('express');
const controller = require('../controllers/facility.controller');

const router = Router();

// GET /api/facilities
router.get('/', controller.getFacilities);
// GET /api/facilities/:id
router.get('/:id', controller.getFacilityById);

module.exports = router;
