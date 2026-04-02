// controllers/adminController.js
const User = require('../models/User');
const Donor = require('../models/Donor');
const BloodRequest = require('../models/BloodRequest');
const AuditLog = require('../models/AuditLog');
const { AppError, asyncHandler, successResponse, getPagination, buildPaginationMeta } = require('../utils/apiResponse');
const { sendBulkEmail } = require('../utils/emailUtils');

// ─── Internal helper ─────────────────────────────────────────────────────────
const logAdminAction = async (adminId, action, targetType, targetId = null, details = '') => {
  try {
    await AuditLog.create({ admin: adminId, action, targetType, targetId, details });
  } catch (_) {
    // Non-blocking – audit failures must never break the main flow
  }
};

/**
 * @desc    Admin Dashboard Stats
 * @route   GET /api/admin/stats
 * @access  Private (Admin)
 */
const getDashboardStats = asyncHandler(async (req, res) => {
  const [
    totalUsers,
    totalDonors,
    approvedDonors,
    pendingDonors,
    totalRequests,
    pendingRequests,
    acceptedRequests,
    completedRequests,
    availableDonors,
  ] = await Promise.all([
    User.countDocuments({ role: { $ne: 'admin' } }),
    Donor.countDocuments(),
    Donor.countDocuments({ isApproved: true }),
    Donor.countDocuments({ isApproved: false }),
    BloodRequest.countDocuments(),
    BloodRequest.countDocuments({ status: 'pending' }),
    BloodRequest.countDocuments({ status: 'accepted' }),
    BloodRequest.countDocuments({ status: 'completed' }),
    Donor.countDocuments({ isApproved: true, isAvailable: true }),
  ]);

  // Blood group distribution
  const bloodGroupStats = await Donor.aggregate([
    { $match: { isApproved: true } },
    { $group: { _id: '$bloodGroup', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);

  // Recent requests (last 7 days)
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const recentRequests = await BloodRequest.countDocuments({ createdAt: { $gte: sevenDaysAgo } });
  const recentRegistrations = await User.countDocuments({ createdAt: { $gte: sevenDaysAgo } });

  // City-wise donors
  const cityStats = await Donor.aggregate([
    { $match: { isApproved: true } },
    { $group: { _id: '$address.city', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 10 },
  ]);

  // Monthly request trend (last 6 months)
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  const monthlyTrend = await BloodRequest.aggregate([
    { $match: { createdAt: { $gte: sixMonthsAgo } } },
    {
      $group: {
        _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
        count: { $sum: 1 },
      },
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } },
  ]);

  successResponse(res, 200, 'Dashboard stats fetched', {
    stats: {
      totalUsers,
      totalDonors,
      approvedDonors,
      pendingDonors,
      availableDonors,
      totalRequests,
      pendingRequests,
      acceptedRequests,
      completedRequests,
      recentRequests,
      recentRegistrations,
    },
    bloodGroupStats,
    cityStats,
    monthlyTrend,
  });
});

/**
 * @desc    Get all users
 * @route   GET /api/admin/users
 * @access  Private (Admin)
 */
const getAllUsers = asyncHandler(async (req, res) => {
  const { role, isActive, search } = req.query;
  const { skip, page, limit } = getPagination(req.query);

  const filter = {};
  if (role) filter.role = role;
  if (isActive !== undefined) filter.isActive = isActive === 'true';
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
  }

  const [users, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    User.countDocuments(filter),
  ]);

  successResponse(res, 200, 'Users fetched', { users }, buildPaginationMeta(total, page, limit));
});

/**
 * @desc    Approve or suspend user
 * @route   PATCH /api/admin/users/:id/toggle-status
 * @access  Private (Admin)
 */
const toggleUserStatus = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new AppError('User not found.', 404);
  if (user.role === 'admin') throw new AppError('Cannot modify admin account.', 403);

  user.isActive = !user.isActive;
  await user.save();

  await logAdminAction(
    req.user._id,
    user.isActive ? 'ACTIVATE_USER' : 'SUSPEND_USER',
    'User',
    user._id,
    `User ${user.name} (${user.email}) ${user.isActive ? 'activated' : 'suspended'}`
  );

  successResponse(res, 200, `User ${user.isActive ? 'activated' : 'deactivated'} successfully`, { user });
});

/**
 * @desc    Delete user
 * @route   DELETE /api/admin/users/:id
 * @access  Private (Admin)
 */
const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new AppError('User not found.', 404);
  if (user.role === 'admin') throw new AppError('Cannot delete admin account.', 403);

  const details = `Deleted user ${user.name} (${user.email}, role: ${user.role})`;

  // Clean up donor profile if exists
  await Donor.findOneAndDelete({ user: user._id });
  await user.deleteOne();

  await logAdminAction(req.user._id, 'DELETE_USER', 'User', user._id, details);

  successResponse(res, 200, 'User deleted successfully');
});

/**
 * @desc    Get all donors (admin view)
 * @route   GET /api/admin/donors
 * @access  Private (Admin)
 */
const getAllDonors = asyncHandler(async (req, res) => {
  const { isApproved, bloodGroup, search } = req.query;
  const { skip, page, limit } = getPagination(req.query);

  const filter = {};
  if (isApproved !== undefined) filter.isApproved = isApproved === 'true';
  if (bloodGroup) filter.bloodGroup = bloodGroup;

  if (search) {
    const users = await User.find({
      $or: [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ],
    }).select('_id');
    filter.user = { $in: users.map((u) => u._id) };
  }

  const [donors, total] = await Promise.all([
    Donor.find(filter)
      .populate('user', 'name email phone isActive')
      .sort({ isApproved: 1, createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Donor.countDocuments(filter),
  ]);

  successResponse(res, 200, 'Donors fetched', { donors }, buildPaginationMeta(total, page, limit));
});

/**
 * @desc    Approve or reject donor (with optional rejection reason)
 * @route   PATCH /api/admin/donors/:id/approve
 * @access  Private (Admin)
 */
const approveDonor = asyncHandler(async (req, res) => {
  const { approve, rejectionReason } = req.body;

  const donor = await Donor.findById(req.params.id).populate('user', 'name email');
  if (!donor) throw new AppError('Donor not found.', 404);

  donor.isApproved = approve;
  donor.approvedAt = approve ? Date.now() : null;
  donor.approvedBy = approve ? req.user._id : null;
  if (!approve && rejectionReason) donor.rejectionReason = rejectionReason;
  if (approve) donor.rejectionReason = undefined;
  await donor.save();

  const action = approve ? 'APPROVE_DONOR' : 'REJECT_DONOR';
  const details = approve
    ? `Approved donor ${donor.user?.name}`
    : `Rejected donor ${donor.user?.name}. Reason: ${rejectionReason || 'No reason given'}`;
  await logAdminAction(req.user._id, action, 'Donor', donor._id, details);

  // In-App Notification (non-blocking)
  const Notification = require('../models/Notification');
  Notification.create({
    recipient: donor.user._id,
    sender: req.user._id,
    type: approve ? 'donor_approved' : 'donor_rejected',
    title: approve ? 'Donor Profile Approved! 🎉' : 'Donor Profile Update',
    message: approve 
      ? 'Your donor profile has been approved. You are now visible to seekers.' 
      : `Your donor profile review is complete. ${rejectionReason ? 'Reason: ' + rejectionReason : 'Please update your details.'}`,
    link: approve ? '/dashboard' : '/donor-register',
  }).catch((err) => console.error('Notification error:', err.message));

  successResponse(res, 200, `Donor ${approve ? 'approved' : 'rejected'} successfully`, { donor });
});

/**
 * @desc    Get all blood requests (admin view)
 * @route   GET /api/admin/requests
 * @access  Private (Admin)
 */
const getAllRequests = asyncHandler(async (req, res) => {
  const { status, bloodGroup, urgency } = req.query;
  const { skip, page, limit } = getPagination(req.query);

  const filter = {};
  if (status) filter.status = status;
  if (bloodGroup) filter.bloodGroup = bloodGroup;
  if (urgency) filter.urgency = urgency;

  const [requests, total] = await Promise.all([
    BloodRequest.find(filter)
      .populate('requester', 'name email phone')
      .populate({ path: 'donor', populate: { path: 'user', select: 'name email phone' } })
      .sort({ urgency: 1, createdAt: -1 })
      .skip(skip)
      .limit(limit),
    BloodRequest.countDocuments(filter),
  ]);

  successResponse(res, 200, 'Requests fetched', { requests }, buildPaginationMeta(total, page, limit));
});

/**
 * @desc    Admin cancel/force-close a blood request
 * @route   PATCH /api/admin/requests/:id/cancel
 * @access  Private (Admin)
 */
const cancelRequest = asyncHandler(async (req, res) => {
  const request = await BloodRequest.findById(req.params.id).populate('requester', 'name email');
  if (!request) throw new AppError('Blood request not found.', 404);
  if (['completed', 'cancelled'].includes(request.status)) {
    throw new AppError('Request is already finalized.', 400);
  }

  request.status = 'cancelled';
  await request.save();

  await logAdminAction(
    req.user._id,
    'CANCEL_REQUEST',
    'BloodRequest',
    request._id,
    `Admin cancelled blood request for ${request.bloodGroup} by ${request.requester?.name}`
  );

  successResponse(res, 200, 'Request cancelled by admin', { request });
});

/**
 * @desc    Admin respond to a blood request (force approve/reject)
 * @route   PATCH /api/admin/requests/:id/respond
 * @access  Private (Admin)
 */
const respondToRequest = asyncHandler(async (req, res) => {
  const { action, responseMessage } = req.body;

  if (!['accepted', 'rejected'].includes(action)) {
    throw new AppError('Action must be accepted or rejected.', 400);
  }

  const request = await BloodRequest.findById(req.params.id)
    .populate('requester', 'name email')
    .populate({ path: 'donor', populate: { path: 'user', select: 'name email' } });

  if (!request) throw new AppError('Blood request not found.', 404);
  if (request.status !== 'pending') {
    throw new AppError(`This request is already ${request.status}.`, 0);
  }

  request.status = action;
  request.responseMessage = responseMessage || `Action taken by administrator.`;
  request.respondedAt = Date.now();
  await request.save();

  // If accepted, increment donation count for the target donor
  if (action === 'accepted') {
    await Donor.findByIdAndUpdate(request.donor._id, { $inc: { totalDonations: 1 }, lastDonationDate: Date.now() });
  }

  // Notify requester via email
  const { sendRequestStatusEmail } = require('../utils/emailUtils');
  sendRequestStatusEmail(
    request.requester.email,
    request.requester.name,
    `Administrator (on behalf of ${request.donor.user?.name || 'Donor'})`,
    action,
    request.bloodGroup,
    request.responseMessage
  ).catch((err) => console.error('Email error:', err.message));

  await logAdminAction(
    req.user._id,
    action === 'accepted' ? 'APPROVE_REQUEST_ADMIN' : 'REJECT_REQUEST_ADMIN',
    'BloodRequest',
    request._id,
    `Admin ${action} request for ${request.bloodGroup} by ${request.requester?.name}`
  );

  // In-App Notification (non-blocking)
  const Notification = require('../models/Notification');
  Notification.create({
    recipient: request.requester._id,
    sender: req.user._id,
    type: action === 'accepted' ? 'request_accepted' : 'request_rejected',
    title: action === 'accepted' ? 'Admin: Request Approved 🩸' : 'Admin: Request Update',
    message: `Your request for ${request.bloodGroup} blood has been ${action} by an administrator.`,
    link: '/my-requests',
  }).catch((err) => console.error('Notification error:', err.message));

  successResponse(res, 200, `Request ${action} by administrator`, { request });
});

/**
 * @desc    Export all users as CSV
 * @route   GET /api/admin/export/users
 * @access  Private (Admin)
 */
const exportUsers = asyncHandler(async (req, res) => {
  const users = await User.find({ role: { $ne: 'admin' } }).sort({ createdAt: -1 }).lean();

  const header = 'Name,Email,Phone,Role,Status,Joined\n';
  const rows = users
    .map((u) =>
      [
        `"${u.name || ''}"`,
        `"${u.email || ''}"`,
        `"${u.phone || ''}"`,
        u.role || '',
        u.isActive ? 'Active' : 'Inactive',
        u.createdAt ? new Date(u.createdAt).toISOString().split('T')[0] : '',
      ].join(',')
    )
    .join('\n');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="bloodconnect-users.csv"');
  res.send(header + rows);
});

/**
 * @desc    Export all blood requests as CSV
 * @route   GET /api/admin/export/requests
 * @access  Private (Admin)
 */
const exportRequests = asyncHandler(async (req, res) => {
  const requests = await BloodRequest.find()
    .populate('requester', 'name email')
    .populate({ path: 'donor', populate: { path: 'user', select: 'name' } })
    .sort({ createdAt: -1 })
    .lean();

  const header = 'Requester,Requester Email,Donor,Blood Group,Hospital,City,Units,Urgency,Status,Needed By,Created At\n';
  const rows = requests
    .map((r) =>
      [
        `"${r.requester?.name || ''}"`,
        `"${r.requester?.email || ''}"`,
        `"${r.donor?.user?.name || ''}"`,
        r.bloodGroup || '',
        `"${r.hospital?.name || ''}"`,
        `"${r.hospital?.city || ''}"`,
        r.unitsRequired || '',
        r.urgency || '',
        r.status || '',
        r.neededBy ? new Date(r.neededBy).toISOString().split('T')[0] : '',
        r.createdAt ? new Date(r.createdAt).toISOString().split('T')[0] : '',
      ].join(',')
    )
    .join('\n');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="bloodconnect-requests.csv"');
  res.send(header + rows);
});

/**
 * @desc    Bulk email to all approved donors of a given blood group / city
 * @route   POST /api/admin/bulk-email
 * @access  Private (Admin)
 */
const bulkEmail = asyncHandler(async (req, res) => {
  const { bloodGroup, city, subject, message } = req.body;
  if (!subject || !message) throw new AppError('Subject and message are required.', 400);

  const donorFilter = { isApproved: true };
  if (bloodGroup) donorFilter.bloodGroup = bloodGroup;
  if (city) donorFilter['address.city'] = { $regex: city, $options: 'i' };

  const donors = await Donor.find(donorFilter).populate('user', 'name email').lean();
  if (!donors.length) throw new AppError('No matching donors found.', 404);

  const recipients = donors.map((d) => ({ name: d.user?.name || 'Donor', email: d.user?.email })).filter((r) => r.email);

  // Send in batches of 20 to avoid rate limits
  const BATCH = 20;
  const transporter = require('../utils/emailUtils').createTransporterInstance();
  for (let i = 0; i < recipients.length; i += BATCH) {
    const batch = recipients.slice(i, i + BATCH);
    await Promise.allSettled(
      batch.map((r) =>
        transporter.sendMail({
          from: process.env.EMAIL_FROM,
          to: r.email,
          subject,
          html: `
            <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
              <div style="background:linear-gradient(135deg,#c0392b,#e74c3c);padding:24px;text-align:center;border-radius:12px 12px 0 0;">
                <h1 style="color:white;margin:0;">🩸 BloodConnect Admin</h1>
              </div>
              <div style="padding:28px;background:#fff;border-radius:0 0 12px 12px;border:1px solid #eee;">
                <p>Dear <strong>${r.name}</strong>,</p>
                <div style="white-space:pre-line;color:#333;line-height:1.7;">${message}</div>
                <hr style="margin:20px 0;border:none;border-top:1px solid #eee;">
                <p style="font-size:12px;color:#999;">BloodConnect · Saving Lives Together 🩸</p>
              </div>
            </div>`,
        })
      )
    );
  }

  await logAdminAction(
    req.user._id,
    'BULK_EMAIL',
    'System',
    null,
    `Sent bulk email to ${recipients.length} donors. BG:${bloodGroup || 'All'} City:${city || 'All'} Subject:${subject}`
  );

  successResponse(res, 200, `Email sent to ${recipients.length} donors successfully`);
});

/**
 * @desc    Get audit logs
 * @route   GET /api/admin/audit-logs
 * @access  Private (Admin)
 */
const getAuditLogs = asyncHandler(async (req, res) => {
  const { skip, page, limit } = getPagination(req.query);

  const [logs, total] = await Promise.all([
    AuditLog.find()
      .populate('admin', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    AuditLog.countDocuments(),
  ]);

  successResponse(res, 200, 'Audit logs fetched', { logs }, buildPaginationMeta(total, page, limit));
});

module.exports = {
  getDashboardStats,
  getAllUsers,
  toggleUserStatus,
  deleteUser,
  getAllDonors,
  approveDonor,
  getAllRequests,
  cancelRequest,
  exportUsers,
  exportRequests,
  bulkEmail,
  getAuditLogs,
};
