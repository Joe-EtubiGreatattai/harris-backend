const express = require('express');
const router = express.Router();
const Rider = require('../models/Rider');

// Get all riders
router.get('/', async (req, res) => {
    try {
        const riders = await Rider.find().sort({ createdAt: -1 });
        res.json(riders);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Create a new rider
router.post('/', async (req, res) => {
    const rider = new Rider(req.body);
    try {
        const newRider = await rider.save();
        const io = req.app.get('socketio');
        if (io) io.emit('riderCreated', newRider);
        res.status(201).json(newRider);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Update rider status/details
router.patch('/:id', async (req, res) => {
    try {
        const updatedRider = await Rider.findByIdAndUpdate(req.params.id, req.body, { new: true });
        const io = req.app.get('socketio');
        if (io) io.emit('riderUpdated', updatedRider);
        res.json(updatedRider);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Delete a rider
router.delete('/:id', async (req, res) => {
    try {
        await Rider.findByIdAndDelete(req.params.id);
        const io = req.app.get('socketio');
        if (io) io.emit('riderDeleted', { _id: req.params.id });
        res.json({ message: 'Rider deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
