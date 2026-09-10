import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { User } from '../models/user.model';
import { API_ENDPOINTS } from '../config/api.config';

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly http = inject(HttpClient);
  private readonly _users = signal<User[]>([]);
  readonly users = this._users.asReadonly();

  constructor() {
    this.loadUsers();
  }

  private loadUsers(): void {
    this.http.get<{ data: User[] }>(`${API_ENDPOINTS.users}?assignable=true`).subscribe({
      next: ({ data }) => this._users.set(data),
      error: (error: HttpErrorResponse) => console.error('Unable to load users from the API.', error.message),
    });
  }
}
