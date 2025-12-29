/**
 * Privacy Policy Component
 * Comprehensive privacy policy for the e-commerce platform
 */

import React from 'react';
import Button from '../common/Button';

const PrivacyPolicy = ({ onClose }) => {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-cream rounded-lg shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-6">
          <h1 className="text-3xl font-bold text-white">Privacy Policy</h1>
          <p className="text-blue-100 mt-2">
            Last updated: November 27, 2025
          </p>
        </div>

        {/* Content */}
        <div className="px-8 py-8 space-y-8">
          {/* Introduction */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              1. Introduction
            </h2>
            <p className="text-gray-700 leading-relaxed">
              Welcome to ShopHub ("we," "our," or "us"). We are committed to
              protecting your personal information and your right to privacy. This
              Privacy Policy explains how we collect, use, disclose, and safeguard
              your information when you visit our website and use our services.
            </p>
            <p className="text-gray-700 leading-relaxed mt-3">
              Please read this privacy policy carefully. If you do not agree with
              the terms of this privacy policy, please do not access the site.
            </p>
          </section>

          {/* Information We Collect */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              2. Information We Collect
            </h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Personal Information
                </h3>
                <p className="text-gray-700 leading-relaxed">
                  We collect personal information that you voluntarily provide to
                  us when you register on the platform, make a purchase, or contact
                  us. This includes:
                </p>
                <ul className="list-disc list-inside text-gray-700 mt-2 space-y-1 ml-4">
                  <li>Full name</li>
                  <li>Email address</li>
                  <li>Phone number</li>
                  <li>Shipping and billing addresses</li>
                  <li>Payment information (processed securely)</li>
                  <li>Account credentials</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Automatically Collected Information
                </h3>
                <p className="text-gray-700 leading-relaxed">
                  When you visit our website, we automatically collect certain
                  information about your device, including:
                </p>
                <ul className="list-disc list-inside text-gray-700 mt-2 space-y-1 ml-4">
                  <li>IP address</li>
                  <li>Browser type and version</li>
                  <li>Operating system</li>
                  <li>Pages visited and time spent</li>
                  <li>Referring website addresses</li>
                  <li>Cookies and similar tracking technologies</li>
                </ul>
              </div>
            </div>
          </section>

          {/* How We Use Your Information */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              3. How We Use Your Information
            </h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              We use the information we collect or receive:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>To facilitate account creation and authentication</li>
              <li>To process your orders and manage payments</li>
              <li>To send you order confirmations and updates</li>
              <li>To provide customer support</li>
              <li>To send marketing and promotional communications (with your consent)</li>
              <li>To improve our website and services</li>
              <li>To analyze usage patterns and trends</li>
              <li>To prevent fraudulent transactions and protect against security threats</li>
              <li>To comply with legal obligations</li>
            </ul>
          </section>

          {/* Information Sharing */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              4. Sharing Your Information
            </h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              We may share your information with:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>
                <strong>Service Providers:</strong> Third-party vendors who perform
                services on our behalf (payment processing, shipping, email delivery)
              </li>
              <li>
                <strong>Business Transfers:</strong> In connection with any merger,
                sale, or acquisition of our business
              </li>
              <li>
                <strong>Legal Requirements:</strong> When required by law or to
                protect our rights
              </li>
              <li>
                <strong>With Your Consent:</strong> When you explicitly agree to
                share information
              </li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-3">
              We do not sell your personal information to third parties.
            </p>
          </section>

          {/* Data Security */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              5. Data Security
            </h2>
            <p className="text-gray-700 leading-relaxed">
              We implement appropriate technical and organizational security measures
              to protect your personal information against unauthorized access,
              alteration, disclosure, or destruction. These include:
            </p>
            <ul className="list-disc list-inside text-gray-700 mt-2 space-y-1 ml-4">
              <li>SSL/TLS encryption for data transmission</li>
              <li>Secure password storage with encryption</li>
              <li>Regular security audits and updates</li>
              <li>Access controls and authentication</li>
              <li>Secure payment processing through trusted providers</li>
            </ul>
          </section>

          {/* Your Privacy Rights */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              6. Your Privacy Rights
            </h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              Depending on your location, you may have the following rights:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>Right to access your personal information</li>
              <li>Right to correct inaccurate information</li>
              <li>Right to delete your personal information</li>
              <li>Right to restrict or object to processing</li>
              <li>Right to data portability</li>
              <li>Right to withdraw consent</li>
              <li>Right to opt-out of marketing communications</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-3">
              To exercise these rights, please contact us using the information
              provided below.
            </p>
          </section>

          {/* Cookies */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              7. Cookies and Tracking Technologies
            </h2>
            <p className="text-gray-700 leading-relaxed">
              We use cookies and similar tracking technologies to track activity on
              our website and store certain information. You can instruct your
              browser to refuse all cookies or to indicate when a cookie is being
              sent. However, if you do not accept cookies, you may not be able to
              use some portions of our website.
            </p>
          </section>

          {/* Children's Privacy */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              8. Children's Privacy
            </h2>
            <p className="text-gray-700 leading-relaxed">
              Our services are not intended for individuals under the age of 13. We
              do not knowingly collect personal information from children under 13.
              If you become aware that a child has provided us with personal
              information, please contact us immediately.
            </p>
          </section>

          {/* Changes to Policy */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              9. Changes to This Privacy Policy
            </h2>
            <p className="text-gray-700 leading-relaxed">
              We may update our Privacy Policy from time to time. We will notify you
              of any changes by posting the new Privacy Policy on this page and
              updating the "Last updated" date. You are advised to review this
              Privacy Policy periodically for any changes.
            </p>
          </section>

          {/* Contact Us */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              10. Contact Us
            </h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              If you have any questions or concerns about this Privacy Policy, please
              contact us:
            </p>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-2">
              <p className="text-gray-700">
                <strong>Email:</strong>{' '}
                <a
                  href="mailto:privacy@shophub.com"
                  className="text-blue-600 hover:underline"
                >
                  privacy@shophub.com
                </a>
              </p>
              <p className="text-gray-700">
                <strong>Phone:</strong> +92 300 1234567
              </p>
              <p className="text-gray-700">
                <strong>Address:</strong> 123 Commerce Street, Karachi, Pakistan
              </p>
            </div>
          </section>

          {/* Consent */}
          <section className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">
              Your Consent
            </h3>
            <p className="text-blue-800 leading-relaxed">
              By using our website and services, you consent to our Privacy Policy
              and agree to its terms. If you do not agree with this policy, please do
              not use our services.
            </p>
          </section>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-8 py-6 border-t border-gray-200">
          {onClose && (
            <Button onClick={onClose} variant="outline" className="w-full sm:w-auto">
              Close
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
