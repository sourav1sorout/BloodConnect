// models/AuditLog.js
const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    action: {
      type: String,
      required: true,
      // e.g. 'APPROVE_DONOR', 'REJECT_DONOR', 'DELETE_USER', 'TOGGLE_USER', 'CANCEL_REQUEST', 'BULK_EMAIL'
    },
    targetType: {
      type: String,
      enum: ['User', 'Donor', 'BloodRequest', 'System'],
      required: true,
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    details: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

// Index for fast queries
auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ admin: 1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
