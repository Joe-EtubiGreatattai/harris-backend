const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

router.post('/login', (req, res) => {
    const { password } = req.body;
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
    const JWT_SECRET = process.env.JWT_SECRET;

    if (!ADMIN_PASSWORD) {
        console.error('ADMIN_PASSWORD not set in environment variables');
        return res.status(500).json({ message: 'Server configuration error: Missing admin password' });
    }

    if (!JWT_SECRET) {
        console.error('JWT_SECRET not set in environment variables');
        return res.status(500).json({ message: 'Server configuration error: Missing JWT secret' });
    }

    if (password === ADMIN_PASSWORD) {
        try {
            const token = jwt.sign({ role: 'admin' }, JWT_SECRET, { expiresIn: '1h' });
            return res.json({ success: true, token });
        } catch (error) {
            console.error('Error signing JWT:', error);
            return res.status(500).json({ message: 'Error generating token' });
        }
    } else {
        return res.status(401).json({ success: false, message: 'Invalid password' });
    }
});

module.exports = router;
