/**
 * Extracts the leading integer from strings like "6 Areas" / "78 Devices"
 * so the dashboard can sum them without hardcoding any totals.
 */
function parseNumberPrefix(value) {
  if (!value) return 0;
  const match = String(value).match(/\d+/);
  return match ? parseInt(match[0], 10) : 0;
}

module.exports = parseNumberPrefix;
