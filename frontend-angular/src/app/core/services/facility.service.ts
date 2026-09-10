import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Facility, FacilityAlertStats } from '../models/facility.model';
import { API_ENDPOINTS } from '../config/api.config';
import { EMPTY_ALERT_STATS, EMPTY_NETWORK_SUMMARY } from '../constants/app.constants';

interface ApiFacility extends Facility {
  activeAlertCount: number;
  activeAlertsLabel: string;
}

interface DashboardResponse {
  data: {
    facilities: {
      network: {
        operationalZones: number;
        regions: number;
        totalDevices: number;
        totalFacilities: number;
      };
    };
  };
}

@Injectable({ providedIn: 'root' })
export class FacilityService {
  private readonly http = inject(HttpClient);
  private readonly _facilities = signal<Facility[]>([]);
  readonly facilities = this._facilities.asReadonly();
  private readonly _networkSummary = signal({ ...EMPTY_NETWORK_SUMMARY });
  readonly networkSummary = this._networkSummary.asReadonly();

  readonly alertStatsByFacility = computed<Record<string, FacilityAlertStats>>(() => {
    const stats: Record<string, FacilityAlertStats> = {};
    for (const facility of this._facilities()) {
      const count = (facility as Facility & { activeAlertCount?: number }).activeAlertCount ?? 0;
      stats[facility.id] = {
        activeAlertCount: count,
        activeAlertsLabel: `${count} Active Alert${count === 1 ? '' : 's'}`,
      };
    }
    return stats;
  });

  constructor() {
    this.loadFacilities();
    this.loadNetworkSummary();
  }

  statsFor(facilityId: string): FacilityAlertStats {
    return this.alertStatsByFacility()[facilityId] ?? EMPTY_ALERT_STATS;
  }

  private loadFacilities(): void {
    this.http.get<{ data: ApiFacility[] }>(API_ENDPOINTS.facilities).subscribe({
      next: ({ data }) => this._facilities.set(data),
      error: (error: HttpErrorResponse) => console.error('Unable to load facilities from the API.', error.message),
    });
  }

  private loadNetworkSummary(): void {
    this.http.get<DashboardResponse>(API_ENDPOINTS.dashboardStats).subscribe({
      next: ({ data }) => this._networkSummary.set({ ...data.facilities.network, deviceHealthPercent: 0 }),
      error: (error: HttpErrorResponse) => console.error('Unable to load dashboard stats.', error.message),
    });
  }
}
