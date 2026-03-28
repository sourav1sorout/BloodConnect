// middleware/auth.js
const { verifyAccessToken } = require('../utils/tokenUtils');
const { AppError, asyncHandler } = require('../utils/apiResponse');
const User = require('../models/User');

/**
 * Protect routes - JWT Authentication
 */
const protect = asyncHandler(async (req, res, next) => {
  let token;

  // Get token from header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies && req.cookies.accessToken) {
    token = req.cookies.accessToken;
  }

  if (!token) {
    throw new AppError('Access denied. No token provided.', 401);
  }

  try {
    // Verify token
    const decoded = verifyAccessToken(token);

    // Get user from DB
    const user = await User.findById(decoded.id).select('+passwordChangedAt');

    if (!user) {
      throw new AppError('The user belonging to this token no longer exists.', 401);
    }

    // Check if user is active
    if (!user.isActive) {
      throw new AppError('Your account has been deactivated. Contact support.', 401);
    }

    // Check if password was changed after token was issued
    if (user.passwordChangedAfter(decoded.iat)) {
      throw new AppError('Password was recently changed. Please log in again.', 401);
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      throw new AppError('Invalid token. Please log in again.', 401);
    }
    if (error.name === 'TokenExpiredError') {
      throw new AppError('Token expired. Please log in again.', 401);
    }
    throw error;
  }
});

/**
 * Authorize specific roles
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError(
          `Role '${req.user.role}' is not authorized to access this route.`,
          403
        )
      );
    }
    next();
  };
};

/**
 * Optional auth - doesn't throw if no token
 */
const optionalAuth = asyncHandler(async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (token) {
    try {
      const decoded = verifyAccessToken(token);
      const user = await User.findById(decoded.id);
      if (user && user.isActive) {
        req.user = user;
      }
    } catch (e) {
      // Ignore token errors for optional auth
    }
  }
  next();
});

module.exports = { protect, authorize, optionalAuth };
