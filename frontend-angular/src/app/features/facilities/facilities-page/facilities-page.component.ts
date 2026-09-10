import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FacilityService } from '../../../core/services/facility.service';
import { AlertService } from '../../../core/services/alert.service';
import { FacilityFilterService } from '../../../core/services/facility-filter.service';
import { Facility, FacilityAlertStats } from '../../../core/models/facility.model';
import { FacilityDetailModalComponent } from '../facility-detail-modal/facility-detail-modal.component';

@Component({
  selector: 'app-facilities-page',
  standalone: true,
  imports: [FacilityDetailModalComponent],
  templateUrl: './facilities-page.component.html',
  styleUrl: './facilities-page.component.css',
})
export class FacilitiesPageComponent {
  private readonly facilityService = inject(FacilityService);
  private readonly alertService = inject(AlertService);
  private readonly facilityFilterService = inject(FacilityFilterService);
  private readonly router = inject(Router);

  readonly facilities = this.facilityService.facilities;
  readonly networkSummary = this.facilityService.networkSummary;
  /** Live per-facility active-alert counts, derived from AlertService — never hardcoded. */
  readonly alertStatsByFacility = this.facilityService.alertStatsByFacility;

  readonly selectedId = signal<string | null>(null);

  /**
   * The single facility whose "View Facility Details" was clicked — only
   * that facility's record (and its own live stats) are ever shown in the
   * modal.
   */
  readonly selectedFacility = computed<Facility | null>(() => {
    const id = this.selectedId();
    return id ? (this.facilities().find((f) => f.id === id) ?? null) : null;
  });

  readonly selectedFacilityStats = computed<FacilityAlertStats | null>(() => {
    const facility = this.selectedFacility();
    return facility ? this.alertStatsByFacility()[facility.id] : null;
  });

  readonly totalActiveAlerts = computed(
    () => this.alertService.alerts().filter((a) => a.status === 'Active').length
  );

  readonly criticalFacilities = computed(() => {
    const stats = this.alertStatsByFacility();
    return this.facilities().filter((f) => f.criticality === 'Tier 1' && stats[f.id]?.activeAlertCount > 0).length;
  });

  statsFor(facility: Facility): FacilityAlertStats {
    return this.alertStatsByFacility()[facility.id] ?? { activeAlertCount: 0, activeAlertsLabel: '0 Active Alerts' };
  }

  openDetail(facility: Facility): void {
    this.selectedId.set(facility.id);
  }
  closeDetail(): void {
    this.selectedId.set(null);
  }

  /** Filters the Alerts page down to only this facility's alerts. */
  goToFacilityAlerts(facility: Facility): void {
    this.facilityFilterService.select(facility.id);
    this.closeDetail();
    this.router.navigate(['/alerts']);
  }
}
