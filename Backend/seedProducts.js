/**
 * Seed Products Script
 * Adds 30 products with proper images and PKR pricing
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./Models/productModel');
const Category = require('./Models/categoryModel');

// MongoDB Connection
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB Connected');
    } catch (error) {
        console.error('MongoDB connection error:', error);
        process.exit(1);
    }
};

// Categories data
const categoriesData = [
    {
        name: 'Electronics',
        slug: 'electronics',
        description: 'Latest electronic gadgets and devices',
        image: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=400'
    },
    {
        name: 'Fashion',
        slug: 'fashion',
        description: 'Trendy clothing and accessories',
        image: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=400'
    },
    {
        name: 'Home & Kitchen',
        slug: 'home-kitchen',
        description: 'Home appliances and kitchen essentials',
        image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400'
    },
    {
        name: 'Sports & Fitness',
        slug: 'sports-fitness',
        description: 'Sports equipment and fitness gear',
        image: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=400'
    },
    {
        name: 'Books & Stationery',
        slug: 'books-stationery',
        description: 'Books, notebooks and office supplies',
        image: 'https://images.unsplash.com/photo-1524578271613-d550eacf6090?w=400'
    },
    {
        name: 'Beauty & Health',
        slug: 'beauty-health',
        description: 'Beauty products and health essentials',
        image: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400'
    }
];

// Products data with PKR pricing
const getProductsData = (categories) => {
    const categoryMap = {};
    categories.forEach(cat => {
        categoryMap[cat.slug] = cat._id;
    });

    return [
        // Electronics (6 products)
        {
            name: 'Wireless Bluetooth Earbuds Pro',
            description: 'Premium wireless earbuds with active noise cancellation, 24-hour battery life, and crystal-clear sound quality. Features touch controls and IPX5 water resistance. Perfect for music lovers and professionals on the go.',
            price: 8999,
            comparePrice: 12999,
            category: categoryMap['electronics'],
            brand: 'SoundMax',
            stock: 150,
            sku: 'ELEC-001',
            images: [
                { url: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=600', alt: 'Wireless Earbuds' },
                { url: 'https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?w=600', alt: 'Earbuds Case' }
            ],
            isFeatured: true,
            isActive: true,
            specifications: [
                { key: 'Battery Life', value: '24 hours' },
                { key: 'Connectivity', value: 'Bluetooth 5.2' },
                { key: 'Water Resistance', value: 'IPX5' }
            ],
            tags: ['wireless', 'earbuds', 'bluetooth', 'audio'],
            ratings: { average: 4.5, count: 128 }
        },
        {
            name: 'Smart Watch Series X',
            description: 'Advanced smartwatch with health monitoring, GPS tracking, and 7-day battery life. Features heart rate sensor, blood oxygen monitoring, sleep tracking, and 100+ workout modes.',
            price: 15999,
            comparePrice: 22999,
            category: categoryMap['electronics'],
            brand: 'TechFit',
            stock: 85,
            sku: 'ELEC-002',
            images: [
                { url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600', alt: 'Smart Watch' },
                { url: 'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=600', alt: 'Smart Watch Side' }
            ],
            isFeatured: true,
            isActive: true,
            specifications: [
                { key: 'Display', value: '1.9" AMOLED' },
                { key: 'Battery', value: '7 days' },
                { key: 'Water Resistance', value: '5ATM' }
            ],
            tags: ['smartwatch', 'fitness', 'health', 'gps'],
            ratings: { average: 4.7, count: 256 }
        },
        {
            name: 'Portable Bluetooth Speaker',
            description: 'Powerful 40W portable speaker with 360° surround sound, deep bass, and waterproof design. Features 20-hour playtime, built-in microphone, and party sync for multiple speakers.',
            price: 6499,
            comparePrice: 8999,
            category: categoryMap['electronics'],
            brand: 'BassKing',
            stock: 200,
            sku: 'ELEC-003',
            images: [
                { url: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=600', alt: 'Bluetooth Speaker' },
                { url: 'https://images.unsplash.com/photo-1545454675-3531b543be5d?w=600', alt: 'Speaker Front' }
            ],
            isFeatured: false,
            isActive: true,
            specifications: [
                { key: 'Power Output', value: '40W' },
                { key: 'Battery Life', value: '20 hours' },
                { key: 'Waterproof', value: 'IPX7' }
            ],
            tags: ['speaker', 'bluetooth', 'portable', 'music'],
            ratings: { average: 4.3, count: 89 }
        },
        {
            name: 'Wireless Gaming Mouse',
            description: 'High-precision gaming mouse with 16000 DPI sensor, RGB lighting, and ultra-fast wireless connection. Features 8 programmable buttons and ergonomic design for extended gaming sessions.',
            price: 4999,
            comparePrice: 6999,
            category: categoryMap['electronics'],
            brand: 'GamePro',
            stock: 120,
            sku: 'ELEC-004',
            images: [
                { url: 'https://images.unsplash.com/photo-1527814050087-3793815479db?w=600', alt: 'Gaming Mouse' },
                { url: 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=600', alt: 'Mouse RGB' }
            ],
            isFeatured: false,
            isActive: true,
            specifications: [
                { key: 'DPI', value: '16000' },
                { key: 'Buttons', value: '8 Programmable' },
                { key: 'Connection', value: '2.4GHz Wireless' }
            ],
            tags: ['gaming', 'mouse', 'wireless', 'rgb'],
            ratings: { average: 4.6, count: 167 }
        },
        {
            name: 'Mechanical Gaming Keyboard',
            description: 'Premium mechanical keyboard with hot-swappable switches, per-key RGB backlighting, and aircraft-grade aluminum frame. Features anti-ghosting and N-key rollover.',
            price: 7999,
            comparePrice: 10999,
            category: categoryMap['electronics'],
            brand: 'GamePro',
            stock: 75,
            sku: 'ELEC-005',
            images: [
                { url: 'https://images.unsplash.com/photo-1511467687858-23d96c32e4ae?w=600', alt: 'Mechanical Keyboard' },
                { url: 'https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?w=600', alt: 'Keyboard RGB' }
            ],
            isFeatured: true,
            isActive: true,
            specifications: [
                { key: 'Switch Type', value: 'Hot-Swappable' },
                { key: 'Backlighting', value: 'Per-Key RGB' },
                { key: 'Frame', value: 'Aluminum Alloy' }
            ],
            tags: ['gaming', 'keyboard', 'mechanical', 'rgb'],
            ratings: { average: 4.8, count: 203 }
        },
        {
            name: 'USB-C Fast Charging Power Bank',
            description: '20000mAh power bank with 65W fast charging, supporting laptops, tablets, and phones. Features digital display, dual USB-C ports, and compact design.',
            price: 5499,
            comparePrice: 7499,
            category: categoryMap['electronics'],
            brand: 'PowerMax',
            stock: 180,
            sku: 'ELEC-006',
            images: [
                { url: 'https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=600', alt: 'Power Bank' },
                { url: 'https://images.unsplash.com/photo-1585338107529-13afc5f02586?w=600', alt: 'Power Bank Ports' }
            ],
            isFeatured: false,
            isActive: true,
            specifications: [
                { key: 'Capacity', value: '20000mAh' },
                { key: 'Max Output', value: '65W' },
                { key: 'Ports', value: '2x USB-C, 1x USB-A' }
            ],
            tags: ['powerbank', 'charging', 'portable', 'usb-c'],
            ratings: { average: 4.4, count: 142 }
        },

        // Fashion (5 products)
        {
            name: 'Premium Cotton Casual Shirt',
            description: 'Comfortable 100% cotton casual shirt with modern slim fit design. Perfect for both casual and semi-formal occasions. Available in multiple colors with breathable fabric.',
            price: 2499,
            comparePrice: 3499,
            category: categoryMap['fashion'],
            brand: 'StyleCraft',
            stock: 300,
            sku: 'FASH-001',
            images: [
                { url: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=600', alt: 'Casual Shirt' },
                { url: 'https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=600', alt: 'Shirt Details' }
            ],
            isFeatured: true,
            isActive: true,
            specifications: [
                { key: 'Material', value: '100% Cotton' },
                { key: 'Fit', value: 'Slim Fit' },
                { key: 'Care', value: 'Machine Washable' }
            ],
            tags: ['shirt', 'casual', 'cotton', 'menswear'],
            ratings: { average: 4.2, count: 178 }
        },
        {
            name: 'Classic Leather Wallet',
            description: 'Genuine leather bifold wallet with RFID blocking technology. Features 8 card slots, 2 bill compartments, and ID window. Slim design fits comfortably in any pocket.',
            price: 1999,
            comparePrice: 2999,
            category: categoryMap['fashion'],
            brand: 'LeatherLux',
            stock: 250,
            sku: 'FASH-002',
            images: [
                { url: 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=600', alt: 'Leather Wallet' },
                { url: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=600', alt: 'Wallet Interior' }
            ],
            isFeatured: false,
            isActive: true,
            specifications: [
                { key: 'Material', value: 'Genuine Leather' },
                { key: 'Card Slots', value: '8' },
                { key: 'RFID Protection', value: 'Yes' }
            ],
            tags: ['wallet', 'leather', 'accessories', 'rfid'],
            ratings: { average: 4.5, count: 234 }
        },
        {
            name: 'Aviator Sunglasses UV400',
            description: 'Classic aviator sunglasses with polarized UV400 protection lenses. Lightweight metal frame with adjustable nose pads for perfect fit. Includes premium case and cleaning cloth.',
            price: 1499,
            comparePrice: 2499,
            category: categoryMap['fashion'],
            brand: 'SunVision',
            stock: 400,
            sku: 'FASH-003',
            images: [
                { url: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=600', alt: 'Aviator Sunglasses' },
                { url: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=600', alt: 'Sunglasses Side' }
            ],
            isFeatured: true,
            isActive: true,
            specifications: [
                { key: 'UV Protection', value: 'UV400' },
                { key: 'Polarized', value: 'Yes' },
                { key: 'Frame', value: 'Metal Alloy' }
            ],
            tags: ['sunglasses', 'aviator', 'polarized', 'accessories'],
            ratings: { average: 4.3, count: 312 }
        },
        {
            name: 'Running Sports Shoes',
            description: 'Lightweight running shoes with responsive cushioning and breathable mesh upper. Features anti-slip rubber outsole and memory foam insole for maximum comfort during workouts.',
            price: 4999,
            comparePrice: 6999,
            category: categoryMap['fashion'],
            brand: 'SpeedStep',
            stock: 180,
            sku: 'FASH-004',
            images: [
                { url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600', alt: 'Running Shoes' },
                { url: 'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=600', alt: 'Shoes Side View' }
            ],
            isFeatured: true,
            isActive: true,
            specifications: [
                { key: 'Upper', value: 'Breathable Mesh' },
                { key: 'Sole', value: 'Anti-slip Rubber' },
                { key: 'Insole', value: 'Memory Foam' }
            ],
            tags: ['shoes', 'running', 'sports', 'footwear'],
            ratings: { average: 4.6, count: 289 }
        },
        {
            name: 'Leather Crossbody Bag',
            description: 'Stylish genuine leather crossbody bag with adjustable strap. Features multiple compartments, secure zipper closure, and antique brass hardware. Perfect for daily use.',
            price: 3499,
            comparePrice: 4999,
            category: categoryMap['fashion'],
            brand: 'LeatherLux',
            stock: 120,
            sku: 'FASH-005',
            images: [
                { url: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600', alt: 'Crossbody Bag' },
                { url: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=600', alt: 'Bag Interior' }
            ],
            isFeatured: false,
            isActive: true,
            specifications: [
                { key: 'Material', value: 'Genuine Leather' },
                { key: 'Strap', value: 'Adjustable' },
                { key: 'Closure', value: 'Zipper' }
            ],
            tags: ['bag', 'crossbody', 'leather', 'accessories'],
            ratings: { average: 4.4, count: 156 }
        },

        // Home & Kitchen (5 products)
        {
            name: 'Stainless Steel Cookware Set',
            description: '10-piece premium stainless steel cookware set with tri-ply construction for even heat distribution. Includes frying pans, saucepans, and stockpot with tempered glass lids.',
            price: 12999,
            comparePrice: 18999,
            category: categoryMap['home-kitchen'],
            brand: 'ChefPro',
            stock: 60,
            sku: 'HOME-001',
            images: [
                { url: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600', alt: 'Cookware Set' },
                { url: 'https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?w=600', alt: 'Pots and Pans' }
            ],
            isFeatured: true,
            isActive: true,
            specifications: [
                { key: 'Material', value: 'Stainless Steel' },
                { key: 'Pieces', value: '10' },
                { key: 'Dishwasher Safe', value: 'Yes' }
            ],
            tags: ['cookware', 'kitchen', 'stainless steel', 'cooking'],
            ratings: { average: 4.7, count: 98 }
        },
        {
            name: 'Smart Air Purifier',
            description: 'HEPA air purifier with smart WiFi control and real-time air quality monitoring. Covers up to 500 sq ft with 3-stage filtration system. Features sleep mode and auto-adjust.',
            price: 18999,
            comparePrice: 24999,
            category: categoryMap['home-kitchen'],
            brand: 'PureAir',
            stock: 45,
            sku: 'HOME-002',
            images: [
                { url: 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=600', alt: 'Air Purifier' },
                { url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600', alt: 'Purifier Display' }
            ],
            isFeatured: true,
            isActive: true,
            specifications: [
                { key: 'Coverage', value: '500 sq ft' },
                { key: 'Filter Type', value: 'HEPA H13' },
                { key: 'Smart Control', value: 'WiFi Enabled' }
            ],
            tags: ['air purifier', 'hepa', 'smart home', 'health'],
            ratings: { average: 4.5, count: 76 }
        },
        {
            name: 'Electric Kettle 1.7L',
            description: 'Rapid-boil electric kettle with temperature control and keep-warm function. Features double-wall insulation, auto shut-off, and BPA-free stainless steel interior.',
            price: 3999,
            comparePrice: 5499,
            category: categoryMap['home-kitchen'],
            brand: 'HotBrew',
            stock: 200,
            sku: 'HOME-003',
            images: [
                { url: 'https://images.unsplash.com/photo-1594213114913-d1ad0a8e2aa4?w=600', alt: 'Electric Kettle' },
                { url: 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=600', alt: 'Kettle Pouring' }
            ],
            isFeatured: false,
            isActive: true,
            specifications: [
                { key: 'Capacity', value: '1.7L' },
                { key: 'Power', value: '1500W' },
                { key: 'Material', value: 'Stainless Steel' }
            ],
            tags: ['kettle', 'electric', 'kitchen', 'appliance'],
            ratings: { average: 4.4, count: 187 }
        },
        {
            name: 'Robot Vacuum Cleaner',
            description: 'Smart robot vacuum with laser navigation and powerful suction. Features app control, scheduled cleaning, and automatic charging. Works on all floor types.',
            price: 29999,
            comparePrice: 39999,
            category: categoryMap['home-kitchen'],
            brand: 'CleanBot',
            stock: 30,
            sku: 'HOME-004',
            images: [
                { url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600', alt: 'Robot Vacuum' },
                { url: 'https://images.unsplash.com/photo-1546552768-9e3a94b38a59?w=600', alt: 'Vacuum Cleaning' }
            ],
            isFeatured: true,
            isActive: true,
            specifications: [
                { key: 'Navigation', value: 'Laser LiDAR' },
                { key: 'Suction Power', value: '2700Pa' },
                { key: 'Battery', value: '150 mins' }
            ],
            tags: ['vacuum', 'robot', 'smart home', 'cleaning'],
            ratings: { average: 4.6, count: 124 }
        },
        {
            name: 'Coffee Maker with Grinder',
            description: 'All-in-one coffee maker with built-in burr grinder. Features programmable timer, adjustable strength, and thermal carafe. Makes up to 12 cups of fresh coffee.',
            price: 14999,
            comparePrice: 19999,
            category: categoryMap['home-kitchen'],
            brand: 'BrewMaster',
            stock: 55,
            sku: 'HOME-005',
            images: [
                { url: 'https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?w=600', alt: 'Coffee Maker' },
                { url: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600', alt: 'Coffee Brewing' }
            ],
            isFeatured: false,
            isActive: true,
            specifications: [
                { key: 'Capacity', value: '12 Cups' },
                { key: 'Grinder', value: 'Burr Grinder' },
                { key: 'Carafe', value: 'Thermal' }
            ],
            tags: ['coffee', 'grinder', 'kitchen', 'appliance'],
            ratings: { average: 4.5, count: 89 }
        },

        // Sports & Fitness (5 products)
        {
            name: 'Adjustable Dumbbell Set',
            description: 'Space-saving adjustable dumbbells ranging from 5-52.5 lbs. Quick-change weight selection dial makes it easy to switch weights in seconds. Replaces 15 sets of weights.',
            price: 24999,
            comparePrice: 32999,
            category: categoryMap['sports-fitness'],
            brand: 'PowerLift',
            stock: 40,
            sku: 'SPORT-001',
            images: [
                { url: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600', alt: 'Adjustable Dumbbells' },
                { url: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=600', alt: 'Dumbbell Weight' }
            ],
            isFeatured: true,
            isActive: true,
            specifications: [
                { key: 'Weight Range', value: '5-52.5 lbs' },
                { key: 'Increments', value: '2.5 lbs' },
                { key: 'Replaces', value: '15 Sets' }
            ],
            tags: ['dumbbells', 'weights', 'fitness', 'strength'],
            ratings: { average: 4.8, count: 156 }
        },
        {
            name: 'Yoga Mat Premium',
            description: 'Extra thick 6mm yoga mat with non-slip surface and alignment lines. Made from eco-friendly TPE material. Includes carrying strap and bag.',
            price: 2499,
            comparePrice: 3499,
            category: categoryMap['sports-fitness'],
            brand: 'ZenFlex',
            stock: 300,
            sku: 'SPORT-002',
            images: [
                { url: 'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=600', alt: 'Yoga Mat' },
                { url: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=600', alt: 'Yoga Practice' }
            ],
            isFeatured: false,
            isActive: true,
            specifications: [
                { key: 'Thickness', value: '6mm' },
                { key: 'Material', value: 'Eco-friendly TPE' },
                { key: 'Size', value: '183 x 61 cm' }
            ],
            tags: ['yoga', 'mat', 'fitness', 'exercise'],
            ratings: { average: 4.4, count: 234 }
        },
        {
            name: 'Resistance Bands Set',
            description: 'Complete resistance bands set with 5 different resistance levels. Includes handles, ankle straps, door anchor, and carrying bag. Perfect for home workouts.',
            price: 1999,
            comparePrice: 2999,
            category: categoryMap['sports-fitness'],
            brand: 'FlexFit',
            stock: 400,
            sku: 'SPORT-003',
            images: [
                { url: 'https://images.unsplash.com/photo-1598289431512-b97b0917affc?w=600', alt: 'Resistance Bands' },
                { url: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=600', alt: 'Workout Bands' }
            ],
            isFeatured: false,
            isActive: true,
            specifications: [
                { key: 'Bands', value: '5 Resistance Levels' },
                { key: 'Accessories', value: 'Handles, Straps, Anchor' },
                { key: 'Material', value: 'Natural Latex' }
            ],
            tags: ['resistance', 'bands', 'fitness', 'workout'],
            ratings: { average: 4.3, count: 312 }
        },
        {
            name: 'Smart Fitness Tracker',
            description: 'Advanced fitness tracker with heart rate, SpO2, and sleep monitoring. Features 14-day battery life, 50+ sports modes, and water resistance up to 50m.',
            price: 5999,
            comparePrice: 7999,
            category: categoryMap['sports-fitness'],
            brand: 'FitPulse',
            stock: 150,
            sku: 'SPORT-004',
            images: [
                { url: 'https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6?w=600', alt: 'Fitness Tracker' },
                { url: 'https://images.unsplash.com/photo-1510017803434-a899f0f0a61a?w=600', alt: 'Tracker Display' }
            ],
            isFeatured: true,
            isActive: true,
            specifications: [
                { key: 'Battery', value: '14 Days' },
                { key: 'Sports Modes', value: '50+' },
                { key: 'Water Resistance', value: '5ATM' }
            ],
            tags: ['fitness', 'tracker', 'smartwatch', 'health'],
            ratings: { average: 4.5, count: 198 }
        },
        {
            name: 'Foam Roller Massage',
            description: 'High-density foam roller for muscle recovery and myofascial release. Features textured surface for deep tissue massage. Ideal for post-workout recovery.',
            price: 1499,
            comparePrice: 2199,
            category: categoryMap['sports-fitness'],
            brand: 'RecoverPro',
            stock: 250,
            sku: 'SPORT-005',
            images: [
                { url: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=600', alt: 'Foam Roller' },
                { url: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600', alt: 'Roller Exercise' }
            ],
            isFeatured: false,
            isActive: true,
            specifications: [
                { key: 'Length', value: '45cm' },
                { key: 'Density', value: 'High-Density EVA' },
                { key: 'Surface', value: 'Textured' }
            ],
            tags: ['foam roller', 'massage', 'recovery', 'fitness'],
            ratings: { average: 4.2, count: 145 }
        },

        // Books & Stationery (4 products)
        {
            name: 'Premium Leather Journal',
            description: 'Handcrafted genuine leather journal with 200 pages of acid-free paper. Features bookmark ribbon and pen loop. Perfect for writing, sketching, or planning.',
            price: 1999,
            comparePrice: 2799,
            category: categoryMap['books-stationery'],
            brand: 'WriteWell',
            stock: 180,
            sku: 'BOOK-001',
            images: [
                { url: 'https://images.unsplash.com/photo-1531346878377-a5be20888e57?w=600', alt: 'Leather Journal' },
                { url: 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=600', alt: 'Journal Open' }
            ],
            isFeatured: true,
            isActive: true,
            specifications: [
                { key: 'Pages', value: '200' },
                { key: 'Paper', value: 'Acid-Free' },
                { key: 'Cover', value: 'Genuine Leather' }
            ],
            tags: ['journal', 'leather', 'notebook', 'writing'],
            ratings: { average: 4.6, count: 167 }
        },
        {
            name: 'Fountain Pen Set',
            description: 'Elegant fountain pen set with brass body and gold-plated nib. Includes 6 ink cartridges and converter. Presented in a luxury gift box.',
            price: 3499,
            comparePrice: 4999,
            category: categoryMap['books-stationery'],
            brand: 'PenCraft',
            stock: 100,
            sku: 'BOOK-002',
            images: [
                { url: 'https://images.unsplash.com/photo-1585336261022-680e295ce3fe?w=600', alt: 'Fountain Pen' },
                { url: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=600', alt: 'Pen Writing' }
            ],
            isFeatured: false,
            isActive: true,
            specifications: [
                { key: 'Body', value: 'Brass' },
                { key: 'Nib', value: 'Gold-Plated' },
                { key: 'Includes', value: '6 Cartridges + Converter' }
            ],
            tags: ['pen', 'fountain', 'writing', 'gift'],
            ratings: { average: 4.7, count: 89 }
        },
        {
            name: 'Desk Organizer Set',
            description: 'Bamboo desk organizer set with 8 compartments. Includes pen holder, phone stand, sticky note holder, and drawer. Keeps your workspace neat and organized.',
            price: 2499,
            comparePrice: 3499,
            category: categoryMap['books-stationery'],
            brand: 'OrganiZen',
            stock: 150,
            sku: 'BOOK-003',
            images: [
                { url: 'https://images.unsplash.com/photo-1456735190827-d1262f71b8a3?w=600', alt: 'Desk Organizer' },
                { url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600', alt: 'Organizer Detail' }
            ],
            isFeatured: false,
            isActive: true,
            specifications: [
                { key: 'Material', value: 'Natural Bamboo' },
                { key: 'Compartments', value: '8' },
                { key: 'Features', value: 'Phone Stand, Drawer' }
            ],
            tags: ['organizer', 'desk', 'office', 'bamboo'],
            ratings: { average: 4.3, count: 123 }
        },
        {
            name: 'Art Supplies Kit',
            description: 'Complete art kit with 72 colored pencils, 24 watercolors, sketchbook, and brushes. Professional-grade supplies in a wooden carrying case.',
            price: 4999,
            comparePrice: 6999,
            category: categoryMap['books-stationery'],
            brand: 'ArtMaster',
            stock: 80,
            sku: 'BOOK-004',
            images: [
                { url: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=600', alt: 'Art Supplies' },
                { url: 'https://images.unsplash.com/photo-1452860606245-08befc0ff44b?w=600', alt: 'Colored Pencils' }
            ],
            isFeatured: true,
            isActive: true,
            specifications: [
                { key: 'Colored Pencils', value: '72' },
                { key: 'Watercolors', value: '24' },
                { key: 'Case', value: 'Wooden Box' }
            ],
            tags: ['art', 'supplies', 'drawing', 'painting'],
            ratings: { average: 4.5, count: 98 }
        },

        // Beauty & Health (5 products)
        {
            name: 'Facial Care Set Premium',
            description: 'Complete facial care set with cleanser, toner, serum, and moisturizer. Made with natural ingredients and suitable for all skin types. Paraben-free formula.',
            price: 3999,
            comparePrice: 5499,
            category: categoryMap['beauty-health'],
            brand: 'GlowSkin',
            stock: 120,
            sku: 'BEAUTY-001',
            images: [
                { url: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=600', alt: 'Facial Care Set' },
                { url: 'https://images.unsplash.com/photo-1570194065650-d99fb4a38c54?w=600', alt: 'Skincare Products' }
            ],
            isFeatured: true,
            isActive: true,
            specifications: [
                { key: 'Items', value: '4 Products' },
                { key: 'Ingredients', value: 'Natural' },
                { key: 'Skin Type', value: 'All Types' }
            ],
            tags: ['skincare', 'facial', 'beauty', 'natural'],
            ratings: { average: 4.6, count: 234 }
        },
        {
            name: 'Electric Toothbrush Pro',
            description: 'Sonic electric toothbrush with 5 cleaning modes and smart timer. Features pressure sensor, 2-minute timer, and 30-day battery life. Includes 3 brush heads.',
            price: 4499,
            comparePrice: 5999,
            category: categoryMap['beauty-health'],
            brand: 'DentaCare',
            stock: 200,
            sku: 'BEAUTY-002',
            images: [
                { url: 'https://images.unsplash.com/photo-1559467278-020d0b8d0e6b?w=600', alt: 'Electric Toothbrush' },
                { url: 'https://images.unsplash.com/photo-1571741140674-8949ca7df2a7?w=600', alt: 'Toothbrush Heads' }
            ],
            isFeatured: false,
            isActive: true,
            specifications: [
                { key: 'Modes', value: '5 Cleaning Modes' },
                { key: 'Battery', value: '30 Days' },
                { key: 'Brush Heads', value: '3 Included' }
            ],
            tags: ['toothbrush', 'electric', 'dental', 'health'],
            ratings: { average: 4.5, count: 178 }
        },
        {
            name: 'Hair Dryer Professional',
            description: 'Professional ionic hair dryer with 1875W motor and 3 heat settings. Features cool shot button, concentrator nozzle, and diffuser attachment. Reduces frizz and adds shine.',
            price: 5999,
            comparePrice: 7999,
            category: categoryMap['beauty-health'],
            brand: 'StylePro',
            stock: 90,
            sku: 'BEAUTY-003',
            images: [
                { url: 'https://images.unsplash.com/photo-1522338242042-2d1c53c14a23?w=600', alt: 'Hair Dryer' },
                { url: 'https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?w=600', alt: 'Dryer in Use' }
            ],
            isFeatured: true,
            isActive: true,
            specifications: [
                { key: 'Power', value: '1875W' },
                { key: 'Technology', value: 'Ionic' },
                { key: 'Attachments', value: 'Concentrator, Diffuser' }
            ],
            tags: ['hair dryer', 'styling', 'beauty', 'professional'],
            ratings: { average: 4.4, count: 156 }
        },
        {
            name: 'Essential Oils Set',
            description: 'Set of 12 pure essential oils including lavender, peppermint, eucalyptus, and tea tree. 100% natural and therapeutic grade. Perfect for aromatherapy and diffusers.',
            price: 2999,
            comparePrice: 4499,
            category: categoryMap['beauty-health'],
            brand: 'AromaZen',
            stock: 180,
            sku: 'BEAUTY-004',
            images: [
                { url: 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=600', alt: 'Essential Oils' },
                { url: 'https://images.unsplash.com/photo-1600857544200-b2f468b16d55?w=600', alt: 'Oil Bottles' }
            ],
            isFeatured: false,
            isActive: true,
            specifications: [
                { key: 'Quantity', value: '12 Oils' },
                { key: 'Grade', value: 'Therapeutic' },
                { key: 'Size', value: '10ml Each' }
            ],
            tags: ['essential oils', 'aromatherapy', 'natural', 'wellness'],
            ratings: { average: 4.7, count: 267 }
        },
        {
            name: 'Digital Body Scale Smart',
            description: 'Smart body composition scale measuring weight, BMI, body fat, muscle mass, and more. Syncs with smartphone app and supports up to 8 user profiles.',
            price: 3499,
            comparePrice: 4999,
            category: categoryMap['beauty-health'],
            brand: 'FitMeasure',
            stock: 140,
            sku: 'BEAUTY-005',
            images: [
                { url: 'https://images.unsplash.com/photo-1576243345690-4e4b79b63288?w=600', alt: 'Smart Scale' },
                { url: 'https://images.unsplash.com/photo-1557838923-2985c318be48?w=600', alt: 'Scale Display' }
            ],
            isFeatured: false,
            isActive: true,
            specifications: [
                { key: 'Measurements', value: '13 Body Metrics' },
                { key: 'Users', value: '8 Profiles' },
                { key: 'Connectivity', value: 'Bluetooth' }
            ],
            tags: ['scale', 'smart', 'health', 'fitness'],
            ratings: { average: 4.3, count: 189 }
        }
    ];
};

// Seed function
const seedData = async () => {
    try {
        await connectDB();

        // Clear existing data
        console.log('Clearing existing products and categories...');
        await Product.deleteMany({});
        await Category.deleteMany({});

        // Create categories
        console.log('Creating categories...');
        const categories = await Category.insertMany(categoriesData);
        console.log(`Created ${categories.length} categories`);

        // Create products
        console.log('Creating products...');
        const productsData = getProductsData(categories);
        const products = await Product.insertMany(productsData);
        console.log(`Created ${products.length} products`);

        console.log('\n✅ Seed completed successfully!');
        console.log(`📦 Total Products: ${products.length}`);
        console.log(`📂 Total Categories: ${categories.length}`);

        // Show summary
        console.log('\nProducts by Category:');
        for (const cat of categories) {
            const count = products.filter(p => p.category.toString() === cat._id.toString()).length;
            console.log(`  - ${cat.name}: ${count} products`);
        }

        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding data:', error);
        process.exit(1);
    }
};

// Run seed
seedData();
