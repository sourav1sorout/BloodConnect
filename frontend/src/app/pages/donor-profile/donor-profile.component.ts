// pages/donor-profile/donor-profile.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DonorService } from '../../services/donor.service';
import { RequestService } from '../../services/request.service';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';
import { Donor } from '../../models';

@Component({
  selector: 'app-donor-profile',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, DatePipe],
  templateUrl: './donor-profile.component.html',
  styleUrls: ['./donor-profile.component.scss'],
})
export class DonorProfileComponent implements OnInit {
  donor: Donor | null = null;
  loading = true;
  isLoggedIn = false;
  showModal = false;
  requestForm!: FormGroup;
  requestLoading = false;
  requestError = '';
  minDate = new Date().toISOString().slice(0, 16);

  // Compatibility map
  private compatibility: Record<string, { donate: string[]; receive: string[] }> = {
    'A+':  { donate: ['A+','AB+'], receive: ['A+','A-','O+','O-'] },
    'A-':  { donate: ['A+','A-','AB+','AB-'], receive: ['A-','O-'] },
    'B+':  { donate: ['B+','AB+'], receive: ['B+','B-','O+','O-'] },
    'B-':  { donate: ['B+','B-','AB+','AB-'], receive: ['B-','O-'] },
    'AB+': { donate: ['AB+'], receive: ['A+','A-','B+','B-','AB+','AB-','O+','O-'] },
    'AB-': { donate: ['AB+','AB-'], receive: ['AB-','A-','B-','O-'] },
    'O+':  { donate: ['A+','B+','AB+','O+'], receive: ['O+','O-'] },
    'O-':  { donate: ['A+','A-','B+','B-','AB+','AB-','O+','O-'], receive: ['O-'] },
  };

  constructor(
    private route: ActivatedRoute,
    private donorService: DonorService,
    private requestService: RequestService,
    private authService: AuthService,
    private toast: ToastService,
    private fb: FormBuilder
  ) {}

  ngOnInit() {
    this.authService.currentUser$.subscribe(u => this.isLoggedIn = !!u);
    this.initForm();
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.donorService.getDonorById(id).subscribe({
        next: (res) => { this.donor = res.data?.donor || null; this.loading = false; },
        error: () => { this.donor = null; this.loading = false; },
      });
    }
  }

  initForm() {
    this.requestForm = this.fb.group({
      patientName: ['', Validators.required],
      requesterContact: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
      hospitalName: ['', Validators.required],
      hospitalCity: ['', Validators.required],
      hospitalState: ['', Validators.required],
      unitsRequired: [1],
      urgency: ['normal'],
      neededBy: ['', Validators.required],
      message: [''],
    });
  }

  getDonateGroups(): string[] {
    return this.compatibility[this.donor?.bloodGroup || '']?.donate || [];
  }
  getReceiveGroups(): string[] {
    return this.compatibility[this.donor?.bloodGroup || '']?.receive || [];
  }

  closeModal(e: MouseEvent) {
    if ((e.target as HTMLElement).classList.contains('modal-overlay')) this.showModal = false;
  }

  submitRequest() {
    if (this.requestForm.invalid) { this.requestForm.markAllAsTouched(); return; }
    this.requestLoading = true;
    this.requestError = '';
    const v = this.requestForm.value;
    this.requestService.createRequest({
      donorId: this.donor?._id || '',
      bloodGroup: this.donor?.bloodGroup || 'O+',
      patientName: v.patientName,
      requesterContact: v.requesterContact,
      hospital: { name: v.hospitalName, city: v.hospitalCity, state: v.hospitalState },
      unitsRequired: v.unitsRequired,
      urgency: v.urgency,
      neededBy: new Date(v.neededBy).toISOString(),
      message: v.message,
    }).subscribe({
      next: () => {
        this.requestLoading = false;
        this.showModal = false;
        this.toast.success('Request Sent!', `Blood request sent to ${this.donor?.user?.name}`);
      },
      error: (err) => {
        this.requestLoading = false;
        this.requestError = err.error?.message || 'Request failed.';
      },
    });
  }
}
