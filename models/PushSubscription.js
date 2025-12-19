const mongoose = require('mongoose');

const PushSubscriptionSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    subscription: {
        endpoint: { type: String, required: true },
        keys: {
            p256dh: { type: String, required: true },
            auth: { type: String, required: true }
        }
    },
    updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('PushSubscription', PushSubscriptionSchema);
