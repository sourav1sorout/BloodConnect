// services/admin.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiResponse } from '../models';

@Injectable({ providedIn: 'root' })
export class AdminService {
  private apiUrl = `${environment.apiUrl}/admin`;

  constructor(private http: HttpClient) {}

  getDashboardStats(): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`${this.apiUrl}/stats`);
  }

  // ── Users ──────────────────────────────────────────────────────────────────
  getAllUsers(filters?: any): Observable<ApiResponse> {
    let params = new HttpParams();
    if (filters) Object.keys(filters).forEach(k => {
      if (filters[k] !== undefined && filters[k] !== '') params = params.set(k, filters[k]);
    });
    return this.http.get<ApiResponse>(`${this.apiUrl}/users`, { params });
  }

  toggleUserStatus(id: string): Observable<ApiResponse> {
    return this.http.patch<ApiResponse>(`${this.apiUrl}/users/${id}/toggle-status`, {});
  }

  deleteUser(id: string): Observable<ApiResponse> {
    return this.http.delete<ApiResponse>(`${this.apiUrl}/users/${id}`);
  }

  // ── Donors ─────────────────────────────────────────────────────────────────
  getAllDonors(filters?: any): Observable<ApiResponse> {
    let params = new HttpParams();
    if (filters) Object.keys(filters).forEach(k => {
      if (filters[k] !== undefined && filters[k] !== '') params = params.set(k, filters[k]);
    });
    return this.http.get<ApiResponse>(`${this.apiUrl}/donors`, { params });
  }

  approveDonor(id: string, approve: boolean, rejectionReason?: string): Observable<ApiResponse> {
    return this.http.patch<ApiResponse>(`${this.apiUrl}/donors/${id}/approve`, { approve, rejectionReason });
  }

  // ── Blood Requests ─────────────────────────────────────────────────────────
  getAllRequests(filters?: any): Observable<ApiResponse> {
    let params = new HttpParams();
    if (filters) Object.keys(filters).forEach(k => {
      if (filters[k] !== undefined && filters[k] !== '') params = params.set(k, filters[k]);
    });
    return this.http.get<ApiResponse>(`${this.apiUrl}/requests`, { params });
  }

  cancelRequest(id: string): Observable<ApiResponse> {
    return this.http.patch<ApiResponse>(`${this.apiUrl}/requests/${id}/cancel`, {});
  }

  respondToRequest(id: string, action: 'accepted' | 'rejected', responseMessage?: string): Observable<ApiResponse> {
    return this.http.patch<ApiResponse>(`${this.apiUrl}/requests/${id}/respond`, { action, responseMessage: responseMessage || '' });
  }

  // ── Export ─────────────────────────────────────────────────────────────────
  exportUsers(): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/export/users`, { responseType: 'blob' });
  }

  exportRequests(): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/export/requests`, { responseType: 'blob' });
  }

  // ── Bulk Email ─────────────────────────────────────────────────────────────
  sendBulkEmail(payload: { bloodGroup?: string; city?: string; subject: string; message: string }): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.apiUrl}/bulk-email`, payload);
  }

  // ── Audit Logs ─────────────────────────────────────────────────────────────
  getAuditLogs(filters?: any): Observable<ApiResponse> {
    let params = new HttpParams();
    if (filters) Object.keys(filters).forEach(k => {
      if (filters[k] !== undefined && filters[k] !== '') params = params.set(k, filters[k]);
    });
    return this.http.get<ApiResponse>(`${this.apiUrl}/audit-logs`, { params });
  }
}
