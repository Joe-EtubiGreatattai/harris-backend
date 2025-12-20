const express = require('express');
const router = express.Router();
const https = require('https');
const Withdrawal = require('../models/Withdrawal');
require('dotenv').config();

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

// Helper function for Paystack API calls
const paystackRequest = (path, method, body = null) => {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'api.paystack.co',
            port: 443,
            path: path,
            method: method,
            headers: {
                Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
                'Content-Type': 'application/json'
            }
        };

        const req = https.request(options, res => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    reject(new Error('Failed to parse Paystack response'));
                }
            });
        });

        req.on('error', error => reject(error));
        if (body) req.write(JSON.stringify(body));
        req.end();
    });
};

// Get list of banks
router.get('/banks', async (req, res) => {
    try {
        const result = await paystackRequest('/bank?currency=NGN', 'GET');
        res.json(result);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get Paystack account balance
router.get('/balance', async (req, res) => {
    try {
        const result = await paystackRequest('/balance', 'GET');
        res.json(result);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Verify bank account
router.post('/verify-account', async (req, res) => {
    const { accountNumber, bankCode } = req.body;
    try {
        const result = await paystackRequest(`/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`, 'GET');
        res.json(result);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Initiate withdrawal
router.post('/initiate', async (req, res) => {
    const { amount, bankCode, bankName, accountNumber, accountName, reason } = req.body;

    try {
        // 1. Create Transfer Recipient
        const recipientResult = await paystackRequest('/transferrecipient', 'POST', {
            type: 'nuban',
            name: accountName,
            account_number: accountNumber,
            bank_code: bankCode,
            currency: 'NGN'
        });

        if (!recipientResult.status) {
            return res.status(400).json({ message: recipientResult.message });
        }

        const recipientCode = recipientResult.data.recipient_code;

        // 2. Initiate Transfer
        const reference = `WD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        const transferResult = await paystackRequest('/transfer', 'POST', {
            source: 'balance',
            amount: Math.round(amount * 100), // Naira to Kobo
            recipient: recipientCode,
            reason: reason || 'Admin Withdrawal',
            reference: reference
        });

        if (!transferResult.status) {
            return res.status(400).json({ message: transferResult.message });
        }

        // 3. Save Withdrawal record
        const withdrawal = new Withdrawal({
            amount,
            status: 'Pending', // Paystack transfers are usually pending/processing initially
            bankName,
            bankCode,
            accountNumber,
            accountName,
            transferCode: transferResult.data.transfer_code,
            reference: reference,
            reason
        });

        await withdrawal.save();

        res.status(201).json(withdrawal);
    } catch (err) {
        console.error('Payout Error:', err);
        res.status(500).json({ message: err.message });
    }
});

// Get withdrawal history
router.get('/history', async (req, res) => {
    try {
        const history = await Withdrawal.find().sort({ createdAt: -1 });
        res.json(history);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
