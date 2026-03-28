// pages/search-donor/search-donor.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DonorService } from '../../services/donor.service';
import { RequestService } from '../../services/request.service';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';
import { Donor, PaginationMeta } from '../../models';

@Component({
  selector: 'app-search-donor',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ReactiveFormsModule, DatePipe],
  templateUrl: './search-donor.component.html',
  styleUrls: ['./search-donor.component.scss'],
})
export class SearchDonorComponent implements OnInit {
  donors: Donor[] = [];
  loading = false;
  viewMode: 'grid' | 'list' = 'grid';
  meta: PaginationMeta | null = null;
  isLoggedIn = false;
  bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

  filters = {
  bloodGroup: '' as any,
  city: '',
  state: '',
  isAvailable: '' as any,
  page: 1,
  limit: 10
};

  // Modal
  showRequestModal = false;
  selectedDonor: Donor | null = null;
  requestForm!: FormGroup;
  requestLoading = false;
  requestError = '';
  minDate = new Date().toISOString().slice(0, 16);

  constructor(
    private donorService: DonorService,
    private requestService: RequestService,
    public authService: AuthService,
    private toast: ToastService,
    private router: Router,
    private fb: FormBuilder
  ) {}

  ngOnInit() {
    this.authService.currentUser$.subscribe(u => this.isLoggedIn = !!u);
    this.initRequestForm();
    this.search();
  }

  initRequestForm() {
    this.requestForm = this.fb.group({
      patientName: ['', Validators.required],
      requesterContact: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
      hospitalName: ['', Validators.required],
      hospitalCity: ['', Validators.required],
      hospitalState: ['', Validators.required],
      unitsRequired: [1, Validators.required],
      urgency: ['normal', Validators.required],
      neededBy: ['', Validators.required],
      message: [''],
    });
  }

  get hasActiveFilters(): boolean {
    return !!(this.filters.bloodGroup || this.filters.city || this.filters.state);
  }

  search() {
    this.loading = true;
    this.filters.page = 1;
    this.donorService.searchDonors(this.filters).subscribe({
      next: (res) => {
        this.donors = res.data?.donors || [];
        this.meta = res.meta || null;
        this.loading = false;
      },
      error: () => { this.loading = false; this.toast.error('Search failed', 'Please try again'); },
    });
  }

  clearFilters() {
    this.filters = { bloodGroup: '', city: '', state: '', isAvailable: '', page: 1, limit: 9 };
    this.search();
  }

  changePage(page: number) {
    this.filters.page = page;
    window.scrollTo({ top: 0, behavior: 'smooth' });
    this.loading = true;
    this.donorService.searchDonors(this.filters).subscribe({
      next: (res) => {
        this.donors = res.data?.donors || [];
        this.meta = res.meta || null;
        this.loading = false;
      },
      error: () => { this.loading = false; },
    });
  }

  getPages(): number[] {
    if (!this.meta) return [];
    const { totalPages, page } = this.meta;
    const pages: number[] = [];
    const start = Math.max(1, page - 2);
    const end = Math.min(totalPages, page + 2);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  }

  viewDonor(id: string) {
    this.router.navigate(['/donor', id]);
  }

  openRequest(donor: Donor) {
    if (!this.isLoggedIn) { this.router.navigate(['/login']); return; }
    this.selectedDonor = donor;
    this.requestError = '';
    this.requestForm.reset({ unitsRequired: 1, urgency: 'normal' });
    this.showRequestModal = true;
  }

  closeModal(event: MouseEvent) {
    if ((event.target as HTMLElement).classList.contains('modal-overlay')) {
      this.showRequestModal = false;
    }
  }

  submitRequest() {
    if (this.requestForm.invalid) { this.requestForm.markAllAsTouched(); return; }
    this.requestLoading = true;
    this.requestError = '';

    const v = this.requestForm.value;
    const payload = {
      donorId: this.selectedDonor?._id || '',
      bloodGroup: this.selectedDonor?.bloodGroup || 'O+',
      patientName: v.patientName,
      requesterContact: v.requesterContact,
      hospital: { name: v.hospitalName, city: v.hospitalCity, state: v.hospitalState },
      unitsRequired: v.unitsRequired,
      urgency: v.urgency,
      neededBy: new Date(v.neededBy).toISOString(),
      message: v.message,
    };

    this.requestService.createRequest(payload).subscribe({
      next: () => {
        this.requestLoading = false;
        this.showRequestModal = false;
        this.toast.success('Request Sent!', `Your blood request has been sent to ${this.selectedDonor?.user?.name}`);
      },
      error: (err) => {
        this.requestLoading = false;
        this.requestError = err.error?.message || 'Failed to send request. Try again.';
      },
    });
  }
}
