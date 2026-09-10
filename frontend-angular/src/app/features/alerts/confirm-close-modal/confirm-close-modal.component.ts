import { Component, input, output } from '@angular/core';
import { Alert } from '../../../core/models/alert.model';

/** Small confirmation dialog before closing an alert. Stateless. */
@Component({
  selector: 'app-confirm-close-modal',
  standalone: true,
  templateUrl: './confirm-close-modal.component.html',
  styleUrl: './confirm-close-modal.component.css',
})
export class ConfirmCloseModalComponent {
  readonly alert = input.required<Alert>();
  readonly confirm = output<Alert>();
  readonly cancel = output<void>();
}
