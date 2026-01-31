const express = require('express');
const router = express.Router();
const Table = require('../models/Table');

// Get all tables
router.get('/', async (req, res) => {
    try {
        const tables = await Table.find().sort({ createdAt: -1 });
        res.json(tables);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Create a table
router.post('/', async (req, res) => {
    const { name, qrUrl } = req.body;
    try {
        const newTable = new Table({ name, qrUrl });
        await newTable.save();

        // Notify admins if needed via socket, though mostly REST based for now

        res.status(201).json(newTable);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Delete a table
router.delete('/:id', async (req, res) => {
    try {
        await Table.findByIdAndDelete(req.params.id);
        res.json({ message: 'Table deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
