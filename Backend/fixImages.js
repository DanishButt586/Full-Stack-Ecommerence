/**
 * Fix broken product images
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./Models/productModel');

const fixImages = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Fix Electric Toaster
        const toasterResult = await Product.updateOne(
            { name: 'Electric Toaster 4-Slice' },
            {
                images: [
                    { url: 'https://images.unsplash.com/photo-1585237017125-24baf8d7406f?w=600', alt: 'Electric Toaster' },
                    { url: 'https://images.unsplash.com/photo-1621866486780-f5d5319369e6?w=600', alt: 'Toaster Side View' }
                ]
            }
        );
        console.log('✅ Fixed Electric Toaster:', toasterResult.modifiedCount > 0 ? 'Updated' : 'Not found');

        // Fix Premium Polo T-Shirt
        const poloResult = await Product.updateOne(
            { name: 'Premium Polo T-Shirt' },
            {
                images: [
                    { url: 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=600', alt: 'Polo Shirt' },
                    { url: 'https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=600', alt: 'Polo Detail' }
                ]
            }
        );
        console.log('✅ Fixed Premium Polo T-Shirt:', poloResult.modifiedCount > 0 ? 'Updated' : 'Not found');

        // Fix Massage Gun Deep Tissue
        const massageResult = await Product.updateOne(
            { name: 'Massage Gun Deep Tissue' },
            {
                images: [
                    { url: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=600', alt: 'Massage Gun' },
                    { url: 'https://images.unsplash.com/photo-1519824145371-296894a0daa9?w=600', alt: 'Massage Therapy' }
                ]
            }
        );
        console.log('✅ Fixed Massage Gun Deep Tissue:', massageResult.modifiedCount > 0 ? 'Updated' : 'Not found');

        // Fix Facial Cleansing Device
        const facialResult = await Product.updateOne(
            { name: 'Facial Cleansing Device' },
            {
                images: [
                    { url: 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=600', alt: 'Facial Cleansing Device' },
                    { url: 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=600', alt: 'Skincare Device' }
                ]
            }
        );
        console.log('✅ Fixed Facial Cleansing Device:', facialResult.modifiedCount > 0 ? 'Updated' : 'Not found');

        // Fix Smart LED Desk Lamp (remove person image)
        const lampResult = await Product.updateOne(
            { name: 'Smart LED Desk Lamp' },
            {
                images: [
                    { url: 'https://images.unsplash.com/photo-1534105615256-13940a56ff44?w=600', alt: 'LED Desk Lamp' },
                    { url: 'https://images.unsplash.com/photo-1573790387438-4da905039392?w=600', alt: 'Desk Lamp Lit' }
                ]
            }
        );
        console.log('✅ Fixed Smart LED Desk Lamp:', lampResult.modifiedCount > 0 ? 'Updated' : 'Not found');

        console.log('\n✅ All images fixed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

fixImages();
