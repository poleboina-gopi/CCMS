const express = require('express');
const { Notification, Email } = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// GET /api/notifications - List current user notifications
router.get('/', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const notifications = await Notification.find({ user_id: userId })
      .sort({ created_at: -1 })
      .limit(30)
      .lean();

    const unreadCount = await Notification.countDocuments({
      user_id: userId,
      is_read: false
    });

    res.json({
      notifications: notifications.map(n => ({
        ...n,
        id: n._id.toString()
      })),
      unreadCount
    });
  } catch (error) {
    console.error('Fetch notifications error:', error);
    res.status(500).json({ error: 'Failed to retrieve notifications.' });
  }
});

// PUT /api/notifications/:id/read - Mark one as read
router.put('/:id/read', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    await Notification.updateOne(
      { _id: req.params.id, user_id: userId },
      { $set: { is_read: true } }
    );

    res.json({ message: 'Notification marked as read.' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update notification.' });
  }
});

// PUT /api/notifications/read-all - Mark all as read
router.put('/read-all', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    await Notification.updateMany(
      { user_id: userId },
      { $set: { is_read: true } }
    );

    res.json({ message: 'All notifications marked as read.' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update notifications.' });
  }
});

// GET /api/notifications/emails - View dispatched email logs
router.get('/emails', requireAuth, async (req, res) => {
  try {
    let query = {};
    if (req.user.role !== 'admin') {
      query.recipient_email = req.user.email;
    }

    const emails = await Email.find(query)
      .sort({ created_at: -1 })
      .limit(50)
      .lean();

    res.json({
      emails: emails.map(e => ({
        ...e,
        id: e._id.toString()
      }))
    });
  } catch (error) {
    console.error('Fetch emails error:', error);
    res.status(500).json({ error: 'Failed to retrieve email logs.' });
  }
});

module.exports = router;
