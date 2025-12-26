const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' }); // Load from backend/.env
const Order = require('../models/Order');
const User = require('../models/User');

const migrate = async () => {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected successfully.');

        console.log('Fetching unique users from orders...');
        const orders = await Order.aggregate([
            {
                $sort: { createdAt: -1 } // Sort by newest first
            },
            {
                $group: {
                    _id: "$user.email",
                    email: { $first: "$user.email" },
                    phone: { $first: "$user.phone" },
                    address: { $first: "$user.address" },
                    lastSeen: { $first: "$createdAt" }
                }
            }
        ]);

        console.log(`Found ${orders.length} unique users. Starting migration...`);

        let count = 0;
        for (const userData of orders) {
            if (!userData.email) continue;

            await User.findOneAndUpdate(
                { email: userData.email.toLowerCase() },
                {
                    phone: userData.phone,
                    address: userData.address,
                    lastSeen: userData.lastSeen
                },
                { upsert: true, new: true }
            );
            count++;
            if (count % 10 === 0) console.log(`Processed ${count}/${orders.length} users...`);
        }

        console.log(`Migration complete! Successfully processed ${count} users.`);
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
};

migrate();
