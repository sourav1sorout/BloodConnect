// routes/requestRoutes.js
const express = require('express');
const router = express.Router();
// const {
//   createRequest, getMyRequests, getDonorRequests,
//   respondToRequest, cancelRequest, completeRequest, getRequestById,
// } = require('../controllers/requestController');
const {
  createRequest,
  getMyRequests,
  getDonorRequests,
  respondToRequest,
  cancelRequest,
  completeRequest,
  getRequestById,
  removeRequest
} = require('../controllers/requestController');
const { protect } = require('../middleware/auth');
const { validateBloodRequest, validateObjectId } = require('../middleware/validate');

router.use(protect);

router.post('/', validateBloodRequest, createRequest);
router.get('/my-requests', getMyRequests);
router.get('/donor-requests', getDonorRequests);
router.get('/:id', validateObjectId('id'), getRequestById);
router.patch('/:id/respond', validateObjectId('id'), respondToRequest);
router.patch('/:id/cancel', validateObjectId('id'), cancelRequest);
router.patch('/:id/complete', validateObjectId('id'), completeRequest);
router.patch('/:id/remove', validateObjectId('id'), removeRequest);

module.exports = router;
