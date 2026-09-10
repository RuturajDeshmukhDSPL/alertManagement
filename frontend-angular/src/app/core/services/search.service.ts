import { Injectable, signal } from '@angular/core';

/**
 * Holds the global search box value (rendered in the static Header)
 * so the dynamic Alerts page can react to it without the Header
 * needing to know anything about alerts.
 */
@Injectable({ providedIn: 'root' })
export class SearchService {
  readonly term = signal('');

  setTerm(value: string): void {
    this.term.set(value);
  }
  clear(): void {
    this.term.set('');
  }
}
