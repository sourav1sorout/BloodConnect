// guards/auth.guard.ts
import { Injectable } from '@angular/core';
import {
  CanActivate,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  Router,
} from '@angular/router';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router,
    private toast: ToastService
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean {
    // Not logged in
    if (!this.authService.isLoggedIn) {
      this.toast.warning('Login Required', 'Please log in to access this page.');
      this.router.navigate(['/login'], {
        queryParams: { returnUrl: state.url },
      });
      return false;
    }

    // Check role restrictions
    const allowedRoles = route.data['roles'] as string[] | undefined;
    if (allowedRoles && allowedRoles.length > 0) {
      const userRole = this.authService.currentUser?.role;
      if (!userRole || !allowedRoles.includes(userRole)) {
        this.toast.error(
          'Access Denied',
          `This page requires one of: ${allowedRoles.join(', ')}`
        );
        this.router.navigate(['/']);
        return false;
      }
    }

    return true;
  }
}
