import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AlertService } from '../../../core/services/alert.service';
import { FacilityService } from '../../../core/services/facility.service';
import { Facility } from '../../../core/models/facility.model';

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './dashboard-page.component.html',
  styleUrl: './dashboard-page.component.css',
})
export class DashboardPageComponent {
  private readonly alertService = inject(AlertService);
  private readonly facilityService = inject(FacilityService);

  readonly facilities = this.facilityService.facilities;
  readonly alertCounts = this.alertService.counts;
  readonly facilityStats = this.facilityService.alertStatsByFacility;

  readonly metrics = computed(() => {
    const counts = this.alertCounts();
    const activeCriticalAlerts = this.alertService.alerts().filter(
      (alert) => alert.status === 'Active' && alert.severity === 'Critical'
    ).length;
    return [
      {
        label: 'Total Alerts',
        value: counts.total,
        icon: 'notifications_active',
        iconClass: 'bg-blue-50 text-blue-600',
        valueClass: 'text-slate-900',
      },
      {
        label: 'Active Critical Alerts',
        value: activeCriticalAlerts,
        icon: 'priority_high',
        iconClass: 'bg-red-50 text-red-600',
        valueClass: 'text-red-600',
      },
      {
        label: 'Active Alerts',
        value: counts.byStatus.Active + counts.byStatus.Addressed,
        icon: 'warning',
        iconClass: 'bg-amber-50 text-amber-600',
        valueClass: 'text-amber-600',
      },
      {
        label: 'Closed Alerts',
        value: counts.byStatus.Closed,
        icon: 'check_circle',
        iconClass: 'bg-emerald-50 text-emerald-600',
        valueClass: 'text-emerald-600',
      },
    ];
  });

  statsFor(facility: Facility): { activeAlertCount: number; activeAlertsLabel: string } {
    return this.facilityStats()[facility.id] ?? { activeAlertCount: 0, activeAlertsLabel: '0 Active Alerts' };
  }
}
