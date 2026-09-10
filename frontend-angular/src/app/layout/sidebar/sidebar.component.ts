import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AlertService } from '../../core/services/alert.service';
import { ModalService } from '../../core/services/modal.service';
import { FacilityService } from '../../core/services/facility.service';

/**
 * STATIC shell component. Only reads aggregate counts (alerts, facilities)
 * from services as read-only/computed signals — it does not know about
 * filters, pagination or selection, which all live in feature pages.
 */
@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css',
})
export class SidebarComponent {
  private readonly alertService = inject(AlertService);
  private readonly modalService = inject(ModalService);
  private readonly facilityService = inject(FacilityService);

  readonly totalAlerts = () => this.alertService.counts().total;
  readonly totalFacilities = () => this.facilityService.facilities().length;

  openRaiseAlert(): void {
    this.modalService.openRaiseAlert();
  }
}
