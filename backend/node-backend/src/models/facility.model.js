const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

/** Maps to the `facilities` table (VARCHAR primary key, e.g. 'FAC-001'). */
class Facility extends Model {}

Facility.init(
  {
    id: { type: DataTypes.STRING(50), primaryKey: true },
    name: { type: DataTypes.STRING(150), allowNull: false },
    location: { type: DataTypes.STRING(100), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    status: {
      type: DataTypes.ENUM('Operational', 'Offline'),
      allowNull: false,
      defaultValue: 'Operational',
    },
    areas: { type: DataTypes.STRING(50), allowNull: false },
    devices: { type: DataTypes.STRING(50), allowNull: false },
    criticality: {
      type: DataTypes.ENUM('Tier 1', 'Tier 2', 'Tier 3'),
      allowNull: false,
      defaultValue: 'Tier 2',
    },
    managerId: { type: DataTypes.INTEGER, allowNull: true, field: 'manager_id' },
  },
  {
    sequelize,
    modelName: 'Facility',
    tableName: 'facilities',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
  }
);

module.exports = Facility;
