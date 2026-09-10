import { AlertStatus, Severity } from '../models/alert.model';

/**
 * Single source of truth for severity/status visual treatment,
 * derived from DESIGN.md (Alerts & Observability Operations).
 * Reused by SeverityBadge, StatusBadge, AlertRow, AlertDetail and FilterBar
 * so colors/icons never drift out of sync across components.
 */
export const SEVERITY_STYLES: Record<
  Severity,
  { badge: string; dot: string; icon: string; iconColor: string }
> = {
  Critical: {
    badge: 'bg-red-50 text-red-600 border-red-100',
    dot: 'bg-red-500',
    icon: 'warning',
    iconColor: 'text-red-500',
  },
  High: {
    badge: 'bg-amber-50 text-amber-700 border-amber-100',
    dot: 'bg-amber-500',
    icon: 'error',
    iconColor: 'text-amber-500',
  },
  Medium: {
    badge: 'bg-slate-100 text-slate-700 border-slate-200',
    dot: 'bg-amber-700',
    icon: 'info',
    iconColor: 'text-amber-700',
  },
  Low: {
    badge: 'bg-slate-100 text-slate-700 border-slate-200',
    dot: 'bg-slate-600',
    icon: 'notifications',
    iconColor: 'text-slate-500',
  },
};

export const STATUS_STYLES: Record<AlertStatus, { badge: string; dot: string }> = {
  Active: { badge: 'bg-rose-50 text-rose-600 border-rose-100', dot: 'bg-red-500' },
  Addressed: { badge: 'bg-blue-50 text-blue-700 border-blue-100', dot: 'bg-blue-600' },
  Closed: { badge: 'bg-emerald-50 text-emerald-700 border-emerald-100', dot: 'bg-emerald-600' },
};
