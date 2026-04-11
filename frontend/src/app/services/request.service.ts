// services/request.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  BloodRequest,
  ApiResponse,
  BloodRequestPayload,
  RequestStatus,
} from '../models';

@Injectable({ providedIn: 'root' })
export class RequestService {
  private apiUrl = `${environment.apiUrl}/requests`;

  constructor(private http: HttpClient) {}

  createRequest(
    data: BloodRequestPayload
  ): Observable<ApiResponse<{ request: BloodRequest }>> {
    return this.http.post<ApiResponse<{ request: BloodRequest }>>(
      this.apiUrl,
      data
    );
  }

  getMyRequests(filters?: {
    status?: RequestStatus;
    page?: number;
    limit?: number;
  }): Observable<ApiResponse<{ requests: BloodRequest[] }>> {
    let params = new HttpParams();
    if (filters) {
      Object.entries(filters).forEach(([k, v]) => {
        if (v !== undefined && v !== null)
           params = params.set(k, String(v));
      });
    }
    return this.http.get<ApiResponse<{ requests: BloodRequest[] }>>(
      `${this.apiUrl}/my-requests`,
      { params }
    );
  }

  getDonorRequests(filters?: {
    status?: RequestStatus;
    page?: number;
    limit?: number;
  }): Observable<ApiResponse<{ requests: BloodRequest[] }>> {
    let params = new HttpParams();
    if (filters) {
      Object.entries(filters).forEach(([k, v]) => {
        if (v !== undefined && v !== null)
          params = params.set(k, String(v));
      });
    }
    return this.http.get<ApiResponse<{ requests: BloodRequest[] }>>(
      `${this.apiUrl}/donor-requests`,
      { params }
    );
  }

  getRequestById(
    id: string
  ): Observable<ApiResponse<{ request: BloodRequest }>> {
    return this.http.get<ApiResponse<{ request: BloodRequest }>>(
      `${this.apiUrl}/${id}`
    );
  }

  respondToRequest(
    id: string,
    action: 'accepted' | 'rejected',
    responseMessage?: string
  ): Observable<ApiResponse<{ request: BloodRequest }>> {
    return this.http.patch<ApiResponse<{ request: BloodRequest }>>(
      `${this.apiUrl}/${id}/respond`,
      { action, responseMessage: responseMessage || '' }
    );
  }

  cancelRequest(
    id: string
  ): Observable<ApiResponse<{ request: BloodRequest }>> {
    return this.http.patch<ApiResponse<{ request: BloodRequest }>>(
      `${this.apiUrl}/${id}/cancel`,
      {}
    );
  }

  completeRequest(
    id: string
  ): Observable<ApiResponse<{ request: BloodRequest }>> {
    return this.http.patch<ApiResponse<{ request: BloodRequest }>>(
      `${this.apiUrl}/${id}/complete`,
      {}
    );
  }
  
  removeRequest(
    id: string
  ): Observable<ApiResponse<{ request: BloodRequest }>> {
    return this.http.patch<ApiResponse<{ request: BloodRequest }>>(
      `${this.apiUrl}/${id}/remove`,
      {}
    );
  }
}
