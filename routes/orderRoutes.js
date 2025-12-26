const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Rider = require('../models/Rider');
const PushSubscription = require('../models/PushSubscription');
const webpush = require('web-push');
const { updateBestSellers } = require('../services/rankingService');
const orderService = require('../services/orderService');

// Create New Order
router.post('/', async (req, res) => {
    try {
        const io = req.app.get('socketio');
        const savedOrder = await orderService.createOrder(req.body, io);
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
        const { status, source } = req.body;
        const updateData = { status };

        if (status === 'Delivered') {
            updateData.deliveredAt = new Date();
            updateData.deliveredBy = source || 'Admin';
        }

        // Use findOneAndUpdate with orderId (our custom ID) or _id
        // Try finding by custom orderId first, then fallback to _id if standard mongo ID
        let updatedOrder = await Order.findOneAndUpdate(
            { orderId: req.params.id },
            updateData,
            { new: true }
        ).populate('assignedRider');

        if (!updatedOrder) {
            updatedOrder = await Order.findByIdAndUpdate(
                req.params.id,
                updateData,
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

        // Send Push Notification
        const userEmail = updatedOrder.user.email;
        const subscriptionDoc = await PushSubscription.findOne({ email: userEmail });

        if (subscriptionDoc) {
            const payload = JSON.stringify({
                title: 'Order Update',
                body: `Your order status is now: ${status}`,
                icon: 'https://res.cloudinary.com/doefjylyu/image/upload/v1766070489/Screenshot_2025-12-18_at_4.06.53_pm_meuhxb.png',
                data: {
                    orderId: updatedOrder.orderId,
                    url: `https://harris-frontend-kkg4.vercel.app/tracking`
                }
            });

            webpush.sendNotification(subscriptionDoc.subscription, payload)
                .catch(err => console.error('Error sending push notification:', err));
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

// Ping Kitchen
router.post('/:id/ping', async (req, res) => {
    try {
        const orderId = req.params.id;
        let order = await Order.findOne({ orderId });
        if (!order) order = await Order.findById(orderId);
        if (!order) return res.status(404).json({ message: 'Order not found' });

        // Check cooldown (3 minutes)
        const lastPing = order.pings[order.pings.length - 1];
        if (lastPing && (new Date() - new Date(lastPing.at)) < 3 * 60 * 1000) {
            return res.status(429).json({ message: 'You can only ping every 3 minutes.' });
        }

        order.pings.push({ at: new Date(), acknowledged: false });
        await order.save();

        const io = req.app.get('socketio');
        if (io) {
            io.emit('adminOrderPinged', { orderId: order.orderId, userEmail: order.user.email });
        }

        res.json({ message: 'Ping sent to kitchen', order });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Acknowledge Ping
router.post('/:id/acknowledge-ping', async (req, res) => {
    try {
        const orderId = req.params.id;
        let order = await Order.findOne({ orderId });
        if (!order) order = await Order.findById(orderId);
        if (!order) return res.status(404).json({ message: 'Order not found' });

        // Update all unacknowledged pings
        order.pings.forEach(p => {
            if (!p.acknowledged) {
                p.acknowledged = true;
                p.acknowledgedAt = new Date();
            }
        });

        await order.save();

        const io = req.app.get('socketio');
        if (io) {
            io.to(`order:${order.orderId}`).emit('orderPingAcknowledged', { orderId: order.orderId });
        }

        res.json({ message: 'Ping acknowledged', order });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Update User Phone for Order
router.patch('/:id/phone', async (req, res) => {
    try {
        const { phone } = req.body;
        const orderId = req.params.id;
        let order = await Order.findOneAndUpdate(
            { orderId },
            { 'user.phone': phone },
            { new: true }
        );
        if (!order) order = await Order.findByIdAndUpdate(orderId, { 'user.phone': phone }, { new: true });

        if (!order) return res.status(404).json({ message: 'Order not found' });

        res.json(order);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
