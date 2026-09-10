export type Severity = 'Critical' | 'High' | 'Medium' | 'Low';
export type AlertStatus = 'Active' | 'Addressed' | 'Closed';

export interface Alert {
  id?: number;
  /** e.g. ALT-2201 */
  code: string;
  title: string;
  description: string;
  host: string;
  source: string;
  owner: string;
  /** human-readable, e.g. "2 min ago" */
  reported: string;
  /** ISO yyyy-mm-dd used for date-range filtering */
  reportedDate: string;
  /** drives the "Latest" preset filter */
  isLatest: boolean;
  severity: Severity;
  status: AlertStatus;
  /** Facility.id this alert originated from — drives the header facility filter */
  facilityId: string;
}

export type FilterType = 'all' | 'preset' | 'severity' | 'status';

export interface AlertFilter {
  type: FilterType;
  value: string;
}
