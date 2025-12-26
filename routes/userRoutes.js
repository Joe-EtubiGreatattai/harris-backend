const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const nodemailer = require('nodemailer');

// Get All Unique Users (Aggregated from Orders)
router.get('/', async (req, res) => {
    try {
        const users = await Order.aggregate([
            {
                $group: {
                    _id: "$user.email",
                    email: { $first: "$user.email" },
                    address: { $first: "$user.address" },
                    phone: { $first: "$user.phone" },
                    orderCount: { $sum: 1 },
                    totalSpent: { $sum: "$total" },
                    lastOrder: { $max: "$createdAt" }
                }
            },
            { $sort: { lastOrder: -1 } }
        ]);
        res.json(users);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get Order History for a specific User
router.get('/:email/orders', async (req, res) => {
    try {
        const orders = await Order.find({ 'user.email': req.params.email })
            .sort({ createdAt: -1 })
            .populate('assignedRider');
        res.json(orders);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Send Email to User
router.post('/send-email', async (req, res) => {
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
