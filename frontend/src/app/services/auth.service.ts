// services/auth.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';
import { User, ApiResponse, RegisterPayload, LoginPayload } from '../models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private apiUrl = `${environment.apiUrl}/auth`;
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient, private router: Router) {
    const stored = localStorage.getItem('bc_user');
    if (stored) {
      try { this.currentUserSubject.next(JSON.parse(stored)); }
      catch { localStorage.clear(); }
    }
  }

  get currentUser(): User | null { return this.currentUserSubject.value; }
  get token(): string | null { return localStorage.getItem('bc_token'); }
  get isLoggedIn(): boolean { return !!this.token && !!this.currentUser; }
  get isAdmin(): boolean { return this.currentUser?.role === 'admin'; }
  get isDonor(): boolean { return this.currentUser?.role === 'donor'; }
  get isReceiver(): boolean { return this.currentUser?.role === 'receiver'; }

  register(data: RegisterPayload): Observable<ApiResponse<{ user: User }>> {
    return this.http
      .post<ApiResponse<{ user: User }>>(`${this.apiUrl}/register`, data)
      .pipe(tap((res) => this.handleAuth(res)));
  }

  login(email: string, password: string): Observable<ApiResponse<{ user: User }>> {
    return this.http
      .post<ApiResponse<{ user: User }>>(`${this.apiUrl}/login`, { email, password })
      .pipe(tap((res) => this.handleAuth(res)));
  }

  logout() {
    this.http.post(`${this.apiUrl}/logout`, {}).subscribe({ error: () => {} });
    localStorage.removeItem('bc_token');
    localStorage.removeItem('bc_user');
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  getMe(): Observable<ApiResponse<{ user: User }>> {
    return this.http
      .get<ApiResponse<{ user: User }>>(`${this.apiUrl}/me`)
      .pipe(
        tap((res) => {
          if (res.data?.user) {
            this.currentUserSubject.next(res.data.user);
            localStorage.setItem('bc_user', JSON.stringify(res.data.user));
          }
        })
      );
  }

  updateProfile(data: Partial<User>): Observable<ApiResponse<{ user: User }>> {
    return this.http
      .put<ApiResponse<{ user: User }>>(`${this.apiUrl}/update-profile`, data)
      .pipe(
        tap((res) => {
          if (res.data?.user) {
            this.currentUserSubject.next(res.data.user);
            localStorage.setItem('bc_user', JSON.stringify(res.data.user));
          }
        })
      );
  }

  changePassword(data: {
    currentPassword: string;
    newPassword: string;
  }): Observable<ApiResponse> {
    return this.http
      .put<ApiResponse>(`${this.apiUrl}/change-password`, data)
      .pipe(tap((res) => this.handleAuth(res)));
  }

  private handleAuth(res: ApiResponse<any>) {
    if (res.accessToken) {
      localStorage.setItem('bc_token', res.accessToken);
    }
    if (res.data?.user) {
      this.currentUserSubject.next(res.data.user);
      localStorage.setItem('bc_user', JSON.stringify(res.data.user));
    }
  }
}
