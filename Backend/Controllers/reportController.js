const Order = require('../Models/orderModel');
const Product = require('../Models/productModel');
const User = require('../Models/userModel');
const { sendResponse, asyncHandler } = require('../Library/helper');

// @desc    Generate Sales Report - All completed orders
// @route   GET /api/reports/sales
// @access  Private/Admin
const generateSalesReport = asyncHandler(async (req, res) => {
    const { startDate, endDate, status } = req.query;

    // Build filter
    const filter = {
        isPaid: true,
    };

    if (startDate || endDate) {
        filter.createdAt = {};
        if (startDate) {
            filter.createdAt.$gte = new Date(startDate);
        }
        if (endDate) {
            filter.createdAt.$lte = new Date(endDate);
        }
    }

    if (status && status !== 'all') {
        filter.orderStatus = status;
    }

    // Get all orders matching filter
    const orders = await Order.find(filter)
        .populate('user', 'name email phone')
        .populate('items.product', 'name sku category')
        .sort({ createdAt: -1 });

    // Calculate summary statistics
    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, order) => sum + order.totalPrice, 0);
    const totalItemsSold = orders.reduce((sum, order) => 
        sum + order.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0
    );

    // Group by date for daily sales
    const dailySales = {};
    orders.forEach(order => {
        const date = new Date(order.createdAt).toISOString().split('T')[0];
        if (!dailySales[date]) {
            dailySales[date] = {
                date,
                count: 0,
                revenue: 0,
                items: 0,
            };
        }
        dailySales[date].count += 1;
        dailySales[date].revenue += order.totalPrice;
        dailySales[date].items += order.items.reduce((sum, item) => sum + item.quantity, 0);
    });

    // Group by product for top sellers
    const productSales = {};
    orders.forEach(order => {
        order.items.forEach(item => {
            const productId = item.product._id.toString();
            if (!productSales[productId]) {
                productSales[productId] = {
                    productId,
                    productName: item.product.name,
                    productSku: item.product.sku,
                    totalQuantity: 0,
                    totalRevenue: 0,
                };
            }
            productSales[productId].totalQuantity += item.quantity;
            productSales[productId].totalRevenue += item.price * item.quantity;
        });
    });

    const topProducts = Object.values(productSales)
        .sort((a, b) => b.totalRevenue - a.totalRevenue)
        .slice(0, 10);

    // Group by order status
    const statusBreakdown = {};
    orders.forEach(order => {
        const status = order.orderStatus || 'unknown';
        if (!statusBreakdown[status]) {
            statusBreakdown[status] = {
                status,
                count: 0,
                revenue: 0,
            };
        }
        statusBreakdown[status].count += 1;
        statusBreakdown[status].revenue += order.totalPrice;
    });

    sendResponse(res, 200, true, 'Sales report generated successfully', {
        summary: {
            totalOrders,
            totalRevenue: Number(totalRevenue.toFixed(2)),
            totalItemsSold,
            averageOrderValue: Number((totalRevenue / (totalOrders || 1)).toFixed(2)),
            generatedDate: new Date().toISOString(),
        },
        dailySales: Object.values(dailySales),
        topProducts,
        statusBreakdown: Object.values(statusBreakdown),
        orders: orders.map(order => ({
            _id: order._id,
            orderNumber: order.orderNumber,
            customer: order.user.name,
            customerEmail: order.user.email,
            date: order.createdAt,
            totalPrice: order.totalPrice,
            itemCount: order.items.length,
            orderStatus: order.orderStatus,
            paymentMethod: order.paymentMethod,
            items: order.items.map(item => ({
                name: item.name,
                quantity: item.quantity,
                price: item.price,
                total: item.price * item.quantity,
            })),
        })),
    });
});

// @desc    Generate Inventory Report - Current stock levels
// @route   GET /api/reports/inventory
// @access  Private/Admin
const generateInventoryReport = asyncHandler(async (req, res) => {
    const { category, lowStockThreshold = 10 } = req.query;

    // Build filter
    const filter = { isActive: true };
    if (category && category !== 'all') {
        filter.category = category;
    }

    // Get all products
    const products = await Product.find(filter)
        .populate('category', 'name')
        .sort({ name: 1 });

    // Categorize by stock level
    const lowStockProducts = [];
    const normalStockProducts = [];
    const outOfStockProducts = [];

    let totalItems = 0;
    let totalValue = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;

    products.forEach(product => {
        const quantity = product.stock || 0;
        const itemValue = quantity * product.price;

        totalItems += quantity;
        totalValue += itemValue;

        const productData = {
            _id: product._id,
            name: product.name,
            sku: product.sku,
            category: product.category?.name || 'Uncategorized',
            quantity: quantity,
            price: product.price,
            totalValue: Number(itemValue.toFixed(2)),
            status: quantity === 0 ? 'Out of Stock' : quantity <= lowStockThreshold ? 'Low Stock' : 'In Stock',
        };

        if (quantity === 0) {
            outOfStockProducts.push(productData);
            outOfStockCount += 1;
        } else if (quantity <= lowStockThreshold) {
            lowStockProducts.push(productData);
            lowStockCount += 1;
        } else {
            normalStockProducts.push(productData);
        }
    });

    // Get recent orders to calculate sales velocity (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentOrders = await Order.find({
        createdAt: { $gte: thirtyDaysAgo },
        isPaid: true,
    }).populate('items.product');

    const salesVelocity = {};
    recentOrders.forEach(order => {
        order.items.forEach(item => {
            const productId = item.product._id.toString();
            if (!salesVelocity[productId]) {
                salesVelocity[productId] = 0;
            }
            salesVelocity[productId] += item.quantity;
        });
    });

    // Calculate days of inventory for critical items
    const criticalItems = lowStockProducts.map(product => {
        const velocity = salesVelocity[product._id.toString()] || 0;
        const daysOfInventory = velocity > 0 ? Math.ceil(product.quantity / (velocity / 30)) : 999;
        return {
            ...product,
            monthlySalesVelocity: velocity,
            estimatedDaysLeft: daysOfInventory,
            requiresReorder: daysOfInventory <= 15,
        };
    });

    sendResponse(res, 200, true, 'Inventory report generated successfully', {
        summary: {
            totalProducts: products.length,
            totalItems: totalItems,
            totalInventoryValue: Number(totalValue.toFixed(2)),
            averageStockPerProduct: Number((totalItems / (products.length || 1)).toFixed(2)),
            lowStockCount: lowStockCount,
            outOfStockCount: outOfStockCount,
            generatedDate: new Date().toISOString(),
        },
        inventory: {
            inStock: normalStockProducts,
            lowStock: criticalItems,
            outOfStock: outOfStockProducts,
        },
        byCategory: groupProductsByCategory(products),
    });
});

// @desc    Generate Customer Report - All customers with details
// @route   GET /api/reports/customers
// @access  Private/Admin
const generateCustomerReport = asyncHandler(async (req, res) => {
    // Get all customers
    const customers = await User.find({ role: 'customer' })
        .select('-password')
        .sort({ createdAt: -1 });

    // Get order data for each customer
    const customerStats = [];

    for (const customer of customers) {
        const orders = await Order.find({ user: customer._id });

        const totalSpent = orders
            .filter(order => order.isPaid)
            .reduce((sum, order) => sum + order.totalPrice, 0);

        const totalOrders = orders.length;
        const totalItemsPurchased = orders.reduce((sum, order) => 
            sum + order.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0
        );

        const lastOrderDate = orders.length > 0 
            ? new Date(Math.max(...orders.map(o => new Date(o.createdAt))))
            : null;

        const averageOrderValue = totalOrders > 0 ? totalSpent / totalOrders : 0;

        // Determine customer status
        let status = 'Inactive';
        if (lastOrderDate) {
            const daysSinceLastOrder = Math.floor((Date.now() - lastOrderDate) / (1000 * 60 * 60 * 24));
            if (daysSinceLastOrder <= 30) {
                status = 'Active';
            } else if (daysSinceLastOrder <= 90) {
                status = 'At Risk';
            } else {
                status = 'Dormant';
            }
        }

        customerStats.push({
            _id: customer._id,
            name: customer.name,
            email: customer.email,
            phone: customer.phone || 'N/A',
            joinDate: customer.createdAt,
            lastOrderDate: lastOrderDate,
            totalOrders: totalOrders,
            totalSpent: Number(totalSpent.toFixed(2)),
            totalItemsPurchased: totalItemsPurchased,
            averageOrderValue: Number(averageOrderValue.toFixed(2)),
            status: status,
            defaultAddress: customer.addresses?.find(a => a.isDefault) || customer.addresses?.[0] || null,
        });
    }

    // Sort by total spent (descending)
    customerStats.sort((a, b) => b.totalSpent - a.totalSpent);

    // Calculate summary stats
    const totalCustomers = customerStats.length;
    const totalRevenue = customerStats.reduce((sum, c) => sum + c.totalSpent, 0);
    const activeCustomers = customerStats.filter(c => c.status === 'Active').length;
    const atRiskCustomers = customerStats.filter(c => c.status === 'At Risk').length;
    const averageLifetimeValue = totalCustomers > 0 ? totalRevenue / totalCustomers : 0;

    // Get top customers
    const topCustomers = customerStats.slice(0, 10);

    // Get new customers (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const newCustomers = customerStats.filter(c => new Date(c.joinDate) >= thirtyDaysAgo);

    sendResponse(res, 200, true, 'Customer report generated successfully', {
        summary: {
            totalCustomers: totalCustomers,
            activeCustomers: activeCustomers,
            atRiskCustomers: atRiskCustomers,
            inactiveCustomers: customerStats.filter(c => c.status === 'Dormant').length,
            newCustomersThisMonth: newCustomers.length,
            totalRevenue: Number(totalRevenue.toFixed(2)),
            averageCustomerLifetimeValue: Number(averageLifetimeValue.toFixed(2)),
            averageOrdersPerCustomer: Number((customerStats.reduce((sum, c) => sum + c.totalOrders, 0) / (totalCustomers || 1)).toFixed(2)),
            generatedDate: new Date().toISOString(),
        },
        topCustomers: topCustomers,
        newCustomers: newCustomers.slice(0, 20),
        atRiskCustomers: customerStats.filter(c => c.status === 'At Risk').slice(0, 20),
        customers: customerStats,
    });
});

// Helper function to group products by category
function groupProductsByCategory(products) {
    const grouped = {};
    let totalValue = 0;

    products.forEach(product => {
        const categoryName = product.category?.name || 'Uncategorized';
        if (!grouped[categoryName]) {
            grouped[categoryName] = {
                category: categoryName,
                productCount: 0,
                totalItems: 0,
                totalValue: 0,
            };
        }
        grouped[categoryName].productCount += 1;
        grouped[categoryName].totalItems += product.stock || 0;
        grouped[categoryName].totalValue += (product.stock || 0) * product.price;
    });

    // Convert to array and calculate percentages
    return Object.values(grouped).map(cat => ({
        ...cat,
        totalValue: Number(cat.totalValue.toFixed(2)),
        percentageOfTotalValue: totalValue > 0 
            ? Number(((cat.totalValue / totalValue) * 100).toFixed(2))
            : 0,
    }));
}

module.exports = {
    generateSalesReport,
    generateInventoryReport,
    generateCustomerReport,
};
