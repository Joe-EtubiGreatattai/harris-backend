const mongoose = require('mongoose');
const Product = require('./models/Product');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
    console.error('Error: MONGO_URI is not defined in .env');
    process.exit(1);
}

const normalize = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB');

        const result = await Product.updateMany(
            { category: 'Drinks' },
            { $set: { category: 'Drink' } }
        );

        console.log(`Normalization complete: ${result.modifiedCount} documents updated.`);
        process.exit(0);
    } catch (error) {
        console.error('Normalization failed:', error);
        process.exit(1);
    }
};

normalize();
