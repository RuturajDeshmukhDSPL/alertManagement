import { Injectable, signal } from '@angular/core';

/**
 * Holds the currently selected facility (from the Header's facility
 * dropdown, or from "View Facility Alerts" in the Facility detail modal).
 * The dynamic Alerts page reads this to restrict its list — the Header
 * itself has no idea how alerts get filtered.
 */
@Injectable({ providedIn: 'root' })
export class FacilityFilterService {
  /** null = "All Facilities" */
  readonly selectedFacilityId = signal<string | null>(null);

  select(facilityId: string | null): void {
    this.selectedFacilityId.set(facilityId);
  }

  clear(): void {
    this.selectedFacilityId.set(null);
  }
}
