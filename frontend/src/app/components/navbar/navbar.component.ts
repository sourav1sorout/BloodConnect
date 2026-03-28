// components/navbar/navbar.component.ts
import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss'],
})
export class NavbarComponent implements OnInit, OnDestroy {
  isScrolled = false;
  menuOpen = false;
  dropdownOpen = false;
  isLoggedIn = false;
  isDonor = false;
  isAdmin = false;
  userName = '';
  userRole = '';
  userInitial = '';
  private sub!: Subscription;

  constructor(public authService: AuthService) {}

  ngOnInit() {
    this.sub = this.authService.currentUser$.subscribe((user) => {
      this.isLoggedIn = !!user;
      this.isDonor = user?.role === 'donor';
      this.isAdmin = user?.role === 'admin';
      this.userName = user?.name || '';
      this.userRole = user?.role || '';
      this.userInitial = user?.name ? user.name.charAt(0).toUpperCase() : '';
    });
  }

  @HostListener('window:scroll')
  onScroll() {
    this.isScrolled = window.scrollY > 20;
  }

  @HostListener('document:keydown.escape')
  onEscape() {
    this.dropdownOpen = false;
    this.menuOpen = false;
  }

  toggleMenu() { this.menuOpen = !this.menuOpen; this.dropdownOpen = false; }
  closeMenu() { this.menuOpen = false; }
  toggleDropdown() { this.dropdownOpen = !this.dropdownOpen; }
  closeDropdown() { this.dropdownOpen = false; }

  logout() {
    this.closeDropdown();
    this.closeMenu();
    this.authService.logout();
  }

  ngOnDestroy() { this.sub?.unsubscribe(); }
}
