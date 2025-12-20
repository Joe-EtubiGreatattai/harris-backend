const mongoose = require('mongoose');

const PromoCodeSchema = new mongoose.Schema({
    code: {
        type: String,
        required: true,
        unique: true,
        uppercase: true,
        trim: true
    },
    discountPercent: {
        type: Number,
        required: true,
        min: 0,
        max: 100
    },
    usageLimit: {
        type: Number,
        required: true,
        min: 1
    },
    usedCount: {
        type: Number,
        default: 0
    },
    // Array of categories this promo applies to. Empty array means all categories.
    applicableCategories: [{
        type: String
    }],
    isActive: {
        type: Boolean,
        default: true
    },
    expiresAt: {
        type: Date
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Virtual to check if promo is still valid
PromoCodeSchema.virtual('isValid').get(function () {
    const isNotExpired = !this.expiresAt || this.expiresAt > new Date();
    const isWithinLimit = this.usedCount < this.usageLimit;
    return this.isActive && isNotExpired && isWithinLimit;
});

PromoCodeSchema.set('toJSON', { virtuals: true });
PromoCodeSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('PromoCode', PromoCodeSchema);
