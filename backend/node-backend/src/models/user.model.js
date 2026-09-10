const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

/**
 * Maps to the `users` table. Not exposed via its own REST routes (none
 * were requested), but Alert.owner_id and Facility.manager_id both point
 * here, so alerts/facilities responses include the resolved user name.
 */
class User extends Model {}

User.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING(100), allowNull: false },
    email: {
      type: DataTypes.STRING(150),
      allowNull: false,
      unique: true,
      validate: { isEmail: true },
    },
    passwordHash: { type: DataTypes.STRING(255), allowNull: false, field: 'password_hash' },
    role: {
      type: DataTypes.ENUM('SRE', 'DevOps', 'SecOps', 'Admin'),
      allowNull: false,
      defaultValue: 'SRE',
    },
  },
  {
    sequelize,
    modelName: 'User',
    tableName: 'users',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
  }
);

module.exports = User;
