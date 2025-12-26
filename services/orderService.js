const Order = require('../models/Order');
const Rider = require('../models/Rider');
const PromoCode = require('../models/PromoCode');
const PushSubscription = require('../models/PushSubscription');
const webpush = require('web-push');
const { updateBestSellers } = require('./rankingService');

const createOrder = async (orderData, io) => {
    try {
        // Idempotency check: if orderId already exists, return it
        const existingOrder = await Order.findOne({ orderId: orderData.orderId }).populate('assignedRider');
        if (existingOrder) {
            console.log(`Order ${orderData.orderId} already exists, returning existing.`);
            return existingOrder;
        }

        const newOrder = new Order({
            ...orderData,
            status: 'Pending Payment' // Force status to Pending Payment for safety
        });
        const savedOrder = await (await newOrder.save()).populate('assignedRider');

        // Background update of best sellers
        updateBestSellers(io);

        // Emit socket event ONLY if it's not Pending Payment
        if (io && savedOrder.status !== 'Pending Payment') {
            io.emit('newOrder', savedOrder);
        }

        // If a promo code was used, increment its usage count
        if (orderData.promoCode) {
            try {
                const updatedPromo = await PromoCode.findOneAndUpdate(
                    { code: orderData.promoCode.toUpperCase() },
                    { $inc: { usedCount: 1 } },
                    { new: true }
                );
                if (updatedPromo && io) {
                    io.emit('promoUpdated', updatedPromo);
                }
            } catch (promoErr) {
                console.error("Failed to increment promo usage:", promoErr);
            }
        }

        // Handle notifications (optional: if you want to notify user immediately)
        // Note: For a new order, we might not need to send a status update push yet
        // since the user is likely still on the app.

        return savedOrder;
    } catch (err) {
        console.error("Error in orderService.createOrder:", err);
        throw err;
    }
};

const confirmPayment = async (orderId, io) => {
    try {
        const order = await Order.findOne({ orderId }).populate('assignedRider');
        if (!order) {
            console.error(`Order ${orderId} not found for payment confirmation`);
            return null;
        }

        if (order.status === 'Pending Payment') {
            order.status = 'Pending';
            const savedOrder = await order.save();

            // Background update of best sellers
            updateBestSellers(io);

            // Notify Admin of NEW PAID order
            if (io) {
                io.emit('newOrder', savedOrder);
            }

            console.log(`Order ${orderId} confirmed and moved to Pending status`);
            return savedOrder;
        }

        return order;
    } catch (err) {
        console.error("Error in orderService.confirmPayment:", err);
        throw err;
    }
};

module.exports = {
    createOrder,
    confirmPayment
};
