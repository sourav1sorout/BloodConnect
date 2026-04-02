// components/toast/toast.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService, Toast } from '../../services/toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-container">
      <div *ngFor="let toast of toasts; trackBy: trackToast"
           class="toast toast-{{toast.type}}"
           (click)="toastService.dismiss(toast.id)">
        <span class="toast-icon">{{ icons[toast.type] }}</span>
        <div class="toast-body">
          <div class="toast-title">{{ toast.title }}</div>
          <div class="toast-message" *ngIf="toast.message">{{ toast.message }}</div>
        </div>
        <button class="toast-close" (click)="$event.stopPropagation(); toastService.dismiss(toast.id)">✕</button>
      </div>
    </div>
  `,
  styles: [`
    .toast-container {
      position: fixed; top: 80px; right: 20px; z-index: 9999;
      display: flex; flex-direction: column; gap: 12px;
      pointer-events: none; max-width: 380px;
    }
    .toast {
      display: flex; align-items: flex-start; gap: 12px;
      padding: 14px 16px; border-radius: 12px;
      background: white; box-shadow: 0 8px 30px rgba(0,0,0,0.15);
      border-left: 4px solid; cursor: pointer; pointer-events: all;
      animation: slideDown 0.3s ease;
      transition: all 0.2s ease;
      &:hover { transform: translateX(-4px); }
    }
    .toast-success { border-color: #2D6A4F; }
    .toast-error { border-color: #C1121F; }
    .toast-warning { border-color: #B5451B; }
    .toast-info { border-color: #023E8A; }
    .toast-icon { font-size: 1.2rem; flex-shrink: 0; margin-top: 1px; }
    .toast-body { flex: 1; }
    .toast-title { font-weight: 700; font-size: 0.9rem; color: #1A0A0C; }
    .toast-message { font-size: 0.825rem; color: #6B3A40; margin-top: 2px; }
    .toast-close { background: none; border: none; color: #9E6B72; cursor: pointer; font-size: 0.8rem; padding: 0; flex-shrink: 0; }
    @keyframes slideDown { from { opacity:0; transform: translateY(-16px); } to { opacity:1; transform: translateY(0); } }
  `]
})
export class ToastComponent implements OnInit {
  toasts: Toast[] = [];
  icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };

  constructor(public toastService: ToastService) {}
  ngOnInit() { this.toastService.toasts$.subscribe(t => this.toasts = t); }
  trackToast(_: number, t: Toast) { return t.id; }
}
