const { fn, col } = require('sequelize');
const { Facility, User, Alert } = require('../models');
const ApiError = require('../utils/ApiError');
const parseNumberPrefix = require('../utils/parseNumberPrefix');

const managerInclude = { model: User, as: 'manager', attributes: ['id', 'name', 'role'] };

function serializeFacility(facilityInstance, activeAlertCount = 0) {
  const json = facilityInstance.toJSON ? facilityInstance.toJSON() : facilityInstance;
  return {
    id: json.id,
    name: json.name,
    location: json.location,
    description: json.description,
    status: json.status,
    areas: json.areas,
    devices: json.devices,
    criticality: json.criticality,
    managerId: json.managerId,
    manager: json.manager ? json.manager.name : 'Unassigned',
    // Live stats — deliberately NOT stored columns, always derived from
    // the alerts table so they can never drift out of sync.
    activeAlertCount,
    activeAlertsLabel: `${activeAlertCount} Active Alert${activeAlertCount === 1 ? '' : 's'}`,
  };
}

/** Returns { [facilityId]: activeAlertCount } for every facility that has at least one active alert. */
async function getActiveAlertCountsByFacility() {
  const rows = await Alert.findAll({
    attributes: ['facilityId', [fn('COUNT', col('Alert.id')), 'activeCount']],
    where: { status: 'Active' },
    group: ['facilityId'],
  });
  const map = {};
  for (const row of rows) {
    const facilityId = row.get('facilityId');
    if (facilityId) map[facilityId] = parseInt(row.get('activeCount'), 10);
  }
  return map;
}

async function listFacilities() {
  const [facilities, activeCounts] = await Promise.all([
    Facility.findAll({ include: [managerInclude], order: [['name', 'ASC']] }),
    getActiveAlertCountsByFacility(),
  ]);
  return facilities.map((f) => serializeFacility(f, activeCounts[f.id] || 0));
}

async function getFacilityById(id) {
  const facility = await Facility.findByPk(id, { include: [managerInclude] });
  if (!facility) throw new ApiError(404, `Facility ${id} not found`);
  const activeAlertCount = await Alert.count({ where: { facilityId: id, status: 'Active' } });
  return serializeFacility(facility, activeAlertCount);
}

/** Sums operational areas/devices across all facilities — no hardcoded totals. */
async function getNetworkSummary() {
  const facilities = await Facility.findAll({ attributes: ['areas', 'devices', 'location'] });
  const operationalZones = facilities.reduce((sum, f) => sum + parseNumberPrefix(f.areas), 0);
  const totalDevices = facilities.reduce((sum, f) => sum + parseNumberPrefix(f.devices), 0);
  const regions = new Set(facilities.map((f) => f.location.split(',').pop().trim())).size;
  return { operationalZones, regions, totalDevices, totalFacilities: facilities.length };
}

module.exports = {
  listFacilities,
  getFacilityById,
  getActiveAlertCountsByFacility,
  getNetworkSummary,
  serializeFacility,
};
