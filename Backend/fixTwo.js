require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./Models/productModel');

async function fix() {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Fix Electric Kettle 1.7L with a definitely working image
    const kettleResult = await Product.updateOne(
        { name: 'Electric Kettle 1.7L' },
        {
            $set: {
                images: [
                    { url: 'https://images.unsplash.com/photo-1647034871120-49da6b2b72b6?w=600', alt: 'Electric Kettle' },
                    { url: 'https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?w=600', alt: 'Kettle Pouring' }
                ]
            }
        }
    );
    console.log('Electric Kettle 1.7L:', kettleResult.modifiedCount > 0 ? 'FIXED!' : 'Already up to date');

    // Verify the update
    const kettle = await Product.findOne({ name: 'Electric Kettle 1.7L' });
    console.log('Verified kettle images:', JSON.stringify(kettle?.images, null, 2));

    process.exit(0);
}
fix();
