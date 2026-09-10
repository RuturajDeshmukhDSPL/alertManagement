import { Component, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Alert, AlertFilter, AlertStatus, Severity } from '../../../core/models/alert.model';
import { AlertService } from '../../../core/services/alert.service';
import { SearchService } from '../../../core/services/search.service';
import { FacilityService } from '../../../core/services/facility.service';
import { FacilityFilterService } from '../../../core/services/facility-filter.service';
import { FilterBarComponent } from '../filter-bar/filter-bar.component';
import { AlertListComponent } from '../alert-list/alert-list.component';
import { AlertDetailComponent } from '../alert-detail/alert-detail.component';
import { ConfirmCloseModalComponent } from '../confirm-close-modal/confirm-close-modal.component';
import { AlertCounts } from '../filter-bar/filter-bar.component';
import { PAGINATION_DEFAULTS } from '../../../core/constants/app.constants';

/**
 * DYNAMIC page container for the Alerts feature.
 * Owns filter/search/date/pagination/selection state and composes the
 * reusable Alerts building blocks (FilterBar, AlertList, AlertDetail).
 * This is the only piece of the app that changes shape as data changes —
 * Header and Sidebar stay static regardless of what happens here.
 *
 * Also reacts to two cross-cutting shared signals it doesn't own:
 *  - FacilityFilterService.selectedFacilityId (set from the Header dropdown
 *    or from "View Facility Alerts" in the facility detail modal)
 *  - AlertService's 30s auto-refresh — because `alerts` is a signal, any
 *    alert that arrives from the background poll flows straight through
 *    filteredAlerts/pagedAlerts with no extra wiring here.
 */
@Component({
  selector: 'app-alerts-page',
  standalone: true,
  imports: [FilterBarComponent, AlertListComponent, AlertDetailComponent, ConfirmCloseModalComponent, DatePipe],
  templateUrl: './alerts-page.component.html',
  styleUrl: './alerts-page.component.css',
})
export class AlertsPageComponent {
  private readonly alertService = inject(AlertService);
  private readonly searchService = inject(SearchService);
  private readonly facilityService = inject(FacilityService);
  private readonly facilityFilterService = inject(FacilityFilterService);

  readonly alerts = this.alertService.alerts;
  readonly searchTerm = this.searchService.term;
  readonly isRefreshing = this.alertService.isRefreshing;
  readonly lastSyncedAt = this.alertService.lastSyncedAt;

  readonly counts = computed<AlertCounts>(() => {
    const facilityId = this.selectedFacilityId();
    const list = this.alerts().filter((alert) => !facilityId || alert.facilityId === facilityId);

    const bySeverity: Record<Severity, number> = { Critical: 0, High: 0, Medium: 0, Low: 0 };
    const byStatus: Record<AlertStatus, number> = { Active: 0, Addressed: 0, Closed: 0 };
    let latest = 0;

    for (const alert of list) {
      bySeverity[alert.severity]++;
      byStatus[alert.status]++;
      if (alert.isLatest) latest++;
    }

    return { total: list.length, latest, bySeverity, byStatus };
  });

  readonly selectedFacilityId = this.facilityFilterService.selectedFacilityId;
  readonly selectedFacilityName = computed(() => {
    const id = this.selectedFacilityId();
    if (!id) return null;
    return this.facilityService.facilities().find((f) => f.id === id)?.name ?? null;
  });

  readonly filter = signal<AlertFilter>({ type: 'all', value: 'all' });
  readonly dateFrom = signal('');
  readonly dateTo = signal('');
  readonly pageSize = signal(PAGINATION_DEFAULTS.pageSize);
  readonly currentPage = signal(PAGINATION_DEFAULTS.page);
  readonly selectedCode = signal<string | null>(null);
  readonly pendingCloseCode = signal<string | null>(null);

  readonly filteredAlerts = computed<Alert[]>(() => {
    const f = this.filter();
    const query = this.searchTerm().trim().toLowerCase();
    const from = this.dateFrom();
    const to = this.dateTo();
    const facilityId = this.selectedFacilityId();

    return this.alerts().filter((a) => {
      if (facilityId && a.facilityId !== facilityId) return false;

      let matchFilter = true;
      if (f.type === 'severity') matchFilter = a.severity === f.value;
      else if (f.type === 'status') matchFilter = a.status === f.value;
      else if (f.type === 'preset' && f.value === 'latest') matchFilter = a.isLatest;

      let matchSearch = true;
      if (query) {
        const haystack = `${a.title} ${a.description} ${a.host} ${a.code} ${a.source}`.toLowerCase();
        matchSearch = haystack.includes(query);
      }

      let matchDate = true;
      if (from && a.reportedDate < from) matchDate = false;
      if (to && a.reportedDate > to) matchDate = false;

      return matchFilter && matchSearch && matchDate;
    });
  });

  readonly totalPages = computed(() => Math.max(1, Math.ceil(this.filteredAlerts().length / this.pageSize())));

  readonly pagedAlerts = computed<Alert[]>(() => {
    const page = Math.min(this.currentPage(), this.totalPages());
    const start = (page - 1) * this.pageSize();
    return this.filteredAlerts().slice(start, start + this.pageSize());
  });

  readonly selectedAlert = computed<Alert | null>(() => {
    const code = this.selectedCode();
    const list = this.alerts();
    const found = code ? list.find((a) => a.code === code) : undefined;
    return found ?? this.pagedAlerts()[0] ?? null;
  });

  readonly pendingCloseAlert = computed<Alert | null>(() => {
    const code = this.pendingCloseCode();
    return code ? (this.alerts().find((a) => a.code === code) ?? null) : null;
  });

  readonly hasActiveFilter = computed(
    () =>
      this.filter().type !== 'all' ||
      Boolean(this.searchTerm().trim()) ||
      Boolean(this.dateFrom() || this.dateTo()) ||
      Boolean(this.selectedFacilityId())
  );

  readonly headerSubtitle = computed(() => {
    const total = this.filteredAlerts().length;
    const facilityName = this.selectedFacilityName();
    if (facilityName) {
      return `${total} alert${total === 1 ? '' : 's'} at ${facilityName}`;
    }
    if (this.hasActiveFilter()) {
      return `Showing ${total} of ${this.alerts().length} alerts filtered`;
    }
    return `${this.alerts().length} alerts across your monitored systems`;
  });

  constructor() {
    // Auto-select the first row of the very first page on load.
    const first = this.alerts()[0];
    if (first) this.selectedCode.set(first.code);
  }

  onFilterChange(f: AlertFilter): void {
    this.filter.set(f);
    this.currentPage.set(1);
  }

  onDateApply(): void {
    this.currentPage.set(1);
  }

  onDateClear(): void {
    this.dateFrom.set('');
    this.dateTo.set('');
    this.currentPage.set(1);
  }

  onClearAll(): void {
    this.filter.set({ type: 'all', value: 'all' });
    this.dateFrom.set('');
    this.dateTo.set('');
    this.searchService.clear();
    this.facilityFilterService.clear();
    this.currentPage.set(1);
  }

  onClearFacility(): void {
    this.facilityFilterService.clear();
    this.currentPage.set(1);
  }

  onSelectAlert(alert: Alert): void {
    this.selectedCode.set(alert.code);
  }

  onPageChange(page: number): void {
    this.currentPage.set(page);
  }

  onPageSizeChange(size: number): void {
    this.pageSize.set(size);
    this.currentPage.set(1);
  }

  onToggleAddressed(alert: Alert): void {
    this.alertService.toggleAddressed(alert.code);
  }

  onRequestClose(alert: Alert): void {
    this.pendingCloseCode.set(alert.code);
  }

  onConfirmClose(alert: Alert): void {
    this.alertService.setStatus(alert.code, 'Closed');
    this.pendingCloseCode.set(null);
  }

  onCancelClose(): void {
    this.pendingCloseCode.set(null);
  }

  onReopen(alert: Alert): void {
    this.alertService.setStatus(alert.code, 'Active');
  }

  onManualRefresh(): void {
    this.alertService.refresh();
  }
}

