import { Component, computed, input, output } from '@angular/core';
import { PAGINATION_DEFAULTS } from '../../core/constants/app.constants';

/**
 * Reusable pagination bar (rows-per-page + prev/next + numbered pages).
 * Fully generic — driven only by counts/page-size, no knowledge of Alerts.
 */
@Component({
  selector: 'app-pagination',
  standalone: true,
  templateUrl: './pagination.component.html',
  styleUrl: './pagination.component.css',
})
export class PaginationComponent {
  readonly totalItems = input.required<number>();
  readonly pageSize = input.required<number>();
  readonly currentPage = input.required<number>();
  readonly pageSizeOptions = input<number[]>([...PAGINATION_DEFAULTS.pageSizeOptions]);

  readonly pageChange = output<number>();
  readonly pageSizeChange = output<number>();

  readonly totalPages = computed(() => Math.max(1, Math.ceil(this.totalItems() / this.pageSize())));

  readonly rangeStart = computed(() =>
    this.totalItems() === 0 ? 0 : (this.currentPage() - 1) * this.pageSize() + 1
  );
  readonly rangeEnd = computed(() => Math.min(this.currentPage() * this.pageSize(), this.totalItems()));

  readonly pages = computed(() => Array.from({ length: this.totalPages() }, (_, i) => i + 1));

  goTo(page: number): void {
    if (page < 1 || page > this.totalPages()) return;
    this.pageChange.emit(page);
  }

  onPageSizeChange(value: string): void {
    this.pageSizeChange.emit(parseInt(value, 10) || PAGINATION_DEFAULTS.fallbackPageSize);
  }
}
