// pages/donor-register/donor-register.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DonorService } from '../../services/donor.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-donor-register',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: './donor-register.component.html',
  styleUrls: ['./donor-register.component.scss'],
})
export class DonorRegisterComponent implements OnInit {
  donorForm!: FormGroup;
  loading = false;
  errorMsg = '';
  currentStep = 0;
  bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

  steps = [
    { label: 'Personal Info' },
    { label: 'Location' },
    { label: 'Review' },
  ];

  indianStates = [
    'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat',
    'Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh',
    'Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab',
    'Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh',
    'Uttarakhand','West Bengal','Delhi','Jammu and Kashmir','Ladakh',
    'Puducherry','Chandigarh',
  ];

  constructor(private fb: FormBuilder, private donorService: DonorService, private router: Router, private toast: ToastService) {}

  ngOnInit() {
    this.donorForm = this.fb.group({
      bloodGroup: ['', Validators.required],
      age: ['', [Validators.required, Validators.min(18), Validators.max(65)]],
      gender: ['', Validators.required],
      weight: [''],
      bio: ['', Validators.maxLength(300)],
      medicalConditions: ['None'],
      city: ['', Validators.required],
      state: ['', Validators.required],
      street: [''],
      pincode: ['', Validators.pattern(/^[0-9]{6}$/)],
    });
  }

  isInvalid(field: string): boolean {
    const ctrl = this.donorForm.get(field);
    return !!(ctrl?.invalid && ctrl?.touched);
  }

  nextStep() {
    const step0Fields = ['bloodGroup', 'age', 'gender'];
    const step1Fields = ['city', 'state'];
    const fields = this.currentStep === 0 ? step0Fields : step1Fields;

    fields.forEach(f => this.donorForm.get(f)?.markAsTouched());
    const valid = fields.every(f => this.donorForm.get(f)?.valid);
    if (valid) this.currentStep++;
  }

  submit() {
    if (this.donorForm.invalid) { this.donorForm.markAllAsTouched(); return; }
    this.loading = true;
    this.errorMsg = '';

    const v = this.donorForm.value;
    const payload = {
      bloodGroup: v.bloodGroup,
      age: +v.age,
      gender: v.gender,
      weight: v.weight ? +v.weight : undefined,
      bio: v.bio,
      medicalConditions: v.medicalConditions || 'None',
      address: {
        street: v.street,
        city: v.city,
        state: v.state,
        pincode: v.pincode,
        country: 'India',
      },
    };

    this.donorService.registerDonor(payload).subscribe({
      next: () => {
        this.loading = false;
        this.toast.success('Registered as Donor!', 'Your profile is pending admin approval.');
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.loading = false;
        this.errorMsg = err.error?.message || 'Registration failed. Please try again.';
      },
    });
  }
}
