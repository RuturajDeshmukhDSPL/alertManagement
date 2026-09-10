const { Alert, Facility } = require('../models');
const { getActiveAlertCountsByFacility, getNetworkSummary } = require('./facility.service');

/**
 * GET /api/dashboard/stats
 * Every number here is computed live from the database — nothing is
 * cached or hardcoded, so the dashboard is always consistent with
 * whatever's actually in `alerts`/`facilities` at request time.
 */
async function getDashboardStats() {
  const [alerts, facilities, activeCountsByFacility, network] = await Promise.all([
    Alert.findAll({ attributes: ['severity', 'status', 'isLatest'] }),
    Facility.findAll({ attributes: ['id', 'criticality'] }),
    getActiveAlertCountsByFacility(),
    getNetworkSummary(),
  ]);

  const bySeverity = { Critical: 0, High: 0, Medium: 0, Low: 0 };
  const byStatus = { Active: 0, Addressed: 0, Closed: 0 };
  let latest = 0;
  for (const a of alerts) {
    bySeverity[a.severity]++;
    byStatus[a.status]++;
    if (a.isLatest) latest++;
  }

  const criticalFacilitiesWithActiveAlerts = facilities.filter(
    (f) => f.criticality === 'Tier 1' && (activeCountsByFacility[f.id] || 0) > 0
  ).length;

  return {
    alerts: {
      total: alerts.length,
      latest,
      bySeverity,
      byStatus,
    },
    facilities: {
      total: facilities.length,
      criticalWithActiveAlerts: criticalFacilitiesWithActiveAlerts,
      totalActiveIncidents: byStatus.Active,
      network,
    },
  };
}

module.exports = { getDashboardStats };
