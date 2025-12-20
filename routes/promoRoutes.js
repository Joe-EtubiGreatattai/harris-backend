const express = require('express');
const router = express.Router();
const PromoCode = require('../models/PromoCode');

// Get all promos (Admin)
router.get('/', async (req, res) => {
    try {
        const promos = await PromoCode.find().sort({ createdAt: -1 });
        res.json(promos);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Create a promo (Admin)
router.post('/', async (req, res) => {
    try {
        const promo = new PromoCode(req.body);
        const newPromo = await promo.save();
        res.status(201).json(newPromo);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Validate a promo (User)
router.post('/validate', async (req, res) => {
    const { code, cartItems } = req.body;

    try {
        const promo = await PromoCode.findOne({ code: code.toUpperCase() });

        if (!promo) {
            return res.status(404).json({ message: "Invalid promo code" });
        }

        if (!promo.isActive) {
            return res.status(400).json({ message: "This promo is no longer active" });
        }

        if (promo.usedCount >= promo.usageLimit) {
            return res.status(400).json({ message: "This promo has reached its usage limit" });
        }

        if (promo.expiresAt && promo.expiresAt < new Date()) {
            return res.status(400).json({ message: "This promo has expired" });
        }

        // Apply logic for categories if specified
        let isApplicable = true;
        if (promo.applicableCategories && promo.applicableCategories.length > 0) {
            // Check if any cart item matches the applicable categories
            const cartCategories = cartItems.map(item => item.category);
            isApplicable = cartItems.some(item => promo.applicableCategories.includes(item.category));
        }

        if (!isApplicable) {
            return res.status(400).json({
                message: `This promo is only valid for categories: ${promo.applicableCategories.join(', ')}`
            });
        }

        res.json({
            code: promo.code,
            discountPercent: promo.discountPercent,
            applicableCategories: promo.applicableCategories
        });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Toggle status (Admin)
router.patch('/:id/toggle', async (req, res) => {
    try {
        const promo = await PromoCode.findById(req.params.id);
        if (!promo) return res.status(404).json({ message: "Promo not found" });

        promo.isActive = !promo.isActive;
        await promo.save();
        res.json(promo);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Delete (Admin)
router.delete('/:id', async (req, res) => {
    try {
        await PromoCode.findByIdAndDelete(req.params.id);
        res.json({ message: "Promo deleted" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
