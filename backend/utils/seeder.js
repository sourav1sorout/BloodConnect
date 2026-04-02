// utils/seeder.js
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const connectDB = require('../config/database');

const User = require('../models/User');
const Donor = require('../models/Donor');

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const CITIES = ['Mumbai', 'Delhi', 'Bengaluru', 'Chennai', 'Hyderabad', 'Pune', 'Kolkata', 'Ahmedabad', 'Surat', 'Jaipur'];
const STATES = ['Maharashtra', 'Delhi', 'Karnataka', 'Tamil Nadu', 'Telangana', 'Maharashtra', 'West Bengal', 'Gujarat', 'Gujarat', 'Rajasthan'];

const seedData = async () => {
  try {
    await connectDB();
    console.log('🌱 Starting database seed...');

    // Clear existing (non-admin) data
    await User.deleteMany({ role: { $ne: 'admin' } });
    await Donor.deleteMany({});
    console.log('✅ Cleared existing data');

    // Create Admin
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@blooddonation.com';
    const adminExists = await User.findOne({ email: adminEmail });
    if (!adminExists) {
      await User.create({
        name: process.env.ADMIN_NAME || 'Super Admin',
        email: adminEmail,
        password: process.env.ADMIN_PASSWORD || 'Admin@12345',
        phone: '9999999999', // Default admin phone
        role: 'admin',
        isActive: true,
        isVerified: true,
      });
      console.log('✅ Admin created');
    }

    // Create Sample Donors
    const sampleDonors = [];
    for (let i = 0; i < 20; i++) {
      const cityIndex = i % CITIES.length;
      const user = await User.create({
        name: `Donor ${i + 1}`,
        email: `donor${i + 1}@example.com`,
        password: 'Donor@12345',
        phone: `98${String(Math.floor(Math.random() * 100000000)).padStart(8, '0')}`,
        role: 'donor',
        isActive: true,
      });

      const donor = await Donor.create({
        user: user._id,
        bloodGroup: BLOOD_GROUPS[i % BLOOD_GROUPS.length],
        age: 20 + (i % 35),
        gender: i % 3 === 0 ? 'Female' : 'Male',
        weight: 55 + (i % 30),
        address: {
          city: CITIES[cityIndex],
          state: STATES[cityIndex],
          country: 'India',
        },
        isAvailable: i % 5 !== 0, // 80% available
        isApproved: i < 16,       // first 16 approved
        totalDonations: Math.floor(Math.random() * 10),
        bio: `I donate blood regularly to help those in need. Blood donation is my way of giving back to society.`,
        medicalConditions: 'None',
      });

      sampleDonors.push(donor);
    }
    console.log(`✅ Created 20 sample donors (16 approved, 4 pending)`);

    // Create Sample Receivers
    for (let i = 0; i < 5; i++) {
      await User.create({
        name: `Receiver ${i + 1}`,
        email: `receiver${i + 1}@example.com`,
        password: 'Receiver@12345',
        phone: `97${String(Math.floor(Math.random() * 100000000)).padStart(8, '0')}`,
        role: 'receiver',
        isActive: true,
      });
    }
    console.log('✅ Created 5 sample receivers');

    console.log('\n🎉 Seeding complete!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📧 Admin:    admin@blooddonation.com');
    console.log('🔑 Password: Admin@12345');
    console.log('📧 Donor:    donor1@example.com');
    console.log('🔑 Password: Donor@12345');
    console.log('📧 Receiver: receiver1@example.com');
    console.log('🔑 Password: Receiver@12345');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  }
};

seedData();
