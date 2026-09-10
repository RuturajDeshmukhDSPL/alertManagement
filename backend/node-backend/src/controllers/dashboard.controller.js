const asyncHandler = require('../utils/asyncHandler');
const dashboardService = require('../services/dashboard.service');

/** GET /api/dashboard/stats */
const getStats = asyncHandler(async (req, res) => {
  const data = await dashboardService.getDashboardStats();
  res.json({ success: true, data });
});

module.exports = { getStats };
