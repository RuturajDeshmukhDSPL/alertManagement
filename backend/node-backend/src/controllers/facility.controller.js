const asyncHandler = require('../utils/asyncHandler');
const facilityService = require('../services/facility.service');

/** GET /api/facilities */
const getFacilities = asyncHandler(async (req, res) => {
  const data = await facilityService.listFacilities();
  res.json({ success: true, data });
});

/** GET /api/facilities/:id */
const getFacilityById = asyncHandler(async (req, res) => {
  const data = await facilityService.getFacilityById(req.params.id);
  res.json({ success: true, data });
});

module.exports = { getFacilities, getFacilityById };
