import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './layout/header/header.component';
import { SidebarComponent } from './layout/sidebar/sidebar.component';
import { RaiseAlertModalComponent } from './features/alerts/raise-alert-modal/raise-alert-modal.component';
import { ModalService } from './core/services/modal.service';

/**
 * Application shell.
 * Header + Sidebar are STATIC — they render once and never change shape
 * regardless of which route/page is active.
 * The routed page (Alerts / Facilities) is the DYNAMIC region.
 */
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent, SidebarComponent, RaiseAlertModalComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
  protected readonly modalService = inject(ModalService);
}
