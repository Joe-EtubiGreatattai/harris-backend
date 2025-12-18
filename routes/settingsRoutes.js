const express = require('express');
const router = express.Router();
const Settings = require('../models/Settings');

// Get Settings
router.get('/', async (req, res) => {
    try {
        let settings = await Settings.findOne();
        if (!settings) {
            // Initialize if not exists
            settings = new Settings({ deliveryFee: 0 });
            await settings.save();
        }
        res.json(settings);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Update Settings
router.patch('/', async (req, res) => {
    try {
        const { deliveryFee } = req.body;
        let settings = await Settings.findOne();
        if (!settings) {
            settings = new Settings({ deliveryFee });
        } else {
            settings.deliveryFee = deliveryFee;
        }
        const updated = await settings.save();

        // Emit socket update if needed (optional for now, but good practice)
        const io = req.app.get('socketio');
        if (io) io.emit('settingsUpdated', updated);

        res.json(updated);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

module.exports = router;
