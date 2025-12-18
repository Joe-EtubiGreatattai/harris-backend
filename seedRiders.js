const mongoose = require('mongoose');
const Rider = require('./models/Rider');
require('dotenv').config();

const riders = [
    {
        name: "John Doe",
        phone: "08012345678",
        email: "john.doe@example.com",
        status: "Available"
    },
    {
        name: "Jane Smith",
        phone: "08087654321",
        email: "jane.smith@example.com",
        status: "Available"
    },
    {
        name: "Mike Johnson",
        phone: "08122334455",
        email: "mike.johnson@example.com",
        status: "Available"
    },
    {
        name: "Sarah Williams",
        phone: "08155443322",
        email: "sarah.williams@example.com",
        status: "Available"
    },
    {
        name: "David Brown",
        phone: "07011223344",
        email: "david.brown@example.com",
        status: "Suspended"
    }
];

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/pizza_app';

mongoose.connect(MONGO_URI)
    .then(async () => {
        console.log('MongoDB Connected');

        try {
            console.log(`Seeding ${riders.length} riders...`);

            for (const rider of riders) {
                await Rider.updateOne(
                    { email: rider.email },
                    { $set: rider },
                    { upsert: true }
                );
            }
            console.log('Riders seeded successfully.');
            process.exit();
        } catch (err) {
            console.error(err);
            process.exit(1);
        }
    })
    .catch(err => {
        console.log('MongoDB Connection Error:', err);
        process.exit(1);
    });
