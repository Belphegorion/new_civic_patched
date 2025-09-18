const mongoose = require('mongoose');

const departmentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  contactEmail: {
    type: String,
    required: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
  },
  contactPhone: {
    type: String,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  categories: [{
    type: String,
    enum: ['Pothole', 'Streetlight Out', 'Trash Overflow', 'Graffiti', 'Water Leak', 'Traffic Signal', 'Park Maintenance', 'Other']
  }],
  responseTimeTarget: {
    type: Number, // hours
    default: 24
  }
}, { timestamps: true });

departmentSchema.index({ name: 1 });
departmentSchema.index({ isActive: 1 });

module.exports = mongoose.model('Department', departmentSchema);