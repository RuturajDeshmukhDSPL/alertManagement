export const AUTO_REFRESH_INTERVAL_MS = 30_000;

export const TIME_MS = {
  minute: 60_000,
  hour: 3_600_000,
  day: 86_400_000,
} as const;

export const PAGINATION_DEFAULTS = {
  page: 1,
  pageSize: 5,
  pageSizeOptions: [5, 10, 20, 50],
  fallbackPageSize: 5,
};

export const EMPTY_NETWORK_SUMMARY = {
  operationalZones: 0,
  regions: 0,
  totalDevices: 0,
  totalFacilities: 0,
  deviceHealthPercent: 0,
};

export const EMPTY_ALERT_STATS = {
  activeAlertCount: 0,
  activeAlertsLabel: '0 Active Alerts',
};