// pages/home/home.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent {
  bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

  heroStats = [
    { value: '12,500+', label: 'Registered Donors' },
    { value: '8,200+', label: 'Lives Saved' },
    { value: '450+', label: 'Cities Covered' },
  ];

  steps = [
    { icon: '📝', title: 'Create Account', desc: 'Sign up in under 2 minutes. No complex forms, no hassle.' },
    { icon: '🔍', title: 'Search Donors', desc: 'Filter by blood group, city, or state to find nearby donors instantly.' },
    { icon: '📩', title: 'Send Request', desc: 'Request blood with urgency details. Donor gets notified immediately.' },
    { icon: '❤️', title: 'Save a Life', desc: 'Donor accepts, you connect. A life is saved together.' },
  ];

  features = [
    { icon: '⚡', title: 'Real-time Search', desc: 'Find available donors instantly with smart filters by blood group, city and state.' },
    { icon: '🔔', title: 'Instant Notifications', desc: 'Email alerts for blood requests so donors can respond the moment help is needed.' },
    { icon: '🛡️', title: 'Verified Donors', desc: 'All donors are reviewed and approved by admins before appearing in search.' },
    { icon: '🌍', title: 'Pan-India Network', desc: 'Coverage across 450+ cities and 28 states with thousands of active donors.' },
    { icon: '📱', title: 'Mobile Friendly', desc: 'Fully responsive design works perfectly on any device, anywhere.' },
    { icon: '🔒', title: 'Privacy Protected', desc: 'Your data is encrypted and secure. Contact info only shared when needed.' },
  ];

  bloodGroupInfo = [
    { group: 'A+', donate: ['A+', 'AB+'], receive: ['A+', 'A-', 'O+', 'O-'] },
    { group: 'A-', donate: ['A+', 'A-', 'AB+', 'AB-'], receive: ['A-', 'O-'] },
    { group: 'B+', donate: ['B+', 'AB+'], receive: ['B+', 'B-', 'O+', 'O-'] },
    { group: 'B-', donate: ['B+', 'B-', 'AB+', 'AB-'], receive: ['B-', 'O-'] },
    { group: 'AB+', donate: ['AB+'], receive: ['All Groups'] },
    { group: 'AB-', donate: ['AB+', 'AB-'], receive: ['AB-', 'A-', 'B-', 'O-'] },
    { group: 'O+', donate: ['A+', 'B+', 'AB+', 'O+'], receive: ['O+', 'O-'] },
    { group: 'O-', donate: ['All Groups'], receive: ['O-'] },
  ];
}
