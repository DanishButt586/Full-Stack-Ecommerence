const mongoose = require('mongoose');
const Coupon = require('./Models/couponModel');
require('dotenv').config();

const hardcodedCoupons = [
    {
        code: '233606DA',
        discountType: 'percentage',
        discountValue: 75,
        maxDiscount: null,
        minOrderAmount: 0,
        validFrom: new Date('2024-01-01'),
        validUntil: new Date('2026-12-31'),
        usageLimit: null,
        usagePerUser: 10,
        description: 'Special 75% discount code',
        isActive: true,
    },
    {
        code: '233544SA',
        discountType: 'percentage',
        discountValue: 50,
        maxDiscount: null,
        minOrderAmount: 0,
        validFrom: new Date('2024-01-01'),
        validUntil: new Date('2026-12-31'),
        usageLimit: null,
        usagePerUser: 10,
        description: 'Special 50% discount code',
        isActive: true,
    },
    {
        code: '233532RA',
        discountType: 'percentage',
        discountValue: 50,
        maxDiscount: null,
        minOrderAmount: 0,
        validFrom: new Date('2024-01-01'),
        validUntil: new Date('2026-12-31'),
        usageLimit: null,
        usagePerUser: 10,
        description: 'Special 50% discount code',
        isActive: true,
    },
    {
        code: '233586OW',
        discountType: 'percentage',
        discountValue: 40,
        maxDiscount: null,
        minOrderAmount: 0,
        validFrom: new Date('2024-01-01'),
        validUntil: new Date('2026-12-31'),
        usageLimit: null,
        usagePerUser: 10,
        description: 'Special 40% discount code',
        isActive: true,
    },
    {
        code: 'SAVE10',
        discountType: 'percentage',
        discountValue: 10,
        maxDiscount: null,
        minOrderAmount: 0,
        validFrom: new Date('2024-01-01'),
        validUntil: new Date('2026-12-31'),
        usageLimit: null,
        usagePerUser: 5,
        description: 'Save 10% on your order',
        isActive: true,
    },
    {
        code: 'FIRST20',
        discountType: 'percentage',
        discountValue: 20,
        maxDiscount: null,
        minOrderAmount: 0,
        validFrom: new Date('2024-01-01'),
        validUntil: new Date('2026-12-31'),
        usageLimit: null,
        usagePerUser: 1,
        description: 'First time customer 20% discount',
        isActive: true,
    },
];

const seedCoupons = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('📊 Connected to MongoDB');

        // Clear existing coupons (optional - comment out if you want to keep existing ones)
        // await Coupon.deleteMany({});
        // console.log('🗑️  Cleared existing coupons');

        // Insert hardcoded coupons
        for (const couponData of hardcodedCoupons) {
            try {
                // Check if coupon already exists
                const existingCoupon = await Coupon.findOne({ code: couponData.code });

                if (existingCoupon) {
                    console.log(`⚠️  Coupon ${couponData.code} already exists, skipping...`);
                } else {
                    await Coupon.create(couponData);
                    console.log(`✅ Created coupon: ${couponData.code} (${couponData.discountValue}% discount)`);
                }
            } catch (err) {
                console.error(`❌ Error creating coupon ${couponData.code}:`, err.message);
            }
        }

        console.log('\n🎉 Coupon seeding completed!');
        console.log(`📝 Total coupons in database: ${await Coupon.countDocuments()}`);

        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding coupons:', error);
        process.exit(1);
    }
};

seedCoupons();
