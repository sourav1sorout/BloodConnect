// controllers/donorController.js
const Donor = require('../models/Donor');
const User = require('../models/User');
const { AppError, asyncHandler, successResponse, getPagination, buildPaginationMeta } = require('../utils/apiResponse');

/**
 * @desc    Register as donor
 * @route   POST /api/donors/register
 * @access  Private (any user)
 */
const registerDonor = asyncHandler(async (req, res) => {
  // Check if already a donor
  const existingDonor = await Donor.findOne({ user: req.user._id });
  if (existingDonor) {
    throw new AppError('You are already registered as a donor.', 409);
  }

  const donorData = {
    user: req.user._id,
    ...req.body,
  };

  const donor = await Donor.create(donorData);

  // Update user role to donor
  await User.findByIdAndUpdate(req.user._id, { role: 'donor' });

  successResponse(res, 201, 'Donor registered successfully. Awaiting admin approval.', { donor });
});

/**
 * @desc    Get my donor profile
 * @route   GET /api/donors/my-profile
 * @access  Private (Donor)
 */
const getMyDonorProfile = asyncHandler(async (req, res) => {
  const donor = await Donor.findOne({ user: req.user._id })
    .populate('user', 'name email phone avatar');

  if (!donor) {
    throw new AppError('Donor profile not found. Please register as donor.', 404);
  }

  successResponse(res, 200, 'Donor profile fetched', { donor });
});

/**
 * @desc    Update donor profile
 * @route   PUT /api/donors/update-profile
 * @access  Private (Donor)
 */
const updateDonorProfile = asyncHandler(async (req, res) => {
  const donor = await Donor.findOneAndUpdate(
    { user: req.user._id },
    { ...req.body },
    { new: true, runValidators: true }
  ).populate('user', 'name email phone');

  if (!donor) {
    throw new AppError('Donor profile not found.', 404);
  }

  successResponse(res, 200, 'Donor profile updated successfully', { donor });
});

/**
 * @desc    Toggle donor availability
 * @route   PATCH /api/donors/toggle-availability
 * @access  Private (Donor)
 */
const toggleAvailability = asyncHandler(async (req, res) => {
  const donor = await Donor.findOne({ user: req.user._id });

  if (!donor) {
    throw new AppError('Donor profile not found.', 404);
  }

  donor.isAvailable = !donor.isAvailable;
  await donor.save();

  successResponse(res, 200, `You are now ${donor.isAvailable ? 'Available' : 'Unavailable'}`, {
    isAvailable: donor.isAvailable,
  });
});

/**
 * @desc    Search donors
 * @route   GET /api/donors/search
 * @access  Public
 */
const searchDonors = asyncHandler(async (req, res) => {
  const { bloodGroup, city, state, isAvailable, page, limit } = req.query;
  const { skip, page: pg, limit: lm } = getPagination(req.query);

  // Build filter
  const filter = { isApproved: true };

  if (bloodGroup) filter.bloodGroup = bloodGroup;
  if (city) filter['address.city'] = { $regex: city, $options: 'i' };
  if (state) filter['address.state'] = { $regex: state, $options: 'i' };
  if (isAvailable !== undefined) filter.isAvailable = isAvailable === 'true';

  const [donors, total] = await Promise.all([
    Donor.find(filter)
      .populate('user', 'name email phone avatar')
      .sort({ isAvailable: -1, createdAt: -1 })
      .skip(skip)
      .limit(lm)
      .lean(),
    Donor.countDocuments(filter),
  ]);

  successResponse(
    res,
    200,
    'Donors fetched successfully',
    { donors },
    buildPaginationMeta(total, pg, lm)
  );
});

/**
 * @desc    Get single donor by ID
 * @route   GET /api/donors/:id
 * @access  Public
 */
const getDonorById = asyncHandler(async (req, res) => {
  const donor = await Donor.findById(req.params.id)
    .populate('user', 'name email phone avatar createdAt');

  if (!donor) {
    throw new AppError('Donor not found.', 404);
  }

  if (!donor.isApproved) {
    throw new AppError('This donor profile is not yet approved.', 403);
  }

  successResponse(res, 200, 'Donor fetched successfully', { donor });
});

/**
 * @desc    Get all cities and states with donors (for filter dropdowns)
 * @route   GET /api/donors/locations
 * @access  Public
 */
const getDonorLocations = asyncHandler(async (req, res) => {
  const locations = await Donor.aggregate([
    { $match: { isApproved: true } },
    {
      $group: {
        _id: null,
        cities: { $addToSet: '$address.city' },
        states: { $addToSet: '$address.state' },
      },
    },
    {
      $project: {
        _id: 0,
        cities: { $sortArray: { input: '$cities', sortBy: 1 } },
        states: { $sortArray: { input: '$states', sortBy: 1 } },
      },
    },
  ]);

  const result = locations[0] || { cities: [], states: [] };
  successResponse(res, 200, 'Locations fetched', result);
});

/**
 * @desc    Get donor stats for a specific donor
 * @route   GET /api/donors/:id/stats
 * @access  Private (Donor - own profile)
 */
const getDonorStats = asyncHandler(async (req, res) => {
  const BloodRequest = require('../models/BloodRequest');
  const donor = await Donor.findOne({ user: req.user._id });

  if (!donor) throw new AppError('Donor profile not found.', 404);

  const [totalRequests, accepted, rejected, pending, completed] = await Promise.all([
    BloodRequest.countDocuments({ donor: donor._id }),
    BloodRequest.countDocuments({ donor: donor._id, status: 'accepted' }),
    BloodRequest.countDocuments({ donor: donor._id, status: 'rejected' }),
    BloodRequest.countDocuments({ donor: donor._id, status: 'pending' }),
    BloodRequest.countDocuments({ donor: donor._id, status: 'completed' }),
  ]);

  successResponse(res, 200, 'Donor stats fetched', {
    stats: { totalRequests, accepted, rejected, pending, completed, totalDonations: donor.totalDonations },
  });
});

module.exports = {
  registerDonor,
  getMyDonorProfile,
  updateDonorProfile,
  toggleAvailability,
  searchDonors,
  getDonorById,
  getDonorLocations,
  getDonorStats,
};
