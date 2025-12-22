const mongoose = require('mongoose');
const Product = require('./models/Product');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
    console.error('Error: MONGO_URI is not defined in .env');
    process.exit(1);
}

const migrate = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB');

        // Products to move to Pasta
        const pastaItems = ["prod-hv6er5", "prod-7nvfsz", "prod-j607ly"];
        const pastaResult = await Product.updateMany(
            { id: { $in: pastaItems } },
            { $set: { category: 'Pasta' } }
        );
        console.log(`Pasta migration: ${pastaResult.modifiedCount} documents updated.`);

        // Products to move to Beef
        const beefItems = ["prod-vfnd0r", "prod-bq98s2"];
        const beefResult = await Product.updateMany(
            { id: { $in: beefItems } },
            { $set: { category: 'Beef' } }
        );
        console.log(`Beef migration: ${beefResult.modifiedCount} documents updated.`);

        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
};

migrate();
