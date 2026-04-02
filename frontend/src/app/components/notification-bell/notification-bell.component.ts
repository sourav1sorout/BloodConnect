// components/notification-bell/notification-bell.component.ts
import { Component, OnInit, OnDestroy, HostListener, ElementRef } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { NotificationService } from '../../services/notification.service';
import { Notification } from '../../models';

@Component({
  selector: 'app-notification-bell',
  standalone: true,
  imports: [CommonModule, RouterModule, DatePipe],
  templateUrl: './notification-bell.component.html',
  styleUrls: ['./notification-bell.component.scss'],
})
export class NotificationBellComponent implements OnInit, OnDestroy {
  notifications: Notification[] = [];
  unreadCount = 0;
  showDropdown = false;
  loading = false;
  private sub = new Subscription();

  constructor(
    private notificationService: NotificationService, 
    private router: Router,
    private eRef: ElementRef
  ) {}

  ngOnInit() {
    // Initial fetch
    this.loadNotifications();
    
    // Subscribe to count changes
    this.sub.add(this.notificationService.unreadCount$.subscribe(c => this.unreadCount = c));

    // Optional: Refresh count every 60 seconds (simple polling)
    const interval = setInterval(() => this.notificationService.refreshUnreadCount(), 60000);
    this.sub.add({ unsubscribe: () => clearInterval(interval) });
  }

  ngOnDestroy() {
    this.sub.unsubscribe();
  }

  loadNotifications() {
    this.loading = true;
    this.notificationService.getNotifications(1, 10).subscribe({
      next: (res) => {
        this.notifications = res.data?.notifications || [];
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  toggleDropdown() {
    this.showDropdown = !this.showDropdown;
    if (this.showDropdown) this.loadNotifications();
  }

  @HostListener('document:click', ['$event'])
  clickout(event: any) {
    if (!this.eRef.nativeElement.contains(event.target)) {
      this.showDropdown = false;
    }
  }

  markRead(n: Notification) {
    if (n.isRead) {
       if (n.link) this.router.navigate([n.link]);
       this.showDropdown = false;
       return;
    }

    this.notificationService.markAsRead(n._id).subscribe(() => {
      n.isRead = true;
      if (n.link) this.router.navigate([n.link]);
      this.showDropdown = false;
    });
  }

  markAllRead() {
    this.notificationService.markAllAsRead().subscribe(() => {
      this.notifications.forEach(n => n.isRead = true);
    });
  }

  getIcon(type: string): string {
    switch (type) {
      case 'request_new': return '📩';
      case 'request_accepted': return '✅';
      case 'request_rejected': return '❌';
      case 'donor_approved': return '🎉';
      default: return '📢';
    }
  }
}
