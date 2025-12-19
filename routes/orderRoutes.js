const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Rider = require('../models/Rider');
const { updateBestSellers } = require('../services/rankingService');

// Create New Order
router.post('/', async (req, res) => {
    const orderData = req.body;
    try {
        // Idempotency check: if orderId already exists, return it
        const existingOrder = await Order.findOne({ orderId: orderData.orderId }).populate('assignedRider');
        if (existingOrder) {
            console.log(`Order ${orderData.orderId} already exists, returning existing.`);
            return res.json(existingOrder);
        }

        // Rider assignment now happens at 'Ready for Delivery' stage manually by Admin

        const newOrder = new Order(orderData);
        const savedOrder = await (await newOrder.save()).populate('assignedRider');

        // Background update of best sellers
        updateBestSellers();

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
        // Sort by createdAt descending and populate rider
        const orders = await Order.find({ 'user.email': req.params.email })
            .sort({ createdAt: -1 })
            .populate('assignedRider');
        res.json(orders);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get ALL Orders (Admin)
router.get('/', async (req, res) => {
    try {
        const orders = await Order.find().sort({ createdAt: -1 }).populate('assignedRider');
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
        ).populate('assignedRider');

        if (!updatedOrder) {
            updatedOrder = await Order.findByIdAndUpdate(
                req.params.id,
                { status },
                { new: true }
            ).populate('assignedRider');
        }

        if (!updatedOrder) return res.status(404).json({ message: 'Order not found' });

        // Emit socket event
        const io = req.app.get('socketio');
        io.emit('orderUpdated', updatedOrder);

        // If Out for Delivery, mark the rider as Busy
        if (status === 'Out for Delivery' && updatedOrder.assignedRider) {
            const riderId = updatedOrder.assignedRider._id || updatedOrder.assignedRider;
            await Rider.findByIdAndUpdate(riderId, { status: 'Busy' });
            const rider = await Rider.findById(riderId);
            if (io && rider) io.emit('riderUpdated', rider);
        }

        // If Delivered, free the rider
        if (status === 'Delivered' && updatedOrder.assignedRider) {
            const riderId = updatedOrder.assignedRider._id || updatedOrder.assignedRider;
            const updatedRider = await Rider.findByIdAndUpdate(riderId, { status: 'Available' }, { new: true });
            if (io && updatedRider) {
                io.emit('riderUpdated', updatedRider);
            }
        }

        res.json(updatedOrder);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Assign Rider Manually
router.patch('/:id/assign-rider', async (req, res) => {
    try {
        const { riderId } = req.body;
        const orderId = req.params.id;

        // Find the order
        let order = await Order.findOne({ orderId });
        if (!order) {
            order = await Order.findById(orderId);
        }

        if (!order) return res.status(404).json({ message: 'Order not found' });

        // Prevent assignment if Delivered
        if (order.status === 'Delivered') {
            return res.status(403).json({ message: 'Cannot change rider on a delivered order' });
        }

        // If there was a previous rider, set them to Available (if they were busy)
        if (order.assignedRider) {
            await Rider.findByIdAndUpdate(order.assignedRider, { status: 'Available' });
        }

        // Assign new rider
        if (riderId) {
            order.assignedRider = riderId;
            // If already out for delivery, mark new rider as busy immediately
            if (order.status === 'Out for Delivery') {
                await Rider.findByIdAndUpdate(riderId, { status: 'Busy' });
            }
        } else {
            order.assignedRider = undefined;
        }

        await order.save();
        const updatedOrder = await Order.findById(order._id).populate('assignedRider');

        // Emit socket event
        const io = req.app.get('socketio');
        io.emit('orderUpdated', updatedOrder);

        res.json(updatedOrder);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
