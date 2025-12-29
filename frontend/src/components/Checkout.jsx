import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import {
    getAddresses,
    addAddress,
    getCheckoutSummary,
    validateOrder,
    processPayment,
    createOrder,
    formatCardNumber,
    formatExpiry,
    validateCardNumber,
    getCardType,
    validateExpiry,
    validateCVV,
} from '../services/checkoutService';
import { validateCoupon } from '../services/couponService';
import { createPaymentIntent, confirmPayment } from '../services/paymentService';

// Initialize Stripe
const stripePromise = loadStripe('pk_test_51Sh4dhCcNuxzldzfIgrCbpcZTC2hNZnxnQ3hg2jbImp665aiBMhrOp3aSTdHg5eD6jeKZqSrYKeB1AusswVuAkCT00aia7YilB');

// Stripe Payment Form Component
const StripePaymentForm = ({ amount, onSuccess, onError, onCancel }) => {
    const stripe = useStripe();
    const elements = useElements();
    const [isProcessing, setIsProcessing] = useState(false);
    const [paymentError, setPaymentError] = useState(null);

    const handleStripePayment = async (e) => {
        e.preventDefault();

        if (!stripe || !elements) {
            setPaymentError('Stripe has not loaded yet');
            return;
        }

        setIsProcessing(true);
        setPaymentError(null);

        try {
            // Create a temporary order ID (you can replace this with actual order creation logic)
            const tempOrderId = 'temp_' + Date.now();

            // Create payment intent on backend
            const paymentIntentResponse = await createPaymentIntent(amount, tempOrderId);
            
            if (!paymentIntentResponse.success) {
                throw new Error(paymentIntentResponse.message || 'Failed to create payment intent');
            }

            const { clientSecret, paymentIntentId } = paymentIntentResponse.data;

            // Confirm payment with Stripe
            const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
                payment_method: {
                    card: elements.getElement(CardElement),
                },
            });

            if (stripeError) {
                setPaymentError(stripeError.message);
                onError && onError(stripeError.message);
                setIsProcessing(false);
                return;
            }

            if (paymentIntent.status === 'succeeded') {
                // Confirm payment on backend
                const confirmResponse = await confirmPayment(paymentIntentId, tempOrderId);
                
                if (confirmResponse.success) {
                    onSuccess && onSuccess({
                        paymentIntentId: paymentIntent.id,
                        status: paymentIntent.status,
                        amount: paymentIntent.amount / 100,
                    });
                } else {
                    throw new Error('Payment succeeded but order confirmation failed');
                }
            }
        } catch (err) {
            const errorMsg = err.message || 'Payment failed';
            setPaymentError(errorMsg);
            onError && onError(errorMsg);
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <form onSubmit={handleStripePayment} className="space-y-4">
            <div className="p-4 border-2 border-gray-300 rounded-xl bg-white">
                <CardElement
                    options={{
                        style: {
                            base: {
                                fontSize: '16px',
                                color: '#424770',
                                '::placeholder': {
                                    color: '#aab7c4',
                                },
                            },
                            invalid: {
                                color: '#9e2146',
                            },
                        },
                    }}
                />
            </div>

            {paymentError && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg flex items-start gap-2">
                    <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm">{paymentError}</span>
                </div>
            )}

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800 font-medium mb-2">💳 Test Card Numbers:</p>
                <ul className="text-xs text-blue-700 space-y-1">
                    <li>• Success: <code className="bg-white px-2 py-0.5 rounded">4242 4242 4242 4242</code></li>
                    <li>• Decline: <code className="bg-white px-2 py-0.5 rounded">4000 0000 0000 0002</code></li>
                    <li>• Use any future expiry date (e.g., 12/34) and any 3-digit CVC</li>
                </ul>
            </div>

            <div className="flex gap-3">
                <button
                    type="submit"
                    disabled={!stripe || isProcessing}
                    className="flex-1 bg-primary-600 text-white py-3 px-6 rounded-xl font-medium hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isProcessing ? (
                        <span className="flex items-center justify-center gap-2">
                            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                            Processing...
                        </span>
                    ) : (
                        `Pay Rs. ${amount.toLocaleString()}`
                    )}
                </button>
                <button
                    type="button"
                    onClick={onCancel}
                    disabled={isProcessing}
                    className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-300 transition-colors disabled:opacity-50"
                >
                    Cancel
                </button>
            </div>
        </form>
    );
};

const Checkout = () => {
    const [currentStep, setCurrentStep] = useState(1);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState(null);
    
    // Checkout data
    const [summary, setSummary] = useState(null);
    const [addresses, setAddresses] = useState([]);
    const [selectedAddress, setSelectedAddress] = useState(null);
    const [showAddressForm, setShowAddressForm] = useState(false);
    
    // New address form
    const [newAddress, setNewAddress] = useState({
        addressType: 'home',
        street: '',
        city: '',
        state: '',
        zipCode: '',
        country: 'United States',
        isDefault: false,
    });

    // Payment
    const [paymentMethod, setPaymentMethod] = useState('card');
    const [paymentStep, setPaymentStep] = useState('select'); // 'select' or 'details'
    const [cardDetails, setCardDetails] = useState({
        cardNumber: '',
        cardName: '',
        expiry: '',
        cvv: '',
    });
    const [cardErrors, setCardErrors] = useState({});

    // JazzCash Payment
    const [jazzCashDetails, setJazzCashDetails] = useState({
        mobileNumber: '',
        cnic: '',
        transactionId: '',
    });
    const [jazzCashErrors, setJazzCashErrors] = useState({});

    // EasyPaisa Payment
    const [easyPaisaDetails, setEasyPaisaDetails] = useState({
        mobileNumber: '',
        pin: '',
    });
    const [easyPaisaErrors, setEasyPaisaErrors] = useState({});

    // Bank Transfer
    const [bankTransferDetails, setBankTransferDetails] = useState({
        accountHolder: '',
        bankName: '',
        accountNumber: '',
        iban: '',
    });
    const [bankTransferErrors, setBankTransferErrors] = useState({});
    
    // Coupon
    const [couponCode, setCouponCode] = useState('');
    const [appliedCoupon, setAppliedCoupon] = useState(null);
    const [couponError, setCouponError] = useState('');
    const [couponLoading, setCouponLoading] = useState(false);
    
    // Stripe payment result
    const [stripePaymentResult, setStripePaymentResult] = useState(null);
    
    // Order result
    const [orderResult, setOrderResult] = useState(null);

    const steps = [
        { id: 1, name: 'Shipping', icon: '📦' },
        { id: 2, name: 'Payment', icon: '💳' },
        { id: 3, name: 'Review', icon: '✓' },
    ];

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const [summaryRes, addressRes] = await Promise.all([
                getCheckoutSummary(),
                getAddresses(),
            ]);
            setSummary(summaryRes);
            setAddresses(addressRes.addresses || []);
            
            // Set default address if available
            const defaultAddr = addressRes.addresses?.find(a => a.isDefault);
            if (defaultAddr) {
                setSelectedAddress(defaultAddr);
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    const handleApplyCoupon = async () => {
        if (!couponCode.trim()) {
            setCouponError('Please enter a coupon code');
            return;
        }

        try {
            setCouponLoading(true);
            setCouponError('');
            const response = await validateCoupon({
                code: couponCode,
                orderAmount: summary?.pricing?.subtotal || 0,
            });

            if (response.success) {
                setAppliedCoupon(response.data);
                setCouponCode('');
                // Recalculate total with discount
                if (summary) {
                    const discountAmount = response.data.discountAmount;
                    setSummary(prev => ({
                        ...prev,
                        pricing: {
                            ...prev.pricing,
                            discount: discountAmount,
                            total: prev.pricing.total - discountAmount,
                        },
                    }));
                }
            } else {
                setCouponError(response.message || 'Invalid coupon code');
            }
        } catch (err) {
            setCouponError(err.message || 'Failed to apply coupon');
        } finally {
            setCouponLoading(false);
        }
    };

    const handleRemoveCoupon = () => {
        if (appliedCoupon && summary) {
            const discountAmount = appliedCoupon.discountAmount;
            setSummary(prev => ({
                ...prev,
                pricing: {
                    ...prev.pricing,
                    discount: 0,
                    total: prev.pricing.total + discountAmount,
                },
            }));
        }
        setAppliedCoupon(null);
        setCouponCode('');
        setCouponError('');
    };

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Auto-generate JazzCash Transaction ID when payment method is selected
    useEffect(() => {
        if (paymentMethod === 'jazzcash' && !jazzCashDetails.transactionId) {
            // Generate Transaction ID: 2 letters + 6 digits (e.g., JC123456)
            const letters = 'JC'; // JazzCash prefix
            const numbers = Math.floor(100000 + Math.random() * 900000); // 6-digit random number
            const generatedId = `${letters}${numbers}`;
            
            setJazzCashDetails(prev => ({
                ...prev,
                transactionId: generatedId
            }));
        }
    }, [paymentMethod, jazzCashDetails.transactionId]);

    const handleAddAddress = async (e) => {
        e.preventDefault();
        try {
            setProcessing(true);
            const result = await addAddress(newAddress);
            setAddresses(result.addresses);
            setSelectedAddress(result.newAddress);
            setShowAddressForm(false);
            setNewAddress({
                addressType: 'home',
                street: '',
                city: '',
                state: '',
                zipCode: '',
                country: 'United States',
                isDefault: false,
            });
        } catch (err) {
            setError(err.message);
        } finally {
            setProcessing(false);
        }
    };

    const handleCardChange = (field, value) => {
        let formattedValue = value;
        
        if (field === 'cardNumber') {
            formattedValue = formatCardNumber(value);
        } else if (field === 'expiry') {
            formattedValue = formatExpiry(value);
        } else if (field === 'cvv') {
            formattedValue = value.replace(/\D/g, '').slice(0, 4);
        }

        setCardDetails(prev => ({ ...prev, [field]: formattedValue }));
        
        // Clear error when user starts typing
        if (cardErrors[field]) {
            setCardErrors(prev => ({ ...prev, [field]: null }));
        }
    };

    const validateCard = () => {
        const errors = {};
        const cardNumber = cardDetails.cardNumber.replace(/\s/g, '');
        const cardType = getCardType(cardNumber);

        if (!cardDetails.cardName.trim()) {
            errors.cardName = 'Please fill Cardholder Name';
        }

        if (!cardDetails.cardNumber.trim()) {
            errors.cardNumber = 'Please fill Card Number';
        } else if (!validateCardNumber(cardNumber)) {
            errors.cardNumber = 'Invalid card number';
        }

        if (!cardDetails.expiry.trim()) {
            errors.expiry = 'Please fill Expiry Date';
        } else if (!validateExpiry(cardDetails.expiry)) {
            errors.expiry = 'Invalid expiry date (use MM/YY)';
        }

        if (!cardDetails.cvv.trim()) {
            errors.cvv = 'Please fill CVC/CVV';
        } else if (!validateCVV(cardDetails.cvv, cardType)) {
            errors.cvv = `CVV must be ${cardType === 'amex' ? '4' : '3'} digits`;
        }

        setCardErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const validateJazzCash = () => {
        const errors = {};
        const mobileRegex = /^03\d{9}$/; // Exactly 11 digits starting with 03
        const transactionIdRegex = /^[A-Z]{2}\d{6}$/; // 2 uppercase letters followed by 6 digits
        
        console.log('Validating JazzCash:', jazzCashDetails);
        
        // Always validate all fields - do not skip any
        if (!jazzCashDetails.mobileNumber || !jazzCashDetails.mobileNumber.trim()) {
            errors.mobileNumber = '⚠️ JazzCash Phone Number is required';
        } else {
            // Remove dashes and spaces for validation
            const cleanNumber = jazzCashDetails.mobileNumber.replace(/[-\s]/g, '');
            if (!mobileRegex.test(cleanNumber)) {
                errors.mobileNumber = 'JazzCash Phone must be exactly 11 digits (e.g., 03001234567)';
            }
        }
        
        if (!jazzCashDetails.cnic || !jazzCashDetails.cnic.trim()) {
            errors.cnic = '⚠️ CNIC (last 6 digits) is required';
        } else if (!/^\d{6}$/.test(jazzCashDetails.cnic)) {
            errors.cnic = 'CNIC must be exactly 6 digits';
        }
        
        if (!jazzCashDetails.transactionId || !jazzCashDetails.transactionId.trim()) {
            errors.transactionId = '⚠️ Transaction ID is required';
        } else if (!transactionIdRegex.test(jazzCashDetails.transactionId.toUpperCase())) {
            errors.transactionId = 'Transaction ID must be 2 letters and 6 numbers (e.g., JC123456)';
        }
        
        console.log('JazzCash validation errors:', errors);
        setJazzCashErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const validateEasyPaisa = () => {
        const errors = {};
        const mobileRegex = /^03\d{2}-?\d{7}$/;
        
        if (!easyPaisaDetails.mobileNumber.trim()) {
            errors.mobileNumber = 'Mobile number is required';
        } else if (!mobileRegex.test(easyPaisaDetails.mobileNumber)) {
            errors.mobileNumber = 'Invalid mobile number format (use: 03XX-XXXXXXX)';
        }
        
        if (!easyPaisaDetails.pin.trim()) {
            errors.pin = 'Account PIN is required';
        } else if (!/^\d{4,5}$/.test(easyPaisaDetails.pin)) {
            errors.pin = 'PIN must be 4-5 digits';
        }
        
        setEasyPaisaErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const validateBankTransfer = () => {
        const errors = {};
        
        if (!bankTransferDetails.accountHolder.trim()) {
            errors.accountHolder = 'Account holder name is required';
        }
        
        if (!bankTransferDetails.bankName.trim()) {
            errors.bankName = 'Bank name is required';
        }
        
        if (!bankTransferDetails.accountNumber.trim()) {
            errors.accountNumber = 'Account number is required';
        } else if (!/^\d{10,16}$/.test(bankTransferDetails.accountNumber)) {
            errors.accountNumber = 'Invalid account number (10-16 digits)';
        }
        
        if (!bankTransferDetails.iban.trim()) {
            errors.iban = 'IBAN is required';
        } else if (!/^[A-Z]{2}\d{2}[A-Z0-9]{1,30}$/.test(bankTransferDetails.iban)) {
            errors.iban = 'Invalid IBAN format';
        }
        
        setBankTransferErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleJazzCashChange = (field, value) => {
        let formattedValue = value;
        
        if (field === 'mobileNumber') {
            // Only allow digits, limit to 11 digits
            formattedValue = value.replace(/\D/g, '').slice(0, 11);
        } else if (field === 'transactionId') {
            // Convert to uppercase and limit to 8 characters (2 letters + 6 digits)
            formattedValue = value.toUpperCase().slice(0, 8);
        }
        
        setJazzCashDetails(prev => ({ ...prev, [field]: formattedValue }));
        if (jazzCashErrors[field]) {
            setJazzCashErrors(prev => ({ ...prev, [field]: null }));
        }
    };

    const handleEasyPaisaChange = (field, value) => {
        setEasyPaisaDetails(prev => ({ ...prev, [field]: value }));
        if (easyPaisaErrors[field]) {
            setEasyPaisaErrors(prev => ({ ...prev, [field]: null }));
        }
    };

    const handleBankTransferChange = (field, value) => {
        setBankTransferDetails(prev => ({ ...prev, [field]: value }));
        if (bankTransferErrors[field]) {
            setBankTransferErrors(prev => ({ ...prev, [field]: null }));
        }
    };

    const handleNextStep = async () => {
        console.log('=== handleNextStep called ===');
        console.log('Current Step:', currentStep);
        console.log('Payment Step:', paymentStep);
        console.log('Payment Method:', paymentMethod);
        setError(null);

        if (currentStep === 1) {
            if (!selectedAddress) {
                setError('Please select or add a shipping address');
                return;
            }
            
            // Validate order
            try {
                setProcessing(true);
                const validation = await validateOrder(selectedAddress);
                if (!validation.isValid) {
                    setError(validation.errors?.join(', ') || 'Order validation failed');
                    return;
                }
                setPaymentStep('select'); // Reset payment step when entering step 2
                setCurrentStep(2);
            } catch (err) {
                setError(err.message);
            } finally {
                setProcessing(false);
            }
        } else if (currentStep === 2) {
            if (paymentStep === 'select') {
                // On payment method selection screen
                if (!paymentMethod) {
                    setError('Please select a payment method');
                    return;
                }
                
                // For COD, skip payment details and go directly to review
                if (paymentMethod === 'cod') {
                    setCurrentStep(3);
                    return;
                }
                
                // For other methods, show payment details screen
                console.log('Moving to payment details, method:', paymentMethod);
                setPaymentStep('details');
                return;
            } else if (paymentStep === 'details') {
                // On payment details screen
                console.log('=== On payment details screen ===');
                console.log('Payment Method:', paymentMethod);
                console.log('JazzCash Details:', jazzCashDetails);
                
                // Validate payment details before going to review
                if (paymentMethod === 'card' && !validateCard()) {
                    setError('Please enter all card details correctly');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                    return;
                }
                if (paymentMethod === 'jazzcash') {
                    const isValid = validateJazzCash();
                    console.log('JazzCash validation result:', isValid);
                    if (!isValid) {
                        setError('⚠️ Please enter ALL JazzCash credentials to proceed (JazzCash Phone, CNIC, and Transaction ID)');
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                        return;
                    }
                }
                if (paymentMethod === 'easypaisa' && !validateEasyPaisa()) {
                    setError('Please enter all EasyPaisa credentials correctly');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                    return;
                }
                if (paymentMethod === 'banktransfer' && !validateBankTransfer()) {
                    setError('Please enter all Bank Transfer details correctly');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                    return;
                }
                
                // Clear error if validation passed
                console.log('All validations passed, moving to step 3');
                setError(null);
                setCurrentStep(3);
            }
        }
    };

    const handlePlaceOrder = async () => {
        try {
            setProcessing(true);
            setError(null);

            // Process payment first
            let paymentResult = null;
            if (paymentMethod === 'stripe') {
                // Stripe payment already processed, use stored result
                if (!stripePaymentResult) {
                    throw new Error('Stripe payment not completed');
                }
                paymentResult = {
                    success: true,
                    transactionId: stripePaymentResult.paymentIntentId,
                    amount: stripePaymentResult.amount,
                    status: stripePaymentResult.status,
                };
            } else if (paymentMethod === 'card') {
                const paymentRes = await processPayment({
                    paymentMethod: 'card',
                    paymentDetails: {
                        cardNumber: cardDetails.cardNumber.replace(/\s/g, ''),
                        expiry: cardDetails.expiry,
                        cvv: cardDetails.cvv,
                    },
                    amount: summary.pricing.total,
                });
                paymentResult = paymentRes.paymentResult;
            } else if (paymentMethod === 'jazzcash') {
                const paymentRes = await processPayment({
                    paymentMethod: 'jazzcash',
                    paymentDetails: {
                        mobile: 'jazzcash_mobile', // Would come from form
                    },
                    amount: summary.pricing.total,
                });
                paymentResult = paymentRes.paymentResult;
            } else if (paymentMethod === 'easypaisa') {
                const paymentRes = await processPayment({
                    paymentMethod: 'easypaisa',
                    paymentDetails: {
                        mobile: 'easypaisa_mobile', // Would come from form
                    },
                    amount: summary.pricing.total,
                });
                paymentResult = paymentRes.paymentResult;
            } else if (paymentMethod === 'banktransfer') {
                const paymentRes = await processPayment({
                    paymentMethod: 'banktransfer',
                    paymentDetails: {
                        reference: 'bank_ref', // Would come from form
                    },
                    amount: summary.pricing.total,
                });
                paymentResult = paymentRes.paymentResult;
            }

            // Create order
            const orderRes = await createOrder({
                shippingAddress: selectedAddress,
                paymentMethod,
                paymentResult,
            });

            setOrderResult(orderRes.order);
            setCurrentStep(4); // Success step
        } catch (err) {
            setError(err.message);
        } finally {
            setProcessing(false);
        }
    };

    const formatPrice = (price) => {
        return new Intl.NumberFormat('en-PK', {
            style: 'currency',
            currency: 'PKR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(price);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading checkout...</p>
                </div>
            </div>
        );
    }

    // Order Success
    if (currentStep === 4 && orderResult) {
        return (
            <div className="min-h-screen bg-gray-50 py-12">
                <div className="max-w-2xl mx-auto px-4">
                    <div className="bg-cream rounded-2xl shadow-lg p-8 text-center">
                        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <svg className="w-10 h-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">Order Placed Successfully!</h1>
                        <p className="text-gray-600 mb-6">
                            Thank you for your order. We've sent a confirmation email to your registered email address.
                        </p>
                        <div className="grid grid-cols-2 gap-4 mb-8">
                            <div className="text-left">
                                <p className="text-sm text-gray-500">Total Amount</p>
                                <p className="font-semibold">{formatPrice(orderResult.totalPrice)}</p>
                            </div>
                            <div className="text-left">
                                <p className="text-sm text-gray-500">Payment Status</p>
                                <p className={`font-semibold ${orderResult.isPaid ? 'text-green-600' : 'text-yellow-600'}`}>
                                    {orderResult.isPaid ? 'Paid' : 'Pending'}
                                </p>
                            </div>
                        </div>
                        <div className="flex space-x-4">
                            <Link
                                to="/orders"
                                className="flex-1 bg-primary-600 text-cream py-3 px-6 rounded-2xl font-medium hover:bg-primary-700 transition-colors"
                            >
                                View Orders
                            </Link>
                            <Link
                                to="/products"
                                className="flex-1 bg-gray-200 text-gray-700 py-3 px-6 rounded-2xl font-medium hover:bg-gray-300 transition-colors"
                            >
                                Continue Shopping
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            {/* Fixed Error Notification at Top */}
            {error && (
                <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-2xl px-4">
                    <div className="bg-red-600 text-white px-6 py-4 rounded-xl shadow-2xl flex items-start gap-3 animate-shake">
                        <svg className="w-6 h-6 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <div className="flex-1">
                            <h3 className="font-bold text-lg mb-1">⚠️ Error</h3>
                            <p className="text-sm">{error}</p>
                        </div>
                        <button 
                            onClick={() => setError(null)}
                            className="text-white hover:text-red-200 flex-shrink-0"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>
            )}
            
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-8">
                    <Link to="/cart" className="text-primary-600 hover:text-primary-800 flex items-center mb-4">
                        <svg className="w-5 h-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        Back to Cart
                    </Link>
                    <h1 className="text-3xl font-bold text-gray-900">Checkout</h1>
                </div>

                {/* Progress Steps */}
                <div className="mb-8">
                    <div className="flex items-center justify-center">
                        {steps.map((step, index) => (
                            <React.Fragment key={step.id}>
                                <div className="flex items-center">
                                    <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                                        currentStep > step.id
                                            ? 'bg-primary-600 border-primary-600 text-cream'
                                            : currentStep === step.id
                                            ? 'bg-primary-600 border-primary-600 text-cream'
                                            : 'border-gray-300 text-gray-400'
                                    }`}>
                                        {currentStep > step.id ? (
                                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                            </svg>
                                        ) : (
                                            <span className="text-lg">{step.icon}</span>
                                        )}
                                    </div>
                                    <span className={`ml-2 text-sm font-medium ${
                                        currentStep >= step.id ? 'text-primary-600' : 'text-gray-500'
                                    }`}>
                                        {step.name}
                                    </span>
                                </div>
                                {index < steps.length - 1 && (
                                    <div className={`w-24 h-1 mx-4 ${
                                        currentStep > step.id ? 'bg-primary-600' : 'bg-gray-200'
                                    }`}></div>
                                )}
                            </React.Fragment>
                        ))}
                    </div>
                </div>

                {error && (
                    <div className="mb-6 bg-red-50 border-2 border-red-500 text-red-800 px-6 py-4 rounded-2xl shadow-lg flex items-start gap-3">
                        <svg className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <div className="flex-1">
                            <h3 className="font-bold text-lg mb-1">Validation Error</h3>
                            <p className="text-base">{error}</p>
                        </div>
                        <button 
                            onClick={() => setError(null)}
                            className="text-red-600 hover:text-red-800 flex-shrink-0"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                )}

                <div className="lg:grid lg:grid-cols-12 lg:gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-8">
                        {/* Step 1: Shipping Address */}
                        {currentStep === 1 && (
                            <div className="bg-cream rounded-xl shadow-md border border-gray-200 p-6">
                                <h2 className="text-xl font-semibold text-gray-900 mb-6">Shipping Address</h2>
                                
                                {/* Saved Addresses */}
                                {addresses.length > 0 && (
                                    <div className="space-y-4 mb-6">
                                        {addresses.map((addr) => (
                                            <label
                                                key={addr._id}
                                                className={`flex items-start p-4 border-2 rounded-2xl cursor-pointer transition-all ${
                                                    selectedAddress?._id === addr._id
                                                        ? 'border-primary-600 bg-primary-50'
                                                        : 'border-gray-200 hover:border-gray-300'
                                                }`}
                                            >
                                                <input
                                                    type="radio"
                                                    name="address"
                                                    checked={selectedAddress?._id === addr._id}
                                                    onChange={() => setSelectedAddress(addr)}
                                                    className="mt-1 h-4 w-4 text-primary-600 focus:ring-primary-500"
                                                />
                                                <div className="ml-3 flex-1">
                                                    <div className="flex items-center">
                                                        <span className="font-medium text-gray-900 capitalize">
                                                            {addr.addressType}
                                                        </span>
                                                        {addr.isDefault && (
                                                            <span className="ml-2 px-2 py-0.5 bg-primary-100 text-primary-700 text-xs rounded-full">
                                                                Default
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-sm text-gray-600 mt-1">
                                                        {addr.street}, {addr.city}, {addr.state} {addr.zipCode}
                                                    </p>
                                                    <p className="text-sm text-gray-500">{addr.country}</p>
                                                </div>
                                            </label>
                                        ))}
                                    </div>
                                )}

                                {/* Add New Address Button */}
                                {!showAddressForm && (
                                    <button
                                        onClick={() => setShowAddressForm(true)}
                                        className="w-full py-3 border-2 border-dashed border-gray-300 rounded-2xl text-gray-600 hover:border-primary-500 hover:text-primary-600 transition-colors flex items-center justify-center"
                                    >
                                        <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                        </svg>
                                        Add New Address
                                    </button>
                                )}

                                {/* New Address Form */}
                                {showAddressForm && (
                                    <form onSubmit={handleAddAddress} className="border-2 border-primary-200 rounded-2xl p-4 bg-primary-50">
                                        <h3 className="font-medium text-gray-900 mb-4">New Address</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="md:col-span-2">
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Address Type
                                                </label>
                                                <select
                                                    value={newAddress.addressType}
                                                    onChange={(e) => setNewAddress({ ...newAddress, addressType: e.target.value })}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                                >
                                                    <option value="home">Home</option>
                                                    <option value="work">Work</option>
                                                    <option value="other">Other</option>
                                                </select>
                                            </div>
                                            <div className="md:col-span-2">
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Street Address *
                                                </label>
                                                <input
                                                    type="text"
                                                    required
                                                    value={newAddress.street}
                                                    onChange={(e) => setNewAddress({ ...newAddress, street: e.target.value })}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                                    placeholder="123 Main Street, Apt 4B"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    City *
                                                </label>
                                                <input
                                                    type="text"
                                                    required
                                                    value={newAddress.city}
                                                    onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    State *
                                                </label>
                                                <input
                                                    type="text"
                                                    required
                                                    value={newAddress.state}
                                                    onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    ZIP Code *
                                                </label>
                                                <input
                                                    type="text"
                                                    required
                                                    value={newAddress.zipCode}
                                                    onChange={(e) => setNewAddress({ ...newAddress, zipCode: e.target.value })}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Country *
                                                </label>
                                                <input
                                                    type="text"
                                                    required
                                                    value={newAddress.country}
                                                    onChange={(e) => setNewAddress({ ...newAddress, country: e.target.value })}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                                />
                                            </div>
                                            <div className="md:col-span-2">
                                                <label className="flex items-center">
                                                    <input
                                                        type="checkbox"
                                                        checked={newAddress.isDefault}
                                                        onChange={(e) => setNewAddress({ ...newAddress, isDefault: e.target.checked })}
                                                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                                                    />
                                                    <span className="ml-2 text-sm text-gray-600">Set as default address</span>
                                                </label>
                                            </div>
                                        </div>
                                        <div className="flex space-x-3 mt-4">
                                            <button
                                                type="submit"
                                                disabled={processing}
                                                className="flex-1 bg-primary-600 text-cream py-2 px-4 rounded-2xl hover:bg-primary-700 disabled:opacity-50"
                                            >
                                                {processing ? 'Saving...' : 'Save Address'}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setShowAddressForm(false)}
                                                className="px-4 py-2 border border-gray-300 rounded-2xl text-gray-700 hover:bg-gray-50"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </form>
                                )}
                            </div>
                        )}

                        {/* Step 2: Payment Method Selection */}
                        {currentStep === 2 && paymentStep === 'select' && (
                            <div className="bg-cream rounded-xl shadow-md border border-gray-200 p-6">
                                <div className="bg-primary-100 p-2 mb-4 text-xs rounded">
                                    DEBUG: Step={currentStep}, PaymentStep={paymentStep}, Method={paymentMethod}
                                </div>
                                <h2 className="text-xl font-semibold text-gray-900 mb-6">Select Payment Method</h2>

                                {/* Payment Method Selection */}
                                <div className="space-y-4">
                                    <label className={`flex items-center p-4 border-2 rounded-2xl cursor-pointer transition-all ${
                                        paymentMethod === 'stripe' ? 'border-primary-600 bg-primary-50' : 'border-gray-200 hover:border-gray-300'
                                    }`}>
                                        <input
                                            type="radio"
                                            name="payment"
                                            value="stripe"
                                            checked={paymentMethod === 'stripe'}
                                            onChange={(e) => setPaymentMethod(e.target.value)}
                                            className="h-4 w-4 text-primary-600 focus:ring-primary-500"
                                        />
                                        <div className="ml-3 flex-1">
                                            <div className="flex items-center">
                                                <svg className="w-6 h-6 mr-2 text-indigo-600" fill="currentColor" viewBox="0 0 24 24">
                                                    <path d="M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zm0 2v12h16V6H4zm2 3h12v2H6V9zm0 4h8v2H6v-2z"/>
                                                </svg>
                                                <span className="font-medium">Stripe Payment</span>
                                                <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-800 text-xs font-semibold rounded">RECOMMENDED</span>
                                            </div>
                                            <p className="text-sm text-gray-500 ml-8">Secure payment with Stripe (Test Mode)</p>
                                        </div>
                                    </label>

                                    <label className={`flex items-center p-4 border-2 rounded-2xl cursor-pointer transition-all ${
                                        paymentMethod === 'card' ? 'border-primary-600 bg-primary-50' : 'border-gray-200 hover:border-gray-300'
                                    }`}>
                                        <input
                                            type="radio"
                                            name="payment"
                                            value="card"
                                            checked={paymentMethod === 'card'}
                                            onChange={(e) => setPaymentMethod(e.target.value)}
                                            className="h-4 w-4 text-primary-600 focus:ring-primary-500"
                                        />
                                        <div className="ml-3 flex-1">
                                            <div className="flex items-center">
                                                <svg className="w-6 h-6 mr-2 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                                                </svg>
                                                <span className="font-medium">Credit / Debit Card</span>
                                            </div>
                                            <p className="text-sm text-gray-500 ml-8">Visa, Mastercard, UnionPay</p>
                                        </div>
                                    </label>

                                    <label className={`flex items-center p-4 border-2 rounded-2xl cursor-pointer transition-all ${
                                        paymentMethod === 'jazzcash' ? 'border-primary-600 bg-primary-50' : 'border-gray-200 hover:border-gray-300'
                                    }`}>
                                        <input
                                            type="radio"
                                            name="payment"
                                            value="jazzcash"
                                            checked={paymentMethod === 'jazzcash'}
                                            onChange={(e) => setPaymentMethod(e.target.value)}
                                            className="h-4 w-4 text-primary-600 focus:ring-primary-500"
                                        />
                                        <div className="ml-3 flex items-center">
                                            <svg className="w-6 h-6 mr-2 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                            </svg>
                                            <span className="font-medium">JazzCash</span>
                                        </div>
                                    </label>

                                    <label className={`flex items-center p-4 border-2 rounded-2xl cursor-pointer transition-all ${
                                        paymentMethod === 'easypaisa' ? 'border-primary-600 bg-primary-50' : 'border-gray-200 hover:border-gray-300'
                                    }`}>
                                        <input
                                            type="radio"
                                            name="payment"
                                            value="easypaisa"
                                            checked={paymentMethod === 'easypaisa'}
                                            onChange={(e) => setPaymentMethod(e.target.value)}
                                            className="h-4 w-4 text-primary-600 focus:ring-primary-500"
                                        />
                                        <div className="ml-3 flex items-center">
                                            <svg className="w-6 h-6 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                            </svg>
                                            <span className="font-medium">EasyPaisa</span>
                                        </div>
                                    </label>

                                    <label className={`flex items-center p-4 border-2 rounded-2xl cursor-pointer transition-all ${
                                        paymentMethod === 'banktransfer' ? 'border-primary-600 bg-primary-50' : 'border-gray-200 hover:border-gray-300'
                                    }`}>
                                        <input
                                            type="radio"
                                            name="payment"
                                            value="banktransfer"
                                            checked={paymentMethod === 'banktransfer'}
                                            onChange={(e) => setPaymentMethod(e.target.value)}
                                            className="h-4 w-4 text-primary-600 focus:ring-primary-500"
                                        />
                                        <div className="ml-3 flex items-center">
                                            <svg className="w-6 h-6 mr-2 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
                                            </svg>
                                            <span className="font-medium">Bank Transfer</span>
                                        </div>
                                    </label>

                                    <label className={`flex items-center p-4 border-2 rounded-2xl cursor-pointer transition-all ${
                                        paymentMethod === 'cod' ? 'border-primary-600 bg-primary-50' : 'border-gray-200 hover:border-gray-300'
                                    }`}>
                                        <input
                                            type="radio"
                                            name="payment"
                                            value="cod"
                                            checked={paymentMethod === 'cod'}
                                            onChange={(e) => setPaymentMethod(e.target.value)}
                                            className="h-4 w-4 text-primary-600 focus:ring-primary-500"
                                        />
                                        <div className="ml-3 flex items-center">
                                            <svg className="w-6 h-6 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                                            </svg>
                                            <span className="font-medium">Cash on Delivery</span>
                                        </div>
                                    </label>
                                </div>
                            </div>
                        )}

                        {/* Step 2.5: Payment Details */}
                        {currentStep === 2 && paymentStep === 'details' && (
                            <div className="bg-cream rounded-xl shadow-md border border-gray-200 p-6">
                                <div className="bg-green-100 p-2 mb-4 text-xs rounded">
                                    DEBUG DETAILS SCREEN: Step={currentStep}, PaymentStep={paymentStep}, Method={paymentMethod}
                                </div>
                                <h2 className="text-xl font-semibold text-gray-900 mb-6">
                                    {paymentMethod === 'stripe' && 'Stripe Payment (Test Mode)'}
                                    {paymentMethod === 'card' && 'Enter Card Details'}
                                    {paymentMethod === 'jazzcash' && 'JazzCash Payment'}
                                    {paymentMethod === 'easypaisa' && 'EasyPaisa Payment'}
                                    {paymentMethod === 'banktransfer' && 'Bank Transfer Details'}
                                </h2>

                                {/* Stripe Payment Form */}
                                {paymentMethod === 'stripe' && (
                                    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-6 border-2 border-indigo-200">
                                        <div className="flex items-center mb-4">
                                            <svg className="w-6 h-6 text-indigo-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                            </svg>
                                            <span className="text-sm font-semibold text-indigo-900">Secure Payment Powered by Stripe</span>
                                        </div>
                                        <Elements stripe={stripePromise}>
                                            <StripePaymentForm
                                                amount={summary?.pricing?.total || 0}
                                                onSuccess={(paymentResult) => {
                                                    console.log('Stripe payment success:', paymentResult);
                                                    setStripePaymentResult(paymentResult);
                                                    setCurrentStep(3); // Move to review step
                                                }}
                                                onError={(error) => {
                                                    setError(error);
                                                }}
                                                onCancel={() => {
                                                    setPaymentStep('select');
                                                }}
                                            />
                                        </Elements>
                                    </div>
                                )}

                                {/* Card Details Form */}
                                {paymentMethod === 'card' && (
                                    <div className="bg-gray-50 rounded-2xl p-4">
                                        <div className="flex items-center mb-4">
                                            <svg className="w-5 h-5 text-green-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                            </svg>
                                            <span className="text-sm text-gray-600">Your payment information is secure (SSL/TLS encrypted)</span>
                                        </div>
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Card Number <span className="text-red-600">*</span>
                                                </label>
                                                <div className="relative">
                                                    <input
                                                        type="text"
                                                        value={cardDetails.cardNumber}
                                                        onChange={(e) => handleCardChange('cardNumber', e.target.value)}
                                                        placeholder="XXXX XXXX XXXX XXXX"
                                                        maxLength="19"
                                                        className={`w-full px-3 py-2 border rounded-2xl focus:ring-2 focus:ring-primary-500 ${
                                                            cardErrors.cardNumber ? 'border-red-500' : 'border-gray-300'
                                                        }`}
                                                    />
                                                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                                        {(getCardType(cardDetails.cardNumber) === 'visa' || getCardType(cardDetails.cardNumber) === 'mastercard' || getCardType(cardDetails.cardNumber) === 'amex') && (
                                                            <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                                                            </svg>
                                                        )}
                                                    </div>
                                                </div>
                                                {cardErrors.cardNumber && (
                                                    <p className="text-red-500 text-sm mt-1">{cardErrors.cardNumber}</p>
                                                )}
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Cardholder Name <span className="text-red-600">*</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    value={cardDetails.cardName}
                                                    onChange={(e) => handleCardChange('cardName', e.target.value)}
                                                    placeholder="Sadia Khan"
                                                    className={`w-full px-3 py-2 border rounded-2xl focus:ring-2 focus:ring-primary-500 ${
                                                        cardErrors.cardName ? 'border-red-500' : 'border-gray-300'
                                                    }`}
                                                />
                                                {cardErrors.cardName && (
                                                    <p className="text-red-500 text-sm mt-1">{cardErrors.cardName}</p>
                                                )}
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        Expiry (MM/YY) <span className="text-red-600">*</span>
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={cardDetails.expiry}
                                                        onChange={(e) => handleCardChange('expiry', e.target.value)}
                                                        placeholder="MM/YY"
                                                        maxLength="5"
                                                        className={`w-full px-3 py-2 border rounded-2xl focus:ring-2 focus:ring-primary-500 ${
                                                            cardErrors.expiry ? 'border-red-500' : 'border-gray-300'
                                                        }`}
                                                    />
                                                    {cardErrors.expiry && (
                                                        <p className="text-red-500 text-sm mt-1">{cardErrors.expiry}</p>
                                                    )}
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        CVC <span className="text-red-600">*</span>
                                                    </label>
                                                    <input
                                                        type="password"
                                                        value={cardDetails.cvv}
                                                        onChange={(e) => handleCardChange('cvv', e.target.value)}
                                                        placeholder="3-4 digits"
                                                        maxLength="4"
                                                        className={`w-full px-3 py-2 border rounded-2xl focus:ring-2 focus:ring-primary-500 ${
                                                            cardErrors.cvv ? 'border-red-500' : 'border-gray-300'
                                                        }`}
                                                    />
                                                    {cardErrors.cvv && (
                                                        <p className="text-red-500 text-sm mt-1">{cardErrors.cvv}</p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {paymentMethod === 'jazzcash' && (
                                    <div className="bg-red-50 rounded-2xl p-6">
                                        <div className="flex items-center mb-4">
                                            <svg className="w-8 h-8 mr-3 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                            </svg>
                                            <h3 className="text-lg font-semibold text-gray-900">JazzCash Payment</h3>
                                        </div>
                                        
                                        {/* Error Summary */}
                                        {Object.keys(jazzCashErrors).length > 0 && (
                                            <div className="mb-4 bg-red-100 border-2 border-red-500 rounded-xl p-4">
                                                <div className="flex items-start gap-2">
                                                    <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                                    </svg>
                                                    <div>
                                                        <h4 className="font-bold text-red-800 mb-2">Please fix the following errors:</h4>
                                                        <ul className="list-disc list-inside space-y-1 text-red-700 text-sm">
                                                            {jazzCashErrors.mobileNumber && <li>{jazzCashErrors.mobileNumber}</li>}
                                                            {jazzCashErrors.cnic && <li>{jazzCashErrors.cnic}</li>}
                                                            {jazzCashErrors.transactionId && <li>{jazzCashErrors.transactionId}</li>}
                                                        </ul>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                        
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    JazzCash Phone <span className="text-red-600">*</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    value={jazzCashDetails.mobileNumber}
                                                    onChange={(e) => handleJazzCashChange('mobileNumber', e.target.value)}
                                                    placeholder="03001234567 (11 digits)"
                                                    maxLength="11"
                                                    className={`w-full px-3 py-2 border rounded-2xl focus:ring-2 focus:ring-red-500 ${
                                                        jazzCashErrors.mobileNumber ? 'border-red-500' : 'border-gray-300'
                                                    }`}
                                                />
                                                {jazzCashErrors.mobileNumber && (
                                                    <p className="text-red-500 text-sm mt-1">{jazzCashErrors.mobileNumber}</p>
                                                )}
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    CNIC (Last 6 Digits) <span className="text-red-600">*</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    value={jazzCashDetails.cnic}
                                                    onChange={(e) => handleJazzCashChange('cnic', e.target.value)}
                                                    placeholder="XXXXXX"
                                                    maxLength="6"
                                                    className={`w-full px-3 py-2 border rounded-2xl focus:ring-2 focus:ring-red-500 ${
                                                        jazzCashErrors.cnic ? 'border-red-500' : 'border-gray-300'
                                                    }`}
                                                />
                                                {jazzCashErrors.cnic && (
                                                    <p className="text-red-500 text-sm mt-1">{jazzCashErrors.cnic}</p>
                                                )}
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Transaction ID <span className="text-red-600">*</span>
                                                    <span className="text-gray-500 text-xs ml-2">(Auto-generated)</span>
                                                </label>
                                                <div className="flex gap-2">
                                                    <input
                                                        type="text"
                                                        value={jazzCashDetails.transactionId}
                                                        readOnly
                                                        placeholder="JC123456"
                                                        className={`flex-1 px-3 py-2 border rounded-2xl bg-gray-50 ${
                                                            jazzCashErrors.transactionId ? 'border-red-500' : 'border-gray-300'
                                                        }`}
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            const letters = 'JC';
                                                            const numbers = Math.floor(100000 + Math.random() * 900000);
                                                            setJazzCashDetails(prev => ({
                                                                ...prev,
                                                                transactionId: `${letters}${numbers}`
                                                            }));
                                                        }}
                                                        className="px-4 py-2 bg-red-600 text-white rounded-2xl hover:bg-red-700 transition-colors text-sm font-medium"
                                                    >
                                                        Regenerate
                                                    </button>
                                                </div>
                                                {jazzCashErrors.transactionId && (
                                                    <p className="text-red-500 text-sm mt-1">{jazzCashErrors.transactionId}</p>
                                                )}
                                            </div>
                                            <div className="bg-cream rounded-2xl p-3 mt-4">
                                                <p className="text-sm text-gray-600">
                                                    You will receive an OTP on your JazzCash registered mobile number to complete the payment.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {paymentMethod === 'easypaisa' && (
                                    <div className="bg-green-50 rounded-2xl p-6">
                                        <div className="flex items-center mb-4">
                                            <svg className="w-8 h-8 mr-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                            </svg>
                                            <h3 className="text-lg font-semibold text-gray-900">EasyPaisa Payment</h3>
                                        </div>
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Mobile Account Number <span className="text-red-600">*</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    value={easyPaisaDetails.mobileNumber}
                                                    onChange={(e) => handleEasyPaisaChange('mobileNumber', e.target.value)}
                                                    placeholder="03XX-XXXXXXX"
                                                    maxLength="12"
                                                    className={`w-full px-3 py-2 border rounded-2xl focus:ring-2 focus:ring-green-500 ${
                                                        easyPaisaErrors.mobileNumber ? 'border-red-500' : 'border-gray-300'
                                                    }`}
                                                />
                                                {easyPaisaErrors.mobileNumber && (
                                                    <p className="text-red-500 text-sm mt-1">{easyPaisaErrors.mobileNumber}</p>
                                                )}
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Account PIN <span className="text-red-600">*</span>
                                                </label>
                                                <input
                                                    type="password"
                                                    value={easyPaisaDetails.pin}
                                                    onChange={(e) => handleEasyPaisaChange('pin', e.target.value)}
                                                    placeholder="Enter your EasyPaisa PIN"
                                                    maxLength="5"
                                                    className={`w-full px-3 py-2 border rounded-2xl focus:ring-2 focus:ring-green-500 ${
                                                        easyPaisaErrors.pin ? 'border-red-500' : 'border-gray-300'
                                                    }`}
                                                />
                                                {easyPaisaErrors.pin && (
                                                    <p className="text-red-500 text-sm mt-1">{easyPaisaErrors.pin}</p>
                                                )}
                                            </div>
                                            <div className="bg-cream rounded-2xl p-3 mt-4">
                                                <p className="text-sm text-gray-600">
                                                    Your payment will be processed securely through EasyPaisa mobile wallet.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {paymentMethod === 'banktransfer' && (
                                    <div className="bg-primary-50 rounded-2xl p-6">
                                        <div className="flex items-center mb-4">
                                            <svg className="w-8 h-8 mr-3 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
                                            </svg>
                                            <h3 className="text-lg font-semibold text-gray-900">Bank Transfer Details</h3>
                                        </div>
                                        <div className="bg-cream rounded-2xl p-4 mb-4">
                                            <h4 className="font-semibold text-gray-900 mb-3">Our Bank Account Details:</h4>
                                            <div className="space-y-2 text-sm">
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Bank Name:</span>
                                                    <span className="font-medium">Meezan Bank</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Account Title:</span>
                                                    <span className="font-medium">E-Commerce Store</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Account Number:</span>
                                                    <span className="font-medium">01234567890123</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">IBAN:</span>
                                                    <span className="font-medium">PK12 MEZN 0001 2345 6789 0123</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Account Holder Name <span className="text-red-600">*</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    value={bankTransferDetails.accountHolder}
                                                    onChange={(e) => handleBankTransferChange('accountHolder', e.target.value)}
                                                    placeholder="Enter account holder name"
                                                    className={`w-full px-3 py-2 border rounded-2xl focus:ring-2 focus:ring-primary-500 ${
                                                        bankTransferErrors.accountHolder ? 'border-red-500' : 'border-gray-300'
                                                    }`}
                                                />
                                                {bankTransferErrors.accountHolder && (
                                                    <p className="text-red-500 text-sm mt-1">{bankTransferErrors.accountHolder}</p>
                                                )}
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Your Bank Name <span className="text-red-600">*</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    value={bankTransferDetails.bankName}
                                                    onChange={(e) => handleBankTransferChange('bankName', e.target.value)}
                                                    placeholder="Enter bank name"
                                                    className={`w-full px-3 py-2 border rounded-2xl focus:ring-2 focus:ring-primary-500 ${
                                                        bankTransferErrors.bankName ? 'border-red-500' : 'border-gray-300'
                                                    }`}
                                                />
                                                {bankTransferErrors.bankName && (
                                                    <p className="text-red-500 text-sm mt-1">{bankTransferErrors.bankName}</p>
                                                )}
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Account Number <span className="text-red-600">*</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    value={bankTransferDetails.accountNumber}
                                                    onChange={(e) => handleBankTransferChange('accountNumber', e.target.value.replace(/\D/g, ''))}
                                                    placeholder="Enter account number"
                                                    className={`w-full px-3 py-2 border rounded-2xl focus:ring-2 focus:ring-primary-500 ${
                                                        bankTransferErrors.accountNumber ? 'border-red-500' : 'border-gray-300'
                                                    }`}
                                                />
                                                {bankTransferErrors.accountNumber && (
                                                    <p className="text-red-500 text-sm mt-1">{bankTransferErrors.accountNumber}</p>
                                                )}
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    IBAN <span className="text-red-600">*</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    value={bankTransferDetails.iban}
                                                    onChange={(e) => handleBankTransferChange('iban', e.target.value.toUpperCase())}
                                                    placeholder="E.g., PK12 MEZN 0001 2345 6789 0123"
                                                    className={`w-full px-3 py-2 border rounded-2xl focus:ring-2 focus:ring-primary-500 ${
                                                        bankTransferErrors.iban ? 'border-red-500' : 'border-gray-300'
                                                    }`}
                                                />
                                                {bankTransferErrors.iban && (
                                                    <p className="text-red-500 text-sm mt-1">{bankTransferErrors.iban}</p>
                                                )}
                                            </div>
                                            <div className="bg-yellow-50 rounded-2xl p-3 mt-4">
                                                <p className="text-sm text-gray-700">
                                                    <strong>Important:</strong> Please transfer the amount and your order will be processed after payment verification (24-48 hours).
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                            </div>
                        )}

                        {/* Step 3: Review */}
                        {currentStep === 3 && (
                            <div className="space-y-6">
                                {/* Shipping Review */}
                                <div className="bg-cream rounded-xl shadow-md border border-gray-200 p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-lg font-semibold text-gray-900">Shipping Address</h3>
                                        <button
                                            onClick={() => setCurrentStep(1)}
                                            className="text-primary-600 hover:text-primary-800 text-sm"
                                        >
                                            Edit
                                        </button>
                                    </div>
                                    {selectedAddress && (
                                        <div className="text-gray-600">
                                            <p className="font-medium capitalize">{selectedAddress.addressType}</p>
                                            <p>{selectedAddress.street}</p>
                                            <p>{selectedAddress.city}, {selectedAddress.state} {selectedAddress.zipCode}</p>
                                            <p>{selectedAddress.country}</p>
                                        </div>
                                    )}
                                </div>

                                {/* Payment Review */}
                                <div className="bg-cream rounded-xl shadow-md border border-gray-200 p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-lg font-semibold text-gray-900">Payment Method</h3>
                                        <button
                                            onClick={() => setCurrentStep(2)}
                                            className="text-primary-600 hover:text-primary-800 text-sm"
                                        >
                                            Edit
                                        </button>
                                    </div>
                                    <div className="flex items-center text-gray-600">
                                        {paymentMethod === 'card' && (
                                            <>
                                                <svg className="w-6 h-6 mr-3 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                                                </svg>
                                                <div>
                                                    <p className="font-medium">Credit Card</p>
                                                    <p className="text-sm">**** **** **** {cardDetails.cardNumber.slice(-4)}</p>
                                                </div>
                                            </>
                                        )}
                                        {paymentMethod === 'jazzcash' && (
                                            <>
                                                <svg className="w-6 h-6 mr-3 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                                </svg>
                                                <p className="font-medium">JazzCash</p>
                                            </>
                                        )}
                                        {paymentMethod === 'easypaisa' && (
                                            <>
                                                <svg className="w-6 h-6 mr-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                                </svg>
                                                <p className="font-medium">EasyPaisa</p>
                                            </>
                                        )}
                                        {paymentMethod === 'banktransfer' && (
                                            <>
                                                <svg className="w-6 h-6 mr-3 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
                                                </svg>
                                                <p className="font-medium">Bank Transfer</p>
                                            </>
                                        )}
                                        {paymentMethod === 'cod' && (
                                            <>
                                                <svg className="w-6 h-6 mr-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                                                </svg>
                                                <p className="font-medium">Cash on Delivery</p>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* Items Review */}
                                <div className="bg-cream rounded-xl shadow-md border border-gray-200 p-6">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Items</h3>
                                    <div className="space-y-3">
                                        {summary?.items?.map((item, index) => {
                                            const productName = item.product?.name || 'Product';
                                            const displayName = productName.length > 25 ? productName.substring(0, 25) + '...' : productName;
                                            
                                            return (
                                                <div key={index} className="flex items-center gap-2 p-3 bg-gray-50 rounded-2xl">
                                                    <div className="w-10 h-10 bg-cream rounded flex items-center justify-center flex-shrink-0 overflow-hidden border border-gray-200">
                                                        {item.product?.images?.[0]?.url ? (
                                                            <img
                                                                src={item.product.images[0].url.startsWith('http') ? item.product.images[0].url : `http://localhost:5000${item.product.images[0].url}`}
                                                                alt={displayName}
                                                                className="w-full h-full object-cover"
                                                                onError={(e) => {
                                                                    e.target.style.display = 'none';
                                                                    e.target.parentElement.innerHTML = '<span class="text-sm">📦</span>';
                                                                }}
                                                            />
                                                        ) : (
                                                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                                            </svg>
                                                        )}
                                                    </div>
                                                    <div className="flex-1 min-w-0 mr-2">
                                                        <p className="font-medium text-xs text-gray-900 break-words" style={{ maxWidth: '150px' }}>
                                                            {displayName}
                                                        </p>
                                                        <p className="text-xs text-gray-500 mt-0.5">Qty: {item.quantity}</p>
                                                    </div>
                                                    <div className="flex-shrink-0 text-right" style={{ minWidth: '80px' }}>
                                                        <p className="font-semibold text-xs text-gray-900 whitespace-nowrap">
                                                            PKR {item.price?.toFixed(2) || '0.00'}
                                                        </p>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Navigation Buttons */}
                        <div className="mt-6 flex justify-between">
                            {currentStep > 1 && currentStep < 4 && (
                                <button
                                    onClick={() => {
                                        if (currentStep === 2 && paymentStep === 'details') {
                                            setPaymentStep('select');
                                        } else {
                                            if (currentStep === 2) {
                                                setPaymentStep('select');
                                            }
                                            setCurrentStep(currentStep - 1);
                                        }
                                    }}
                                    className="px-6 py-3 border border-gray-300 rounded-2xl text-gray-700 hover:bg-gray-50"
                                >
                                    Back
                                </button>
                            )}
                            {currentStep < 3 && (
                                <button
                                    onClick={handleNextStep}
                                    disabled={processing}
                                    className="ml-auto px-6 py-3 bg-primary-600 text-cream rounded-2xl hover:bg-primary-700 disabled:opacity-50"
                                >
                                    {processing ? 'Processing...' : 
                                     currentStep === 1 ? 'Continue' :
                                     currentStep === 2 && paymentStep === 'select' ? 'Continue to Payment' :
                                     currentStep === 2 && paymentStep === 'details' ? 'Review Order' : 
                                     'Continue'}
                                </button>
                            )}
                            {currentStep === 3 && (
                                <button
                                    onClick={handlePlaceOrder}
                                    disabled={processing}
                                    className="ml-auto px-8 py-3 bg-green-600 text-cream rounded-2xl hover:bg-green-700 disabled:opacity-50 font-medium"
                                >
                                    {processing ? 'Placing Order...' : `Place Order - ${formatPrice(summary?.pricing?.total || 0)}`}
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Order Summary Sidebar */}
                    <div className="lg:col-span-4 mt-8 lg:mt-0">
                        <div className="bg-cream rounded-xl shadow-md border border-gray-200 p-6 sticky top-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h3>
                            
                            {/* Items Preview */}
                            <div className="space-y-2 mb-4 max-h-48 overflow-y-auto">
                                {summary?.items?.map((item, index) => {
                                    const productName = item.product?.name || 'Product';
                                    const displayName = productName.length > 20 ? productName.substring(0, 20) + '...' : productName;
                                    
                                    return (
                                        <div key={index} className="flex items-center gap-2 text-xs">
                                            <span className="w-5 h-5 bg-gray-100 rounded flex items-center justify-center text-xs flex-shrink-0">
                                                {item.quantity}
                                            </span>
                                            <span className="flex-1 text-gray-600 min-w-0" style={{ maxWidth: '120px' }}>
                                                {displayName}
                                            </span>
                                            <span className="text-gray-900 font-medium whitespace-nowrap">
                                                {formatPrice(item.subtotal)}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Coupon Section */}
                            <div className="border-t border-gray-200 pt-4 mt-4">
                                {!appliedCoupon ? (
                                    <div className="space-y-3">
                                        <label className="text-sm font-medium text-gray-700 block">Apply Coupon Code</label>
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                value={couponCode}
                                                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                                                placeholder="Enter coupon code"
                                                className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 outline-none"
                                                disabled={couponLoading}
                                            />
                                            <button
                                                onClick={handleApplyCoupon}
                                                disabled={couponLoading || !couponCode.trim()}
                                                className="px-3 py-2 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                                            >
                                                {couponLoading ? 'Applying...' : 'Apply'}
                                            </button>
                                        </div>
                                        {couponError && (
                                            <p className="text-xs text-red-600">{couponError}</p>
                                        )}
                                    </div>
                                ) : (
                                    <div className="bg-green-50 border border-green-200 rounded-lg p-3 space-y-2">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm font-medium text-green-900">✓ Coupon Applied</p>
                                                <p className="text-xs text-green-700 mt-1">Code: {appliedCoupon.code}</p>
                                            </div>
                                            <button
                                                onClick={handleRemoveCoupon}
                                                className="text-sm text-green-600 hover:text-green-800 font-medium"
                                            >
                                                Remove
                                            </button>
                                        </div>
                                        <p className="text-xs text-green-700 font-medium">
                                            Discount: -{formatPrice(appliedCoupon.discountAmount)}
                                        </p>
                                    </div>
                                )}
                            </div>

                            <div className="border-t border-gray-200 pt-4 space-y-3">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Subtotal</span>
                                    <span>{formatPrice(summary?.pricing?.subtotal || 0)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Shipping</span>
                                    <span>
                                        {summary?.pricing?.shipping === 0 ? (
                                            <span className="text-green-600">FREE</span>
                                        ) : (
                                            formatPrice(summary?.pricing?.shipping || 0)
                                        )}
                                    </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Tax (8%)</span>
                                    <span>{formatPrice(summary?.pricing?.tax || 0)}</span>
                                </div>
                                {appliedCoupon && (
                                    <div className="flex justify-between text-sm text-green-600 font-medium">
                                        <span>Discount</span>
                                        <span>-{formatPrice(appliedCoupon.discountAmount || 0)}</span>
                                    </div>
                                )}
                                <div className="border-t border-gray-200 pt-3">
                                    <div className="flex justify-between font-semibold text-lg">
                                        <span>Total</span>
                                        <span className="text-primary-600">{formatPrice(summary?.pricing?.total || 0)}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Security Badge */}
                            <div className="mt-6 pt-4 border-t border-gray-200">
                                <div className="flex items-center justify-center text-sm text-gray-500">
                                    <svg className="w-5 h-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                    </svg>
                                    SSL Secured Checkout
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Checkout;

