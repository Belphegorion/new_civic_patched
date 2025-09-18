// backend/models/adminInviteModel.js
const mongoose = require('mongoose');

const AdminInviteSchema = new mongoose.Schema({
  email: { type: String, required: true, lowercase: true, trim: true },
  tokenHash: { type: String, required: true }, // hashed token (sha256)
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  expiresAt: { type: Date, required: true },
  used: { type: Boolean, default: false }
}, { timestamps: true });

AdminInviteSchema.index({ email: 1 });
AdminInviteSchema.index({ tokenHash: 1 });

module.exports = mongoose.model('AdminInvite', AdminInviteSchema);
