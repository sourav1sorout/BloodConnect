// routes/donorRoutes.js
const express = require('express');
const router = express.Router();
const {
  registerDonor, getMyDonorProfile, updateDonorProfile,
  toggleAvailability, searchDonors, getDonorById, getDonorLocations, getDonorStats
} = require('../controllers/donorController');
const { protect, authorize } = require('../middleware/auth');
const { validateDonorProfile, validateObjectId, validateSearchQuery } = require('../middleware/validate');

// Public routes
router.get('/search', validateSearchQuery, searchDonors);
router.get('/locations', getDonorLocations);
router.get('/:id', validateObjectId('id'), getDonorById);

// Protected routes
router.use(protect);
router.post('/register', validateDonorProfile, registerDonor);
router.get('/my-profile', getMyDonorProfile);
router.put('/update-profile', validateDonorProfile, updateDonorProfile);
router.patch('/toggle-availability', toggleAvailability);
router.get('/stats/me', getDonorStats);

module.exports = router;
