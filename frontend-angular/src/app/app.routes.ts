import { Routes } from '@angular/router';
import { AlertsPageComponent } from './features/alerts/alerts-page/alerts-page.component';
import { FacilitiesPageComponent } from './features/facilities/facilities-page/facilities-page.component';
import { DashboardPageComponent } from './features/dashboard/dashboard-page/dashboard-page.component';

export const routes: Routes = [
  { path: 'dashboard', component: DashboardPageComponent, title: 'Dashboard · PulseAlert' },
  { path: 'alerts', component: AlertsPageComponent, title: 'Alerts · PulseAlert' },
  { path: 'facilities', component: FacilitiesPageComponent, title: 'Facility Management · PulseAlert' },
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: '**', redirectTo: 'dashboard' },
];
