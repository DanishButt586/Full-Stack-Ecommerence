/**
 * Seed script to add products to user carts for testing
 * Usage: node seedCarts.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Cart = require('./Models/cartModel');
const User = require('./Models/userModel');
const Product = require('./Models/productModel');

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB Connected Successfully');
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

const seedCarts = async () => {
    try {
        await connectDB();

        // Get all customer users
        const customers = await User.find({ role: 'customer' }).limit(5);
        console.log(`Found ${customers.length} customers`);

        if (customers.length === 0) {
            console.log('No customers found. Please run seed.js first to create customers.');
            process.exit(0);
        }

        // Get some products
        const products = await Product.find().limit(10);
        console.log(`Found ${products.length} products`);

        if (products.length === 0) {
            console.log('No products found. Please ensure products exist in the database.');
            process.exit(0);
        }

        // Add items to each customer's cart
        for (let i = 0; i < customers.length; i++) {
            const customer = customers[i];
            
            // Find or create cart for this user
            let cart = await Cart.findOne({ user: customer._id });
            
            if (!cart) {
                cart = new Cart({
                    user: customer._id,
                    items: [],
                    savedItems: []
                });
            }

            // Clear existing items for clean test data
            cart.items = [];

            // Add 1-3 random products to cart
            const numItems = Math.floor(Math.random() * 3) + 1;
            for (let j = 0; j < numItems && j < products.length; j++) {
                const product = products[j];
                const quantity = Math.floor(Math.random() * 3) + 1;
                
                cart.items.push({
                    product: product._id,
                    quantity: quantity,
                    price: product.price
                });
            }

            // Calculate total price
            cart.totalPrice = cart.items.reduce((total, item) => {
                return total + (item.price * item.quantity);
            }, 0);

            await cart.save();
            console.log(`✓ Added ${cart.items.length} items to cart for ${customer.name} (${customer.email})`);
            console.log(`  Total cart value: PKR ${cart.totalPrice}`);
        }

        console.log('\n✓ Successfully seeded carts with products');
        console.log('You can now view the carts in the Admin Cart Management panel');
        
        process.exit(0);
    } catch (error) {
        console.error('Error seeding carts:', error);
        process.exit(1);
    }
};

seedCarts();
