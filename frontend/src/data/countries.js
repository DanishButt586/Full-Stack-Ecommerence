/**
 * Country Data with Phone Codes and Validation Rules
 * Includes country names, flags, dial codes, and digit requirements
 */

export const countries = [
    {
        code: 'PK',
        name: 'Pakistan',
        dialCode: '+92',
        flag: '🇵🇰',
        digitCount: 10, // After country code (without +92)
        format: '3XX XXXXXXX',
        placeholder: '300 1234567',
        example: '+92 300 1234567',
    },
    {
        code: 'US',
        name: 'United States',
        dialCode: '+1',
        flag: '🇺🇸',
        digitCount: 10,
        format: '(XXX) XXX-XXXX',
        placeholder: '(555) 123-4567',
        example: '+1 (555) 123-4567',
    },
    {
        code: 'GB',
        name: 'United Kingdom',
        dialCode: '+44',
        flag: '🇬🇧',
        digitCount: 10,
        format: 'XXXX XXXXXX',
        placeholder: '7400 123456',
        example: '+44 7400 123456',
    },
    {
        code: 'IN',
        name: 'India',
        dialCode: '+91',
        flag: '🇮🇳',
        digitCount: 10,
        format: 'XXXXX XXXXX',
        placeholder: '98765 43210',
        example: '+91 98765 43210',
    },
    {
        code: 'CA',
        name: 'Canada',
        dialCode: '+1',
        flag: '🇨🇦',
        digitCount: 10,
        format: '(XXX) XXX-XXXX',
        placeholder: '(555) 123-4567',
        example: '+1 (555) 123-4567',
    },
    {
        code: 'AU',
        name: 'Australia',
        dialCode: '+61',
        flag: '🇦🇺',
        digitCount: 9,
        format: 'XXX XXX XXX',
        placeholder: '412 345 678',
        example: '+61 412 345 678',
    },
    {
        code: 'AE',
        name: 'United Arab Emirates',
        dialCode: '+971',
        flag: '🇦🇪',
        digitCount: 9,
        format: 'XX XXX XXXX',
        placeholder: '50 123 4567',
        example: '+971 50 123 4567',
    },
    {
        code: 'SA',
        name: 'Saudi Arabia',
        dialCode: '+966',
        flag: '🇸🇦',
        digitCount: 9,
        format: 'XX XXX XXXX',
        placeholder: '50 123 4567',
        example: '+966 50 123 4567',
    },
    {
        code: 'DE',
        name: 'Germany',
        dialCode: '+49',
        flag: '🇩🇪',
        digitCount: 10,
        format: 'XXX XXXXXXX',
        placeholder: '151 2345678',
        example: '+49 151 2345678',
    },
    {
        code: 'FR',
        name: 'France',
        dialCode: '+33',
        flag: '🇫🇷',
        digitCount: 9,
        format: 'X XX XX XX XX',
        placeholder: '6 12 34 56 78',
        example: '+33 6 12 34 56 78',
    },
    {
        code: 'IT',
        name: 'Italy',
        dialCode: '+39',
        flag: '🇮🇹',
        digitCount: 10,
        format: 'XXX XXX XXXX',
        placeholder: '312 345 6789',
        example: '+39 312 345 6789',
    },
    {
        code: 'JP',
        name: 'Japan',
        dialCode: '+81',
        flag: '🇯🇵',
        digitCount: 10,
        format: 'XX XXXX XXXX',
        placeholder: '90 1234 5678',
        example: '+81 90 1234 5678',
    },
    {
        code: 'CN',
        name: 'China',
        dialCode: '+86',
        flag: '🇨🇳',
        digitCount: 11,
        format: 'XXX XXXX XXXX',
        placeholder: '138 0013 8000',
        example: '+86 138 0013 8000',
    },
    {
        code: 'BR',
        name: 'Brazil',
        dialCode: '+55',
        flag: '🇧🇷',
        digitCount: 11,
        format: 'XX XXXXX XXXX',
        placeholder: '11 91234 5678',
        example: '+55 11 91234 5678',
    },
    {
        code: 'MX',
        name: 'Mexico',
        dialCode: '+52',
        flag: '🇲🇽',
        digitCount: 10,
        format: 'XXX XXX XXXX',
        placeholder: '222 123 4567',
        example: '+52 222 123 4567',
    },
    {
        code: 'ZA',
        name: 'South Africa',
        dialCode: '+27',
        flag: '🇿🇦',
        digitCount: 9,
        format: 'XX XXX XXXX',
        placeholder: '71 123 4567',
        example: '+27 71 123 4567',
    },
    {
        code: 'EG',
        name: 'Egypt',
        dialCode: '+20',
        flag: '🇪🇬',
        digitCount: 10,
        format: 'XXX XXX XXXX',
        placeholder: '100 123 4567',
        example: '+20 100 123 4567',
    },
    {
        code: 'NG',
        name: 'Nigeria',
        dialCode: '+234',
        flag: '🇳🇬',
        digitCount: 10,
        format: 'XXX XXX XXXX',
        placeholder: '803 123 4567',
        example: '+234 803 123 4567',
    },
    {
        code: 'TR',
        name: 'Turkey',
        dialCode: '+90',
        flag: '🇹🇷',
        digitCount: 10,
        format: 'XXX XXX XXXX',
        placeholder: '532 123 4567',
        example: '+90 532 123 4567',
    },
    {
        code: 'KR',
        name: 'South Korea',
        dialCode: '+82',
        flag: '🇰🇷',
        digitCount: 10,
        format: 'XX XXXX XXXX',
        placeholder: '10 1234 5678',
        example: '+82 10 1234 5678',
    },
];

/**
 * Get country by code
 */
export const getCountryByCode = (code) => {
    return countries.find((country) => country.code === code);
};

/**
 * Get country by dial code
 */
export const getCountryByDialCode = (dialCode) => {
    return countries.find((country) => country.dialCode === dialCode);
};

/**
 * Validate phone number based on country
 */
export const validatePhoneNumber = (phoneNumber, countryCode) => {
    const country = getCountryByCode(countryCode);
    if (!country) return { isValid: false, message: 'Invalid country' };

    // Remove all non-digit characters
    const digits = phoneNumber.replace(/\D/g, '');

    // Check if digit count matches
    if (digits.length !== country.digitCount) {
        return {
            isValid: false,
            message: `Phone number must be exactly ${country.digitCount} digits for ${country.name}`,
        };
    }

    return { isValid: true, message: '' };
};

/**
 * Format phone number according to country format
 */
export const formatPhoneNumber = (phoneNumber, countryCode) => {
    const country = getCountryByCode(countryCode);
    if (!country) return phoneNumber;

    // Remove all non-digit characters
    const digits = phoneNumber.replace(/\D/g, '');

    // Return formatted number based on country
    // This is a simplified version - you can add more sophisticated formatting
    return digits;
};
