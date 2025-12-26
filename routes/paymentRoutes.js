const express = require('express');
const router = express.Router();
const https = require('https');
const orderService = require('../services/orderService');
require('dotenv').config();

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

// Initialize Payment
router.post('/initialize', async (req, res) => {
    const { email, amount, metadata } = req.body;

    // 1. Basic Regex Validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
        return res.status(400).json({ status: false, message: "Invalid email address format" });
    }

    // 2. DNS MX Check (Optional but helpful)
    const dns = require('dns').promises;
    try {
        const domain = email.split('@')[1];
        const mx = await dns.resolveMx(domain);
        if (!mx || mx.length === 0) {
            return res.status(400).json({ status: false, message: "Email domain does not exist or cannot receive emails" });
        }
    } catch (dnsErr) {
        console.warn(`DNS check failed for ${email}:`, dnsErr.message);
        // We don't block if DNS fails (could be transient), but regex is hard requirement
    }

    // Convert amount to kobo (Paystack expects amount in lowest currency unit)
    const params = JSON.stringify({
        email: email,
        amount: Math.round(amount * 100), // Naira to Kobo (rounded for safety)
        // callback_url: "https://harris-frontend-kkg4.vercel.app/payment/callback" // Localhost
        callback_url: "https://harris-backend.onrender.com/payment/callback", // Hosted backend callback handler
        metadata: metadata
    });

    const options = {
        hostname: 'api.paystack.co',
        port: 443,
        path: '/transaction/initialize',
        method: 'POST',
        headers: {
            Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
            'Content-Type': 'application/json'
        }
    };

    const request = https.request(options, response => {
        let data = '';
        response.on('data', (chunk) => {
            data += chunk;
        });

        response.on('end', () => {
            try {
                const result = JSON.parse(data);
                res.status(200).json(result);
            } catch (error) {
                res.status(500).json({ error: "Failed to parse Paystack response" });
            }
        });
    });

    request.on('error', error => {
        console.error(error);
        res.status(500).json({ error: "An error occurred" });
    });

    request.write(params);
    request.end();
});

// Verify Payment
router.get('/verify/:reference', async (req, res) => {
    const reference = req.params.reference;

    const options = {
        hostname: 'api.paystack.co',
        port: 443,
        path: `/transaction/verify/${reference}`,
        method: 'GET',
        headers: {
            Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`
        }
    };

    const request = https.request(options, response => {
        let data = '';
        response.on('data', (chunk) => {
            data += chunk;
        });

        response.on('end', () => {
            try {
                const result = JSON.parse(data);
                res.status(200).json(result);
            } catch (error) {
                res.status(500).json({ error: "Failed to parse Paystack response" });
            }
        });
    });

    request.on('error', error => {
        console.error(error);
        res.status(500).json({ error: "An error occurred" });
    });

    request.end();
});

// Paystack Webhook
router.post('/webhook', async (req, res) => {
    const crypto = require('crypto');
    const secret = PAYSTACK_SECRET_KEY;

    // Validate event
    const hash = crypto.createHmac('sha512', secret).update(JSON.stringify(req.body)).digest('hex');

    if (hash == req.headers['x-paystack-signature']) {
        // Retrieve the request's body
        const event = req.body;

        // Log event for now
        console.log("Paystack Event Received:", event.event);

        if (event.event === 'charge.success') {
            const reference = event.data.reference;
            const metadata = event.data.metadata;

            console.log(`Payment successful for reference: ${reference}`);

            if (metadata && metadata.orderData) {
                try {
                    const io = req.app.get('socketio');
                    await orderService.createOrder(metadata.orderData, io);
                    console.log(`Order ${metadata.orderData.orderId} created via Webhook`);
                } catch (orderErr) {
                    console.error("Failed to create order via Webhook:", orderErr);
                }
            }
        }

        res.sendStatus(200);
    } else {
        res.sendStatus(400);
    }
});

module.exports = router;
