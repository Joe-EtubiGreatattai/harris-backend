const mongoose = require('mongoose');
const Product = require('./models/Product');
require('dotenv').config();

const products = [
    {
        id: "chef-special",
        name: "Chef Special",
        description: "Beef, sausage, sweet corn, red pepper, green pepper, tomato sauce, mozzarella cheese.",
        prices: { S: 9500, M: 11500, L: 13500, XL: 15500 },
        image: "https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
        category: "Pizza",
        isBestSeller: true
    },
    {
        id: "half-half",
        name: "Half/Half Pizza",
        description: "Two of your favorite pizza in one.",
        prices: { S: 10000, M: 12000, L: 15000, XL: 18000 },
        image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
        category: "Pizza",
        isBestSeller: true
    },
    {
        id: "create-your-own",
        name: "Create Your Pizza",
        description: "Pick three veggies and two proteins.",
        prices: { S: 9000, M: 12000, L: 15000, XL: 18000 },
        image: "https://images.unsplash.com/photo-1571407970349-bc487eacdea9?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
        category: "Pizza"
    },
    {
        id: "sausage-deluxe",
        name: "Sausage Deluxe",
        description: "A generous spread of sausage, tomato sauce and mozzarella cheese",
        prices: { S: 7000, M: 9000, L: 11000, XL: 13000 },
        image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
        category: "Pizza",
        isBestSeller: true
    },
    {
        id: "hot-spicy",
        name: "Hot & Spicy Pizza",
        description: "Red chilli pepper, beef, pepperoni, chilli sauce, sauce, mozzarella cheese.",
        prices: { S: 8500, M: 10500, L: 12500, XL: 14500 },
        image: "https://images.unsplash.com/photo-1628840042765-356cda07504e?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
        category: "Pizza"
    },
    {
        id: "hp-square",
        name: "HP Square Pizza",
        description: "Chicken, Sausage, red pepper, green pepper, sauce, mozzarella cheese.",
        prices: { S: 8500, M: 10500, L: 12500, XL: 14500 },
        image: "https://images.unsplash.com/photo-1594007654729-407eedc4be65?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
        category: "Pizza"
    },
    {
        id: "seafood",
        name: "Sea Food Pizza",
        description: "Shrimps, tunafish, red chilli pepper, mushroom, sauce and mozzarella cheese",
        prices: { S: 10000, M: 12000, L: 14000, XL: 16000 },
        image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
        category: "Pizza"
    },
    {
        id: "bbq-chicken",
        name: "BBQ Chicken Pizza",
        description: "Grilled chicken, BBQ sauce, red onions, and mozzarella cheese.",
        prices: { S: 7200, M: 9200, L: 11200, XL: 13200 },
        image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
        category: "Pizza",
        isBestSeller: true
    },
    {
        id: "chicken-supreme",
        name: "Chicken Supreme",
        description: "Chicken, mushrooms, mozzarella and sauce",
        prices: { S: 8000, M: 10000, L: 12000, XL: 14000 },
        image: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
        category: "Pizza",
        isBestSeller: true
    },
    {
        id: "meaty",
        name: "Meaty Pizza",
        description: "Loaded with pepperoni, beef sausage, green peppers and chilli pepper",
        prices: { S: 8300, M: 10300, L: 12300, XL: 14300 },
        image: "https://images.unsplash.com/photo-1628840042765-356cda07504e?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
        category: "Pizza"
    },
    {
        id: "vegetarian",
        name: "Vegetarian",
        description: "A colorful mix of bell peppers, black olives, mushrooms, and red onions, chilli sauce and tomato",
        prices: { S: 7200, M: 9200, L: 11200, XL: 13200 },
        image: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
        category: "Pizza"
    },
    {
        id: "chicken-peri-peri",
        name: "Chicken Peri Peri",
        description: "Sauced chicken, pineapple, red bell pepper, chilli pepper & mozzarella",
        prices: { S: 7000, M: 9000, L: 11000, XL: 13000 },
        image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
        category: "Pizza",
        isBestSeller: true
    },
    {
        id: "hot-mexicana",
        name: "Hot Mexicana",
        description: "Ground beef, jalapeños, red peppers, onions, and mozzarella.",
        prices: { S: 6000, M: 8000, L: 11000, XL: 12000 },
        image: "https://images.unsplash.com/photo-1628840042765-356cda07504e?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
        category: "Pizza"
    },
    {
        id: "magharitta",
        name: "Magharitta/Cheese Lovers",
        description: "A perfect blend of mozzarella, parmesan, and cheddar",
        prices: { S: 8000, M: 10000, L: 12000, XL: 14000 },
        image: "https://images.unsplash.com/photo-1589187151053-5ec8818e661b?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
        category: "Pizza",
        isBestSeller: true
    },
    {
        id: "hawaiian",
        name: "Hawaiian Pizza",
        description: "A sweet and savory combo of ham, pineapple chunks, mozzarella.",
        prices: { S: 7400, M: 9400, L: 11400, XL: 13400 },
        image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
        category: "Pizza"
    },
    {
        id: "pepperoni",
        name: "Pepperoni Pizza",
        description: "Topped with generous slices of beef pepperoni.",
        prices: { S: 8200, M: 10200, L: 12200, XL: 14200 },
        image: "https://images.unsplash.com/photo-1628840042765-356cda07504e?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
        category: "Pizza"
    },
    // Burgers
    {
        id: "classic-beef-burger",
        name: "Classic Beef Burger",
        description: "Juicy beef patty, cheddar cheese, lettuce, tomato, house sauce.",
        prices: { S: 3500, M: 4500, L: 5500, XL: 6500 },
        image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
        category: "Burger",
        isBestSeller: true
    },
    {
        id: "chicken-crunch-burger",
        name: "Chicken Crunch Burger",
        description: "Crispy fried chicken breast, spicy mayo, pickles.",
        prices: { S: 4000, M: 5000, L: 6000, XL: 7000 },
        image: "https://images.unsplash.com/photo-1615297348960-ef067b3f7731?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
        category: "Burger"
    },
    {
        id: "bbq-bacon-burger",
        name: "BBQ Bacon Burger",
        description: "Beef patty, crispy bacon, onion rings, BBQ sauce.",
        prices: { S: 4500, M: 5500, L: 6500, XL: 7500 },
        image: "https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
        category: "Burger"
    },
    // Chicken
    {
        id: "spicy-wings-6",
        name: "Spicy Chicken Wings",
        description: "6pcs hot and spicy wings with dip.",
        prices: { S: 3000, M: 3000, L: 5500, XL: 8000 }, // Scaling by portion roughly
        image: "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
        category: "Chicken"
    },
    {
        id: "fried-chicken-basket",
        name: "Fried Chicken Basket",
        description: "3pcs crispy fried chicken with fries.",
        prices: { S: 5000, M: 5000, L: 5000, XL: 5000 },
        image: "https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
        category: "Chicken",
        isBestSeller: true
    },
    {
        id: "grilled-chicken",
        name: "Grilled Chicken Quarter",
        description: "Flame grilled chicken quarter with spicy herb marinade.",
        prices: { S: 4000, M: 4000, L: 4000, XL: 4000 },
        image: "https://images.unsplash.com/photo-1532550907401-a500c9a57435?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
        category: "Chicken"
    },
    // Drinks
    {
        id: "coke",
        name: "Coca Cola",
        description: "Ice cold refreshing coke.",
        prices: { S: 500, M: 500, L: 500, XL: 500 },
        image: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
        category: "Drink"
    },
    {
        id: "orange-juice",
        name: "Fresh Orange Juice",
        description: "Freshly squeezed oranges.",
        prices: { S: 1500, M: 2000, L: 2500, XL: 3000 },
        image: "https://images.unsplash.com/photo-1624797432677-6f803a98acb3?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
        category: "Drink"
    },
    {
        id: "water",
        name: "Bottled Water",
        description: "Pure natural spring water.",
        prices: { S: 300, M: 300, L: 300, XL: 300 },
        image: "https://images.unsplash.com/photo-1616118132534-381148898bb4?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
        category: "Drink"
    },
    // Shawarma
    {
        id: "beef-shawarma",
        name: "Beef Shawarma",
        description: "Spicy beef strips with cabbage, carrot and special cream.",
        prices: { S: 2500, M: 3000, L: 3500, XL: 4000 }, // Double sausage/Regular/Large/Jumbo logic
        image: "https://images.unsplash.com/photo-1644365313988-cb94cb05bf47?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
        category: "Shawarma",
        isBestSeller: true
    },
    {
        id: "chicken-shawarma",
        name: "Chicken Shawarma",
        description: "Grilled chicken strips with fresh veggies and cream.",
        prices: { S: 2500, M: 3000, L: 3500, XL: 4000 },
        image: "https://images.unsplash.com/photo-1529006557810-274b9b2eb783?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
        category: "Shawarma"
    }
];

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/pizza_app';

mongoose.connect(MONGO_URI)
    .then(async () => {
        console.log('MongoDB Connected');

        try {
            // EXCLUSIVE: Only seed Shawarma data as requested
            const shawarmaProducts = products.filter(p => p.category === 'Shawarma');

            if (shawarmaProducts.length === 0) {
                console.log('No Shawarma products found to seed.');
            } else {
                console.log(`Seeding ${shawarmaProducts.length} Shawarma products...`);

                for (const product of shawarmaProducts) {
                    await Product.updateOne(
                        { id: product.id },
                        { $set: product },
                        { upsert: true } // Create if doesn't exist, update if it does
                    );
                }
                console.log('Shawarma data seeded successfully.');
            }

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
