// backend/models/departmentModel.js
const mongoose = require('mongoose');

const categoryEnum = [
  'Pothole',
  'Streetlight Out',
  'Trash Overflow',
  'Graffiti',
  'Water Leak',
  'Traffic Signal',
  'Park Maintenance',
  'Other'
];

const departmentSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true },
  description: { type: String, default: '' },
  contactEmail: {
    type: String,
    trim: true,
    match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please provide a valid email'],
    default: ''
  },
  contactPhone: { type: String, default: '' },
  isActive: { type: Boolean, default: true },
  categories: [{ type: String, enum: categoryEnum }],
  responseTimeTarget: { type: Number, default: 24 }
}, { timestamps: true });

departmentSchema.index({ name: 1 });
departmentSchema.index({ isActive: 1 });

module.exports = mongoose.model('Department', departmentSchema);
