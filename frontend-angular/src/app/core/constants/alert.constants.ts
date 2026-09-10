import { AlertStatus, Severity } from '../models/alert.model';

export const ALERT_SEVERITIES: Severity[] = ['Critical', 'High', 'Medium', 'Low'];
export const ALERT_STATUSES: AlertStatus[] = ['Active', 'Addressed', 'Closed'];
export const RAISE_ALERT_INITIAL_STATUSES: AlertStatus[] = ['Active', 'Addressed'];

export const ALERT_FORM_SOURCES = [
  'Network Monitor',
  'Prometheus Alertmanager',
  'APM Tracer (Datadog)',
  'AWS CloudWatch',
  'Identity Shield',
  'Storage Watchdog',
  'Manual SRE Report',
] as const;

export const ALERT_DEFAULT_COUNTS = {
  total: 0,
  latest: 0,
} as const;