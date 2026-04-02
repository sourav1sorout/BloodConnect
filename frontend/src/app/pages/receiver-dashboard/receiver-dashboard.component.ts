// pages/receiver-dashboard/receiver-dashboard.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { RequestService } from '../../services/request.service';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';
import { BloodRequest, User } from '../../models';

@Component({
  selector: 'app-receiver-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, DatePipe, FormsModule],
  templateUrl: './receiver-dashboard.component.html',
  styleUrls: ['./receiver-dashboard.component.scss'],
})
export class ReceiverDashboardComponent implements OnInit {
  user: User | null = null;
  requests: BloodRequest[] = [];
  loading = false;
  filter = '';

  constructor(
    private requestService: RequestService,
    private authService: AuthService,
    private toast: ToastService
  ) {}

  ngOnInit() {
    this.authService.currentUser$.subscribe(u => this.user = u);
    this.loadRequests();
  }

  loadRequests() {
    this.loading = true;
    const params: any = {};
    if (this.filter) params.status = this.filter;

    this.requestService.getMyRequests(params).subscribe({
      next: (res) => {
        this.requests = res.data?.requests || [];
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.toast.error('Failed to load requests');
      },
    });
  }

  cancelRequest(id: string) {
    if (!confirm('Are you sure you want to cancel this request?')) return;
    this.requestService.cancelRequest(id).subscribe({
      next: () => {
        this.toast.success('Request Cancelled');
        this.loadRequests();
      },
      error: (err) => this.toast.error('Failed', err.error?.message),
    });
  }

  completeRequest(id: string) {
     if (!confirm('Mark this request as completed (Blood Received)?')) return;
     this.requestService.completeRequest(id).subscribe({
       next: () => {
         this.toast.success('Request Completed!');
         this.loadRequests();
       },
       error: (err) => this.toast.error('Failed', err.error?.message),
     });
  }

  get filteredRequests() {
    if (!this.filter) return this.requests;
    return this.requests.filter(r => r.status === this.filter);
  }

  countByStatus(status: string): number {
    return this.requests.filter(r => r.status === status).length;
  }
}
