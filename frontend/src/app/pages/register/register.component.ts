// pages/register/register.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';

function passwordMatchValidator(g: AbstractControl): ValidationErrors | null {
  const pass = g.get('password')?.value;
  const confirm = g.get('confirmPassword')?.value;
  return pass === confirm ? null : { mismatch: true };
}

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
})
export class RegisterComponent implements OnInit {
  registerForm!: FormGroup;
  loading = false;
  showPassword = false;
  errorMsg = '';
  selectedRole = 'receiver';

  roles = [
    { value: 'receiver', icon: '🏥', label: 'Receiver', desc: 'I need blood' },
    { value: 'donor', icon: '❤️', label: 'Donor', desc: 'I want to donate' },
  ];

  regSteps = [
    { title: 'Create Account', desc: 'Quick registration in 60 seconds' },
    { title: 'Complete Profile', desc: 'Add your details and blood group' },
    { title: 'Get Verified', desc: 'Admin approval for donors' },
    { title: 'Start Saving Lives', desc: 'Connect with those in need' },
  ];

  get passwordStrength() {
    const val = this.registerForm?.get('password')?.value || '';
    let score = 0;
    if (val.length >= 8) score++;
    if (/[A-Z]/.test(val)) score++;
    if (/[0-9]/.test(val)) score++;
    if (/[^A-Za-z0-9]/.test(val)) score++;
    const labels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
    const classes = ['', 'weak', 'fair', 'good', 'strong'];
    return { score, label: labels[score] || '', class: classes[score] || '' };
  }

  constructor(private fb: FormBuilder, private authService: AuthService, private router: Router, private toast: ToastService) {}

  ngOnInit() {
    if (this.authService.isLoggedIn) { this.router.navigate(['/']); return; }
    this.registerForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8), Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)]],
      confirmPassword: ['', Validators.required],
      phone: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
      role: ['receiver'],
      agreeTerms: [false, Validators.requiredTrue],
    }, { validators: passwordMatchValidator });
  }

  isInvalid(field: string): boolean {
    if (field === 'confirmPassword') {
      const ctrl = this.registerForm.get(field);
      return !!(ctrl?.touched && (ctrl?.invalid || this.registerForm.errors?.['mismatch']));
    }
    const ctrl = this.registerForm.get(field);
    return !!(ctrl?.invalid && ctrl?.touched);
  }

  getError(field: string): string {
    const ctrl = this.registerForm.get(field);
    if (!ctrl?.errors) return '';
    if (ctrl.errors['required']) return 'This field is required';
    if (ctrl.errors['minlength']) return `Minimum ${ctrl.errors['minlength'].requiredLength} characters`;
    if (ctrl.errors['maxlength']) return `Maximum ${ctrl.errors['maxlength'].requiredLength} characters`;
    if (ctrl.errors['email']) return 'Enter a valid email address';
    if (ctrl.errors['pattern'] && field === 'password') return 'Need uppercase letter and number';
    if (ctrl.errors['pattern'] && field === 'phone') return 'Enter valid 10-digit number';
    return 'Invalid value';
  }

  onSubmit() {
    if (this.registerForm.invalid) { this.registerForm.markAllAsTouched(); return; }
    this.loading = true;
    this.errorMsg = '';
    const { name, email, password, phone, role } = this.registerForm.value;

    this.authService.register({ name, email, password, phone: phone || undefined, role }).subscribe({
      next: (res) => {
        this.loading = false;
        this.toast.success('Account created!', 'Welcome to BloodConnect!');
        if (role === 'donor') this.router.navigate(['/donor-register']);
        else this.router.navigate(['/search']);
      },
      error: (err) => {
        this.loading = false;
        this.errorMsg = err.error?.message || 'Registration failed. Please try again.';
      },
    });
  }
}
