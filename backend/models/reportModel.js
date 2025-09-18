const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    category: { type: String, required: true, index: true },
    status: {
        type: String,
        enum: ['Submitted', 'Acknowledged', 'In Progress', 'Resolved', 'Rejected'],
        default: 'Submitted',
        index: true
    },
    priority: {
        type: String,
        enum: ['Low', 'Medium', 'High', 'Critical'],
        default: 'Medium',
        index: true
    },
    citizen: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    location: {
        type: { type: String, enum: ['Point'], required: true, default: 'Point' },
        coordinates: { type: [Number], required: true } // [Longitude, Latitude]
    },
    photoUrl: { type: String, required: true },
    photoCloudinaryId: { type: String, required: true },
    audioUrl: { type: String },
    audioCloudinaryId: { type: String },
    assignedDepartment: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
    aiTags: { type: [String] },
    comments: [{
        text: String,
        author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        createdAt: { type: Date, default: Date.now }
    }]
}, { timestamps: true });

reportSchema.index({ location: '2dsphere' });
reportSchema.index({ citizen: 1, createdAt: -1 });
reportSchema.index({ status: 1, assignedDepartment: 1 });
reportSchema.index({ category: 1, status: 1 });
reportSchema.index({ createdAt: -1 });
reportSchema.index({ priority: 1, status: 1 });
reportSchema.index({ assignedDepartment: 1, status: 1 });

module.exports = mongoose.model('Report', reportSchema);