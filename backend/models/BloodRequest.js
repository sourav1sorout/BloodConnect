// models/BloodRequest.js
const mongoose = require('mongoose');

const bloodRequestSchema = new mongoose.Schema(
  {
    requester: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Requester is required'],
    },
    donor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Donor',
      required: [true, 'Donor is required'],
    },
    bloodGroup: {
      type: String,
      required: [true, 'Blood group is required'],
      enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
    },
    patientName: {
      type: String,
      required: [true, 'Patient name is required'],
      trim: true,
    },
    hospital: {
      name: {
        type: String,
        required: [true, 'Hospital name is required'],
        trim: true,
      },
      address: { type: String, trim: true },
      city: { type: String, required: true, trim: true },
      state: { type: String, required: true, trim: true },
    },
    unitsRequired: {
      type: Number,
      required: [true, 'Units required'],
      min: [1, 'Minimum 1 unit required'],
      max: [10, 'Maximum 10 units per request'],
      default: 1,
    },
    urgency: {
      type: String,
      enum: ['normal', 'urgent', 'critical'],
      default: 'normal',
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected', 'completed', 'cancelled'],
      default: 'pending',
    },
    message: {
      type: String,
      maxlength: [500, 'Message cannot exceed 500 characters'],
      default: '',
    },
    requesterContact: {
      type: String,
      required: [true, 'Contact number is required'],
      match: [/^[0-9]{10}$/, 'Please enter a valid phone number'],
    },
    responseMessage: {
      type: String,
      maxlength: [500, 'Response message cannot exceed 500 characters'],
      default: '',
    },
    respondedAt: {
      type: Date,
      default: null,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    neededBy: {
      type: Date,
      required: [true, 'Needed by date is required'],
    },
    isRemovedByRequester: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
bloodRequestSchema.index({ requester: 1, status: 1, isRemovedByRequester: 1 });
bloodRequestSchema.index({ donor: 1, status: 1 });
bloodRequestSchema.index({ bloodGroup: 1, status: 1 });
bloodRequestSchema.index({ status: 1, createdAt: -1 });
bloodRequestSchema.index({ urgency: 1, status: 1 });

module.exports = mongoose.model('BloodRequest', bloodRequestSchema);
