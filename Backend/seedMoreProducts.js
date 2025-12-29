/**
 * Seed Additional Products Script
 * Adds 40 more products with proper images and PKR pricing
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

// Additional products data with PKR pricing
const getAdditionalProductsData = (categories) => {
    const categoryMap = {};
    categories.forEach(cat => {
        categoryMap[cat.slug] = cat._id;
    });

    return [
        // Electronics - 7 more products
        {
            name: 'Wireless Noise Cancelling Headphones',
            description: 'Premium over-ear headphones with advanced noise cancellation technology, 40-hour battery life, and superior sound quality. Features soft memory foam ear cushions and foldable design for portability.',
            price: 12999,
            comparePrice: 17999,
            category: categoryMap['electronics'],
            brand: 'AudioPro',
            stock: 95,
            sku: 'ELEC-007',
            images: [
                { url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600', alt: 'Noise Cancelling Headphones' },
                { url: 'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=600', alt: 'Headphones Side View' }
            ],
            isFeatured: true,
            isActive: true,
            specifications: [
                { key: 'Battery Life', value: '40 hours' },
                { key: 'Driver Size', value: '40mm' },
                { key: 'Noise Cancellation', value: 'Active ANC' }
            ],
            tags: ['headphones', 'wireless', 'noise-cancelling', 'audio'],
            ratings: { average: 4.7, count: 312 }
        },
        {
            name: '4K Action Camera Waterproof',
            description: 'Compact action camera with 4K 60fps video recording, electronic image stabilization, and waterproof housing up to 40m. Includes mounting accessories and remote control.',
            price: 18999,
            comparePrice: 24999,
            category: categoryMap['electronics'],
            brand: 'AdventureCam',
            stock: 65,
            sku: 'ELEC-008',
            images: [
                { url: 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=600', alt: 'Action Camera' },
                { url: 'https://images.unsplash.com/photo-1502982720700-bfff97f2ecac?w=600', alt: 'Camera Accessories' }
            ],
            isFeatured: true,
            isActive: true,
            specifications: [
                { key: 'Resolution', value: '4K 60fps' },
                { key: 'Waterproof', value: '40m' },
                { key: 'Stabilization', value: 'EIS' }
            ],
            tags: ['camera', 'action', '4k', 'waterproof'],
            ratings: { average: 4.5, count: 187 }
        },
        {
            name: 'Tablet 10.5" Display',
            description: 'Powerful tablet with 10.5-inch 2K display, octa-core processor, 6GB RAM, and 128GB storage. Perfect for work, entertainment, and creative tasks.',
            price: 34999,
            comparePrice: 44999,
            category: categoryMap['electronics'],
            brand: 'TechTab',
            stock: 45,
            sku: 'ELEC-009',
            images: [
                { url: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=600', alt: 'Tablet' },
                { url: 'https://images.unsplash.com/photo-1561154464-82e9adf32764?w=600', alt: 'Tablet Side' }
            ],
            isFeatured: true,
            isActive: true,
            specifications: [
                { key: 'Display', value: '10.5" 2K' },
                { key: 'RAM', value: '6GB' },
                { key: 'Storage', value: '128GB' }
            ],
            tags: ['tablet', 'android', '2k', 'portable'],
            ratings: { average: 4.4, count: 156 }
        },
        {
            name: 'Wireless Charging Pad 15W',
            description: 'Fast wireless charging pad with 15W output, compatible with all Qi-enabled devices. Features LED indicator, anti-slip surface, and overcharge protection.',
            price: 1999,
            comparePrice: 2999,
            category: categoryMap['electronics'],
            brand: 'ChargeMax',
            stock: 350,
            sku: 'ELEC-010',
            images: [
                { url: 'https://images.unsplash.com/photo-1586816879360-004f5b0c51e5?w=600', alt: 'Wireless Charger' },
                { url: 'https://images.unsplash.com/photo-1622675273954-32c6b36fe6dd?w=600', alt: 'Charger in Use' }
            ],
            isFeatured: false,
            isActive: true,
            specifications: [
                { key: 'Output', value: '15W Max' },
                { key: 'Standard', value: 'Qi Compatible' },
                { key: 'Safety', value: 'Overcharge Protection' }
            ],
            tags: ['charger', 'wireless', 'fast-charging', 'qi'],
            ratings: { average: 4.3, count: 423 }
        },
        {
            name: 'Mini Projector HD',
            description: 'Portable mini projector with 1080p support, 200 ANSI lumens, and built-in speakers. Perfect for home theater, presentations, and outdoor movie nights.',
            price: 21999,
            comparePrice: 29999,
            category: categoryMap['electronics'],
            brand: 'ViewMax',
            stock: 35,
            sku: 'ELEC-011',
            images: [
                { url: 'https://images.unsplash.com/photo-1626379953822-baec19c3accd?w=600', alt: 'Mini Projector' },
                { url: 'https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=600', alt: 'Projector Screen' }
            ],
            isFeatured: false,
            isActive: true,
            specifications: [
                { key: 'Resolution', value: '1080p' },
                { key: 'Brightness', value: '200 ANSI' },
                { key: 'Screen Size', value: 'Up to 120"' }
            ],
            tags: ['projector', 'portable', 'hd', 'entertainment'],
            ratings: { average: 4.2, count: 98 }
        },
        {
            name: 'USB-C Hub 7-in-1',
            description: 'Versatile USB-C hub with 4K HDMI, USB 3.0 ports, SD card reader, and 100W power delivery pass-through. Aluminum body for better heat dissipation.',
            price: 3499,
            comparePrice: 4999,
            category: categoryMap['electronics'],
            brand: 'ConnectPro',
            stock: 220,
            sku: 'ELEC-012',
            images: [
                { url: 'https://images.unsplash.com/photo-1625723044792-44de16ccb4e9?w=600', alt: 'USB-C Hub' },
                { url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600', alt: 'Hub Ports' }
            ],
            isFeatured: false,
            isActive: true,
            specifications: [
                { key: 'Ports', value: '7-in-1' },
                { key: 'HDMI', value: '4K 60Hz' },
                { key: 'Power Delivery', value: '100W' }
            ],
            tags: ['usb-c', 'hub', 'adapter', 'laptop'],
            ratings: { average: 4.5, count: 267 }
        },
        {
            name: 'Smart LED Desk Lamp',
            description: 'Modern LED desk lamp with touch control, adjustable color temperature, and brightness levels. Features USB charging port and memory function.',
            price: 2999,
            comparePrice: 4499,
            category: categoryMap['electronics'],
            brand: 'LightSmart',
            stock: 180,
            sku: 'ELEC-013',
            images: [
                { url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600', alt: 'LED Desk Lamp' },
                { url: 'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?w=600', alt: 'Lamp Detail' }
            ],
            isFeatured: false,
            isActive: true,
            specifications: [
                { key: 'Color Temperature', value: '3000K-6500K' },
                { key: 'Brightness Levels', value: '5' },
                { key: 'USB Port', value: 'Yes' }
            ],
            tags: ['lamp', 'led', 'desk', 'smart'],
            ratings: { average: 4.4, count: 189 }
        },

        // Fashion - 7 more products
        {
            name: 'Casual Denim Jacket',
            description: 'Classic denim jacket with modern slim fit, button closure, and multiple pockets. Made from premium quality cotton denim with comfortable lining.',
            price: 4499,
            comparePrice: 5999,
            category: categoryMap['fashion'],
            brand: 'DenimCo',
            stock: 120,
            sku: 'FASH-006',
            images: [
                { url: 'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=600', alt: 'Denim Jacket' },
                { url: 'https://images.unsplash.com/photo-1578587018452-892bacefd3f2?w=600', alt: 'Jacket Back' }
            ],
            isFeatured: true,
            isActive: true,
            specifications: [
                { key: 'Material', value: '100% Cotton Denim' },
                { key: 'Fit', value: 'Slim Fit' },
                { key: 'Closure', value: 'Button' }
            ],
            tags: ['jacket', 'denim', 'casual', 'menswear'],
            ratings: { average: 4.5, count: 234 }
        },
        {
            name: 'Premium Polo T-Shirt',
            description: 'Classic polo shirt made from 100% Pima cotton. Features ribbed collar, two-button placket, and embroidered logo. Available in multiple colors.',
            price: 1999,
            comparePrice: 2799,
            category: categoryMap['fashion'],
            brand: 'PoloCraft',
            stock: 400,
            sku: 'FASH-007',
            images: [
                { url: 'https://images.unsplash.com/photo-1625910513413-5fc45d6b5914?w=600', alt: 'Polo Shirt' },
                { url: 'https://images.unsplash.com/photo-1586363104862-3a5e2ab60d99?w=600', alt: 'Polo Detail' }
            ],
            isFeatured: false,
            isActive: true,
            specifications: [
                { key: 'Material', value: 'Pima Cotton' },
                { key: 'Collar', value: 'Ribbed' },
                { key: 'Style', value: 'Classic Fit' }
            ],
            tags: ['polo', 'tshirt', 'cotton', 'casual'],
            ratings: { average: 4.3, count: 456 }
        },
        {
            name: 'Slim Fit Chino Pants',
            description: 'Modern slim fit chino pants with stretch comfort fabric. Features flat front, belt loops, and slash pockets. Perfect for work or casual wear.',
            price: 2999,
            comparePrice: 3999,
            category: categoryMap['fashion'],
            brand: 'ChiStyle',
            stock: 280,
            sku: 'FASH-008',
            images: [
                { url: 'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=600', alt: 'Chino Pants' },
                { url: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=600', alt: 'Pants Detail' }
            ],
            isFeatured: false,
            isActive: true,
            specifications: [
                { key: 'Material', value: 'Cotton Stretch' },
                { key: 'Fit', value: 'Slim Fit' },
                { key: 'Rise', value: 'Mid Rise' }
            ],
            tags: ['pants', 'chino', 'slim-fit', 'menswear'],
            ratings: { average: 4.4, count: 312 }
        },
        {
            name: 'Leather Belt Classic',
            description: 'Genuine leather belt with brushed metal buckle. Features smooth finish and precise stitching. Versatile design suits both formal and casual outfits.',
            price: 1499,
            comparePrice: 2199,
            category: categoryMap['fashion'],
            brand: 'LeatherLux',
            stock: 350,
            sku: 'FASH-009',
            images: [
                { url: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600', alt: 'Leather Belt' },
                { url: 'https://images.unsplash.com/photo-1624222247344-550fb60583dc?w=600', alt: 'Belt Buckle' }
            ],
            isFeatured: false,
            isActive: true,
            specifications: [
                { key: 'Material', value: 'Genuine Leather' },
                { key: 'Buckle', value: 'Brushed Metal' },
                { key: 'Width', value: '35mm' }
            ],
            tags: ['belt', 'leather', 'accessories', 'formal'],
            ratings: { average: 4.6, count: 287 }
        },
        {
            name: 'Canvas Backpack Urban',
            description: 'Stylish canvas backpack with leather accents, padded laptop compartment, and multiple organizer pockets. Water-resistant coating for all-weather use.',
            price: 3999,
            comparePrice: 5499,
            category: categoryMap['fashion'],
            brand: 'UrbanGear',
            stock: 150,
            sku: 'FASH-010',
            images: [
                { url: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600', alt: 'Canvas Backpack' },
                { url: 'https://images.unsplash.com/photo-1581605405669-fcdf81165afa?w=600', alt: 'Backpack Open' }
            ],
            isFeatured: true,
            isActive: true,
            specifications: [
                { key: 'Material', value: 'Canvas + Leather' },
                { key: 'Laptop', value: 'Up to 15.6"' },
                { key: 'Capacity', value: '25L' }
            ],
            tags: ['backpack', 'canvas', 'laptop', 'urban'],
            ratings: { average: 4.5, count: 198 }
        },
        {
            name: 'Sports Cap Adjustable',
            description: 'Breathable sports cap with curved brim and adjustable strap. Features moisture-wicking sweatband and UV protection fabric.',
            price: 899,
            comparePrice: 1299,
            category: categoryMap['fashion'],
            brand: 'SportStyle',
            stock: 500,
            sku: 'FASH-011',
            images: [
                { url: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=600', alt: 'Sports Cap' },
                { url: 'https://images.unsplash.com/photo-1521369909029-2afed882baee?w=600', alt: 'Cap Side' }
            ],
            isFeatured: false,
            isActive: true,
            specifications: [
                { key: 'Material', value: 'Polyester Blend' },
                { key: 'Closure', value: 'Adjustable Strap' },
                { key: 'UV Protection', value: 'UPF 50+' }
            ],
            tags: ['cap', 'sports', 'adjustable', 'accessories'],
            ratings: { average: 4.2, count: 543 }
        },
        {
            name: 'Woolen Scarf Premium',
            description: 'Luxurious woolen scarf with classic plaid pattern. Made from fine merino wool for exceptional softness and warmth. Perfect for winter styling.',
            price: 1799,
            comparePrice: 2499,
            category: categoryMap['fashion'],
            brand: 'WoolCraft',
            stock: 200,
            sku: 'FASH-012',
            images: [
                { url: 'https://images.unsplash.com/photo-1520903920243-00d872a2d1c9?w=600', alt: 'Woolen Scarf' },
                { url: 'https://images.unsplash.com/photo-1457545195570-67f207084966?w=600', alt: 'Scarf Detail' }
            ],
            isFeatured: false,
            isActive: true,
            specifications: [
                { key: 'Material', value: 'Merino Wool' },
                { key: 'Size', value: '180 x 30 cm' },
                { key: 'Pattern', value: 'Classic Plaid' }
            ],
            tags: ['scarf', 'wool', 'winter', 'accessories'],
            ratings: { average: 4.7, count: 167 }
        },

        // Home & Kitchen - 6 more products
        {
            name: 'Non-Stick Frying Pan Set',
            description: 'Set of 3 non-stick frying pans (8", 10", 12") with titanium coating for superior release. Features cool-touch handles and induction-compatible base.',
            price: 5999,
            comparePrice: 8499,
            category: categoryMap['home-kitchen'],
            brand: 'ChefPro',
            stock: 85,
            sku: 'HOME-006',
            images: [
                { url: 'https://images.unsplash.com/photo-1585659722983-3a675dabf23d?w=600', alt: 'Frying Pan Set' },
                { url: 'https://images.unsplash.com/photo-1574269909862-7e1d70bb8078?w=600', alt: 'Pan Cooking' }
            ],
            isFeatured: true,
            isActive: true,
            specifications: [
                { key: 'Sizes', value: '8", 10", 12"' },
                { key: 'Coating', value: 'Titanium Non-Stick' },
                { key: 'Induction', value: 'Compatible' }
            ],
            tags: ['cookware', 'frying-pan', 'non-stick', 'kitchen'],
            ratings: { average: 4.6, count: 234 }
        },
        {
            name: 'Digital Kitchen Scale',
            description: 'Precision digital kitchen scale with tempered glass platform and LCD display. Measures up to 5kg with 1g accuracy. Features tare function and auto-off.',
            price: 1499,
            comparePrice: 2199,
            category: categoryMap['home-kitchen'],
            brand: 'ScaleMaster',
            stock: 250,
            sku: 'HOME-007',
            images: [
                { url: 'https://images.unsplash.com/photo-1495195134817-aeb325a55b65?w=600', alt: 'Kitchen Scale' },
                { url: 'https://images.unsplash.com/photo-1556909114-44e3e70034e2?w=600', alt: 'Scale Display' }
            ],
            isFeatured: false,
            isActive: true,
            specifications: [
                { key: 'Capacity', value: '5kg' },
                { key: 'Accuracy', value: '1g' },
                { key: 'Display', value: 'LCD Backlit' }
            ],
            tags: ['scale', 'kitchen', 'digital', 'baking'],
            ratings: { average: 4.4, count: 312 }
        },
        {
            name: 'Immersion Hand Blender',
            description: 'Powerful 800W immersion blender with variable speed control and turbo function. Includes whisk attachment, chopper bowl, and measuring cup.',
            price: 4499,
            comparePrice: 5999,
            category: categoryMap['home-kitchen'],
            brand: 'BlendPro',
            stock: 120,
            sku: 'HOME-008',
            images: [
                { url: 'https://images.unsplash.com/photo-1570222094114-d054a817e56b?w=600', alt: 'Hand Blender' },
                { url: 'https://images.unsplash.com/photo-1585515320310-259814833e62?w=600', alt: 'Blender Accessories' }
            ],
            isFeatured: false,
            isActive: true,
            specifications: [
                { key: 'Power', value: '800W' },
                { key: 'Speed', value: 'Variable + Turbo' },
                { key: 'Attachments', value: '3 Included' }
            ],
            tags: ['blender', 'immersion', 'kitchen', 'appliance'],
            ratings: { average: 4.5, count: 189 }
        },
        {
            name: 'Bamboo Cutting Board Set',
            description: 'Set of 3 bamboo cutting boards in different sizes. Features juice grooves, non-slip edges, and antimicrobial surface. Eco-friendly and durable.',
            price: 2499,
            comparePrice: 3499,
            category: categoryMap['home-kitchen'],
            brand: 'BambooChef',
            stock: 180,
            sku: 'HOME-009',
            images: [
                { url: 'https://images.unsplash.com/photo-1594282486552-05b4d80fbb9f?w=600', alt: 'Bamboo Cutting Boards' },
                { url: 'https://images.unsplash.com/photo-1528712306091-ed0763094c98?w=600', alt: 'Board in Use' }
            ],
            isFeatured: false,
            isActive: true,
            specifications: [
                { key: 'Material', value: 'Organic Bamboo' },
                { key: 'Pieces', value: '3' },
                { key: 'Features', value: 'Juice Grooves' }
            ],
            tags: ['cutting-board', 'bamboo', 'kitchen', 'eco-friendly'],
            ratings: { average: 4.3, count: 267 }
        },
        {
            name: 'Glass Storage Containers Set',
            description: 'Set of 10 glass food storage containers with airtight locking lids. Microwave, freezer, and dishwasher safe. BPA-free and leak-proof design.',
            price: 3999,
            comparePrice: 5499,
            category: categoryMap['home-kitchen'],
            brand: 'FreshKeep',
            stock: 140,
            sku: 'HOME-010',
            images: [
                { url: 'https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?w=600', alt: 'Glass Containers' },
                { url: 'https://images.unsplash.com/photo-1556909212-d5b604d0c90d?w=600', alt: 'Container Stack' }
            ],
            isFeatured: true,
            isActive: true,
            specifications: [
                { key: 'Pieces', value: '10 Containers' },
                { key: 'Material', value: 'Borosilicate Glass' },
                { key: 'Lids', value: 'Airtight Locking' }
            ],
            tags: ['containers', 'glass', 'storage', 'kitchen'],
            ratings: { average: 4.6, count: 198 }
        },
        {
            name: 'Electric Toaster 4-Slice',
            description: 'Stainless steel 4-slice toaster with extra-wide slots, 7 browning levels, and defrost function. Features removable crumb tray and cord storage.',
            price: 4999,
            comparePrice: 6499,
            category: categoryMap['home-kitchen'],
            brand: 'ToastMaster',
            stock: 95,
            sku: 'HOME-011',
            images: [
                { url: 'https://images.unsplash.com/photo-1590004953392-5aba2e72269a?w=600', alt: 'Electric Toaster' },
                { url: 'https://images.unsplash.com/photo-1556909190-6a1b6d1b8400?w=600', alt: 'Toaster in Use' }
            ],
            isFeatured: false,
            isActive: true,
            specifications: [
                { key: 'Slots', value: '4 Extra-Wide' },
                { key: 'Browning', value: '7 Levels' },
                { key: 'Functions', value: 'Toast, Defrost, Reheat' }
            ],
            tags: ['toaster', 'kitchen', 'appliance', 'breakfast'],
            ratings: { average: 4.4, count: 156 }
        },

        // Sports & Fitness - 6 more products
        {
            name: 'Adjustable Weight Bench',
            description: 'Multi-position weight bench with 7 back pad positions and 3 seat positions. Features heavy-duty steel frame and comfortable padding. Max weight capacity 300kg.',
            price: 15999,
            comparePrice: 21999,
            category: categoryMap['sports-fitness'],
            brand: 'PowerLift',
            stock: 30,
            sku: 'SPORT-006',
            images: [
                { url: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600', alt: 'Weight Bench' },
                { url: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600', alt: 'Bench Exercise' }
            ],
            isFeatured: true,
            isActive: true,
            specifications: [
                { key: 'Positions', value: '7 Back + 3 Seat' },
                { key: 'Capacity', value: '300kg' },
                { key: 'Frame', value: 'Heavy-Duty Steel' }
            ],
            tags: ['bench', 'weight', 'fitness', 'gym'],
            ratings: { average: 4.7, count: 134 }
        },
        {
            name: 'Jump Rope Speed Professional',
            description: 'Professional speed jump rope with ball bearing handles and adjustable cable length. Features non-slip grips and lightweight design for cardio workouts.',
            price: 999,
            comparePrice: 1499,
            category: categoryMap['sports-fitness'],
            brand: 'CardioFit',
            stock: 450,
            sku: 'SPORT-007',
            images: [
                { url: 'https://images.unsplash.com/photo-1598632640487-6ea4a4e8b963?w=600', alt: 'Jump Rope' },
                { url: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=600', alt: 'Rope Training' }
            ],
            isFeatured: false,
            isActive: true,
            specifications: [
                { key: 'Handle', value: 'Ball Bearing' },
                { key: 'Cable', value: 'Adjustable Length' },
                { key: 'Material', value: 'Steel Cable + PVC' }
            ],
            tags: ['jump-rope', 'cardio', 'fitness', 'training'],
            ratings: { average: 4.4, count: 378 }
        },
        {
            name: 'Kettlebell Cast Iron 16kg',
            description: 'Competition-grade cast iron kettlebell with wide handle for two-handed exercises. Features flat base for floor exercises and durable powder coating.',
            price: 3499,
            comparePrice: 4499,
            category: categoryMap['sports-fitness'],
            brand: 'IronStrength',
            stock: 80,
            sku: 'SPORT-008',
            images: [
                { url: 'https://images.unsplash.com/photo-1517344884509-a0c97ec11bcc?w=600', alt: 'Kettlebell' },
                { url: 'https://images.unsplash.com/photo-1599058917765-a780eda07a3e?w=600', alt: 'Kettlebell Exercise' }
            ],
            isFeatured: false,
            isActive: true,
            specifications: [
                { key: 'Weight', value: '16kg' },
                { key: 'Material', value: 'Cast Iron' },
                { key: 'Coating', value: 'Powder Coated' }
            ],
            tags: ['kettlebell', 'weights', 'strength', 'training'],
            ratings: { average: 4.6, count: 189 }
        },
        {
            name: 'Exercise Ball with Pump',
            description: 'Anti-burst exercise ball (65cm) for core strengthening, yoga, and pilates. Includes hand pump, plug, and exercise guide. Supports up to 250kg.',
            price: 1799,
            comparePrice: 2499,
            category: categoryMap['sports-fitness'],
            brand: 'BalancePro',
            stock: 220,
            sku: 'SPORT-009',
            images: [
                { url: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=600', alt: 'Exercise Ball' },
                { url: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=600', alt: 'Ball Exercise' }
            ],
            isFeatured: false,
            isActive: true,
            specifications: [
                { key: 'Size', value: '65cm' },
                { key: 'Capacity', value: '250kg' },
                { key: 'Material', value: 'Anti-Burst PVC' }
            ],
            tags: ['exercise-ball', 'yoga', 'pilates', 'core'],
            ratings: { average: 4.3, count: 267 }
        },
        {
            name: 'Gym Gloves with Wrist Support',
            description: 'Padded gym gloves with integrated wrist wraps for extra support. Features breathable mesh, silicone palm grip, and easy pull-off tabs.',
            price: 1299,
            comparePrice: 1899,
            category: categoryMap['sports-fitness'],
            brand: 'GripPro',
            stock: 350,
            sku: 'SPORT-010',
            images: [
                { url: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=600', alt: 'Gym Gloves' },
                { url: 'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?w=600', alt: 'Gloves in Use' }
            ],
            isFeatured: false,
            isActive: true,
            specifications: [
                { key: 'Palm', value: 'Silicone Grip' },
                { key: 'Wrist', value: 'Integrated Wraps' },
                { key: 'Material', value: 'Breathable Mesh' }
            ],
            tags: ['gloves', 'gym', 'weightlifting', 'accessories'],
            ratings: { average: 4.4, count: 298 }
        },
        {
            name: 'Sports Water Bottle 1L Insulated',
            description: 'Double-wall insulated stainless steel water bottle keeps drinks cold for 24 hours or hot for 12 hours. Features leak-proof lid and wide mouth opening.',
            price: 1999,
            comparePrice: 2799,
            category: categoryMap['sports-fitness'],
            brand: 'HydroFit',
            stock: 280,
            sku: 'SPORT-011',
            images: [
                { url: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=600', alt: 'Water Bottle' },
                { url: 'https://images.unsplash.com/photo-1523362628745-0c100150b504?w=600', alt: 'Bottle Detail' }
            ],
            isFeatured: false,
            isActive: true,
            specifications: [
                { key: 'Capacity', value: '1L' },
                { key: 'Insulation', value: 'Double-Wall' },
                { key: 'Material', value: 'Stainless Steel' }
            ],
            tags: ['bottle', 'water', 'insulated', 'sports'],
            ratings: { average: 4.5, count: 345 }
        },

        // Books & Stationery - 6 more products
        {
            name: 'Executive Notebook A5',
            description: 'Premium executive notebook with PU leather cover, 200 ruled pages, and ribbon bookmark. Features lay-flat binding and expandable inner pocket.',
            price: 1299,
            comparePrice: 1899,
            category: categoryMap['books-stationery'],
            brand: 'NoteCraft',
            stock: 320,
            sku: 'BOOK-005',
            images: [
                { url: 'https://images.unsplash.com/photo-1517842645767-c639042777db?w=600', alt: 'Executive Notebook' },
                { url: 'https://images.unsplash.com/photo-1531346878377-a5be20888e57?w=600', alt: 'Notebook Open' }
            ],
            isFeatured: false,
            isActive: true,
            specifications: [
                { key: 'Size', value: 'A5' },
                { key: 'Pages', value: '200 Ruled' },
                { key: 'Cover', value: 'PU Leather' }
            ],
            tags: ['notebook', 'executive', 'office', 'writing'],
            ratings: { average: 4.5, count: 234 }
        },
        {
            name: 'Gel Pen Set 12 Colors',
            description: 'Set of 12 smooth-flowing gel pens in vibrant colors. Features 0.5mm fine tip for precise writing and comfortable rubber grip.',
            price: 599,
            comparePrice: 899,
            category: categoryMap['books-stationery'],
            brand: 'PenArt',
            stock: 500,
            sku: 'BOOK-006',
            images: [
                { url: 'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=600', alt: 'Gel Pen Set' },
                { url: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=600', alt: 'Pens Writing' }
            ],
            isFeatured: false,
            isActive: true,
            specifications: [
                { key: 'Colors', value: '12' },
                { key: 'Tip Size', value: '0.5mm' },
                { key: 'Ink Type', value: 'Gel' }
            ],
            tags: ['pens', 'gel', 'colors', 'stationery'],
            ratings: { average: 4.3, count: 456 }
        },
        {
            name: 'Mechanical Pencil Set Professional',
            description: 'Professional mechanical pencil set with 3 pencils (0.3mm, 0.5mm, 0.7mm). Includes lead refills and erasers. Perfect for drafting and precise work.',
            price: 899,
            comparePrice: 1299,
            category: categoryMap['books-stationery'],
            brand: 'DraftPro',
            stock: 280,
            sku: 'BOOK-007',
            images: [
                { url: 'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?w=600', alt: 'Mechanical Pencils' },
                { url: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=600', alt: 'Pencils Set' }
            ],
            isFeatured: false,
            isActive: true,
            specifications: [
                { key: 'Sizes', value: '0.3, 0.5, 0.7mm' },
                { key: 'Pencils', value: '3' },
                { key: 'Includes', value: 'Lead + Erasers' }
            ],
            tags: ['pencils', 'mechanical', 'drafting', 'professional'],
            ratings: { average: 4.6, count: 187 }
        },
        {
            name: 'Sticky Notes Cube Assorted',
            description: 'Cube of 400 sticky notes in 5 bright neon colors. Strong adhesive for reliable sticking, easy to remove without residue. Size: 3x3 inches.',
            price: 399,
            comparePrice: 599,
            category: categoryMap['books-stationery'],
            brand: 'StickNote',
            stock: 600,
            sku: 'BOOK-008',
            images: [
                { url: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=600', alt: 'Sticky Notes' },
                { url: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=600', alt: 'Notes in Use' }
            ],
            isFeatured: false,
            isActive: true,
            specifications: [
                { key: 'Sheets', value: '400' },
                { key: 'Colors', value: '5 Neon' },
                { key: 'Size', value: '3x3 inches' }
            ],
            tags: ['sticky-notes', 'office', 'organization', 'stationery'],
            ratings: { average: 4.2, count: 534 }
        },
        {
            name: 'Watercolor Paint Set 24 Colors',
            description: 'Professional watercolor set with 24 vibrant colors in portable case. Includes mixing palette, water brush, and 10 sheets of watercolor paper.',
            price: 2499,
            comparePrice: 3499,
            category: categoryMap['books-stationery'],
            brand: 'ArtMaster',
            stock: 120,
            sku: 'BOOK-009',
            images: [
                { url: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=600', alt: 'Watercolor Set' },
                { url: 'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=600', alt: 'Painting' }
            ],
            isFeatured: true,
            isActive: true,
            specifications: [
                { key: 'Colors', value: '24' },
                { key: 'Includes', value: 'Brush, Palette, Paper' },
                { key: 'Case', value: 'Portable Metal' }
            ],
            tags: ['watercolor', 'art', 'painting', 'supplies'],
            ratings: { average: 4.7, count: 145 }
        },
        {
            name: 'File Organizer Desktop',
            description: 'Metal mesh desktop file organizer with 5 vertical compartments. Keeps documents, folders, and notebooks neatly organized. Black powder-coated finish.',
            price: 1599,
            comparePrice: 2299,
            category: categoryMap['books-stationery'],
            brand: 'OrganiZen',
            stock: 200,
            sku: 'BOOK-010',
            images: [
                { url: 'https://images.unsplash.com/photo-1456735190827-d1262f71b8a3?w=600', alt: 'File Organizer' },
                { url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600', alt: 'Organizer Detail' }
            ],
            isFeatured: false,
            isActive: true,
            specifications: [
                { key: 'Compartments', value: '5 Vertical' },
                { key: 'Material', value: 'Metal Mesh' },
                { key: 'Finish', value: 'Powder-Coated' }
            ],
            tags: ['organizer', 'file', 'desk', 'office'],
            ratings: { average: 4.4, count: 178 }
        },

        // Beauty & Health - 7 more products
        {
            name: 'Makeup Brush Set 15 Pieces',
            description: 'Professional makeup brush set with 15 essential brushes for face and eyes. Features synthetic bristles and stylish rose gold handles. Includes leather case.',
            price: 2999,
            comparePrice: 4499,
            category: categoryMap['beauty-health'],
            brand: 'GlamPro',
            stock: 150,
            sku: 'BEAUTY-006',
            images: [
                { url: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=600', alt: 'Makeup Brushes' },
                { url: 'https://images.unsplash.com/photo-1599305090598-fe179d501227?w=600', alt: 'Brush Set' }
            ],
            isFeatured: true,
            isActive: true,
            specifications: [
                { key: 'Pieces', value: '15' },
                { key: 'Bristles', value: 'Synthetic' },
                { key: 'Case', value: 'Leather Roll' }
            ],
            tags: ['makeup', 'brushes', 'beauty', 'professional'],
            ratings: { average: 4.6, count: 267 }
        },
        {
            name: 'Facial Cleansing Device',
            description: 'Silicone facial cleansing device with sonic vibration technology. Features 8 intensity levels, waterproof design, and USB rechargeable battery.',
            price: 3499,
            comparePrice: 4999,
            category: categoryMap['beauty-health'],
            brand: 'SkinPure',
            stock: 100,
            sku: 'BEAUTY-007',
            images: [
                { url: 'https://images.unsplash.com/photo-1570194065650-d99fb4a38c54?w=600', alt: 'Facial Cleansing Device' },
                { url: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=600', alt: 'Device in Use' }
            ],
            isFeatured: true,
            isActive: true,
            specifications: [
                { key: 'Material', value: 'Medical Silicone' },
                { key: 'Intensity', value: '8 Levels' },
                { key: 'Waterproof', value: 'IPX7' }
            ],
            tags: ['facial', 'cleansing', 'skincare', 'device'],
            ratings: { average: 4.5, count: 189 }
        },
        {
            name: 'Nail Art Kit Professional',
            description: 'Complete nail art kit with 100+ accessories including dotting tools, brushes, stickers, rhinestones, and acrylic powders. Perfect for beginners and professionals.',
            price: 1999,
            comparePrice: 2999,
            category: categoryMap['beauty-health'],
            brand: 'NailCraft',
            stock: 180,
            sku: 'BEAUTY-008',
            images: [
                { url: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=600', alt: 'Nail Art Kit' },
                { url: 'https://images.unsplash.com/photo-1604902396830-aca29e19b067?w=600', alt: 'Nail Accessories' }
            ],
            isFeatured: false,
            isActive: true,
            specifications: [
                { key: 'Pieces', value: '100+' },
                { key: 'Includes', value: 'Tools, Stickers, Powders' },
                { key: 'Level', value: 'All Levels' }
            ],
            tags: ['nail-art', 'manicure', 'beauty', 'kit'],
            ratings: { average: 4.3, count: 234 }
        },
        {
            name: 'Hair Straightener Ceramic',
            description: 'Professional ceramic hair straightener with floating plates for smooth glide. Features adjustable temperature up to 230°C and dual voltage for travel.',
            price: 4499,
            comparePrice: 5999,
            category: categoryMap['beauty-health'],
            brand: 'StylePro',
            stock: 90,
            sku: 'BEAUTY-009',
            images: [
                { url: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600', alt: 'Hair Straightener' },
                { url: 'https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?w=600', alt: 'Straightener in Use' }
            ],
            isFeatured: false,
            isActive: true,
            specifications: [
                { key: 'Plates', value: 'Ceramic Floating' },
                { key: 'Temperature', value: 'Up to 230°C' },
                { key: 'Voltage', value: 'Dual (110-240V)' }
            ],
            tags: ['straightener', 'hair', 'styling', 'ceramic'],
            ratings: { average: 4.5, count: 178 }
        },
        {
            name: 'Massage Gun Deep Tissue',
            description: 'Powerful percussion massage gun with 6 speed levels and 4 interchangeable heads. Features quiet motor, long battery life, and carrying case.',
            price: 8999,
            comparePrice: 12999,
            category: categoryMap['beauty-health'],
            brand: 'RelaxPro',
            stock: 65,
            sku: 'BEAUTY-010',
            images: [
                { url: 'https://images.unsplash.com/photo-1617952986600-802f965daf25?w=600', alt: 'Massage Gun' },
                { url: 'https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?w=600', alt: 'Massage Heads' }
            ],
            isFeatured: true,
            isActive: true,
            specifications: [
                { key: 'Speed Levels', value: '6' },
                { key: 'Heads', value: '4 Interchangeable' },
                { key: 'Battery', value: '6 Hours' }
            ],
            tags: ['massage', 'recovery', 'muscle', 'therapy'],
            ratings: { average: 4.7, count: 156 }
        },
        {
            name: 'Aroma Diffuser 500ml',
            description: 'Ultrasonic aroma diffuser with 500ml capacity and 7 color LED lights. Features timer settings, auto shut-off, and whisper-quiet operation.',
            price: 2499,
            comparePrice: 3499,
            category: categoryMap['beauty-health'],
            brand: 'AromaZen',
            stock: 140,
            sku: 'BEAUTY-011',
            images: [
                { url: 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=600', alt: 'Aroma Diffuser' },
                { url: 'https://images.unsplash.com/photo-1600857544200-b2f468b16d55?w=600', alt: 'Diffuser Lights' }
            ],
            isFeatured: false,
            isActive: true,
            specifications: [
                { key: 'Capacity', value: '500ml' },
                { key: 'LED Colors', value: '7' },
                { key: 'Timer', value: '1/3/6 Hours' }
            ],
            tags: ['diffuser', 'aroma', 'aromatherapy', 'wellness'],
            ratings: { average: 4.4, count: 287 }
        },
        {
            name: 'Blood Pressure Monitor Digital',
            description: 'Automatic digital blood pressure monitor with large LCD display. Features memory for 2 users with 120 readings each, irregular heartbeat detection, and cuff fit indicator.',
            price: 3999,
            comparePrice: 5499,
            category: categoryMap['beauty-health'],
            brand: 'HealthTrack',
            stock: 110,
            sku: 'BEAUTY-012',
            images: [
                { url: 'https://images.unsplash.com/photo-1559757175-5700dde675bc?w=600', alt: 'Blood Pressure Monitor' },
                { url: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=600', alt: 'Monitor Display' }
            ],
            isFeatured: false,
            isActive: true,
            specifications: [
                { key: 'Users', value: '2 x 120 Readings' },
                { key: 'Display', value: 'Large LCD' },
                { key: 'Features', value: 'Irregular Heartbeat Detection' }
            ],
            tags: ['health', 'blood-pressure', 'monitor', 'medical'],
            ratings: { average: 4.6, count: 198 }
        }
    ];
};

// Seed function
const seedAdditionalProducts = async () => {
    try {
        await connectDB();

        // Get existing categories
        console.log('Fetching existing categories...');
        const categories = await Category.find({});

        if (categories.length === 0) {
            console.error('No categories found. Please run the main seed script first.');
            process.exit(1);
        }

        console.log(`Found ${categories.length} categories`);

        // Get current product count
        const existingCount = await Product.countDocuments();
        console.log(`Existing products: ${existingCount}`);

        // Create additional products
        console.log('Adding 40 more products...');
        const additionalProducts = getAdditionalProductsData(categories);
        const products = await Product.insertMany(additionalProducts);
        console.log(`Added ${products.length} new products`);

        // Get new total
        const newTotal = await Product.countDocuments();
        console.log(`\n✅ Seed completed successfully!`);
        console.log(`📦 Total Products Now: ${newTotal}`);

        // Show summary by category
        console.log('\nProducts by Category:');
        for (const cat of categories) {
            const count = await Product.countDocuments({ category: cat._id });
            console.log(`  - ${cat.name}: ${count} products`);
        }

        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding data:', error);
        process.exit(1);
    }
};

// Run seed
seedAdditionalProducts();
