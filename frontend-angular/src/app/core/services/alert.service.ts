import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { Alert, AlertStatus, Severity } from '../models/alert.model';
import { API_DEFAULTS, API_ENDPOINTS } from '../config/api.config';
import { AUTO_REFRESH_INTERVAL_MS, TIME_MS } from '../constants/app.constants';

interface ApiAlert {
  id: number;
  code: string;
  title: string;
  description: string;
  host: string;
  source: string;
  severity: Severity;
  status: AlertStatus;
  ownerId: number | null;
  owner: string;
  facilityId: string;
  reportedDate: string;
  reportedAt: string;
  isLatest: boolean;
}

interface AlertListResponse { data: ApiAlert[]; }

@Injectable({ providedIn: 'root' })
export class AlertService {
  private readonly http = inject(HttpClient);
  private readonly destroyRef = inject(DestroyRef);
  private readonly _alerts = signal<Alert[]>([]);
  readonly alerts = this._alerts.asReadonly();
  private readonly _isRefreshing = signal(false);
  readonly isRefreshing = this._isRefreshing.asReadonly();
  private readonly _lastSyncedAt = signal<Date>(new Date(0));
  readonly lastSyncedAt = this._lastSyncedAt.asReadonly();

  readonly counts = computed(() => {
    const list = this._alerts();
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

  constructor() {
    this.refresh();
    const intervalId = setInterval(() => this.refresh(), AUTO_REFRESH_INTERVAL_MS);
    this.destroyRef.onDestroy(() => clearInterval(intervalId));
  }

  refresh(): void {
    if (this._isRefreshing()) return;
    this._isRefreshing.set(true);
    this.http.get<AlertListResponse>(
      `${API_ENDPOINTS.alerts}?page=${API_DEFAULTS.alertsPage}&pageSize=${API_DEFAULTS.alertsPageSize}`
    ).subscribe({
      next: (response) => {
        this._alerts.set(response.data.map((alert) => this.toAlert(alert)));
        this._lastSyncedAt.set(new Date());
        this._isRefreshing.set(false);
      },
      error: (error: HttpErrorResponse) => {
        console.error('Unable to load alerts from the API.', error.message);
        this._isRefreshing.set(false);
      },
    });
  }

  addAlert(input: {
    title: string;
    host: string;
    source: string;
    severity: Severity;
    ownerId: number | null;
    status: AlertStatus;
    description: string;
    facilityId: string;
  }): Observable<{ data: ApiAlert }> {
    return this.http.post<{ data: ApiAlert }>(API_ENDPOINTS.alerts, {
      title: input.title,
      host: input.host,
      source: input.source,
      severity: input.severity,
      status: input.status,
      ownerId: input.ownerId,
      description: input.description,
      facilityId: input.facilityId,
    }).pipe(tap(({ data }) => this._alerts.update((alerts) => [this.toAlert(data), ...alerts])));
  }

  setStatus(code: string, status: AlertStatus): void {
    const alert = this._alerts().find((item) => item.code === code);
    if (!alert?.id) return;
    this.http.put<{ data: ApiAlert }>(`${API_ENDPOINTS.alerts}/${alert.id}`, { status }).subscribe({
      next: ({ data }) => this.replaceAlert(data),
      error: (error: HttpErrorResponse) => console.error('Unable to update alert.', error.message),
    });
  }

  toggleAddressed(code: string): void {
    const current = this._alerts().find((alert) => alert.code === code);
    if (current) this.setStatus(code, current.status === 'Addressed' ? 'Active' : 'Addressed');
  }

  private replaceAlert(alert: ApiAlert): void {
    this._alerts.update((alerts) => alerts.map((item) => item.id === alert.id ? this.toAlert(alert) : item));
  }

  private toAlert(alert: ApiAlert): Alert {
    return {
      id: alert.id,
      code: alert.code,
      title: alert.title,
      description: alert.description,
      host: alert.host,
      source: alert.source,
      owner: alert.owner,
      reported: this.relativeTime(alert.reportedAt),
      reportedDate: alert.reportedDate,
      isLatest: alert.isLatest,
      severity: alert.severity,
      status: alert.status,
      facilityId: alert.facilityId,
    };
  }

  private relativeTime(value: string): string {
    const minutes = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / TIME_MS.minute));
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes} min ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hr ago`;
    return `${Math.floor(hours / 24)} days ago`;
  }
}
