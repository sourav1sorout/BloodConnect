// services/donor.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  Donor,
  ApiResponse,
  DonorRegisterPayload,
  DonorStats,
  SearchFilters,
} from '../models';

@Injectable({ providedIn: 'root' })
export class DonorService {
  private apiUrl = `${environment.apiUrl}/donors`;

  constructor(private http: HttpClient) {}

  registerDonor(
    data: DonorRegisterPayload
  ): Observable<ApiResponse<{ donor: Donor }>> {
    return this.http.post<ApiResponse<{ donor: Donor }>>(
      `${this.apiUrl}/register`,
      data
    );
  }

  getMyProfile(): Observable<ApiResponse<{ donor: Donor }>> {
    return this.http.get<ApiResponse<{ donor: Donor }>>(
      `${this.apiUrl}/my-profile`
    );
  }

  updateProfile(
    data: Partial<DonorRegisterPayload>
  ): Observable<ApiResponse<{ donor: Donor }>> {
    return this.http.put<ApiResponse<{ donor: Donor }>>(
      `${this.apiUrl}/update-profile`,
      data
    );
  }

  toggleAvailability(): Observable<ApiResponse<{ isAvailable: boolean }>> {
    return this.http.patch<ApiResponse<{ isAvailable: boolean }>>(
      `${this.apiUrl}/toggle-availability`,
      {}
    );
  }

  searchDonors(
    filters: SearchFilters
  ): Observable<ApiResponse<{ donors: Donor[] }>> {
    let params = new HttpParams();
    Object.entries(filters).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        params = params.set(key, String(val));
      }
    });
    return this.http.get<ApiResponse<{ donors: Donor[] }>>(
      `${this.apiUrl}/search`,
      { params }
    );
  }

  getDonorById(id: string): Observable<ApiResponse<{ donor: Donor }>> {
    return this.http.get<ApiResponse<{ donor: Donor }>>(
      `${this.apiUrl}/${id}`
    );
  }

  getLocations(): Observable<
    ApiResponse<{ cities: string[]; states: string[] }>
  > {
    return this.http.get<ApiResponse<{ cities: string[]; states: string[] }>>(
      `${this.apiUrl}/locations`
    );
  }

  getMyStats(): Observable<ApiResponse<{ stats: DonorStats }>> {
    return this.http.get<ApiResponse<{ stats: DonorStats }>>(
      `${this.apiUrl}/stats/me`
    );
  }
}
