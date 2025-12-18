const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true }, // Keeping string ID to match frontend data
    name: { type: String, required: true },
    description: String,
    prices: {
        S: { type: Number, required: true },
        M: { type: Number, required: true },
        L: { type: Number, required: true },
        XL: { type: Number, required: true }
    },
    image: String,
    category: { type: String, required: true },
    isBestSeller: { type: Boolean, default: false },
    isAvailable: { type: Boolean, default: true },
    extras: [{
        name: { type: String, required: true },
        price: { type: Number, default: 500 },
        isAvailable: { type: Boolean, default: true }
    }]
});

module.exports = mongoose.model('Product', ProductSchema);
