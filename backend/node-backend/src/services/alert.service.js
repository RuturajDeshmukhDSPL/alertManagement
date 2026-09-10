const { Op, literal } = require('sequelize');
const { Alert, User, Facility } = require('../models');
const ApiError = require('../utils/ApiError');

const CODE_PREFIX = 'ALT-';
const CODE_SEED_START = 2202;

const ownerInclude = { model: User, as: 'owner', attributes: ['id', 'name', 'role'] };
const facilityInclude = { model: Facility, as: 'facility', attributes: ['id', 'name', 'location'] };

/** Finds the highest existing ALT-#### code and returns the next one. */
async function generateNextCode() {
  const last = await Alert.findOne({
    where: { code: { [Op.like]: `${CODE_PREFIX}%` } },
    order: [[literal(`CAST(SUBSTRING(code, ${CODE_PREFIX.length + 1}) AS UNSIGNED)`), 'DESC']],
  });
  if (!last || !last.code) return `${CODE_PREFIX}${CODE_SEED_START}`;
  const num = parseInt(last.code.replace(CODE_PREFIX, ''), 10);
  const next = Number.isFinite(num) ? num + 1 : CODE_SEED_START;
  return `${CODE_PREFIX}${next}`;
}

function serializeAlert(alertInstance) {
  const json = alertInstance.toJSON ? alertInstance.toJSON() : alertInstance;
  return {
    id: json.id,
    code: json.code,
    title: json.title,
    description: json.description,
    host: json.host,
    source: json.source,
    severity: json.severity,
    status: json.status,
    ownerId: json.ownerId,
    owner: json.owner ? json.owner.name : 'Unassigned',
    facilityId: json.facilityId,
    facility: json.facility ? { id: json.facility.id, name: json.facility.name, location: json.facility.location } : null,
    reportedDate: json.reportedDate,
    reportedAt: json.reportedAt,
    isLatest: Boolean(json.isLatest),
    createdAt: json.createdAt,
  };
}

/** Builds a Sequelize `where` clause from the GET /api/alerts query params. */
function buildWhereClause({ status, severity, facilityId, search, dateFrom, dateTo, latest }) {
  const where = {};
  if (status) where.status = status;
  if (severity) where.severity = severity;
  if (facilityId) where.facilityId = facilityId;
  if (latest === 'true') where.isLatest = true;

  if (dateFrom || dateTo) {
    where.reportedDate = {};
    if (dateFrom) where.reportedDate[Op.gte] = dateFrom;
    if (dateTo) where.reportedDate[Op.lte] = dateTo;
  }

  if (search) {
    const like = `%${search}%`;
    where[Op.or] = [
      { title: { [Op.like]: like } },
      { description: { [Op.like]: like } },
      { host: { [Op.like]: like } },
      { code: { [Op.like]: like } },
      { source: { [Op.like]: like } },
    ];
  }

  return where;
}

/**
 * GET /api/alerts
 * Supports: status, severity, facilityId, search, dateFrom, dateTo, latest,
 * page, pageSize.
 *
 * Also returns `meta.counts` — severity/status/latest totals scoped to
 * facility + search + date range but deliberately NOT to the status/severity
 * filter itself, so a filter-bar UI can show "how many alerts would match
 * each chip" without a second round-trip.
 */
async function listAlerts(query = {}) {
  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  const pageSize = Math.min(Math.max(parseInt(query.pageSize, 10) || 10, 1), 100);

  const where = buildWhereClause(query);

  const { rows, count } = await Alert.findAndCountAll({
    where,
    include: [ownerInclude, facilityInclude],
    order: [['reportedAt', 'DESC']],
    limit: pageSize,
    offset: (page - 1) * pageSize,
  });

  const countsScope = buildWhereClause({
    facilityId: query.facilityId,
    search: query.search,
    dateFrom: query.dateFrom,
    dateTo: query.dateTo,
  });
  const scopedAlerts = await Alert.findAll({
    where: countsScope,
    attributes: ['severity', 'status', 'isLatest'],
  });

  const counts = {
    total: scopedAlerts.length,
    latest: scopedAlerts.filter((a) => a.isLatest).length,
    bySeverity: { Critical: 0, High: 0, Medium: 0, Low: 0 },
    byStatus: { Active: 0, Addressed: 0, Closed: 0 },
  };
  for (const a of scopedAlerts) {
    counts.bySeverity[a.severity]++;
    counts.byStatus[a.status]++;
  }

  return {
    data: rows.map(serializeAlert),
    meta: {
      page,
      pageSize,
      total: count,
      totalPages: Math.max(1, Math.ceil(count / pageSize)),
      counts,
    },
  };
}

async function getAlertById(id) {
  const alert = await Alert.findByPk(id, { include: [ownerInclude, facilityInclude] });
  if (!alert) throw new ApiError(404, `Alert ${id} not found`);
  return serializeAlert(alert);
}

async function createAlert(payload = {}) {
  const { title, description, host, source, severity, status, ownerId, facilityId } = payload;

  if (!title || !host || !source || !severity || !facilityId) {
    throw new ApiError(400, 'title, host, source, severity and facilityId are required');
  }

  const facility = await Facility.findByPk(facilityId);
  if (!facility) throw new ApiError(400, `Facility ${facilityId} does not exist`);

  if (ownerId) {
    const owner = await User.findByPk(ownerId);
    if (!owner) throw new ApiError(400, `User ${ownerId} does not exist`);
  }

  const code = await generateNextCode();
  const now = new Date();

  const created = await Alert.create({
    code,
    title,
    description: description || 'Manually raised alert.',
    host,
    source,
    severity,
    status: status || 'Active',
    ownerId: ownerId || null,
    facilityId,
    reportedDate: now,
    reportedAt: now,
    isLatest: true,
  });

  return getAlertById(created.id);
}

async function updateAlert(id, payload = {}) {
  const alert = await Alert.findByPk(id);
  if (!alert) throw new ApiError(404, `Alert ${id} not found`);

  const updatableFields = [
    'title',
    'description',
    'host',
    'source',
    'severity',
    'status',
    'ownerId',
    'facilityId',
    'isLatest',
  ];
  const changes = {};
  for (const field of updatableFields) {
    if (payload[field] !== undefined) changes[field] = payload[field];
  }

  if (Object.keys(changes).length === 0) {
    throw new ApiError(400, 'No updatable fields provided');
  }

  if (changes.facilityId) {
    const facility = await Facility.findByPk(changes.facilityId);
    if (!facility) throw new ApiError(400, `Facility ${changes.facilityId} does not exist`);
  }
  if (changes.ownerId) {
    const owner = await User.findByPk(changes.ownerId);
    if (!owner) throw new ApiError(400, `User ${changes.ownerId} does not exist`);
  }

  await alert.update(changes);
  return getAlertById(alert.id);
}

module.exports = {
  listAlerts,
  getAlertById,
  createAlert,
  updateAlert,
  serializeAlert,
};
