import { Component, computed, input } from '@angular/core';
import { Severity } from '../../core/models/alert.model';
import { SEVERITY_STYLES } from '../../core/utils/alert-styles';

/**
 * Reusable severity pill. Used by AlertRow, AlertDetail and the
 * "Raise Alert" modal preview — one place to change how severity looks.
 */
@Component({
  selector: 'app-severity-badge',
  standalone: true,
  templateUrl: './severity-badge.component.html',
  styleUrl: './severity-badge.component.css',
})
export class SeverityBadgeComponent {
  readonly severity = input.required<Severity>();
  readonly showIcon = input(false);

  readonly style = computed(() => SEVERITY_STYLES[this.severity()]);
}
