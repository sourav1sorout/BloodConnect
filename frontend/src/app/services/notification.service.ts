// services/notification.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiResponse, AppNotification } from '../models';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private apiUrl = `${environment.apiUrl}/notifications`;
  
  private unreadCountSubject = new BehaviorSubject<number>(0);
  public unreadCount$ = this.unreadCountSubject.asObservable();

  constructor(private http: HttpClient) {}

  getNotifications(page = 1, limit = 10): Observable<ApiResponse<{ notifications: AppNotification[], unreadCount: number }>> {
    const params = new HttpParams().set('page', page).set('limit', limit);
    return this.http.get<ApiResponse<{ notifications: AppNotification[], unreadCount: number }>>(this.apiUrl, { params })
      .pipe(
        tap(res => {
          if (res.data) {
            this.unreadCountSubject.next(res.data.unreadCount);
          }
        })
      );
  }

  markAsRead(id: string): Observable<ApiResponse<{ notification: AppNotification }>> {
    return this.http.patch<ApiResponse<{ notification: AppNotification }>>(`${this.apiUrl}/${id}/read`, {})
      .pipe(
        tap(() => {
          const current = this.unreadCountSubject.value;
          if (current > 0) this.unreadCountSubject.next(current - 1);
        })
      );
  }

  markAllAsRead(): Observable<ApiResponse> {
    return this.http.patch<ApiResponse>(`${this.apiUrl}/read-all`, {})
      .pipe(
        tap(() => this.unreadCountSubject.next(0))
      );
  }

  deleteNotification(id: string): Observable<ApiResponse> {
    return this.http.delete<ApiResponse>(`${this.apiUrl}/${id}`);
  }

  // Helper to force refresh unread count (e.g. on a timer or login)
  refreshUnreadCount(): void {
    this.getNotifications(1, 1).subscribe();
  }

  clear(): void {
    this.unreadCountSubject.next(0);
  }
}
