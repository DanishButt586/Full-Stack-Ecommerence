/**
 * Registration Component
 * Handles user registration with validation, password strength indicator
 */

import React, { useState } from 'react';
import Input from '../common/Input';
import PhoneInput from '../common/PhoneInput';
import Button from '../common/Button';
import PrivacyPolicy from '../legal/PrivacyPolicy';
import TermsOfService from '../legal/TermsOfService';
import {
  validateEmail,
  validatePassword,
  validateName,
  getPasswordStrengthIndicator,
} from '../../utils/validation';
import { validatePhoneNumber, getCountryByDialCode } from '../../data/countries';
import { registerUser } from '../../services/authService';

const Register = ({ onSwitchToLogin, onRegisterSuccess }) => {
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });

  // UI state
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);
  const [showTermsOfService, setShowTermsOfService] = useState(false);

  /**
   * Handle input change
   */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Update password strength in real-time
    if (name === 'password') {
      const { strength } = validatePassword(value);
      setPasswordStrength(strength);
    }

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
    if (apiError) setApiError('');
  };

  /**
   * Handle input blur for validation
   */
  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    // Only validate and show error when user leaves the field
    validateField(name, formData[name]);
  };

  /**
   * Validate individual field with dynamic feedback
   */
  const validateField = (name, value) => {
    let error = '';

    switch (name) {
      case 'name':
        if (!value || value.trim() === '') {
          error = 'Full name is required';
        } else if (value.trim().length < 2) {
          error = 'Name must be at least 2 characters';
        } else if (!validateName(value)) {
          error = 'Please enter a valid name (letters and spaces only)';
        }
        break;
      case 'email':
        const emailValidation = validateEmail(value);
        if (!emailValidation.isValid) {
          error = emailValidation.message;
        }
        break;
      case 'phone':
        if (!value || value.trim() === '') {
          error = 'Phone number is required';
        } else {
          // Extract country code and phone number
          const dialCodeMatch = value.match(/^\+(\d+)/);
          if (dialCodeMatch) {
            const dialCode = `+${dialCodeMatch[1]}`;
            const phoneNumber = value.replace(dialCode, '').trim();
            const country = getCountryByDialCode(dialCode);
            
            if (country) {
              const phoneValidation = validatePhoneNumber(phoneNumber, country.code);
              if (!phoneValidation.isValid) {
                error = phoneValidation.message;
              }
            }
          } else {
            error = 'Please select a country code';
          }
        }
        break;
      case 'password':
        if (!value || value.trim() === '') {
          error = 'Password is required';
        } else {
          const validation = validatePassword(value);
          if (!validation.isValid) {
            error = validation.message;
          }
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

    setErrors((prev) => ({ ...prev, [name]: error }));
    return error;
  };

  /**
   * Validate all fields
   */
  const validateForm = () => {
    const newErrors = {};

    Object.keys(formData).forEach((key) => {
      const error = validateField(key, formData[key]);
      if (error) newErrors[key] = error;
    });

    // Check terms agreement
    if (!agreedToTerms) {
      setApiError('You must agree to the Terms of Service and Privacy Policy');
      return false;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Mark all fields as touched
    const allTouched = Object.keys(formData).reduce(
      (acc, key) => ({ ...acc, [key]: true }),
      {}
    );
    setTouched(allTouched);

    // Validate form
    if (!validateForm()) return;

    setLoading(true);
    setApiError('');

    try {
      // Call mock API
      const response = await registerUser(formData);

      // Handle successful registration
      console.log('Registration successful:', response);
      onRegisterSuccess?.(response.data);

      // Reset form
      setFormData({
        name: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
      });
      setTouched({});
      setPasswordStrength(0);
    } catch (error) {
      setApiError(error.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Get password strength indicator
  const strengthIndicator = getPasswordStrengthIndicator(passwordStrength);

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Create Account</h2>
        <p className="text-gray-600">Join us today and start shopping!</p>
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

      {/* Registration Form */}
      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        {/* Full Name Input */}
        <Input
          label="Full Name"
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          onBlur={handleBlur}
          error={touched.name ? errors.name : ''}
          placeholder="John Doe"
          required
          autoComplete="name"
          icon={(props) => (
            <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
          )}
        />

        {/* Email Input */}
        <Input
          label="Email Address"
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          onBlur={handleBlur}
          error={touched.email ? errors.email : ''}
          placeholder="you@example.com"
          required
          autoComplete="email"
          icon={(props) => (
            <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
              />
            </svg>
          )}
        />

        {/* Phone Input with Country Code Selector */}
        <PhoneInput
          label="Phone Number"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          onBlur={handleBlur}
          error={touched.phone ? errors.phone : ''}
          required
        />

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
          placeholder="Re-enter your password"
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

        {/* Terms and Conditions */}
        <div className="flex items-start">
          <input
            id="terms"
            type="checkbox"
            checked={agreedToTerms}
            onChange={(e) => {
              setAgreedToTerms(e.target.checked);
              if (e.target.checked && apiError.includes('agree to')) {
                setApiError('');
              }
            }}
            required
            className="mt-1 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded cursor-pointer"
          />
          <label htmlFor="terms" className="ml-2 text-sm text-gray-600">
            I agree to the{' '}
            <button
              type="button"
              onClick={() => setShowTermsOfService(true)}
              className="text-primary-600 hover:text-primary-700 font-medium focus:outline-none focus:underline"
            >
              Terms of Service
            </button>{' '}
            and{' '}
            <button
              type="button"
              onClick={() => setShowPrivacyPolicy(true)}
              className="text-primary-600 hover:text-primary-700 font-medium focus:outline-none focus:underline"
            >
              Privacy Policy
            </button>
          </label>
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          loading={loading}
          disabled={loading}
          fullWidth
          size="lg"
        >
          Create Account
        </Button>

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-cream text-gray-500">Or sign up with</span>
          </div>
        </div>

        {/* Social Signup Buttons */}
        <div className="flex justify-center">
          <Button
            type="button"
            variant="outline"
            onClick={() => window.location.href = 'http://localhost:5000/api/auth/google'}
            fullWidth
            icon={(props) => (
              <svg {...props} viewBox="0 0 24 24">
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
            )}
          >
            Continue with Google
          </Button>
        </div>

        {/* Sign In Link */}
        <p className="text-center text-sm text-gray-600 mt-6">
          Already have an account?{' '}
          <button
            type="button"
            onClick={onSwitchToLogin}
            className="text-primary-600 hover:text-primary-700 font-semibold focus:outline-none focus:underline"
          >
            Sign in here
          </button>
        </p>
      </form>

      {/* Privacy Policy Modal */}
      {showPrivacyPolicy && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div
              className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
              onClick={() => setShowPrivacyPolicy(false)}
            />
            <div className="relative bg-cream rounded-lg max-w-4xl w-full max-h-screen overflow-y-auto">
              <PrivacyPolicy onClose={() => setShowPrivacyPolicy(false)} />
            </div>
          </div>
        </div>
      )}

      {/* Terms of Service Modal */}
      {showTermsOfService && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div
              className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
              onClick={() => setShowTermsOfService(false)}
            />
            <div className="relative bg-cream rounded-lg max-w-4xl w-full max-h-screen overflow-y-auto">
              <TermsOfService onClose={() => setShowTermsOfService(false)} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Register;
