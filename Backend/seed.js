/**
 * Database Seed Script
 * Run this to initialize the database with sample data
 * Usage: node seed.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./Models/userModel');

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB Connected Successfully');
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

const seedDatabase = async () => {
    try {
        await connectDB();

        // Clear existing users (optional - comment out if you want to keep existing data)
        // await User.deleteMany({});
        // console.log('Cleared existing users');

        // Check if admin already exists
        const adminExists = await User.findOne({ email: 'Admin123@gmail.com' });

        if (!adminExists) {
            // Note: Admin login is handled separately in the backend with hardcoded credentials
            // This is just a placeholder entry
            console.log('Admin user is handled through hardcoded credentials (Email: Admin123@gmail.com, Password: Admin123@)');
        } else {
            console.log('Admin user already exists in database');
        }

        // Create sample customer users
        const sampleUsers = [
            {
                name: 'Danish',
                email: 'danish@example.com',
                password: '1234',
                phone: '+1234567890',
                role: 'customer',
            },
            {
                name: 'John Doe',
                email: 'john@example.com',
                password: 'password123',
                phone: '+1234567891',
                role: 'customer',
            },
        ];

        for (const userData of sampleUsers) {
            const userExists = await User.findOne({ email: userData.email });
            if (!userExists) {
                await User.create(userData);
                console.log(`Created user: ${userData.name}`);
            } else {
                console.log(`User already exists: ${userData.name}`);
            }
        }

        console.log('\n✅ Database seeded successfully!');
        console.log('\nLogin Credentials:');
        console.log('==================');
        console.log('Admin Portal:');
        console.log('  Username: Admin');
        console.log('  Password: 1234');
        console.log('\nCustomer Portal (Sample Users):');
        console.log('  Username: Danish');
        console.log('  Password: 1234');
        console.log('  OR');
        console.log('  Email: john@example.com');
        console.log('  Password: password123');
        console.log('\nNote: New customers can register through the signup page');

        process.exit(0);
    } catch (error) {
        console.error('Error seeding database:', error);
        process.exit(1);
    }
};

seedDatabase();
