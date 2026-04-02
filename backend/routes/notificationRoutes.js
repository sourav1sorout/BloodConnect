// routes/notificationRoutes.js
const express = require('express');
const router = express.Router();
const {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} = require('../controllers/notificationController');
const { protect } = require('../middleware/auth');
const { validateObjectId } = require('../middleware/validate');

router.use(protect); // All routes require authentication

router.get('/', getNotifications);
router.patch('/read-all', markAllAsRead);
router.patch('/:id/read', validateObjectId('id'), markAsRead);
router.delete('/:id', validateObjectId('id'), deleteNotification);

module.exports = router;
