import { Injectable, signal } from '@angular/core';

/**
 * Tiny UI-state bus so the STATIC Header/Sidebar can trigger the
 * "Raise Alert" modal without owning any Alert business logic themselves.
 */
@Injectable({ providedIn: 'root' })
export class ModalService {
  readonly showRaiseAlert = signal(false);

  openRaiseAlert(): void {
    this.showRaiseAlert.set(true);
  }
  closeRaiseAlert(): void {
    this.showRaiseAlert.set(false);
  }
}
