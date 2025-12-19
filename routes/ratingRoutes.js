const express = require('express');
const router = express.Router();
const Rating = require('../models/Rating');

// POST /api/ratings
router.post('/', async (req, res) => {
    try {
        const { orderId, rating, comment } = req.body;

        // Basic validation
        if (!orderId || !rating) {
            return res.status(400).json({ message: 'Order ID and rating are required' });
        }

        const newRating = new Rating({
            orderId,
            rating,
            comment
        });

        const savedRating = await newRating.save();

        // Emit socket event
        const io = req.app.get('socketio');
        if (io) {
            io.emit('ratingCreated', savedRating);
        }

        res.status(201).json(savedRating);
    } catch (error) {
        console.error('Error creating rating:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// GET /api/ratings
router.get('/', async (req, res) => {
    try {
        const ratings = await Rating.find().sort({ createdAt: -1 });
        res.json(ratings);
    } catch (error) {
        console.error('Error fetching ratings:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

module.exports = router;
