// controllers/requestController.js
const BloodRequest = require('../models/BloodRequest');
const Donor = require('../models/Donor');
const User = require('../models/User');
const { AppError, asyncHandler, successResponse, getPagination, buildPaginationMeta } = require('../utils/apiResponse');
const { sendBloodRequestEmail, sendRequestStatusEmail } = require('../utils/emailUtils');

/**
 * @desc    Create blood request
 * @route   POST /api/requests
 * @access  Private (Receiver)
 */
const createRequest = asyncHandler(async (req, res) => {
  const { donorId, bloodGroup, patientName, hospital, unitsRequired, urgency, message, requesterContact, neededBy } = req.body;

  // Find donor
  const donor = await Donor.findById(donorId).populate('user', 'name email');
  if (!donor) throw new AppError('Donor not found.', 404);
  if (!donor.isApproved) throw new AppError('This donor is not approved yet.', 400);
  if (!donor.isAvailable) throw new AppError('This donor is currently unavailable.', 400);

  // Check blood group match
  if (donor.bloodGroup !== bloodGroup) {
    throw new AppError(`Donor's blood group (${donor.bloodGroup}) doesn't match requested (${bloodGroup}).`, 400);
  }

  // Prevent requester from requesting their own donor profile
  if (donor.user._id.toString() === req.user._id.toString()) {
    throw new AppError('You cannot request blood from your own profile.', 400);
  }

  // Check for duplicate pending request
  const existingRequest = await BloodRequest.findOne({
    requester: req.user._id,
    donor: donorId,
    status: 'pending',
  });
  if (existingRequest) {
    throw new AppError('You already have a pending request with this donor.', 409);
  }

  // Create request
  const request = await BloodRequest.create({
    requester: req.user._id,
    donor: donorId,
    bloodGroup,
    patientName,
    hospital,
    unitsRequired,
    urgency,
    message,
    requesterContact,
    neededBy,
  });

  // Populate for response
  await request.populate([
    { path: 'requester', select: 'name email phone' },
    { path: 'donor', populate: { path: 'user', select: 'name email' } },
  ]);

  // Send email to donor (non-blocking)
  sendBloodRequestEmail(
    donor.user.email,
    donor.user.name,
    req.user.name,
    bloodGroup,
    `${hospital.name}, ${hospital.city}`,
    urgency
  ).catch((err) => console.error('Email error:', err.message));

  // In-App Notification (non-blocking)
  const Notification = require('../models/Notification');
  Notification.create({
    recipient: donor.user._id,
    sender: req.user._id,
    type: 'request_new',
    title: 'New Blood Request 🩸',
    message: `${req.user.name} needs ${unitsRequired} units of ${bloodGroup} blood at ${hospital.name}.`,
    link: '/requests/incoming',
  }).catch((err) => console.error('Notification error:', err.message));

  successResponse(res, 201, 'Blood request sent successfully', { request });
});

/**
 * @desc    Get requester's requests
 * @route   GET /api/requests/my-requests
 * @access  Private
 */
const getMyRequests = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const { skip, page, limit } = getPagination(req.query);

  const filter = { requester: req.user._id, isRemovedByRequester: { $ne: true } };
  if (status) filter.status = status;

  const [requests, total] = await Promise.all([
    BloodRequest.find(filter)
      .populate({ path: 'donor', populate: { path: 'user', select: 'name email phone avatar' } })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    BloodRequest.countDocuments(filter),
  ]);

  successResponse(res, 200, 'Requests fetched', { requests }, buildPaginationMeta(total, page, limit));
});

/**
 * @desc    Get donor's incoming requests
 * @route   GET /api/requests/donor-requests
 * @access  Private (Donor)
 */
const getDonorRequests = asyncHandler(async (req, res) => {
  const donor = await Donor.findOne({ user: req.user._id });
  if (!donor) throw new AppError('Donor profile not found.', 404);

  const { status } = req.query;
  const { skip, page, limit } = getPagination(req.query);

  const filter = { donor: donor._id };
  if (status) filter.status = status;

  const [requests, total] = await Promise.all([
    BloodRequest.find(filter)
      .populate('requester', 'name email phone avatar')
      .sort({ urgency: 1, createdAt: -1 })
      .skip(skip)
      .limit(limit),
    BloodRequest.countDocuments(filter),
  ]);

  successResponse(res, 200, 'Requests fetched', { requests }, buildPaginationMeta(total, page, limit));
});

/**
 * @desc    Accept or reject a blood request
 * @route   PATCH /api/requests/:id/respond
 * @access  Private (Donor)
 */
const respondToRequest = asyncHandler(async (req, res) => {
  const { action, responseMessage } = req.body;

  if (!['accepted', 'rejected'].includes(action)) {
    throw new AppError('Action must be accepted or rejected.', 400);
  }

  const donor = await Donor.findOne({ user: req.user._id });
  if (!donor) throw new AppError('Donor profile not found.', 404);

  const request = await BloodRequest.findOne({ _id: req.params.id, donor: donor._id })
    .populate('requester', 'name email');

  if (!request) throw new AppError('Request not found.', 404);
  if (request.status !== 'pending') {
    throw new AppError(`This request is already ${request.status}.`, 400);
  }

  request.status = action;
  request.responseMessage = responseMessage || '';
  request.respondedAt = Date.now();
  await request.save();

  // If accepted, increment donation count
  if (action === 'accepted') {
    await Donor.findByIdAndUpdate(donor._id, { $inc: { totalDonations: 1 }, lastDonationDate: Date.now() });
  }

  // Notify requester via email (non-blocking)
  sendRequestStatusEmail(
    request.requester.email,
    request.requester.name,
    req.user.name,
    action,
    request.bloodGroup,
    responseMessage
  ).catch((err) => console.error('Email error:', err.message));

  // In-App Notification (non-blocking)
  const Notification = require('../models/Notification');
  Notification.create({
    recipient: request.requester._id,
    sender: req.user._id,
    type: action === 'accepted' ? 'request_accepted' : 'request_rejected',
    title: action === 'accepted' ? 'Blood Request Accepted ✅' : 'Blood Request Declined ❌',
    message: `${req.user.name} has ${action} your request for ${request.bloodGroup} blood.`,
    link: '/my-requests',
  }).catch((err) => console.error('Notification error:', err.message));

  successResponse(res, 200, `Request ${action} successfully`, { request });
});

/**
 * @desc    Cancel a blood request (by requester)
 * @route   PATCH /api/requests/:id/cancel
 * @access  Private
 */
const cancelRequest = asyncHandler(async (req, res) => {
  const request = await BloodRequest.findOne({
    _id: req.params.id,
    requester: req.user._id,
    status: 'pending',
  });

  if (!request) throw new AppError('Pending request not found.', 404);

  request.status = 'cancelled';
  await request.save();

  successResponse(res, 200, 'Request cancelled', { request });
});

/**
 * @desc    Mark request as completed
 * @route   PATCH /api/requests/:id/complete
 * @access  Private
 */
const completeRequest = asyncHandler(async (req, res) => {
  const request = await BloodRequest.findOne({
    _id: req.params.id,
    requester: req.user._id,
    status: 'accepted',
  });

  if (!request) throw new AppError('Accepted request not found.', 404);

  request.status = 'completed';
  request.completedAt = Date.now();
  await request.save();

  successResponse(res, 200, 'Request marked as completed', { request });
});

/**
 * @desc    Remove (archive) request from requester's view
 * @route   PATCH /api/requests/:id/remove
 * @access  Private
 */
const removeRequest = asyncHandler(async (req, res) => {
  const request = await BloodRequest.findOne({
    _id: req.params.id,
    requester: req.user._id,
  });

  if (!request) throw new AppError('Request not found.', 404);
  
  request.isRemovedByRequester = true;
  await request.save();

  successResponse(res, 200, 'Request removed from profile', { request });
});

/**
 * @desc    Get single request
 * @route   GET /api/requests/:id
 * @access  Private
 */
const getRequestById = asyncHandler(async (req, res) => {
  const request = await BloodRequest.findById(req.params.id)
    .populate('requester', 'name email phone')
    .populate({ path: 'donor', populate: { path: 'user', select: 'name email phone avatar' } });

  if (!request) throw new AppError('Request not found.', 404);

  // Only requester or donor can view
  const donor = await Donor.findOne({ user: req.user._id });
  const isRequester = request.requester._id.toString() === req.user._id.toString();
  const isDonor = donor && request.donor._id.toString() === donor._id.toString();
  const isAdmin = req.user.role === 'admin';

  if (!isRequester && !isDonor && !isAdmin) {
    throw new AppError('Not authorized to view this request.', 403);
  }

  successResponse(res, 200, 'Request fetched', { request });
});

module.exports = {
  createRequest,
  getMyRequests,
  getDonorRequests,
  respondToRequest,
  cancelRequest,
  completeRequest,
  removeRequest,
  getRequestById,
};
