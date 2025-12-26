const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const User = require('../models/User');
const nodemailer = require('nodemailer');
const { verifyAdmin } = require('../middleware/authMiddleware');

// Get All Unique Users (Aggregated from Orders + Profile Sync)
router.get('/', verifyAdmin, async (req, res) => {
    try {
        const users = await Order.aggregate([
            {
                $group: {
                    _id: "$user.email",
                    email: { $first: "$user.email" },
                    orderCount: { $sum: 1 },
                    totalSpent: { $sum: "$total" },
                    lastOrder: { $max: "$createdAt" }
                }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "email",
                    foreignField: "email",
                    as: "profile"
                }
            },
            {
                $unwind: {
                    path: "$profile",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $project: {
                    _id: 1,
                    email: 1,
                    orderCount: 1,
                    totalSpent: 1,
                    lastOrder: 1,
                    // Prioritize Profile data, fallback to order info (which we didn't $first but can if needed)
                    // Actually, let's keep it simple: profile has the source of truth now.
                    phone: { $ifNull: ["$profile.phone", "No Phone"] },
                    address: { $ifNull: ["$profile.address", "No Address"] }
                }
            },
            { $sort: { lastOrder: -1 } }
        ]);
        res.json(users);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get Profile by Email
router.get('/profile/:email', async (req, res) => {
    try {
        let user = await User.findOne({ email: req.params.email });
        if (!user) {
            // Find last order to populate initial data if user doesn't exist yet
            const lastOrder = await Order.findOne({ 'user.email': req.params.email }).sort({ createdAt: -1 });
            if (lastOrder) {
                user = new User({
                    email: req.params.email,
                    phone: lastOrder.user.phone,
                    address: lastOrder.user.address
                });
                await user.save();
            }
        }
        res.json(user || { email: req.params.email });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get All Orders for a Specific User (Admin History)
router.get('/:email/orders', verifyAdmin, async (req, res) => {
    try {
        const orders = await Order.find({ 'user.email': req.params.email }).sort({ createdAt: -1 });
        res.json(orders);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Update Profile
router.post('/profile', async (req, res) => {
    const { email, phone, address, savedAddresses } = req.body;
    try {
        const user = await User.findOneAndUpdate(
            { email },
            {
                phone,
                address,
                savedAddresses,
                lastSeen: new Date()
            },
            { upsert: true, new: true }
        );
        res.json(user);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Send Email to User (Admin Only)
router.post('/send-email', verifyAdmin, async (req, res) => {
    const { email, subject, message } = req.body;

    if (!email || !subject || !message) {
        return res.status(400).json({ message: "Email, subject, and message are required." });
    }

    try {
        // Create transporter using environment variables
        const transporter = nodemailer.createTransport({
            service: process.env.EMAIL_SERVICE || 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: subject,
            text: message,
            html: `<div style="font-family: sans-serif; padding: 20px; line-height: 1.6;">${message.replace(/\n/g, '<br>')}</div>`
        };

        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            console.warn("Email credentials not set. Simulating success.");
            return res.json({ success: true, message: "Email simulation successful (credentials missing)." });
        }

        await transporter.sendMail(mailOptions);
        res.json({ success: true, message: "Email sent successfully." });
    } catch (err) {
        console.error("Failed to send email:", err);
        res.status(500).json({ message: "Failed to send email: " + err.message });
    }
});

module.exports = router;
