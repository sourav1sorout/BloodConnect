// admin-dashboard.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../services/admin.service';
import { ToastService } from '../../services/toast.service';
import {
  DashboardStats, BloodGroupStat, CityStat, MonthlyTrendStat,
  Donor, User, BloodRequest, AuditLog, PaginationMeta,
} from '../../models';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, DatePipe],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.scss'],
})
export class AdminDashboardComponent implements OnInit {
  activeTab = 'overview';

  // ── Data ────────────────────────────────────────────────────────────────────
  stats: DashboardStats | null = null;
  bloodGroupStats: BloodGroupStat[] = [];
  cityStats: CityStat[] = [];
  monthlyTrend: MonthlyTrendStat[] = [];
  donors: Donor[] = [];
  users: User[] = [];
  requests: BloodRequest[] = [];
  auditLogs: AuditLog[] = [];

  // ── Filters ─────────────────────────────────────────────────────────────────
  donorFilter = '';
  donorSearch = '';
  userSearch = '';
  requestStatusFilter = '';
  requestUrgencyFilter = '';

  // ── Pagination ──────────────────────────────────────────────────────────────
  donorPage = 1;
  userPage = 1;
  requestPage = 1;
  auditPage = 1;
  donorMeta: PaginationMeta | null = null;
  userMeta: PaginationMeta | null = null;
  requestMeta: PaginationMeta | null = null;
  auditMeta: PaginationMeta | null = null;
  readonly PAGE_LIMIT = 10;

  // ── Delete Modal ────────────────────────────────────────────────────────────
  deleteModal: { show: boolean; id: string; name: string } = { show: false, id: '', name: '' };

  // ── Approve/Reject Modal ────────────────────────────────────────────────────
  approveModal: { show: boolean; donorId: string; donorName: string; approve: boolean; reason: string } = {
    show: false, donorId: '', donorName: '', approve: true, reason: '',
  };

  // ── Bulk Email Modal ────────────────────────────────────────────────────────
  bulkEmailModal = { show: false };
  bulkEmailForm = { bloodGroup: '', city: '', subject: '', message: '' };
  bulkEmailLoading = false;

  // ── Month names helper ──────────────────────────────────────────────────────
  readonly MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  tabs = [
    { id: 'overview',  icon: '📊', label: 'Overview'   },
    { id: 'donors',    icon: '🩸', label: 'Donors'     },
    { id: 'users',     icon: '👥', label: 'Users'      },
    { id: 'requests',  icon: '📩', label: 'Requests'   },
    { id: 'audit',     icon: '📋', label: 'Audit Log'  },
    { id: 'tools',     icon: '🛠️', label: 'Tools'      },
  ];

  constructor(
    private adminService: AdminService,
    private toast: ToastService
  ) {}

  ngOnInit() {
    this.loadStats();
    this.loadDonors();
    this.loadUsers();
    this.loadRequests();
  }

  // ── Loaders ─────────────────────────────────────────────────────────────────
  loadStats() {
    this.adminService.getDashboardStats().subscribe({
      next: (res) => {
        this.stats           = res.data?.stats          || null;
        this.bloodGroupStats = res.data?.bloodGroupStats || [];
        this.cityStats       = res.data?.cityStats       || [];
        this.monthlyTrend    = res.data?.monthlyTrend    || [];
      },
      error: () => this.toast.error('Failed to load stats'),
    });
  }

  loadDonors() {
    const filters: any = { page: this.donorPage, limit: this.PAGE_LIMIT };
    if (this.donorFilter !== '') filters['isApproved'] = this.donorFilter;
    if (this.donorSearch)        filters['search']     = this.donorSearch;
    this.adminService.getAllDonors(filters).subscribe({
      next: (res) => {
        this.donors    = res.data?.donors || [];
        this.donorMeta = res.meta         || null;
      },
      error: () => this.toast.error('Failed to load donors'),
    });
  }

  loadUsers() {
    const filters: any = { page: this.userPage, limit: this.PAGE_LIMIT };
    if (this.userSearch) filters['search'] = this.userSearch;
    this.adminService.getAllUsers(filters).subscribe({
      next: (res) => {
        this.users    = res.data?.users || [];
        this.userMeta = res.meta        || null;
      },
      error: () => this.toast.error('Failed to load users'),
    });
  }

  loadRequests() {
    const filters: any = { page: this.requestPage, limit: this.PAGE_LIMIT };
    if (this.requestStatusFilter)  filters['status']  = this.requestStatusFilter;
    if (this.requestUrgencyFilter) filters['urgency'] = this.requestUrgencyFilter;
    this.adminService.getAllRequests(filters).subscribe({
      next: (res) => {
        this.requests    = res.data?.requests || [];
        this.requestMeta = res.meta           || null;
      },
      error: () => this.toast.error('Failed to load requests'),
    });
  }

  loadAuditLogs() {
    const filters: any = { page: this.auditPage, limit: this.PAGE_LIMIT };
    this.adminService.getAuditLogs(filters).subscribe({
      next: (res) => {
        this.auditLogs = res.data?.logs || [];
        this.auditMeta = res.meta       || null;
      },
      error: () => this.toast.error('Failed to load audit logs'),
    });
  }

  // ── Tab switch ───────────────────────────────────────────────────────────────
  switchTab(id: string) {
    this.activeTab = id;
    if (id === 'audit' && !this.auditLogs.length) this.loadAuditLogs();
  }

  // ── Pagination helpers ───────────────────────────────────────────────────────
  donorPrev()    { if (this.donorPage > 1)                             { this.donorPage--;    this.loadDonors();    } }
  donorNext()    { if (this.donorMeta?.hasNextPage)                    { this.donorPage++;    this.loadDonors();    } }
  userPrev()     { if (this.userPage > 1)                              { this.userPage--;     this.loadUsers();     } }
  userNext()     { if (this.userMeta?.hasNextPage)                     { this.userPage++;     this.loadUsers();     } }
  requestPrev()  { if (this.requestPage > 1)                           { this.requestPage--;  this.loadRequests();  } }
  requestNext()  { if (this.requestMeta?.hasNextPage)                  { this.requestPage++;  this.loadRequests();  } }
  auditPrev()    { if (this.auditPage > 1)                             { this.auditPage--;    this.loadAuditLogs(); } }
  auditNext()    { if (this.auditMeta?.hasNextPage)                    { this.auditPage++;    this.loadAuditLogs(); } }

  onDonorSearch()  { this.donorPage   = 1; this.loadDonors();    }
  onUserSearch()   { this.userPage    = 1; this.loadUsers();     }
  onDonorFilter()  { this.donorPage   = 1; this.loadDonors();    }
  onReqFilter()    { this.requestPage = 1; this.loadRequests();  }

  // ── Monthly trend helpers ─────────────────────────────────────────────────
  get maxTrendCount(): number {
    return Math.max(...this.monthlyTrend.map(t => t.count), 1);
  }

  trendBarWidth(count: number): number {
    return Math.round((count / this.maxTrendCount) * 100);
  }

  trendLabel(item: MonthlyTrendStat): string {
    return `${this.MONTH_NAMES[(item._id.month - 1) % 12]} ${item._id.year}`;
  }

  // ── Approve / Reject Modal ────────────────────────────────────────────────
  openApproveModal(donor: Donor, approve: boolean) {
    this.approveModal = { show: true, donorId: donor._id, donorName: donor.user?.name || '', approve, reason: '' };
  }

  confirmApprove() {
    const { donorId, approve, reason } = this.approveModal;
    this.adminService.approveDonor(donorId, approve, approve ? undefined : reason).subscribe({
      next: () => {
        this.toast.success(approve ? 'Donor Approved!' : 'Donor Rejected');
        this.approveModal.show = false;
        this.loadDonors();
        this.loadStats();
      },
      error: (e) => this.toast.error('Failed', e.error?.message),
    });
  }

  // ── Delete Modal ──────────────────────────────────────────────────────────
  openDeleteModal(user: User) {
    this.deleteModal = { show: true, id: user._id, name: user.name };
  }

  confirmDelete() {
    this.adminService.deleteUser(this.deleteModal.id).subscribe({
      next: () => {
        this.toast.success('User deleted');
        this.deleteModal.show = false;
        this.loadUsers();
        this.loadStats();
      },
      error: (e) => this.toast.error('Failed', e.error?.message),
    });
  }

  // ── Toggle user ─────────────────────────────────────────────────────────
  toggleUser(id: string) {
    this.adminService.toggleUserStatus(id).subscribe({
      next: () => { this.toast.success('User status updated'); this.loadUsers(); },
      error: (e) => this.toast.error('Failed', e.error?.message),
    });
  }

  // ── Cancel Request ────────────────────────────────────────────────────────
  cancelRequest(id: string) {
    this.adminService.cancelRequest(id).subscribe({
      next: () => { this.toast.success('Request cancelled'); this.loadRequests(); },
      error: (e) => this.toast.error('Failed', e.error?.message),
    });
  }

  // ── Export CSV ─────────────────────────────────────────────────────────────
  exportCSV(type: 'users' | 'requests') {
    const obs$ = type === 'users' ? this.adminService.exportUsers() : this.adminService.exportRequests();
    obs$.subscribe({
      next: (blob) => {
        const url  = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href  = url;
        link.download = `bloodconnect-${type}-${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        URL.revokeObjectURL(url);
        this.toast.success(`${type === 'users' ? 'Users' : 'Requests'} CSV downloaded`);
      },
      error: () => this.toast.error('Export failed'),
    });
  }

  // ── Bulk Email ─────────────────────────────────────────────────────────────
  sendBulkEmail() {
    if (!this.bulkEmailForm.subject || !this.bulkEmailForm.message) {
      this.toast.error('Subject and message are required'); return;
    }
    this.bulkEmailLoading = true;
    this.adminService.sendBulkEmail(this.bulkEmailForm).subscribe({
      next: (res) => {
        this.toast.success(res.message || 'Emails sent!');
        this.bulkEmailLoading = false;
        this.bulkEmailModal.show = false;
        this.bulkEmailForm = { bloodGroup: '', city: '', subject: '', message: '' };
      },
      error: (e) => { this.toast.error('Failed to send', e.error?.message); this.bulkEmailLoading = false; },
    });
  }

  // ── Helper for action badge color in audit log ────────────────────────────
  auditActionClass(action: string): string {
    if (action.includes('DELETE') || action.includes('CANCEL') || action.includes('REJECT')) return 'audit-danger';
    if (action.includes('APPROVE') || action.includes('ACTIVATE')) return 'audit-success';
    if (action.includes('SUSPEND')) return 'audit-warning';
    return 'audit-info';
  }
}
