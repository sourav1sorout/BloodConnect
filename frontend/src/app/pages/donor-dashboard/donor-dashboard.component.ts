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
  toggleLoading = false;
  profileForm!: FormGroup;
  profileLoading = false;
  profileSuccess = false;
  responseMessages: Record<string, string> = {};
  bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

  tabs: { id: string; icon: string; label: string; badge: number | null }[] = [
    { id: 'overview', icon: '📊', label: 'Overview', badge: null },
    { id: 'requests', icon: '📩', label: 'Requests', badge: null },
    { id: 'profile', icon: '👤', label: 'Edit Profile', badge: null },
];

  get userInitial(): string { return this.user?.name?.charAt(0)?.toUpperCase() || 'D'; }
  get pendingCount(): number { return this.donorRequests.filter(r => r.status === 'pending').length; }

  get statCards() {
    return [
      { icon: '📩', value: this.stats?.totalRequests || 0, label: 'Total Requests', trend: 'All time', color: 'info', filter: 'all' },
      { icon: '✅', value: this.stats?.accepted || 0, label: 'Accepted', trend: `${Math.round((this.stats?.accepted / (this.stats?.totalRequests || 1)) * 100)}%`, color: 'success', filter: 'accepted' },
      { icon: '🩸', value: this.stats?.totalDonations || 0, label: 'Donations Done', trend: 'Lives saved', color: 'blood', filter: 'completed' },
      { icon: '⏳', value: this.stats?.pending || 0, label: 'Pending', trend: 'Awaiting response', color: 'warn', filter: 'pending' },
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
        if (err.status === 404) {
          this.toast.error('Donor profile not found', 'Redirecting to registration...');
          // Optional: this.router.navigate(['/donor-register']);
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

  toggleAvailability() {
    if (!this.donor) return;
    // Optimistic update — change UI instantly
    const prevState = this.donor.isAvailable;
    this.donor.isAvailable = !prevState;
    this.toggleLoading = true;

    this.donorService.toggleAvailability().subscribe({
      next: (res) => {
        this.toggleLoading = false;
        // Confirm with server value
        if (this.donor) this.donor.isAvailable = res.data?.isAvailable ?? this.donor.isAvailable;
        this.toast.success(
          this.donor?.isAvailable ? '🟢 You are now Available' : '🔴 You are now Unavailable',
          res.message
        );
      },
      error: () => {
        // Revert on failure
        this.toggleLoading = false;
        if (this.donor) this.donor.isAvailable = prevState;
        this.toast.error('Failed to update status');
      },
    });
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
