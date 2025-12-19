const express = require('express');
const router = express.Router();
const PushSubscription = require('../models/PushSubscription');
const webpush = require('web-push');

// VAPID keys should ideally be in env variables
const publicVapidKey = process.env.PUBLIC_VAPID_KEY || 'BOfeAhKKoeQ1v_3d9KF_MRBdSSJBZEPXzhy-aIIy_LA0Z99Um7fWANHU8UeMLbRoUQ9nJ2IDroyvWfanpYh8K9A';
const privateVapidKey = process.env.PRIVATE_VAPID_KEY || 'moFyAYfeXY3rrxlWOAH4kl-VV1X-4b-XBBOT9qbekVc';

webpush.setVapidDetails(
    'mailto:support@harrispizza.com',
    publicVapidKey,
    privateVapidKey
);

// Get Public Key
router.get('/vapid-public-key', (req, res) => {
    res.json({ publicKey: publicVapidKey });
});

// Subscribe to push notifications
router.post('/subscribe', async (req, res) => {
    const { email, subscription } = req.body;

    try {
        await PushSubscription.findOneAndUpdate(
            { email },
            { subscription, updatedAt: Date.now() },
            { upsert: true, new: true }
        );
        res.status(201).json({ message: 'Subscription saved' });
    } catch (error) {
        console.error('Error saving subscription:', error);
        res.status(500).json({ error: 'Failed to save subscription' });
    }
});

module.exports = router;
