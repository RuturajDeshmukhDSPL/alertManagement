const sequelize = require('../config/database');
const User = require('./user.model');
const Facility = require('./facility.model');
const Alert = require('./alert.model');

/**
 * Associations — declared once, here, so every service/controller gets
 * consistent `include` aliases ('owner', 'facility', 'manager').
 */
User.hasMany(Alert, { foreignKey: 'ownerId', as: 'alerts' });
Alert.belongsTo(User, { foreignKey: 'ownerId', as: 'owner' });

User.hasMany(Facility, { foreignKey: 'managerId', as: 'managedFacilities' });
Facility.belongsTo(User, { foreignKey: 'managerId', as: 'manager' });

Facility.hasMany(Alert, { foreignKey: 'facilityId', as: 'alerts' });
Alert.belongsTo(Facility, { foreignKey: 'facilityId', as: 'facility' });

module.exports = { sequelize, User, Facility, Alert };
