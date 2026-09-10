import { Component, computed, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AlertFilter, AlertStatus, Severity } from '../../../core/models/alert.model';
import { SEVERITY_STYLES, STATUS_STYLES } from '../../../core/utils/alert-styles';
import { ALERT_SEVERITIES, ALERT_STATUSES } from '../../../core/constants/alert.constants';

export interface AlertCounts {
  total: number;
  latest: number;
  bySeverity: Record<Severity, number>;
  byStatus: Record<AlertStatus, number>;
}

/**
 * Filter chip bar + date-range picker.
 * Fully controlled: receives the current filter/counts/date-range as inputs
 * and emits change events — no internal alert-list knowledge. The set of
 * severities/statuses rendered as chips comes from dummy-data, not from
 * hardcoded arrays in this component.
 */
@Component({
  selector: 'app-filter-bar',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './filter-bar.component.html',
  styleUrl: './filter-bar.component.css',
})
export class FilterBarComponent {
  readonly filter = input.required<AlertFilter>();
  readonly counts = input.required<AlertCounts>();
  readonly dateFrom = input('');
  readonly dateTo = input('');
  readonly hasActiveFilter = input(false);

  readonly filterChange = output<AlertFilter>();
  readonly dateFromChange = output<string>();
  readonly dateToChange = output<string>();
  readonly applyDate = output<void>();
  readonly clearDate = output<void>();
  readonly clearAll = output<void>();

  readonly severities: Severity[] = ALERT_SEVERITIES;
  readonly statuses: AlertStatus[] = ALERT_STATUSES;
  readonly severityStyles = SEVERITY_STYLES;
  readonly statusStyles = STATUS_STYLES;

  readonly hasDateActive = computed(() => Boolean(this.dateFrom() || this.dateTo()));

  isActive(type: AlertFilter['type'], value: string): boolean {
    const f = this.filter();
    return f.type === type && f.value === value;
  }

  toggle(type: AlertFilter['type'], value: string): void {
    if (this.isActive(type, value)) {
      this.filterChange.emit({ type: 'all', value: 'all' });
    } else {
      this.filterChange.emit({ type, value });
    }
  }

  severityCount(sev: Severity): number {
    return this.counts().bySeverity[sev];
  }
  statusCount(st: AlertStatus): number {
    return this.counts().byStatus[st];
  }
}
