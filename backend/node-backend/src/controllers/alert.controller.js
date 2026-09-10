const asyncHandler = require('../utils/asyncHandler');
const alertService = require('../services/alert.service');

/** GET /api/alerts */
const getAlerts = asyncHandler(async (req, res) => {
  const result = await alertService.listAlerts(req.query);
  res.json({ success: true, ...result });
});

/** GET /api/alerts/:id */
const getAlertById = asyncHandler(async (req, res) => {
  const alert = await alertService.getAlertById(req.params.id);
  res.json({ success: true, data: alert });
});

/** POST /api/alerts */
const createAlert = asyncHandler(async (req, res) => {
  const alert = await alertService.createAlert(req.body);
  res.status(201).json({ success: true, data: alert });
});

/** PUT /api/alerts/:id */
const updateAlert = asyncHandler(async (req, res) => {
  const alert = await alertService.updateAlert(req.params.id, req.body);
  res.json({ success: true, data: alert });
});

module.exports = { getAlerts, getAlertById, createAlert, updateAlert };
