import { Component, computed, inject, input, output } from '@angular/core';
import { Alert } from '../../../core/models/alert.model';
import { SeverityBadgeComponent } from '../../../shared/severity-badge/severity-badge.component';
import { StatusBadgeComponent } from '../../../shared/status-badge/status-badge.component';
import { SEVERITY_STYLES } from '../../../core/utils/alert-styles';
import { FacilityService } from '../../../core/services/facility.service';

/**
 * Incident inspector / triage panel (right pane).
 * Stateless: renders whichever Alert it's given and emits intents
 * (mark addressed / close / reopen) for the container to handle.
 */
@Component({
  selector: 'app-alert-detail',
  standalone: true,
  imports: [SeverityBadgeComponent, StatusBadgeComponent],
  templateUrl: './alert-detail.component.html',
  styleUrl: './alert-detail.component.css',
})
export class AlertDetailComponent {
  private readonly facilityService = inject(FacilityService);

  readonly alert = input<Alert | null>(null);

  readonly toggleAddressed = output<Alert>();
  readonly requestClose = output<Alert>();
  readonly reopen = output<Alert>();

  readonly severityStyles = SEVERITY_STYLES;

  readonly facilityName = computed(() => {
    const a = this.alert();
    if (!a) return null;
    return this.facilityService.facilities().find((f) => f.id === a.facilityId)?.name ?? a.facilityId;
  });
}
