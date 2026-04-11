// pages/donor-dashboard/donor-dashboard.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DonorService } from '../../services/donor.service';
import { RequestService } from '../../services/request.service';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';
import { Donor, BloodRequest, User } from '../../models';

@Component({
  selector: 'app-donor-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ReactiveFormsModule, DatePipe],
  templateUrl: './donor-dashboard.component.html',
  styleUrls: ['./donor-dashboard.component.scss'],
})
export class DonorDashboardComponent implements OnInit {
  activeTab = 'overview';
  user: User | null = null;
  donor: Donor | null = null;
  stats: any = null;
  recentRequests: BloodRequest[] = [];
  donorRequests: BloodRequest[] = [];
  requestFilter = '';
  requestsLoading = false;
  loadingProfile = true; // New loading state
  profileForm!: FormGroup;
  profileLoading = false;
  profileSuccess = false;
  responseMessages: Record<string, string> = {};
  bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

  tabs: { id: string; icon: string; label: string; badge: number | null }[] = [
    { id: 'overview', icon: '📊', label: 'Overview', badge: null },
    { id: 'requests', icon: '📩', label: 'Requests', badge: null },
];

  get userInitial(): string { return this.user?.name?.charAt(0)?.toUpperCase() || 'D'; }
  get pendingCount(): number { return this.donorRequests.filter(r => r.status === 'pending').length; }

  get statCards() {
    const totalReqs = (this.stats?.pending || 0) + (this.stats?.accepted || 0) + (this.stats?.completed || 0) + (this.stats?.rejected || 0);

    return [
      { id: 'donations', icon: '🏆', value: this.donor?.totalDonations || 0, label: 'Total Donations', trend: 'Lives Saved', color: 'blood', filter: 'completed' },
      { id: 'pending', icon: '⏳', value: this.stats?.pending || 0, label: 'Pending Requests', trend: 'Awaiting Response', color: 'warn', filter: 'pending' },
      { id: 'accepted', icon: '✅', value: this.stats?.accepted || 0, label: 'Accepted Requests', trend: 'Scheduled', color: 'success', filter: 'accepted' },
      { id: 'completed', icon: '🏁', value: this.stats?.completed || 0, label: 'Completed Donations', trend: 'Finished', color: 'primary', filter: 'completed' },
      { id: 'rejected', icon: '❌', value: this.stats?.rejected || 0, label: 'Rejected Requests', trend: 'Cancelled', color: 'danger', filter: 'rejected' },
      { id: 'total', icon: '📩', value: totalReqs, label: 'Total Requests', trend: 'All Time', color: 'info', filter: '' },
      { id: 'blood', icon: '🩸', value: this.donor?.bloodGroup || '?', label: 'Blood Group', trend: 'Verified', color: 'info', filter: '' },
      { id: 'status', icon: '🛡️', value: this.donor?.isApproved ? 'Approved' : 'Pending', label: 'Account Status', trend: 'Verification', color: this.donor?.isApproved ? 'success' : 'warn', filter: '' },
      { id: 'rating', icon: '⭐', value: this.donor?.rating?.average || '5.0', label: 'Donor Rating', trend: 'From Receivers', color: 'warn', filter: '' },
    ];
  }

  constructor(
    private donorService: DonorService,
    private requestService: RequestService,
    private authService: AuthService,
    private toast: ToastService,
    private fb: FormBuilder
  ) {}

  ngOnInit() {
    this.authService.currentUser$.subscribe(u => this.user = u);
    this.loadProfile();
  }

  loadProfile() {
    this.loadingProfile = true;
    this.donorService.getMyProfile().subscribe({
      next: (res) => {
        this.donor = res.data?.donor || null;
        if (this.donor) {
          this.initProfileForm();
          this.loadStats();
          this.loadRecentRequests();
          this.loadRequests();
          this.updateTabs();
        }
        this.loadingProfile = false;
      },
      error: (err) => {
        this.loadingProfile = false;
        if (err.status !== 404) {
           this.toast.error('Failed to load profile', err.error?.message);
        }
      },
    });
  }

  loadStats() {
    this.donorService.getMyStats().subscribe({
      next: (res) => { this.stats = res.data?.stats; },
    });
  }

  loadRecentRequests() {
    this.requestService.getDonorRequests({ limit: 5 }).subscribe({
      next: (res) => { this.recentRequests = res.data?.requests || []; },
    });
  }

  loadRequests() {
    this.requestsLoading = true;
    const filters: any = {};
    if (this.requestFilter) filters.status = this.requestFilter;
    this.requestService.getDonorRequests(filters).subscribe({
      next: (res) => {
        this.donorRequests = res.data?.requests || [];
        this.requestsLoading = false;
        this.updateTabs();
      },
      error: () => { this.requestsLoading = false; },
    });
  }

  updateTabs() {
    if (!this.tabs[1]) return;
    const pending = this.donorRequests.filter(r => r.status === 'pending').length;
    this.tabs[1].badge = pending > 0 ? pending : null;
  }

  respond(id: string, action: 'accepted' | 'rejected', message?: string) {
    this.requestService.respondToRequest(id, action, message).subscribe({
      next: (res) => {
        this.toast.success(`Request ${action}!`, res.message);
        this.loadRequests();
        this.loadRecentRequests();
        this.loadStats();
      },
      error: (err) => { this.toast.error('Failed', err.error?.message); },
    });
  }

  onStatClick(filter: string) {
    if (filter === undefined) return;
    this.activeTab = 'requests';
    this.requestFilter = (filter === 'all' || filter === '') ? '' : filter;
    this.loadRequests();
  }

  initProfileForm() {
    const d = this.donor!;
    this.profileForm = this.fb.group({
      bloodGroup: [d.bloodGroup, Validators.required],
      age: [d.age, [Validators.required, Validators.min(18), Validators.max(65)]],
      gender: [d.gender, Validators.required],
      weight: [d.weight || ''],
      city: [d.address?.city, Validators.required],
      state: [d.address?.state, Validators.required],
      street: [d.address?.street || ''],
      pincode: [d.address?.pincode || ''],
      bio: [d.bio || ''],
      medicalConditions: [d.medicalConditions || 'None'],
    });
  }

  updateProfile() {
    if (this.profileForm.invalid) { this.profileForm.markAllAsTouched(); return; }
    this.profileLoading = true;
    const v = this.profileForm.value;
    const payload = {
      bloodGroup: v.bloodGroup,
      age: v.age,
      gender: v.gender,
      weight: v.weight || undefined,
      address: {
        street: v.street || '',
        city: v.city,
        state: v.state,
        pincode: v.pincode,
        country: 'India'
      },
      bio: v.bio,
      medicalConditions: v.medicalConditions,
    };
    this.donorService.updateProfile(payload).subscribe({
      next: (res) => {
        this.profileLoading = false;
        this.profileSuccess = true;
        this.donor = res.data?.donor || this.donor;
        this.toast.success('Profile Updated!');
        setTimeout(() => this.profileSuccess = false, 3000);
      },
      error: (err) => {
        this.profileLoading = false;
        this.toast.error('Update Failed', err.error?.message);
      },
    });
  }
}
