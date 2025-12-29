let stripe = null;
if (process.env.STRIPE_SECRET_KEY) {
    stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
} else {
    console.warn('STRIPE_SECRET_KEY not set; Stripe payments disabled.');
}
const { sendResponse, asyncHandler } = require('../Library/helper');
const Order = require('../Models/orderModel');

// @desc    Create payment intent
// @route   POST /api/payment/create-intent
// @access  Private
const createPaymentIntent = asyncHandler(async (req, res) => {
    if (!stripe) {
        return sendResponse(res, 503, false, 'Stripe is not configured on the server');
    }
    const { amount, orderId } = req.body;

    if (!amount || !orderId) {
        return sendResponse(res, 400, false, 'Amount and Order ID are required');
    }

    try {
        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(amount * 100), // Convert to cents (Stripe uses smallest currency unit)
            currency: 'usd', // You can change to 'pkr' for Pakistani Rupees if needed
            metadata: {
                orderId: orderId.toString(),
                userId: req.user._id.toString(),
            },
            automatic_payment_methods: {
                enabled: true,
            },
        });

        sendResponse(res, 200, true, 'Payment intent created successfully', {
            clientSecret: paymentIntent.client_secret,
            paymentIntentId: paymentIntent.id,
        });
    } catch (error) {
        console.error('Stripe Error:', error);
        return sendResponse(res, 500, false, `Payment error: ${error.message}`);
    }
});

// @desc    Confirm payment and update order
// @route   POST /api/payment/confirm
// @access  Private
const confirmPayment = asyncHandler(async (req, res) => {
    if (!stripe) {
        return sendResponse(res, 503, false, 'Stripe is not configured on the server');
    }
    const { paymentIntentId, orderId } = req.body;

    if (!paymentIntentId || !orderId) {
        return sendResponse(res, 400, false, 'Payment Intent ID and Order ID are required');
    }

    try {
        // Retrieve payment intent from Stripe
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

        if (paymentIntent.status === 'succeeded') {
            // Update order with payment details
            const order = await Order.findByIdAndUpdate(
                orderId,
                {
                    paymentStatus: 'paid',
                    paymentMethod: 'stripe',
                    'paymentDetails.transactionId': paymentIntentId,
                    'paymentDetails.amount': paymentIntent.amount / 100,
                    'paymentDetails.currency': paymentIntent.currency,
                    'paymentDetails.paidAt': new Date(),
                },
                { new: true }
            );

            if (!order) {
                return sendResponse(res, 404, false, 'Order not found');
            }

            sendResponse(res, 200, true, 'Payment confirmed successfully', {
                order,
                paymentIntent: {
                    id: paymentIntent.id,
                    status: paymentIntent.status,
                    amount: paymentIntent.amount / 100,
                },
            });
        } else {
            return sendResponse(res, 400, false, `Payment status: ${paymentIntent.status}`);
        }
    } catch (error) {
        console.error('Payment Confirmation Error:', error);
        return sendResponse(res, 500, false, `Error confirming payment: ${error.message}`);
    }
});

// @desc    Get payment status
// @route   GET /api/payment/status/:paymentIntentId
// @access  Private
const getPaymentStatus = asyncHandler(async (req, res) => {
    if (!stripe) {
        return sendResponse(res, 503, false, 'Stripe is not configured on the server');
    }
    const { paymentIntentId } = req.params;

    try {
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

        sendResponse(res, 200, true, 'Payment status retrieved', {
            id: paymentIntent.id,
            status: paymentIntent.status,
            amount: paymentIntent.amount / 100,
            currency: paymentIntent.currency,
        });
    } catch (error) {
        console.error('Payment Status Error:', error);
        return sendResponse(res, 500, false, `Error retrieving payment status: ${error.message}`);
    }
});

// @desc    Webhook handler for Stripe events
// @route   POST /api/payment/webhook
// @access  Public (Stripe only)
const handleWebhook = asyncHandler(async (req, res) => {
    if (!stripe) {
        return res.status(503).send('Stripe is not configured on the server');
    }
    const sig = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event;

    try {
        event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } catch (err) {
        console.error('Webhook Error:', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    switch (event.type) {
        case 'payment_intent.succeeded':
            const paymentIntent = event.data.object;
            console.log('PaymentIntent was successful!', paymentIntent.id);

            // Update order in database
            if (paymentIntent.metadata.orderId) {
                await Order.findByIdAndUpdate(paymentIntent.metadata.orderId, {
                    paymentStatus: 'paid',
                    'paymentDetails.transactionId': paymentIntent.id,
                });
            }
            break;

        case 'payment_intent.payment_failed':
            const failedPayment = event.data.object;
            console.log('Payment failed:', failedPayment.id);

            if (failedPayment.metadata.orderId) {
                await Order.findByIdAndUpdate(failedPayment.metadata.orderId, {
                    paymentStatus: 'failed',
                });
            }
            break;

        default:
            console.log(`Unhandled event type ${event.type}`);
    }

    res.json({ received: true });
});

module.exports = {
    createPaymentIntent,
    confirmPayment,
    getPaymentStatus,
    handleWebhook,
};
