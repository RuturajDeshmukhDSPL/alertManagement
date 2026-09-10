const { Router } = require('express');
const alertRoutes = require('./alert.routes');
const facilityRoutes = require('./facility.routes');
const dashboardRoutes = require('./dashboard.routes');
const userRoutes = require('./user.routes');

const router = Router();

router.use('/alerts', alertRoutes);
router.use('/facilities', facilityRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/users', userRoutes);

module.exports = router;
