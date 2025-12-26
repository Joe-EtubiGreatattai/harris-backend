const mongoose = require('mongoose');

const SettingsSchema = new mongoose.Schema({
    deliveryFee: { type: Number, default: 0 },
    isOpen: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('Settings', SettingsSchema);
