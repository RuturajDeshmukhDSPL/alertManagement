import { Component, input, output } from '@angular/core';
import { Alert } from '../../../core/models/alert.model';
import { SeverityBadgeComponent } from '../../../shared/severity-badge/severity-badge.component';
import { StatusBadgeComponent } from '../../../shared/status-badge/status-badge.component';
import { SEVERITY_STYLES } from '../../../core/utils/alert-styles';

/** One row of the alert master list. Purely presentational + one output. */
@Component({
  // Attribute selector: this component's root node IS a <tr>, so it must be
  // used as `<tr app-alert-row>` inside a real <table>/<tbody> — the browser's
  // HTML parser does not allow a custom element to wrap a <tr> directly.
  selector: 'tr[app-alert-row]',
  standalone: true,
  imports: [SeverityBadgeComponent, StatusBadgeComponent],
  templateUrl: './alert-row.component.html',
  styleUrl: './alert-row.component.css',
  host: {
    class: 'group hover:bg-blue-50/40 cursor-pointer transition-colors border-l-4',
    '[class.border-l-blue-600]': 'selected()',
    '[class.bg-blue-50/20]': 'selected()',
    '[class.border-l-transparent]': '!selected()',
    '(click)': 'onRowClick()',
  },
})
export class AlertRowComponent {
  readonly alert = input.required<Alert>();
  readonly selected = input(false);

  readonly select = output<Alert>();
  readonly inspect = output<Alert>();

  readonly severityStyles = SEVERITY_STYLES;

  onRowClick(): void {
    this.select.emit(this.alert());
  }

  onInspectClick(event: MouseEvent): void {
    event.stopPropagation();
    this.inspect.emit(this.alert());
  }
}
