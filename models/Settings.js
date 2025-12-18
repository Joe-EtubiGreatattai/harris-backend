const mongoose = require('mongoose');

const SettingsSchema = new mongoose.Schema({
    deliveryFee: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('Settings', SettingsSchema);
