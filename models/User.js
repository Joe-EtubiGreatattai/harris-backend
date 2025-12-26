const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    phone: {
        type: String,
        trim: true
    },
    address: {
        type: String,
        trim: true
    },
    favorites: [{
        type: String // Product IDs
    }],
    savedAddresses: {
        home: { type: String, trim: true },
        work: { type: String, trim: true }
    },
    lastSeen: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);
