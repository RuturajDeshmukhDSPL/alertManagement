import { Component, input, output } from '@angular/core';
import { Facility, FacilityAlertStats } from '../../../core/models/facility.model';

/**
 * Shows exactly one facility — whichever one was passed in via `facility`.
 * `stats` (live active-alert count) is supplied by the parent instead of
 * being stored on the Facility record, so it can never go stale.
 */
@Component({
  selector: 'app-facility-detail-modal',
  standalone: true,
  templateUrl: './facility-detail-modal.component.html',
  styleUrl: './facility-detail-modal.component.css',
})
export class FacilityDetailModalComponent {
  readonly facility = input.required<Facility>();
  readonly stats = input.required<FacilityAlertStats>();
  readonly close = output<void>();
  readonly viewAlerts = output<void>();
}
