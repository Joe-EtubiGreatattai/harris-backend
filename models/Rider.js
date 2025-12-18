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
    image: String
}, { timestamps: true });

module.exports = mongoose.model('Rider', RiderSchema);
