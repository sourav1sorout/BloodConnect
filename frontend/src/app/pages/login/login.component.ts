// pages/login/login.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;
  loading = false;
  showPassword = false;
  errorMsg = '';

  stats = [
    { v: '12.5K+', l: 'Donors Registered' },
    { v: '8.2K+', l: 'Lives Saved' },
    { v: '24/7', l: 'Always Available' },
  ];

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private toast: ToastService
  ) {}

  ngOnInit() {
    if (this.authService.isLoggedIn) {
      this.router.navigate(['/']);
      return;
    }
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
    });
  }

  isInvalid(field: string): boolean {
    const ctrl = this.loginForm.get(field);
    return !!(ctrl?.invalid && ctrl?.touched);
  }

  getError(field: string): string {
    const ctrl = this.loginForm.get(field);
    if (ctrl?.errors?.['required']) return 'This field is required';
    if (ctrl?.errors?.['email']) return 'Enter a valid email address';
    return '';
  }

  onSubmit() {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }
    this.loading = true;
    this.errorMsg = '';

    const { email, password } = this.loginForm.value;
    this.authService.login(email, password).subscribe({
      next: (res) => {
        this.loading = false;
        this.toast.success('Welcome back!', res.message);
        const user = this.authService.currentUser;
        if (user?.role === 'admin') this.router.navigate(['/admin']);
        else if (user?.role === 'donor') this.router.navigate(['/dashboard']);
        else this.router.navigate(['/search']);
      },
      error: (err) => {
        this.loading = false;
        if (err.status === 429) {
          this.errorMsg = 'Too many login attempts. Please wait 15 minutes and try again.';
          this.toast.error('Rate Limit Reached', 'Please wait before trying again');
        } else {
          this.errorMsg = err.error?.message || 'Login failed. Please try again.';
        }
      },
    });
  }
}
