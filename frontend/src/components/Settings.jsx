/**
 * Settings Component
 * Admin settings for profile, security, notifications, and preferences
 */
import React, { useState, useEffect, useCallback } from 'react';
import Input from './common/Input';
import Toast from './common/Toast';
import { getUserSettings, updateUserSettings, updatePassword, updateUserProfile } from '../services/settingsService';
import { DEFAULT_SETTINGS, persistSettings, readSettingsFromStorage } from '../utils/settings';
import { t } from '../utils/translations';

// SVG Icons
const UserIcon = (props) => (
  <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const LockIcon = (props) => (
  <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
  </svg>
);

const PaletteIcon = (props) => (
  <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
  </svg>
);

const ShieldIcon = (props) => (
  <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
);

const EyeIcon = (props) => (
  <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);

const EyeOffIcon = (props) => (
  <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
  </svg>
);

const Settings = ({ darkMode, user, settings, onSettingsChange }) => {
  const [activeSection, setActiveSection] = useState('profile');
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [loading, setLoading] = useState(false);

  // Profile settings state
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    role: user?.role || 'seller',
    businessName: '',
    businessAddress: ''
  });

  // Security settings state
  const [securityData, setSecurityData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Password visibility toggles
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [securityErrors, setSecurityErrors] = useState({
    current: '',
    new: '',
    confirm: ''
  });

  // Appearance settings state
  const initialSettings = settings || readSettingsFromStorage();

  const [appearance, setAppearance] = useState({
    theme: initialSettings.theme || (darkMode ? 'dark' : 'light'),
    language: initialSettings.language || DEFAULT_SETTINGS.language,
    timezone: initialSettings.timezone || DEFAULT_SETTINGS.timezone,
    dateFormat: initialSettings.dateFormat || DEFAULT_SETTINGS.dateFormat
  });

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  const applySettings = useCallback((nextSettings, options = { persist: true, notify: true }) => {
    const merged = {
      theme: nextSettings.theme || 'light',
      language: nextSettings.language || DEFAULT_SETTINGS.language,
      timezone: nextSettings.timezone || DEFAULT_SETTINGS.timezone,
      dateFormat: nextSettings.dateFormat || DEFAULT_SETTINGS.dateFormat
    };

    setAppearance(merged);

    if (options.persist) {
      persistSettings(merged);
    }

    if (options.notify && onSettingsChange) {
      onSettingsChange(merged);
    }

    return merged;
  }, [onSettingsChange]);

  // Load settings on component mount or when parent settings change
  useEffect(() => {
    const loadSettings = async () => {
      try {
        console.log('Loading user settings...');
        const response = await getUserSettings();
        console.log('Settings response:', response);
        
        if (response.success && response.data.settings) {
          const settings = response.data.settings;
          applySettings(settings);
          console.log('Settings loaded successfully:', settings);
        }
      } catch (error) {
        console.error('Failed to load settings:', error);
        // Don't show error toast on initial load, just use defaults
      }
    };

    loadSettings();
  }, [applySettings]);

  // Sync with parent-provided settings
  useEffect(() => {
    if (settings) {
      applySettings(settings, { persist: false, notify: false });
    }
  }, [settings, applySettings]);

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      console.log('Updating profile with data:', profileData);
      const response = await updateUserProfile({
        name: profileData.name,
        email: profileData.email,
        phone: profileData.phone,
      });
      
      console.log('Profile update response:', response);
      
      if (response.success) {
        showToast('Profile updated successfully!');
      } else {
        showToast(response.message || 'Failed to update profile', 'error');
      }
    } catch (error) {
      console.error('Profile update error:', error);
      showToast(error.message || 'Failed to update profile', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();

    // Clear previous errors
    setSecurityErrors({ current: '', new: '', confirm: '' });

    const newErrors = {};
    const pwd = securityData.newPassword;
    const hasUpper = /[A-Z]/.test(pwd);
    const hasLower = /[a-z]/.test(pwd);

    if (!securityData.currentPassword) {
      newErrors.current = 'Enter your current password to continue.';
    }

    if (pwd.length < 6) {
      newErrors.new = 'Password must be at least 6 characters.';
    } else if (!(hasUpper && hasLower)) {
      newErrors.new = 'Use a mix of uppercase and lowercase letters.';
    }

    if (securityData.confirmPassword !== pwd) {
      newErrors.confirm = 'Passwords do not match.';
    }

    if (Object.keys(newErrors).length > 0) {
      setSecurityErrors((prev) => ({ ...prev, ...newErrors }));
      showToast('Please fix the highlighted errors.', 'error');
      return;
    }

    setLoading(true);
    
    try {
      console.log('Changing password...');
      const response = await updatePassword(
        securityData.currentPassword,
        securityData.newPassword
      );
      
      console.log('Password change response:', response);
      
      if (response.success) {
        showToast('Password changed successfully!');
        setSecurityData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setSecurityErrors({ current: '', new: '', confirm: '' });
      } else {
        const message = response.message || 'Failed to change password';
        if (message.toLowerCase().includes('current')) {
          setSecurityErrors((prev) => ({ ...prev, current: 'Current password is incorrect.' }));
        }
        showToast(message, 'error');
      }
    } catch (error) {
      console.error('Password change error:', error);
      const message = error.message || 'Failed to change password';
      if (message.toLowerCase().includes('current')) {
        setSecurityErrors((prev) => ({ ...prev, current: 'Current password is incorrect.' }));
      }
      showToast(message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAppearanceUpdate = async () => {
    setLoading(true);
    
    try {
      console.log('Updating appearance settings:', appearance);
      const response = await updateUserSettings({
        theme: appearance.theme,
        language: appearance.language,
        timezone: appearance.timezone,
        dateFormat: appearance.dateFormat
      });
      
      console.log('Appearance update response:', response);
      
      if (response.success) {
        applySettings(appearance);
        showToast('Appearance settings saved!');
      } else {
        showToast(response.message || 'Failed to update settings', 'error');
      }
    } catch (error) {
      console.error('Appearance update error:', error);
      showToast(error.message || 'Failed to update settings', 'error');
    } finally {
      setLoading(false);
    }
  };

  const sections = [
    { id: 'profile', label: 'Profile', icon: UserIcon },
    { id: 'security', label: 'Security', icon: LockIcon },
    { id: 'appearance', label: 'Appearance', icon: PaletteIcon }
  ];

  return (
    <div className="space-y-6">
      {toast.show && <Toast message={toast.message} type={toast.type} />}

      {/* Header */}
      <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
        <h2 className="text-2xl font-bold text-gray-900">
          Settings
        </h2>
        <p className="mt-1 text-sm text-indigo-600 font-medium">
          Manage your account settings and preferences
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar Navigation */}
        <div className="bg-white rounded-xl shadow-md border border-gray-100 h-fit">
          <nav className="p-4 space-y-2">
            {sections.map((section) => {
              const Icon = section.icon;
              const isActive = activeSection === section.id;
              
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                    isActive
                      ? 'text-white'
                      : darkMode
                      ? 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                  style={isActive ? { backgroundColor: '#492273' } : {}}
                >
                  <Icon className="w-5 h-5" />
                  <span>{section.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          {/* Profile Section */}
          {activeSection === 'profile' && (
            <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
              <div className="flex items-center space-x-3 mb-6">
                <UserIcon className={`w-6 h-6 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`} />
                <h3 className="text-xl font-bold text-gray-900">
                  Profile Information
                </h3>
              </div>

              <form onSubmit={handleProfileUpdate} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-900">
                      Full Name
                    </label>
                    <Input
                      type="text"
                      value={profileData.name}
                      onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                      placeholder="Enter your name"
                      className=""
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-900">
                      Email Address
                    </label>
                    <Input
                      type="email"
                      value={profileData.email}
                      onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                      placeholder="Enter your email"
                      className=""
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-900">
                      Phone Number
                    </label>
                    <Input
                      type="tel"
                      value={profileData.phone}
                      onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                      placeholder="Enter phone number"
                      className=""
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-900">
                      Role
                    </label>
                    <Input
                      type="text"
                      value={profileData.role}
                      disabled
                      className="bg-gray-100 cursor-not-allowed"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-2 text-gray-900">
                      Business Name
                    </label>
                    <Input
                      type="text"
                      value={profileData.businessName}
                      onChange={(e) => setProfileData({ ...profileData, businessName: e.target.value })}
                      placeholder="Enter business name"
                      className=""
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-2 text-gray-900">
                      Business Address
                    </label>
                    <textarea
                      value={profileData.businessAddress}
                      onChange={(e) => setProfileData({ ...profileData, businessAddress: e.target.value })}
                      placeholder="Enter business address"
                      rows="3"
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2.5 rounded-lg font-medium text-white transition-all duration-200 disabled:opacity-50"
                    style={{ backgroundColor: '#492273' }}
                    onMouseEnter={(e) => !loading && (e.currentTarget.style.backgroundColor = '#5a2d87')}
                    onMouseLeave={(e) => !loading && (e.currentTarget.style.backgroundColor = '#492273')}
                  >
                    {loading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Security Section */}
          {activeSection === 'security' && (
            <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <LockIcon className={`w-6 h-6 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`} />
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">
                      Security Settings
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">Update your password to keep your account secure</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2 px-3 py-2 bg-green-50 rounded-lg">
                  <ShieldIcon className="w-5 h-5 text-green-600" />
                  <span className="text-sm font-medium text-green-700">Secure</span>
                </div>
              </div>

              <form onSubmit={handlePasswordChange} className="space-y-6">
                {/* Current Password */}
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-900">
                    Current Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Input
                      type={showCurrentPassword ? "text" : "password"}
                      value={securityData.currentPassword}
                      onChange={(e) => setSecurityData({ ...securityData, currentPassword: e.target.value })}
                      placeholder="Enter your current password"
                      className=""
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showCurrentPassword ? (
                        <EyeOffIcon className="w-5 h-5" />
                      ) : (
                        <EyeIcon className="w-5 h-5" />
                      )}
                    </button>
                    {securityErrors.current && (
                      <p className="mt-2 text-sm text-red-600">{securityErrors.current}</p>
                    )}
                  </div>
                </div>

                {/* New Password */}
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-900">
                    New Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Input
                      type={showNewPassword ? "text" : "password"}
                      value={securityData.newPassword}
                      onChange={(e) => {
                        const next = e.target.value;
                        setSecurityData({ ...securityData, newPassword: next });
                        const hasUpper = /[A-Z]/.test(next);
                        const hasLower = /[a-z]/.test(next);
                        const errors = { ...securityErrors };
                        if (next.length < 6) {
                          errors.new = 'Password must be at least 6 characters.';
                        } else if (!(hasUpper && hasLower)) {
                          errors.new = 'Use a mix of uppercase and lowercase letters.';
                        } else {
                          errors.new = '';
                        }
                        // Soft hints for recommended rules
                        errors.newHint = {
                          hasNumber: /[0-9]/.test(next),
                          hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(next)
                        };
                        setSecurityErrors(errors);
                      }}
                      placeholder="Enter new password"
                      className=""
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showNewPassword ? (
                        <EyeOffIcon className="w-5 h-5" />
                      ) : (
                        <EyeIcon className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                  {securityErrors.new && (
                    <p className="mt-2 text-sm text-red-600">{securityErrors.new}</p>
                  )}
                  {/* Password Strength Indicator */}
                  {securityData.newPassword && (
                    <div className="mt-2">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-gray-600">Password Strength:</span>
                        <span className={`text-xs font-medium ${
                          securityData.newPassword.length < 6 ? 'text-red-600' :
                          securityData.newPassword.length < 10 ? 'text-yellow-600' : 'text-green-600'
                        }`}>
                          {securityData.newPassword.length < 6 ? 'Weak' :
                           securityData.newPassword.length < 10 ? 'Medium' : 'Strong'}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all duration-300 ${
                            securityData.newPassword.length < 6 ? 'bg-red-500 w-1/3' :
                            securityData.newPassword.length < 10 ? 'bg-yellow-500 w-2/3' : 'bg-green-500 w-full'
                          }`}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-900">
                    Confirm New Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Input
                      type={showConfirmPassword ? "text" : "password"}
                      value={securityData.confirmPassword}
                      onChange={(e) => {
                        const value = e.target.value;
                        setSecurityData({ ...securityData, confirmPassword: value });
                        if (value && value !== securityData.newPassword) {
                          setSecurityErrors((prev) => ({ ...prev, confirm: 'Passwords do not match.' }));
                        } else {
                          setSecurityErrors((prev) => ({ ...prev, confirm: '' }));
                        }
                      }}
                      placeholder="Confirm new password"
                      className=""
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showConfirmPassword ? (
                        <EyeOffIcon className="w-5 h-5" />
                      ) : (
                        <EyeIcon className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                  {securityErrors.confirm && (
                    <p className="mt-2 text-sm text-red-600">{securityErrors.confirm}</p>
                  )}
                  {/* Password Match Indicator */}
                  {securityData.confirmPassword && (
                    <div className="mt-2 flex items-center space-x-2">
                      {securityData.newPassword === securityData.confirmPassword ? (
                        <>
                          <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          <span className="text-xs text-green-600 font-medium">Passwords match</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                          </svg>
                          <span className="text-xs text-red-600 font-medium">Passwords do not match</span>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* Password Requirements */}
                <div className="p-4 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200">
                  <div className="flex items-start space-x-3">
                    <ShieldIcon className="w-5 h-5 mt-0.5 text-blue-600" />
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 mb-3">
                        Password Requirements
                      </h4>
                      <ul className="space-y-2 text-sm text-gray-600">
                        <li className="flex items-center space-x-2">
                          <span className={`w-4 h-4 rounded-full flex items-center justify-center ${
                            securityData.newPassword.length >= 6 ? 'bg-green-500' : 'bg-gray-300'
                          }`}>
                            {securityData.newPassword.length >= 6 && (
                              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            )}
                          </span>
                          <span>At least 6 characters long</span>
                        </li>
                        <li className="flex items-center space-x-2">
                          <span className={`w-4 h-4 rounded-full flex items-center justify-center ${
                            /[A-Z]/.test(securityData.newPassword) && /[a-z]/.test(securityData.newPassword) ? 'bg-green-500' : 'bg-gray-300'
                          }`}>
                            {/[A-Z]/.test(securityData.newPassword) && /[a-z]/.test(securityData.newPassword) && (
                              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            )}
                          </span>
                          <span>Mix of uppercase and lowercase letters</span>
                        </li>
                        <li className="flex items-center space-x-2">
                          <span className={`w-4 h-4 rounded-full flex items-center justify-center ${
                            /[0-9]/.test(securityData.newPassword) ? 'bg-green-500' : 'bg-gray-300'
                          }`}>
                            {/[0-9]/.test(securityData.newPassword) && (
                              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            )}
                          </span>
                          <span>Contains numbers (recommended)</span>
                        </li>
                        <li className="flex items-center space-x-2">
                          <span className={`w-4 h-4 rounded-full flex items-center justify-center ${
                            /[!@#$%^&*(),.?":{}|<>]/.test(securityData.newPassword) ? 'bg-green-500' : 'bg-gray-300'
                          }`}>
                            {/[!@#$%^&*(),.?":{}|<>]/.test(securityData.newPassword) && (
                              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            )}
                          </span>
                          <span>Special characters for better security (recommended)</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => {
                      setSecurityData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                      setSecurityErrors({ current: '', new: '', confirm: '' });
                    }}
                    className="px-4 py-2 text-gray-600 hover:text-gray-900 font-medium transition-colors"
                    disabled={loading}
                  >
                    Clear Fields
                  </button>
                  <button
                    type="submit"
                    disabled={loading || !securityData.currentPassword || !securityData.newPassword || !securityData.confirmPassword}
                    className="px-8 py-3 rounded-lg font-semibold text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl flex items-center space-x-2"
                    style={{ backgroundColor: '#492273' }}
                    onMouseEnter={(e) => !loading && (e.currentTarget.style.backgroundColor = '#5a2d87')}
                    onMouseLeave={(e) => !loading && (e.currentTarget.style.backgroundColor = '#492273')}
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>Changing Password...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        <span>Change Password</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Appearance Section */}
          {activeSection === 'appearance' && (
            <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
              <div className="flex items-center space-x-3 mb-6">
                <PaletteIcon className={`w-6 h-6 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`} />
                <h3 className="text-xl font-bold text-gray-900">
                  Appearance & Localization
                </h3>
              </div>

              <div className="space-y-6">

                <div>
                  <label className="block text-sm font-medium mb-3 text-gray-900">
                    Theme
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    {['light', 'dark'].map((theme) => (
                      <button
                        key={theme}
                        type="button"
                        onClick={() => {
                          applySettings({ ...appearance, theme });
                          showToast(`Theme changed to ${theme}`, 'success');
                        }}
                        className={`p-4 rounded-lg border-2 transition-all duration-200 relative ${
                          appearance.theme === theme
                            ? 'border-purple-600 shadow-lg'
                            : darkMode
                            ? 'border-gray-600 hover:border-gray-500'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                        style={appearance.theme === theme ? { borderColor: '#492273', backgroundColor: 'rgba(73, 34, 115, 0.05)' } : {}}
                      >
                        {appearance.theme === theme && (
                          <div className="absolute top-2 right-2">
                            <svg className="w-5 h-5 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}
                        <div className="flex items-center space-x-3 text-gray-900">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-2xl ${
                            theme === 'light' ? 'bg-white border border-gray-300' : 'bg-gray-800'
                          }`}>
                            {theme === 'light' ? '☀️' : '🌙'}
                          </div>
                          <span className="font-medium capitalize">{theme}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-900">
                    {t('appearance.language', appearance.language)}
                  </label>
                  <select
                    value={appearance.language}
                    onChange={(e) => {
                      const lang = e.target.value;
                      applySettings({ ...appearance, language: lang });
                      const langNames = { en: 'English', es: 'Español', fr: 'Français', de: 'Deutsch', zh: '中文' };
                      showToast(`Language changed to ${langNames[lang] || lang}`, 'success');
                    }}
                    className="w-full px-4 py-2 rounded-lg border bg-white border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
                  >
                    <option value="en">English</option>
                    <option value="es">Español</option>
                    <option value="fr">Français</option>
                    <option value="de">Deutsch</option>
                    <option value="zh">中文</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-900">
                    Timezone
                  </label>
                  <select
                    value={appearance.timezone}
                    onChange={(e) => {
                      const tz = e.target.value;
                      applySettings({ ...appearance, timezone: tz });
                      showToast(`Timezone changed to ${tz}`, 'success');
                    }}
                    className="w-full px-4 py-2 rounded-lg border bg-white border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
                  >
                    <option value="UTC">UTC</option>
                    <optgroup label="North America">
                      <option value="America/New_York">Eastern Time (ET)</option>
                      <option value="America/Chicago">Central Time (CT)</option>
                      <option value="America/Denver">Mountain Time (MT)</option>
                      <option value="America/Los_Angeles">Pacific Time (PT)</option>
                      <option value="America/Anchorage">Alaska Time (AKT)</option>
                      <option value="Pacific/Honolulu">Hawaii Time (HST)</option>
                      <option value="America/Toronto">Toronto</option>
                      <option value="America/Vancouver">Vancouver</option>
                      <option value="America/Mexico_City">Mexico City</option>
                    </optgroup>
                    <optgroup label="Europe">
                      <option value="Europe/London">London (GMT)</option>
                      <option value="Europe/Paris">Paris (CET)</option>
                      <option value="Europe/Berlin">Berlin (CET)</option>
                      <option value="Europe/Rome">Rome (CET)</option>
                      <option value="Europe/Madrid">Madrid (CET)</option>
                      <option value="Europe/Amsterdam">Amsterdam (CET)</option>
                      <option value="Europe/Brussels">Brussels (CET)</option>
                      <option value="Europe/Vienna">Vienna (CET)</option>
                      <option value="Europe/Stockholm">Stockholm (CET)</option>
                      <option value="Europe/Moscow">Moscow (MSK)</option>
                      <option value="Europe/Istanbul">Istanbul (TRT)</option>
                    </optgroup>
                    <optgroup label="Asia">
                      <option value="Asia/Dubai">Dubai (GST)</option>
                      <option value="Asia/Karachi">Karachi (PKT)</option>
                      <option value="Asia/Kolkata">India (IST)</option>
                      <option value="Asia/Dhaka">Dhaka (BST)</option>
                      <option value="Asia/Bangkok">Bangkok (ICT)</option>
                      <option value="Asia/Singapore">Singapore (SGT)</option>
                      <option value="Asia/Hong_Kong">Hong Kong (HKT)</option>
                      <option value="Asia/Shanghai">Shanghai (CST)</option>
                      <option value="Asia/Tokyo">Tokyo (JST)</option>
                      <option value="Asia/Seoul">Seoul (KST)</option>
                    </optgroup>
                    <optgroup label="Australia & Pacific">
                      <option value="Australia/Perth">Perth (AWST)</option>
                      <option value="Australia/Adelaide">Adelaide (ACST)</option>
                      <option value="Australia/Brisbane">Brisbane (AEST)</option>
                      <option value="Australia/Sydney">Sydney (AEST)</option>
                      <option value="Australia/Melbourne">Melbourne (AEST)</option>
                      <option value="Pacific/Auckland">Auckland (NZST)</option>
                    </optgroup>
                    <optgroup label="Africa">
                      <option value="Africa/Cairo">Cairo (EET)</option>
                      <option value="Africa/Johannesburg">Johannesburg (SAST)</option>
                      <option value="Africa/Lagos">Lagos (WAT)</option>
                      <option value="Africa/Nairobi">Nairobi (EAT)</option>
                    </optgroup>
                    <optgroup label="South America">
                      <option value="America/Sao_Paulo">São Paulo (BRT)</option>
                      <option value="America/Buenos_Aires">Buenos Aires (ART)</option>
                      <option value="America/Santiago">Santiago (CLT)</option>
                      <option value="America/Lima">Lima (PET)</option>
                      <option value="America/Bogota">Bogotá (COT)</option>
                    </optgroup>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-900">
                    Date Format
                  </label>
                  <select
                    value={appearance.dateFormat}
                    onChange={(e) => {
                      const format = e.target.value;
                      applySettings({ ...appearance, dateFormat: format });
                      showToast(`Date format changed to ${format}`, 'success');
                    }}
                    className="w-full px-4 py-2 rounded-lg border bg-white border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
                  >
                    <option value="MM/DD/YYYY">MM/DD/YYYY (e.g., 12/13/2025)</option>
                    <option value="DD/MM/YYYY">DD/MM/YYYY (e.g., 13/12/2025)</option>
                    <option value="YYYY-MM-DD">YYYY-MM-DD (e.g., 2025-12-13)</option>
                  </select>
                </div>

                {/* Save Button with indicator */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-600">
                    {t('appearance.synchint', appearance.language)}
                  </p>
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={handleAppearanceUpdate}
                      disabled={loading}
                      className="px-8 py-3 rounded-lg font-semibold text-white transition-all duration-200 disabled:opacity-50 shadow-lg hover:shadow-xl flex items-center space-x-2"
                      style={{ backgroundColor: '#492273' }}
                      onMouseEnter={(e) => !loading && (e.currentTarget.style.backgroundColor = '#5a2d87')}
                      onMouseLeave={(e) => !loading && (e.currentTarget.style.backgroundColor = '#492273')}
                    >
                      {loading ? (
                        <>
                          <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <span>Saving...</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span>Save Settings</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
