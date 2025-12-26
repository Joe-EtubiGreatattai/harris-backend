const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    description: String,
    // Flexible sizes: e.g., { "S": 5000, "M": 7500 }
    prices: {
        type: Map,
        of: Number,
        required: true
    },
    image: String,
    category: { type: String, required: true },
    isManualBestSeller: { type: Boolean, default: false },
    isAutomatedBestSeller: { type: Boolean, default: false },
    salesCount: { type: Number, default: 0 },
    isAvailable: { type: Boolean, default: true },
    extras: [{
        name: { type: String, required: true },
        price: { type: Number, default: 500 },
        isAvailable: { type: Boolean, default: true }
    }],
    estimatedPrepTime: { type: Number, default: 15 } // Default to 15 minutes
});

// Virtual for backward compatibility or general UI check
ProductSchema.virtual('isBestSeller').get(function () {
    return this.isManualBestSeller || this.isAutomatedBestSeller;
});

ProductSchema.set('toJSON', { virtuals: true });
ProductSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Product', ProductSchema);
