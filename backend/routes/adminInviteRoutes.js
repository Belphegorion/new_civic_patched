// backend/routes/adminInviteRoutes.js
const express = require('express');
const router = express.Router();
const { inviteAdmin, acceptInvite } = require('../controllers/adminInviteController');
const { protect, admin } = require('../middleware/authMiddleware'); // ensure path is correct

router.post('/invite', protect, admin, inviteAdmin);
router.post('/accept-invite', acceptInvite);

module.exports = router;
