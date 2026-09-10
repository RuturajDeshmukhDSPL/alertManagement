const asyncHandler = require('../utils/asyncHandler');
const userService = require('../services/user.service');

/** GET /api/users */
const getUsers = asyncHandler(async (req, res) => {
  const data = await userService.listUsers({ assignable: req.query.assignable === 'true' });
  res.json({ success: true, data });
});

module.exports = { getUsers };
