// app.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { NavbarComponent } from './components/navbar/navbar.component';
import { FooterComponent } from './components/footer/footer.component';
import { ToastComponent } from './components/toast/toast.component';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, NavbarComponent, FooterComponent, ToastComponent],
  template: `
    <app-navbar></app-navbar>
    <main>
      <router-outlet></router-outlet>
    </main>
    <app-footer *ngIf="showFooter"></app-footer>
    <app-toast></app-toast>
  `,
  styles: [`
    main { min-height: calc(100vh - 72px); }
  `]
})
export class AppComponent implements OnInit {
  showFooter = true;
  private noFooterRoutes = ['/admin', '/dashboard'];

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit() {
    // Refresh user on app load if token exists
    if (this.authService.token) {
      this.authService.getMe().subscribe({
        error: () => this.authService.logout()
      });
    }

    // Hide footer on dashboard/admin pages
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd)
    ).subscribe((e: any) => {
      this.showFooter = !this.noFooterRoutes.some(r => e.urlAfterRedirects.startsWith(r));
    });
  }
}
