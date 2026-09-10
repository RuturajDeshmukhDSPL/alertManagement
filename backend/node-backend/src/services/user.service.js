const { User } = require('../models');

async function listUsers({ assignable } = {}) {
  const users = await User.findAll({
    attributes: ['id', 'name', 'role'],
    order: [['name', 'ASC']],
  });

  // Keep the query parameter explicit for the frontend contract. The current
  // schema has no disabled-user field, so every existing user is assignable.
  return users;
}

module.exports = { listUsers };
