import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map } from 'rxjs';
import { SearchService } from '../../core/services/search.service';
import { ModalService } from '../../core/services/modal.service';
import { AlertService } from '../../core/services/alert.service';
import { CurrentUserService } from '../../core/services/current-user.service';
import { FacilityService } from '../../core/services/facility.service';
import { FacilityFilterService } from '../../core/services/facility-filter.service';

/**
 * STATIC shell component — same markup on every route.
 * It never reads alert data directly; it only forwards user intent
 * (search text, facility selection, "raise alert" click) through shared
 * services so the dynamic Alerts feature can react independently.
 *
 * Two route-aware behaviors live here on purpose (they're about the
 * Header's own layout, not about Alerts business logic):
 *  - the global search box is hidden while on /facilities and reappears
 *    on /alerts
 *  - the facility dropdown only lists facilities that actually exist
 *    (read live from FacilityService, never hardcoded)
 */
@Component({
  selector: 'app-header',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css',
})
export class HeaderComponent {
  private readonly searchService = inject(SearchService);
  private readonly modalService = inject(ModalService);
  private readonly alertService = inject(AlertService);
  private readonly currentUserService = inject(CurrentUserService);
  private readonly facilityService = inject(FacilityService);
  private readonly facilityFilterService = inject(FacilityFilterService);
  private readonly router = inject(Router);

  readonly searchTerm = this.searchService.term;
  readonly profileMenuOpen = signal(false);
  readonly currentUser = this.currentUserService.user;

  readonly facilities = this.facilityService.facilities;
  readonly selectedFacilityId = this.facilityFilterService.selectedFacilityId;

  private readonly currentUrl = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map((e) => e.urlAfterRedirects)
    ),
    { initialValue: this.router.url }
  );

  /** Global alert filters are only shown on the Alerts page. */
  readonly showSearch = computed(() => {
    const url = this.currentUrl();
    return !url.startsWith('/facilities') && !url.startsWith('/dashboard');
  });
  readonly showFacilitySelector = computed(() => {
    const url = this.currentUrl();
    return !url.startsWith('/facilities') && !url.startsWith('/dashboard');
  });

  onSearchChange(value: string): void {
    this.searchService.setTerm(value);
  }

  onFacilityChange(value: string): void {
    this.facilityFilterService.select(value === 'all' ? null : value);
  }

  toggleProfileMenu(): void {
    this.profileMenuOpen.update((v) => !v);
  }
  closeProfileMenu(): void {
    this.profileMenuOpen.set(false);
  }

  openRaiseAlert(): void {
    this.modalService.openRaiseAlert();
  }

  logout(): void {
    this.closeProfileMenu();
    if (confirm('Are you sure you want to log out of PulseAlert?')) {
      location.reload();
    }
  }

  get openIncidentCount(): number {
    return this.alertService.counts().total;
  }
}
