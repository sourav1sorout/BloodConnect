// routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const {
  getDashboardStats, getAllUsers, toggleUserStatus,
  deleteUser, getAllDonors, approveDonor, getAllRequests,
  cancelRequest, exportUsers, exportRequests, bulkEmail, getAuditLogs,
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');
const { validateObjectId } = require('../middleware/validate');

// All admin routes require authentication + admin role
router.use(protect, authorize('admin'));

// Dashboard
router.get('/stats',                              getDashboardStats);

// Users
router.get('/users',                              getAllUsers);
router.patch('/users/:id/toggle-status',          validateObjectId('id'), toggleUserStatus);
router.delete('/users/:id',                       validateObjectId('id'), deleteUser);

// Donors
router.get('/donors',                             getAllDonors);
router.patch('/donors/:id/approve',               validateObjectId('id'), approveDonor);

// Blood Requests
router.get('/requests',                           getAllRequests);
router.patch('/requests/:id/cancel',              validateObjectId('id'), cancelRequest);

// Export
router.get('/export/users',                       exportUsers);
router.get('/export/requests',                    exportRequests);

// Bulk Email
router.post('/bulk-email',                        bulkEmail);

// Audit Logs
router.get('/audit-logs',                         getAuditLogs);

module.exports = router;
