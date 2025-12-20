const Product = require('../models/Product');
const Order = require('../models/Order');

const updateBestSellers = async () => {
    try {
        console.log("Updating Automated Best Sellers...");

        // 1. Reset all automated best sellers AND salesCount
        await Product.updateMany({}, { isAutomatedBestSeller: false, salesCount: 0 });

        // 2. Aggregate sales per product from all orders
        // Note: For a production app, we might only look at the last 30 days.
        const salesData = await Order.aggregate([
            { $unwind: "$items" },
            {
                $group: {
                    _id: "$items.productId",
                    count: { $sum: "$items.quantity" }
                }
            },
            { $sort: { count: -1 } }
        ]);

        // 3. Update each product's salesCount
        for (const item of salesData) {
            // Find by the custom string id
            await Product.findOneAndUpdate({ id: item._id }, { salesCount: item.count });
        }

        // 4. For each distinct category in the database, pick the top seller
        const categories = await Product.distinct('category');
        for (const cat of categories) {
            const topProduct = await Product.findOne({ category: cat })
                .sort({ salesCount: -1 })
                .exec();

            if (topProduct && topProduct.salesCount > 0) {
                topProduct.isAutomatedBestSeller = true;
                await topProduct.save();
            }
        }

        console.log("Automated Best Sellers updated successfully.");
    } catch (err) {
        console.error("Failed to update best sellers:", err);
    }
};

module.exports = { updateBestSellers };
