const mongoose = require('mongoose');

const RiderSchema = new mongoose.Schema({
    name: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    status: {
        type: String,
        enum: ['Available', 'Busy', 'Offline', 'Suspended'],
        default: 'Available'
    },
    image: String,
    location: {
        lat: { type: Number, default: 6.5244 }, // Default to Lagos lat
        lng: { type: Number, default: 3.3792 }  // Default to Lagos lng
    },
    lastLocationUpdate: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Rider', RiderSchema);
