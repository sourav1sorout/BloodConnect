// models/Donor.js
const mongoose = require('mongoose');

const donorSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
      unique: true,
    },
    bloodGroup: {
      type: String,
      required: [true, 'Blood group is required'],
      enum: {
        values: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
        message: '{VALUE} is not a valid blood group',
      },
    },
    age: {
      type: Number,
      required: [true, 'Age is required'],
      min: [18, 'Donor must be at least 18 years old'],
      max: [65, 'Donor cannot be older than 65 years'],
    },
    gender: {
      type: String,
      required: [true, 'Gender is required'],
      enum: ['Male', 'Female', 'Other'],
    },
    weight: {
      type: Number,
      min: [50, 'Weight must be at least 50 kg'],
      default: null,
    },
    address: {
      street: { type: String, trim: true },
      city: {
        type: String,
        required: [true, 'City is required'],
        trim: true,
      },
      state: {
        type: String,
        required: [true, 'State is required'],
        trim: true,
      },
      pincode: {
        type: String,
        trim: true,
        match: [/^[0-9]{6}$/, 'Please enter a valid 6-digit pincode'],
      },
      country: {
        type: String,
        default: 'India',
        trim: true,
      },
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        default: [0, 0],
      },
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
    lastDonationDate: {
      type: Date,
      default: null,
    },
    totalDonations: {
      type: Number,
      default: 0,
    },
    medicalConditions: {
      type: String,
      maxlength: [500, 'Medical conditions cannot exceed 500 characters'],
      default: 'None',
    },
    isApproved: {
      type: Boolean,
      default: false, // Admin must approve donors
    },
    approvedAt: {
      type: Date,
      default: null,
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    rejectionReason: {
      type: String,
      default: '',
    },
    bio: {
      type: String,
      maxlength: [300, 'Bio cannot exceed 300 characters'],
      default: '',
    },
    rating: {
      average: { type: Number, default: 0, min: 0, max: 5 },
      count: { type: Number, default: 0 },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// GeoSpatial index for location-based search
donorSchema.index({ location: '2dsphere' });

// Compound indexes for search queries
donorSchema.index({ bloodGroup: 1, isAvailable: 1, isApproved: 1 });
donorSchema.index({ 'address.city': 1, bloodGroup: 1 });
donorSchema.index({ 'address.state': 1, bloodGroup: 1 });

// Virtual: Days since last donation
donorSchema.virtual('daysSinceLastDonation').get(function () {
  if (!this.lastDonationDate) return null;
  const diff = Date.now() - this.lastDonationDate.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
});

// Virtual: Can donate (56 days = 8 weeks minimum gap)
donorSchema.virtual('canDonate').get(function () {
  if (!this.lastDonationDate) return true;
  const days = this.daysSinceLastDonation;
  return days >= 56;
});

module.exports = mongoose.model('Donor', donorSchema);
