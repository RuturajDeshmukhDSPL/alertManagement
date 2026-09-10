const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

/** Maps to the `alerts` table (INT auto-increment primary key). */
class Alert extends Model {}

Alert.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    code: { type: DataTypes.STRING(50), allowNull: true, unique: true },
    title: { type: DataTypes.STRING(255), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: false },
    host: { type: DataTypes.STRING(150), allowNull: false },
    source: { type: DataTypes.STRING(100), allowNull: false },
    severity: {
      type: DataTypes.ENUM('Critical', 'High', 'Medium', 'Low'),
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('Active', 'Addressed', 'Closed'),
      allowNull: false,
      defaultValue: 'Active',
    },
    ownerId: { type: DataTypes.INTEGER, allowNull: true, field: 'owner_id' },
    facilityId: { type: DataTypes.STRING(50), allowNull: true, field: 'facility_id' },
    reportedDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'reported_date',
    },
    reportedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'reported_at',
    },
    isLatest: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true, field: 'is_latest' },
  },
  {
    sequelize,
    modelName: 'Alert',
    tableName: 'alerts',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
  }
);

module.exports = Alert;
