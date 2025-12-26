const mongoose = require('mongoose');

const SettingsSchema = new mongoose.Schema({
    deliveryFee: { type: Number, default: 0 },
    isOpen: { type: Boolean, default: true },
    openingTime: { type: String, default: "08:00" }, // HH:mm format
    closingTime: { type: String, default: "22:00" }, // HH:mm format
}, { timestamps: true });

module.exports = mongoose.model('Settings', SettingsSchema);
