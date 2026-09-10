require('dotenv').config();
const { sequelize, User, Facility, Alert } = require('../models');

/** Helpers to build realistic reported_at/reported_date values relative to "now". */
function minutesAgo(n) {
  return new Date(Date.now() - n * 60 * 1000);
}
function hoursAgo(n) {
  return new Date(Date.now() - n * 60 * 60 * 1000);
}
function toDateOnly(date) {
  return date.toISOString().slice(0, 10);
}

const USERS = [
  { name: 'Elena Rostova', email: 'elena.rostova@pulsealert.internal', role: 'Admin' },
  { name: 'Alex Chen', email: 'alex.chen@pulsealert.internal', role: 'DevOps' },
  { name: 'Markus Weber', email: 'markus.weber@pulsealert.internal', role: 'SRE' },
  { name: 'Kenji Sato', email: 'kenji.sato@pulsealert.internal', role: 'SRE' },
  { name: 'Sarah K.', email: 'sarah.k@pulsealert.internal', role: 'SRE' },
  { name: 'Alex C.', email: 'alex.c@pulsealert.internal', role: 'SRE' },
  { name: 'Elena R.', email: 'elena.r@pulsealert.internal', role: 'DevOps' },
  { name: 'SecOps Team', email: 'secops.team@pulsealert.internal', role: 'SecOps' },
  { name: 'DevOps On-Call', email: 'devops.oncall@pulsealert.internal', role: 'DevOps' },
];

// password_hash is NOT NULL in the schema but this app has no auth yet —
// a clearly-labeled placeholder, never a real credential.
const PLACEHOLDER_PASSWORD_HASH = 'unset-no-auth-configured';

async function seed() {
  await sequelize.authenticate();
  console.log('✔ Connected to database.');

  // Respect FK order: children (alerts) before parents (facilities, users).
  await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
  await Alert.destroy({ where: {}, truncate: true });
  await Facility.destroy({ where: {}, truncate: true });
  await User.destroy({ where: {}, truncate: true });
  await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
  console.log('✔ Cleared existing alerts, facilities, users.');

  const createdUsers = await User.bulkCreate(
    USERS.map((u) => ({ ...u, passwordHash: PLACEHOLDER_PASSWORD_HASH }))
  );
  const userIdByName = Object.fromEntries(createdUsers.map((u) => [u.name, u.id]));
  console.log(`✔ Seeded ${createdUsers.length} users.`);

  const facilities = await Facility.bulkCreate([
    {
      id: 'FAC-001',
      name: 'Austin Core Campus',
      location: 'Austin, TX',
      description:
        'Active primary datacenter housing high-density compute racks and root network switches.',
      status: 'Operational',
      areas: '6 Areas',
      devices: '78 Devices',
      criticality: 'Tier 1',
      managerId: userIdByName['Elena Rostova'],
    },
    {
      id: 'FAC-002',
      name: 'Seattle West Distribution',
      location: 'Seattle, WA',
      description: 'Regional fulfillment logistics hub and ingress edge point router cluster.',
      status: 'Operational',
      areas: '4 Areas',
      devices: '52 Devices',
      criticality: 'Tier 2',
      managerId: userIdByName['Alex Chen'],
    },
    {
      id: 'FAC-003',
      name: 'Frankfurt Euro Hub',
      location: 'Frankfurt, DE',
      description:
        'European disaster recovery facility and cross-region replication standby data warehouse.',
      status: 'Operational',
      areas: '5 Areas',
      devices: '48 Devices',
      criticality: 'Tier 1',
      managerId: userIdByName['Markus Weber'],
    },
    {
      id: 'FAC-004',
      name: 'Tokyo Apex Center',
      location: 'Tokyo, JP',
      description:
        'APAC colocation center supporting live checkout endpoints and low-latency API proxy caching.',
      status: 'Operational',
      areas: '3 Areas',
      devices: '32 Devices',
      criticality: 'Tier 3',
      managerId: userIdByName['Kenji Sato'],
    },
  ]);
  console.log(`✔ Seeded ${facilities.length} facilities.`);

  const alertSeeds = [
    {
      code: 'ALT-2201',
      title: 'Unusual outbound traffic from db-prod-03',
      description:
        'Sustained outbound traffic spike (14x baseline) detected on db-prod-03, directed at an unrecognized external IP range. Pattern is consistent with potential data exfiltration.',
      host: 'db-prod-03.internal',
      source: 'Network Monitor',
      severity: 'Critical',
      status: 'Active',
      owner: null,
      facilityId: 'FAC-001',
      reportedAt: minutesAgo(2),
      isLatest: true,
    },
    {
      code: 'ALT-2198',
      title: 'Repeated failed login attempts — admin console',
      description:
        'More than 45 continuous authorization failures within 90 seconds targeting the root system controller. IP originates from an unwhitelisted geographic zone.',
      host: 'auth-mgmt-prod-01',
      source: 'Identity Shield',
      severity: 'Critical',
      status: 'Active',
      owner: 'Alex C.',
      facilityId: 'FAC-001',
      reportedAt: minutesAgo(11),
      isLatest: true,
    },
    {
      code: 'ALT-2194',
      title: 'Disk usage above 90% on log-collector-02',
      description:
        'Primary NVMe volume /var/log capacity crossed 90% threshold. Automated retention policy pending clean run or log rotation.',
      host: 'log-collector-02.internal',
      source: 'Storage Watchdog',
      severity: 'High',
      status: 'Addressed',
      owner: 'Elena R.',
      facilityId: 'FAC-002',
      reportedAt: minutesAgo(38),
      isLatest: true,
    },
    {
      code: 'ALT-2189',
      title: 'TLS certificate expiring in 5 days',
      description:
        'Production wild-card SSL/TLS certificate for *.api.pulsealert.internal will expire in 5 calendar days. Automated ACME challenge was blocked by ingress rate limit.',
      host: 'edge-proxy-pool.us-east',
      source: 'Certificate Manager',
      severity: 'High',
      status: 'Active',
      owner: 'SecOps Team',
      facilityId: 'FAC-002',
      reportedAt: hoursAgo(1),
      isLatest: true,
    },
    {
      code: 'ALT-2183',
      title: 'Elevated 5xx error rate on checkout-service',
      description:
        'HTTP 502/504 error responses on /v2/checkout endpoint exceeded 3.2% total requests over the last 15 minutes. Downstream payment provider circuit open.',
      host: 'checkout-srv-cluster-prod',
      source: 'APM Tracer',
      severity: 'Medium',
      status: 'Addressed',
      owner: 'DevOps On-Call',
      facilityId: 'FAC-004',
      reportedAt: hoursAgo(2),
      isLatest: false,
    },
    {
      code: 'ALT-2177',
      title: 'Database cross-region sync latency warning',
      description:
        'Replication lag between primary us-east postgres replica and eu-central standby exceeded 450ms during peak sync window.',
      host: 'pg-replica-eu-01',
      source: 'Database Watcher',
      severity: 'Medium',
      status: 'Active',
      owner: 'Alex C.',
      facilityId: 'FAC-003',
      reportedAt: hoursAgo(3),
      isLatest: false,
    },
    {
      code: 'ALT-2172',
      title: 'Cache node memory saturation & key evictions',
      description:
        'Redis cache cluster node redis-cache-04 node eviction rate increased by 22% over last 30 minutes due to memory saturation.',
      host: 'redis-cache-04.prod',
      source: 'APM Tracer',
      severity: 'Medium',
      status: 'Closed',
      owner: 'Elena R.',
      facilityId: 'FAC-001',
      reportedAt: hoursAgo(5),
      isLatest: false,
    },
    {
      code: 'ALT-2165',
      title: 'Transient worker pod restarts during spot termination',
      description:
        'Worker pods in billing namespace re-started 4 times during automated spot-instance rotation in us-east-1a.',
      host: 'k8s-node-worker-08',
      source: 'Kubernetes Event Bus',
      severity: 'Low',
      status: 'Addressed',
      owner: 'DevOps On-Call',
      facilityId: 'FAC-002',
      reportedAt: hoursAgo(8),
      isLatest: false,
    },
    {
      code: 'ALT-2159',
      title: 'Scheduled warehouse backup delayed 18m',
      description:
        'Daily snapshot backup of analytics cold warehouse was delayed by 18 minutes due to concurrent ETL batch job.',
      host: 'warehouse-etl-loader',
      source: 'CloudWatch',
      severity: 'Low',
      status: 'Closed',
      owner: null,
      facilityId: 'FAC-002',
      reportedAt: hoursAgo(14),
      isLatest: false,
    },
    {
      code: 'ALT-2150',
      title: 'NTP time drift detected on telemetry gateway',
      description:
        'NTP clock skew reached 84ms on telemetry ingest nodes; chrony re-synced against internal reference clock.',
      host: 'telemetry-ingest-gw',
      source: 'System Watcher',
      severity: 'Low',
      status: 'Active',
      owner: 'SecOps Team',
      facilityId: 'FAC-003',
      reportedAt: hoursAgo(26),
      isLatest: false,
    },
  ];

  const alerts = await Alert.bulkCreate(
    alertSeeds.map((a) => ({
      code: a.code,
      title: a.title,
      description: a.description,
      host: a.host,
      source: a.source,
      severity: a.severity,
      status: a.status,
      ownerId: a.owner ? userIdByName[a.owner] : null,
      facilityId: a.facilityId,
      reportedAt: a.reportedAt,
      reportedDate: toDateOnly(a.reportedAt),
      isLatest: a.isLatest,
    }))
  );
  console.log(`✔ Seeded ${alerts.length} alerts.`);

  console.log('\nDone. Try: GET /api/alerts, /api/facilities, /api/dashboard/stats\n');
  process.exit(0);
}

seed().catch((err) => {
  console.error('✖ Seed failed:', err);
  process.exit(1);
});
