/**
 * Phone Input Component with Country Code Selector
 * Features dropdown with country flags, names, and dynamic validation
 */

import React, { useState, useRef, useEffect } from 'react';
import { countries } from '../../data/countries';

const PhoneInput = ({
  label,
  name,
  value,
  onChange,
  onCountryChange,
  onBlur,
  error,
  required = false,
  disabled = false,
}) => {
  const [selectedCountry, setSelectedCountry] = useState(countries[0]); // Default to Pakistan
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
        setSearchQuery('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Parse initial value if provided
  useEffect(() => {
    if (value) {
      // Try to extract country code and phone number
      const dialCodeMatch = value.match(/^\+\d+/);
      if (dialCodeMatch) {
        const dialCode = dialCodeMatch[0];
        const country = countries.find((c) => c.dialCode === dialCode);
        if (country) {
          setSelectedCountry(country);
          setPhoneNumber(value.replace(dialCode, '').trim());
        }
      } else {
        setPhoneNumber(value);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle country selection
  const handleCountrySelect = (country) => {
    setSelectedCountry(country);
    setIsDropdownOpen(false);
    setSearchQuery('');

    // Trigger onChange with updated full phone number
    const fullNumber = phoneNumber ? `${country.dialCode} ${phoneNumber}` : '';
    onChange?.({
      target: {
        name,
        value: fullNumber,
      },
    });

    // Notify parent of country change
    onCountryChange?.(country);
  };

  // Handle phone number change
  const handlePhoneChange = (e) => {
    let inputValue = e.target.value;

    // Remove all non-digit characters
    inputValue = inputValue.replace(/\D/g, '');

    // Limit to country's digit count
    if (inputValue.length > selectedCountry.digitCount) {
      inputValue = inputValue.slice(0, selectedCountry.digitCount);
    }

    setPhoneNumber(inputValue);

    // Create full phone number with country code
    const fullNumber = inputValue ? `${selectedCountry.dialCode} ${inputValue}` : '';

    // Trigger parent onChange
    onChange?.({
      target: {
        name,
        value: fullNumber,
      },
    });
  };

  // Handle blur for validation
  const handleBlur = (e) => {
    onBlur?.(e);
  };

  // Filter countries based on search
  const filteredCountries = countries.filter(
    (country) =>
      country.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      country.dialCode.includes(searchQuery)
  );

  return (
    <div className="w-full">
      {/* Label */}
      {label && (
        <label
          htmlFor={name}
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      {/* Input Container */}
      <div className="relative">
        {/* Country Code Selector */}
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 z-10">
          <button
            type="button"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            disabled={disabled}
            className="flex items-center space-x-2 hover:bg-gray-50 px-2 py-1 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Select country code"
          >
            <span className="text-2xl leading-none">{selectedCountry.flag}</span>
            <span className="text-sm font-medium text-gray-700">
              {selectedCountry.dialCode}
            </span>
            <svg
              className={`w-4 h-4 text-gray-500 transition-transform ${
                isDropdownOpen ? 'rotate-180' : ''
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>

          {/* Dropdown Menu */}
          {isDropdownOpen && (
            <div
              ref={dropdownRef}
              className="absolute left-0 top-full mt-2 w-80 bg-white border border-gray-300 rounded-lg shadow-lg max-h-96 overflow-hidden z-50"
            >
              {/* Search Input */}
              <div className="p-3 border-b border-gray-200 sticky top-0 bg-white">
                <input
                  type="text"
                  placeholder="Search country..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  autoFocus
                />
              </div>

              {/* Country List */}
              <div className="overflow-y-auto max-h-80">
                {filteredCountries.length > 0 ? (
                  filteredCountries.map((country) => (
                    <button
                      key={country.code}
                      type="button"
                      onClick={() => handleCountrySelect(country)}
                      className={`w-full px-4 py-3 text-left hover:bg-blue-50 transition-colors flex items-center space-x-3 ${
                        selectedCountry.code === country.code
                          ? 'bg-blue-100'
                          : ''
                      }`}
                    >
                      <span className="text-2xl leading-none">{country.flag}</span>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900 truncate">
                          {country.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {country.dialCode} • {country.format}
                        </div>
                      </div>
                      {selectedCountry.code === country.code && (
                        <svg
                          className="w-5 h-5 text-blue-600"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </button>
                  ))
                ) : (
                  <div className="px-4 py-8 text-center text-gray-500">
                    No countries found
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Phone Number Input */}
        <input
          id={name}
          name={name}
          type="tel"
          value={phoneNumber}
          onChange={handlePhoneChange}
          onBlur={handleBlur}
          placeholder={selectedCountry.placeholder}
          disabled={disabled}
          required={required}
          autoComplete="tel"
          aria-label={label}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? `${name}-error` : undefined}
          className={`
            w-full px-4 py-3 pl-32 pr-4
            border rounded-lg 
            focus:outline-none focus:ring-2 
            transition-all duration-200
            ${
              error
                ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
            }
            ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}
            text-gray-900 placeholder-gray-400
          `}
        />
      </div>

      {/* Helper Text */}
      {phoneNumber.length > 0 && (
        <p className="mt-2 text-xs text-gray-500">
          Example: {selectedCountry.example}
        </p>
      )}

      {/* Progress Bar - Always visible when typing */}
      {phoneNumber.length > 0 && (
        <div className="mt-2 flex items-center text-xs">
          <div
            className={`flex-1 h-1 rounded-full ${
              phoneNumber.length === selectedCountry.digitCount
                ? 'bg-green-500'
                : 'bg-gray-300'
            }`}
          >
            <div
              className="h-full bg-blue-500 rounded-full transition-all duration-300"
              style={{
                width: `${(phoneNumber.length / selectedCountry.digitCount) * 100}%`,
              }}
            />
          </div>
          <span
            className={`ml-2 ${
              phoneNumber.length === selectedCountry.digitCount
                ? 'text-green-600 font-medium'
                : 'text-gray-500'
            }`}
          >
            {phoneNumber.length}/{selectedCountry.digitCount}
          </span>
        </div>
      )}
    </div>
  );
};

export default PhoneInput;
