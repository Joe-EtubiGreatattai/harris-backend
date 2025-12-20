const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const fs = require('fs');

// Cloudinary Config
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'pizza_app',
        allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
    },
});

const multer = require('multer');
const upload = multer({ storage });

// Upload Endpoint
router.post('/upload', (req, res, next) => {
    upload.single('image')(req, res, (err) => {
        if (err) {
            console.error("❌ Multer/Cloudinary Error:", err);
            return res.status(500).json({ error: err.message || err });
        }
        if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
        res.json({ url: req.file.path });
    });
});

// Helper to emit product events
const emitProductEvent = (req, eventType, product) => {
    const io = req.app.get('socketio');
    if (io) io.emit(eventType, product);
};

// Get All Products
router.get('/', async (req, res) => {
    try {
        const products = await Product.find();
        res.json(products);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get Single Product
router.get('/:id', async (req, res) => {
    try {
        // Search by custom 'id' string, not _id
        const product = await Product.findOne({ id: req.params.id });
        if (product) {
            res.json(product);
        } else {
            res.status(404).json({ message: 'Product not found' });
        }
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Create Product (Admin)
router.post('/', async (req, res) => {
    const product = new Product(req.body);
    try {
        const newProduct = await product.save();
        emitProductEvent(req, 'productCreated', newProduct);
        res.status(201).json(newProduct);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Update Product (Admin)
router.patch('/:id', async (req, res) => {
    try {
        const updatedProduct = await Product.findOneAndUpdate(
            { id: req.params.id },
            req.body,
            { new: true }
        );
        if (updatedProduct) {
            emitProductEvent(req, 'productUpdated', updatedProduct);
        }
        res.json(updatedProduct);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Delete Product (Admin)
router.delete('/:id', async (req, res) => {
    try {
        const deletedProduct = await Product.findOneAndDelete({ id: req.params.id });
        if (deletedProduct) {
            emitProductEvent(req, 'productDeleted', { id: req.params.id });
        }
        res.json({ message: 'Product deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
