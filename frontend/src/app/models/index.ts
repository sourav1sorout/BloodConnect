// models/index.ts — All TypeScript interfaces

export type BloodGroup = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';
export type UserRole = 'donor' | 'receiver' | 'admin';
export type RequestStatus = 'pending' | 'accepted' | 'rejected' | 'completed' | 'cancelled';
export type UrgencyLevel = 'normal' | 'urgent' | 'critical';

export interface User {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  isActive: boolean;
  isVerified: boolean;
  avatar?: string;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
  donorProfile?: Donor;
}

export interface Address {
  street?: string;
  city: string;
  state: string;
  pincode?: string;
  country: string;
}

export interface Location {
  type: 'Point';
  coordinates: [number, number]; // [lng, lat]
}

export interface Rating {
  average: number;
  count: number;
}

export interface Donor {
  _id: string;
  user: User;
  bloodGroup: BloodGroup;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  weight?: number;
  address: Address;
  location?: Location;
  isAvailable: boolean;
  isApproved: boolean;
  lastDonationDate?: string;
  totalDonations: number;
  medicalConditions?: string;
  approvedAt?: string;
  approvedBy?: string;
  bio?: string;
  rating: Rating;
  canDonate: boolean;
  daysSinceLastDonation?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Hospital {
  name: string;
  address?: string;
  city: string;
  state: string;
}

export interface BloodRequest {
  _id: string;
  requester: User;
  donor: Donor;
  bloodGroup: BloodGroup;
  patientName: string;
  hospital: Hospital;
  unitsRequired: number;
  urgency: UrgencyLevel;
  status: RequestStatus;
  message?: string;
  requesterContact: string;
  responseMessage?: string;
  respondedAt?: string;
  completedAt?: string;
  neededBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  meta?: PaginationMeta;
  accessToken?: string;
  errors?: string[];
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface DashboardStats {
  totalUsers: number;
  totalDonors: number;
  approvedDonors: number;
  pendingDonors: number;
  availableDonors: number;
  totalRequests: number;
  pendingRequests: number;
  acceptedRequests: number;
  completedRequests: number;
  recentRequests: number;
  recentRegistrations: number;
}

export interface DonorStats {
  totalRequests: number;
  accepted: number;
  rejected: number;
  pending: number;
  completed: number;
  totalDonations: number;
}

export interface BloodGroupStat {
  _id: BloodGroup;
  count: number;
}

export interface CityStat {
  _id: string;
  count: number;
}

export interface MonthlyTrendStat {
  _id: { year: number; month: number };
  count: number;
}

export interface AuditLog {
  _id: string;
  admin: { name: string; email: string };
  action: string;
  targetType: string;
  targetId?: string;
  details: string;
  createdAt: string;
}


export interface SearchFilters {
  bloodGroup?: BloodGroup | '';
  city?: string;
  state?: string;
  isAvailable?: string;
  page?: number;
  limit?: number;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  role?: UserRole;
  phone?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface DonorRegisterPayload {
  bloodGroup: BloodGroup;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  weight?: number;
  address: Address;
  bio?: string;
  medicalConditions?: string;
}

export interface AppNotification {
  _id: string;
  recipient: string;
  sender?: User;
  type: 'request_new' | 'request_accepted' | 'request_rejected' | 'donor_approved' | 'donor_rejected' | 'system_alert';
  title: string;
  message: string;
  link?: string;
  isRead: boolean;
  createdAt: string;
}

export interface BloodRequestPayload {
  donorId: string;
  bloodGroup: BloodGroup;
  patientName: string;
  hospital: Hospital;
  unitsRequired: number;
  urgency: UrgencyLevel;
  requesterContact: string;
  neededBy: string;
  message?: string;
}
