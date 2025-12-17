const express = require('express');
const router = express.Router();
const Order = require('../models/Order');

// Create New Order
router.post('/', async (req, res) => {
    const orderData = req.body;
    const newOrder = new Order(orderData);

    try {
        const savedOrder = await newOrder.save();

        // Emit socket event
        const io = req.app.get('socketio');
        io.emit('newOrder', savedOrder);

        res.status(201).json(savedOrder);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Get Orders by User Email
router.get('/user/:email', async (req, res) => {
    try {
        // Sort by createdAt descending
        const orders = await Order.find({ 'user.email': req.params.email }).sort({ createdAt: -1 });
        res.json(orders);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get ALL Orders (Admin)
router.get('/', async (req, res) => {
    try {
        const orders = await Order.find().sort({ createdAt: -1 });
        res.json(orders);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Update Order Status
router.patch('/:id/status', async (req, res) => {
    try {
        const { status } = req.body;
        // Use findOneAndUpdate with orderId (our custom ID) or _id
        // Try finding by custom orderId first, then fallback to _id if standard mongo ID
        let updatedOrder = await Order.findOneAndUpdate(
            { orderId: req.params.id },
            { status },
            { new: true }
        );

        if (!updatedOrder) {
            updatedOrder = await Order.findByIdAndUpdate(
                req.params.id,
                { status },
                { new: true }
            );
        }

        if (!updatedOrder) return res.status(404).json({ message: 'Order not found' });

        // Emit socket event
        const io = req.app.get('socketio');
        io.emit('orderUpdated', updatedOrder);

        res.json(updatedOrder);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
