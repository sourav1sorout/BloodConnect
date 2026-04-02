// app.routes.ts
import { Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/home/home.component').then((m) => m.HomeComponent),
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./pages/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./pages/register/register.component').then((m) => m.RegisterComponent),
  },
  {
    path: 'search',
    loadComponent: () =>
      import('./pages/search-donor/search-donor.component').then((m) => m.SearchDonorComponent),
  },
  {
    path: 'donor/:id',
    loadComponent: () =>
      import('./pages/donor-profile/donor-profile.component').then((m) => m.DonorProfileComponent),
  },
  {
    path: 'donor-register',
    loadComponent: () =>
      import('./pages/donor-register/donor-register.component').then((m) => m.DonorRegisterComponent),
    canActivate: [AuthGuard],
  },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./pages/donor-dashboard/donor-dashboard.component').then((m) => m.DonorDashboardComponent),
    canActivate: [AuthGuard],
  },
  {
    path: 'my-requests',
    loadComponent: () =>
      import('./pages/receiver-dashboard/receiver-dashboard.component').then((m) => m.ReceiverDashboardComponent),
    canActivate: [AuthGuard],
  },
  {
    path: 'admin',
    loadComponent: () =>
      import('./pages/admin-dashboard/admin-dashboard.component').then((m) => m.AdminDashboardComponent),
    canActivate: [AuthGuard],
    data: { roles: ['admin'] },
  },
  {
    path: '**',
    redirectTo: '',
  },
];
