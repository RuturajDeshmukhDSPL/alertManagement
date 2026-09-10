export interface Facility {
  id: string;
  name: string;
  location: string;
  description: string;
  status: 'Operational' | 'Degraded' | 'Offline';
  areas: string;
  devices: string;
  criticality: 'Tier 1' | 'Tier 2' | 'Tier 3';
  manager: string;
  managerId?: number | null;
}

/**
 * Live per-facility alert stats — deliberately NOT part of the static
 * Facility record. These are derived at runtime from AlertService so they
 * can never drift out of sync with the actual alert list.
 */
export interface FacilityAlertStats {
  activeAlertCount: number;
  activeAlertsLabel: string;
}
