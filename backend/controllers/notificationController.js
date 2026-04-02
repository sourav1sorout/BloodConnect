// controllers/notificationController.js
const Notification = require('../models/Notification');
const { AppError, asyncHandler, successResponse, getPagination, buildPaginationMeta } = require('../utils/apiResponse');

/**
 * @desc    Get all notifications for current user
 * @route   GET /api/notifications
 * @access  Private
 */
const getNotifications = asyncHandler(async (req, res) => {
  const { skip, page, limit } = getPagination(req.query);

  const [notifications, total] = await Promise.all([
    Notification.find({ recipient: req.user._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Notification.countDocuments({ recipient: req.user._id }),
  ]);

  const unreadCount = await Notification.countDocuments({ recipient: req.user._id, isRead: false });

  successResponse(res, 200, 'Notifications fetched', { notifications, unreadCount }, buildPaginationMeta(total, page, limit));
});

/**
 * @desc    Mark individual notification as read
 * @route   PATCH /api/notifications/:id/read
 * @access  Private
 */
const markAsRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, recipient: req.user._id },
    { isRead: true },
    { new: true }
  );

  if (!notification) throw new AppError('Notification not found.', 404);

  successResponse(res, 200, 'Notification marked as read', { notification });
});

/**
 * @desc    Mark all notifications as read
 * @route   PATCH /api/notifications/read-all
 * @access  Private
 */
const markAllAsRead = asyncHandler(async (req, res) => {
  await Notification.updateMany({ recipient: req.user._id, isRead: false }, { isRead: true });
  successResponse(res, 200, 'All notifications marked as read');
});

/**
 * @desc    Delete a notification
 * @route   DELETE /api/notifications/:id
 * @access  Private
 */
const deleteNotification = asyncHandler(async (req, res) => {
  const notification = await Notification.findOneAndDelete({ _id: req.params.id, recipient: req.user._id });
  if (!notification) throw new AppError('Notification not found.', 404);
  successResponse(res, 200, 'Notification deleted');
});

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
};
