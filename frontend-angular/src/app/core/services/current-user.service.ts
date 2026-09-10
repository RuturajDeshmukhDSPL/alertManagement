import { Injectable, signal } from '@angular/core';
import { CURRENT_USER } from '../constants/current-user.constants';

/** Owns the signed-in user shown in the Header. Backed by dummy data for now. */
@Injectable({ providedIn: 'root' })
export class CurrentUserService {
  private readonly _user = signal(CURRENT_USER);
  readonly user = this._user.asReadonly();
}
