import { Component, computed, input } from '@angular/core';
import { AlertStatus } from '../../core/models/alert.model';
import { STATUS_STYLES } from '../../core/utils/alert-styles';

/** Reusable lifecycle-status pill (Active / Addressed / Closed). */
@Component({
  selector: 'app-status-badge',
  standalone: true,
  templateUrl: './status-badge.component.html',
  styleUrl: './status-badge.component.css',
})
export class StatusBadgeComponent {
  readonly status = input.required<AlertStatus>();
  readonly style = computed(() => STATUS_STYLES[this.status()]);
}
