// middleware/validate.js
const { validationResult, body, param, query } = require('express-validator');
const { AppError } = require('../utils/apiResponse');

/**
 * Handle validation result
 */
const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const messages = errors.array().map((e) => e.msg);
    return next(new AppError(messages.join('. '), 400));
  }
  next();
};

/**
 * Auth Validators
 */
const validateRegister = [
  body('name').trim().notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 50 }).withMessage('Name must be 2-50 characters'),
  body('email').trim().isEmail().withMessage('Valid email is required')
    .normalizeEmail(),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('Password must have uppercase, lowercase, and number'),
  body('role').optional().isIn(['donor', 'receiver']).withMessage('Role must be donor or receiver'),
  body('phone').optional().matches(/^[0-9]{10}$/).withMessage('Phone must be 10 digits'),
  handleValidation,
];

const validateLogin = [
  body('email').trim().isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
  handleValidation,
];

/**
 * Donor Profile Validators
 */
const validateDonorProfile = [
  body('bloodGroup').isIn(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'])
    .withMessage('Invalid blood group'),
  body('age').isInt({ min: 18, max: 65 }).withMessage('Age must be between 18 and 65'),
  body('gender').isIn(['Male', 'Female', 'Other']).withMessage('Invalid gender'),
  body('address.city').trim().notEmpty().withMessage('City is required'),
  body('address.state').trim().notEmpty().withMessage('State is required'),
  body('weight').optional().isFloat({ min: 50 }).withMessage('Weight must be at least 50 kg'),
  handleValidation,
];

/**
 * Blood Request Validators
 */
const validateBloodRequest = [
  body('donorId').isMongoId().withMessage('Invalid donor ID'),
  body('bloodGroup').isIn(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'])
    .withMessage('Invalid blood group'),
  body('patientName').trim().notEmpty().withMessage('Patient name is required'),
  body('hospital.name').trim().notEmpty().withMessage('Hospital name is required'),
  body('hospital.city').trim().notEmpty().withMessage('Hospital city is required'),
  body('hospital.state').trim().notEmpty().withMessage('Hospital state is required'),
  body('unitsRequired').isInt({ min: 1, max: 10 }).withMessage('Units must be between 1 and 10'),
  body('urgency').isIn(['normal', 'urgent', 'critical']).withMessage('Invalid urgency level'),
  body('requesterContact').matches(/^[0-9]{10}$/).withMessage('Valid 10-digit contact required'),
  body('neededBy').isISO8601().withMessage('Valid date required').custom((value) => {
    if (new Date(value) < new Date()) throw new Error('Needed by date must be in the future');
    return true;
  }),
  handleValidation,
];

/**
 * ObjectId param validator
 */
const validateObjectId = (paramName) => [
  param(paramName).isMongoId().withMessage(`Invalid ${paramName}`),
  handleValidation,
];

/**
 * Search query validators
 */
const validateSearchQuery = [
  query('bloodGroup').optional().isIn(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'])
    .withMessage('Invalid blood group'),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be positive'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be 1-50'),
  handleValidation,
];

module.exports = {
  validateRegister,
  validateLogin,
  validateDonorProfile,
  validateBloodRequest,
  validateObjectId,
  validateSearchQuery,
};
