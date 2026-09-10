import { Component, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AlertService } from '../../../core/services/alert.service';
import { ModalService } from '../../../core/services/modal.service';
import { FacilityService } from '../../../core/services/facility.service';
import { UserService } from '../../../core/services/user.service';
import { AlertStatus, Severity } from '../../../core/models/alert.model';
import {
  ALERT_FORM_SOURCES,
  ALERT_SEVERITIES,
} from '../../../core/constants/alert.constants';

/**
 * "Raise Alert" dialog. Opened globally (from the static Header or Sidebar)
 * via ModalService, but writes directly into AlertService — the dynamic
 * Alerts list picks the new row up automatically through signals.
 *
 * Dropdown/radio option lists are imported from dummy-data instead of
 * being hardcoded in this component. The Facility list comes live from
 * FacilityService.
 */
@Component({
  selector: 'app-raise-alert-modal',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './raise-alert-modal.component.html',
  styleUrl: './raise-alert-modal.component.css',
})
export class RaiseAlertModalComponent {
  private readonly alertService = inject(AlertService);
  private readonly modalService = inject(ModalService);
  private readonly facilityService = inject(FacilityService);
  private readonly userService = inject(UserService);

  readonly sources = ALERT_FORM_SOURCES;
  readonly users = this.userService.users;
  readonly severities: Severity[] = ALERT_SEVERITIES;
  readonly facilities = this.facilityService.facilities;

  readonly title = signal('');
  readonly host = signal('');
  readonly source = signal(this.sources[0]);
  readonly severity = signal<Severity>(this.severities[0]);
  readonly ownerId = signal<number | null>(null);
  readonly status = signal<AlertStatus>('Active');
  readonly description = signal('');
  readonly facilityId = signal(this.facilities()[0]?.id ?? '');

  readonly submitAttempted = signal(false);
  readonly isSubmitting = signal(false);
  readonly submitError = signal('');

  constructor() {
    effect(() => {
      const firstUserId = this.users()[0]?.id;
      if (this.ownerId() === null && firstUserId !== undefined) this.ownerId.set(firstUserId);
    });
    effect(() => {
      const firstFacilityId = this.facilities()[0]?.id;
      if (!this.facilityId() && firstFacilityId) this.facilityId.set(firstFacilityId);
    });
  }

  close(): void {
    this.modalService.closeRaiseAlert();
    this.resetForm();
  }

  submit(): void {
    this.submitAttempted.set(true);
    this.submitError.set('');
    if (!this.title().trim() || !this.host().trim() || !this.source() || !this.facilityId()) {
      if (!this.facilityId()) {
      this.submitError.set('Select a facility before submitting the alert.');
      }
      return;
    }

    this.isSubmitting.set(true);
    this.alertService.addAlert({
      title: this.title().trim(),
      host: this.host().trim(),
      source: this.source(),
      severity: this.severity(),
      ownerId: this.ownerId(),
      status: this.status(),
      description: this.description().trim(),
      facilityId: this.facilityId(),
    }).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.close();
      },
      error: (error: { error?: { message?: string } }) => {
        this.isSubmitting.set(false);
        this.submitError.set(error.error?.message ?? 'Unable to submit alert. Check that the API is running.');
      },
    });
  }

  private resetForm(): void {
    this.title.set('');
    this.host.set('');
    this.source.set(this.sources[0]);
    this.severity.set(this.severities[0]);
    this.ownerId.set(this.users()[0]?.id ?? null);
    this.status.set('Active');
    this.description.set('');
    this.facilityId.set(this.facilities()[0]?.id ?? '');
    this.submitAttempted.set(false);
    this.isSubmitting.set(false);
    this.submitError.set('');
  }
}
