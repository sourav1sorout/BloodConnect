// controllers/authController.js
const User = require('../models/User');
const Donor = require('../models/Donor');
const { sendTokenResponse, verifyRefreshToken, generateAccessToken } = require('../utils/tokenUtils');
const { AppError, asyncHandler, successResponse } = require('../utils/apiResponse');
const { sendWelcomeEmail } = require('../utils/emailUtils');

/**
 * @desc    Register new user
 * @route   POST /api/auth/register
 * @access  Public
 */
const register = asyncHandler(async (req, res) => {
  const { name, email, password, role, phone } = req.body;
  console.log(`📝 Register attempt for: ${email}`);

  // Check if user exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new AppError('Email already registered. Please login.', 409);
  }

  // Create user
  const user = await User.create({ name, email, password, role: role || 'receiver', phone });
  console.log(`✅ User registered: ${email}`);

  // Send welcome email (non-blocking)
  sendWelcomeEmail(email, name, user.role).catch((err) =>
    console.error('Welcome email failed:', err.message)
  );

  sendTokenResponse(user, 201, res, 'Account created successfully');
});

/**
 * @desc    Login user
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  console.log(`🔐 Login attempt for: ${email}`);

  // Find user with password
  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.comparePassword(password))) {
    console.log(`❌ Login failed for: ${email}`);
    throw new AppError('Invalid email or password.', 401);
  }

  if (!user.isActive) {
    throw new AppError('Your account is deactivated. Contact admin.', 401);
  }

  // Update last login
  user.lastLogin = Date.now();
  await user.save({ validateBeforeSave: false });

  sendTokenResponse(user, 200, res, 'Login successful');
});

/**
 * @desc    Get current user profile
 * @route   GET /api/auth/me
 * @access  Private
 */
const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).populate('donorProfile');

  successResponse(res, 200, 'Profile fetched successfully', { user });
});

/**
 * @desc    Update profile
 * @route   PUT /api/auth/update-profile
 * @access  Private
 */
const updateProfile = asyncHandler(async (req, res) => {
  const { name, phone } = req.body;

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { name, phone },
    { new: true, runValidators: true }
  );

  successResponse(res, 200, 'Profile updated successfully', { user });
});

/**
 * @desc    Change password
 * @route   PUT /api/auth/change-password
 * @access  Private
 */
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user._id).select('+password');

  if (!(await user.comparePassword(currentPassword))) {
    throw new AppError('Current password is incorrect.', 400);
  }

  user.password = newPassword;
  await user.save();

  sendTokenResponse(user, 200, res, 'Password changed successfully');
});

/**
 * @desc    Refresh access token
 * @route   POST /api/auth/refresh-token
 * @access  Public
 */
const refreshToken = asyncHandler(async (req, res) => {
  const token = req.cookies.refreshToken || req.body.refreshToken;

  if (!token) throw new AppError('No refresh token provided.', 401);

  const decoded = verifyRefreshToken(token);
  const user = await User.findById(decoded.id);

  if (!user || !user.isActive) {
    throw new AppError('Invalid refresh token.', 401);
  }

  const newAccessToken = generateAccessToken(user._id, user.role);

  successResponse(res, 200, 'Token refreshed', { accessToken: newAccessToken });
});

/**
 * @desc    Logout
 * @route   POST /api/auth/logout
 * @access  Private
 */
const logout = asyncHandler(async (req, res) => {
  res.cookie('refreshToken', '', { expires: new Date(0), httpOnly: true });
  successResponse(res, 200, 'Logged out successfully');
});

module.exports = { register, login, getMe, updateProfile, changePassword, refreshToken, logout };
