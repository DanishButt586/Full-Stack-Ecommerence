/**
 * CompleteSignup Component
 * Handles signup completion for Google OAuth users
 * Pre-fills name and email, requires phone number
 * Matches the AuthContainer theme
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Input from '../common/Input';
import Button from '../common/Button';
import PhoneInput from '../common/PhoneInput';
import { validatePassword, getPasswordStrengthIndicator } from '../../utils/validation';
import { registerUser } from '../../services/authService';

const CompleteSignup = () => {
  const navigate = useNavigate();
  const [googleData, setGoogleData] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    avatar: '',
  });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [passwordStrength, setPasswordStrength] = useState(0);

  // Calculate password strength indicator
  const strengthIndicator = getPasswordStrengthIndicator(passwordStrength);

  useEffect(() => {
    // Extract Google data from URL
    const urlParams = new URLSearchParams(window.location.search);
    const googleDataStr = urlParams.get('googleData');

    if (!googleDataStr) {
      // No Google data, redirect to home
      navigate('/');
      return;
    }

    try {
      const data = JSON.parse(decodeURIComponent(googleDataStr));
      setGoogleData(data);
      
      // Pre-fill form with Google data
      setFormData(prev => ({
        ...prev,
        name: data.name || '',
        email: data.email || '',
        avatar: data.avatar || '',
      }));
    } catch (err) {
      console.error('Error parsing Google data:', err);
      navigate('/');
    }
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Update password strength in real-time
    if (name === 'password') {
      const { strength } = validatePassword(value);
      setPasswordStrength(strength);
    }

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    if (apiError) setApiError('');
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    validateField(name, formData[name]);
  };

  const validateField = (name, value) => {
    let error = '';

    switch (name) {
      case 'password':
        const passwordValidation = validatePassword(value);
        if (!passwordValidation.isValid) {
          error = passwordValidation.message;
        }
        break;
      case 'confirmPassword':
        if (!value || value.trim() === '') {
          error = 'Please confirm your password';
        } else if (value !== formData.password) {
          error = 'Passwords do not match';
        }
        break;
      default:
        break;
    }

    setErrors(prev => ({ ...prev, [name]: error }));
    return error;
  };

  const handlePhoneChange = (e) => {
    // PhoneInput passes an event-like object { target: { name, value } }
    const phoneValue = e?.target?.value || '';
    setFormData(prev => ({ ...prev, phone: phoneValue }));
    
    // Clear phone error when user types
    if (errors.phone) {
      setErrors(prev => ({ ...prev, phone: '' }));
    }
  };

  const validatePhone = () => {
    const phone = formData.phone || '';
    if (!phone || phone.trim() === '') {
      setErrors(prev => ({ ...prev, phone: 'Phone number is required' }));
      return false;
    }

    // Basic validation - phone should have some digits
    const digitCount = phone.replace(/\D/g, '').length;
    if (digitCount < 7) {
      setErrors(prev => ({ 
        ...prev, 
        phone: 'Please enter a valid phone number' 
      }));
      return false;
    }

    return true;
  };

  const validateForm = () => {
    let isValid = true;

    // Validate phone
    if (!validatePhone()) {
      isValid = false;
    }

    // Validate password
    const passwordError = validateField('password', formData.password);
    if (passwordError) isValid = false;

    // Validate confirm password
    const confirmError = validateField('confirmPassword', formData.confirmPassword);
    if (confirmError) isValid = false;

    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError('');

    // Validate all fields
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Register user with phone number
      const response = await registerUser({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        phone: formData.phone,
        avatar: formData.avatar,
      });

      // Store token and redirect to dashboard
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));

      // Dispatch custom event to notify App component of auth change
      window.dispatchEvent(new Event('authUpdate'));

      // Redirect to dashboard
      navigate('/dashboard');
    } catch (error) {
      setApiError(error.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/');
  };

  if (!googleData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Visual Branding Section */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 relative overflow-hidden lg:fixed lg:left-0 lg:top-0 lg:h-screen">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-full h-full">
            <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern
                  id="grid"
                  width="40"
                  height="40"
                  patternUnits="userSpaceOnUse"
                >
                  <path
                    d="M 40 0 L 0 0 0 40"
                    fill="none"
                    stroke="white"
                    strokeWidth="1"
                  />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>
          </div>
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center items-center w-full px-12 text-white py-12">
          {/* Logo */}
          <div className="mb-8">
            <div className="w-20 h-20 bg-cream rounded-2xl flex items-center justify-center shadow-2xl">
              <svg
                className="w-12 h-12 text-primary-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                />
              </svg>
            </div>
          </div>

          {/* Heading */}
          <h1 className="text-5xl font-bold mb-6 text-center">
            Almost There!
          </h1>
          <p className="text-xl text-primary-100 text-center max-w-md mb-12">
            Just one more step to unlock your personalized shopping experience.
          </p>

          {/* Features List */}
          <div className="space-y-6 max-w-md">
            {[
              {
                icon: (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                ),
                title: 'Verified Account',
                desc: 'Your Google account has been verified',
              },
              {
                icon: (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                  />
                ),
                title: 'Phone Verification',
                desc: 'Add your phone for order updates & security',
              },
              {
                icon: (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                ),
                title: 'Secure Password',
                desc: 'Create a strong password for your account',
              },
            ].map((feature, index) => (
              <div
                key={index}
                className="flex items-start space-x-4 bg-cream bg-opacity-10 backdrop-blur-sm rounded-lg p-4 border border-white border-opacity-20"
              >
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-cream bg-opacity-20 rounded-lg flex items-center justify-center">
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      {feature.icon}
                    </svg>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-1">{feature.title}</h3>
                  <p className="text-primary-100 text-sm">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Decorative Elements */}
          <div className="absolute top-10 right-10 w-32 h-32 bg-cream opacity-5 rounded-full blur-3xl" />
          <div className="absolute bottom-10 left-10 w-40 h-40 bg-primary-300 opacity-10 rounded-full blur-3xl" />
        </div>
      </div>

      {/* Right Side - Complete Signup Form */}
      <div className="w-full lg:w-1/2 lg:ml-auto flex items-center justify-center p-8 bg-gray-50 min-h-screen">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex justify-center mb-8">
            <div className="w-16 h-16 bg-primary-600 rounded-xl flex items-center justify-center shadow-lg">
              <svg
                className="w-10 h-10 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                />
              </svg>
            </div>
          </div>

          {/* Form Container */}
          <div className="bg-cream rounded-2xl shadow-xl p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                <svg
                  className="w-8 h-8 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Complete Your Profile
              </h2>
              <p className="text-gray-600">
                Welcome, <span className="font-semibold text-primary-600">{googleData.name}</span>! Add your details to finish.
              </p>
            </div>

            {/* API Error Alert */}
            {apiError && (
              <div
                className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start"
                role="alert"
              >
                <svg
                  className="w-5 h-5 text-red-600 mt-0.5 mr-3 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
                <div className="flex-1">
                  <p className="text-sm text-red-800 font-medium">{apiError}</p>
                </div>
              </div>
            )}

            {/* Google Account Info Banner */}
            <div className="mb-6 p-4 bg-primary-50 border border-primary-100 rounded-xl">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-cream rounded-full flex items-center justify-center shadow-sm">
                    <svg viewBox="0 0 24 24" className="w-5 h-5">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {googleData.name}
                  </p>
                  <p className="text-sm text-gray-500 truncate">
                    {googleData.email}
                  </p>
                </div>
                <div className="flex-shrink-0">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Verified
                  </span>
                </div>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6" noValidate>
              {/* Phone Input (Required) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <PhoneInput
                  value={formData.phone}
                  onChange={handlePhoneChange}
                  error={errors.phone}
                  required
                />
                <p className="mt-2 text-sm text-gray-500">
                  We'll use this for order updates and account security
                </p>
              </div>

              {/* Password Input */}
              <div>
                <Input
                  label="Password"
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={touched.password ? errors.password : ''}
                  placeholder="Create a strong password"
                  required
                  autoComplete="new-password"
                  showPasswordToggle
                  icon={(props) => (
                    <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                      />
                    </svg>
                  )}
                />
                
                {/* Password Strength Indicator */}
                {formData.password && (
                  <div className="mt-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-600">Password strength:</span>
                      <span className={`text-xs font-medium ${strengthIndicator.textColor}`}>
                        {strengthIndicator.text}
                      </span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${strengthIndicator.color}`}
                        style={{ width: `${(passwordStrength / 4) * 100}%` }}
                        role="progressbar"
                        aria-valuenow={passwordStrength}
                        aria-valuemin="0"
                        aria-valuemax="4"
                        aria-label="Password strength"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm Password Input */}
              <Input
                label="Confirm Password"
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                onBlur={handleBlur}
                error={touched.confirmPassword ? errors.confirmPassword : ''}
                placeholder="Confirm your password"
                required
                autoComplete="new-password"
                showPasswordToggle
                icon={(props) => (
                  <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                )}
              />

              {/* Action Buttons */}
              <div className="space-y-3 pt-2">
                <Button
                  type="submit"
                  loading={loading}
                  disabled={loading || !formData.phone || !formData.password || !formData.confirmPassword}
                  fullWidth
                  size="lg"
                >
                  Complete Registration
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                  disabled={loading}
                  fullWidth
                >
                  Cancel
                </Button>
              </div>

              {/* Terms Text */}
              <p className="text-center text-xs text-gray-500 mt-4">
                By completing registration, you agree to our{' '}
                <span className="text-primary-600 hover:underline cursor-pointer">
                  Terms of Service
                </span>{' '}
                and{' '}
                <span className="text-primary-600 hover:underline cursor-pointer">
                  Privacy Policy
                </span>
              </p>
            </form>
          </div>

          {/* Footer */}
          <p className="text-center text-sm text-gray-500 mt-8">
            © 2025 ShopHub. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};

export default CompleteSignup;
