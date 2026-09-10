import { Component, input, output } from '@angular/core';
import { Alert } from '../../../core/models/alert.model';
import { AlertRowComponent } from '../alert-row/alert-row.component';
import { PaginationComponent } from '../../../shared/pagination/pagination.component';

/**
 * Alert master list: sticky-header table + footer pagination.
 * Receives the already-paginated slice plus totals; contains no
 * filtering logic itself (that lives in the AlertsPage container).
 */
@Component({
  selector: 'app-alert-list',
  standalone: true,
  imports: [AlertRowComponent, PaginationComponent],
  templateUrl: './alert-list.component.html',
  styleUrl: './alert-list.component.css',
})
export class AlertListComponent {
  readonly pagedAlerts = input.required<Alert[]>();
  readonly totalMatching = input.required<number>();
  readonly selectedCode = input<string | null>(null);
  readonly pageSize = input.required<number>();
  readonly currentPage = input.required<number>();

  readonly selectAlert = output<Alert>();
  readonly pageChange = output<number>();
  readonly pageSizeChange = output<number>();
  readonly resetFilters = output<void>();

  protected readonly Math = Math;
}
