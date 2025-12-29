/**
 * Terms of Service Component
 * Comprehensive terms and conditions for the e-commerce platform
 */

import React from 'react';
import Button from '../common/Button';

const TermsOfService = ({ onClose }) => {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-cream rounded-lg shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 px-8 py-6">
          <h1 className="text-3xl font-bold text-white">Terms of Service</h1>
          <p className="text-indigo-100 mt-2">
            Last updated: November 27, 2025
          </p>
        </div>

        {/* Content */}
        <div className="px-8 py-8 space-y-8">
          {/* Introduction */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              1. Agreement to Terms
            </h2>
            <p className="text-gray-700 leading-relaxed">
              These Terms of Service ("Terms") constitute a legally binding agreement
              between you and ShopHub ("Company," "we," "us," or "our") concerning
              your access to and use of our website and services.
            </p>
            <p className="text-gray-700 leading-relaxed mt-3">
              By accessing or using our website, you agree that you have read,
              understood, and agree to be bound by these Terms. If you do not agree
              with these Terms, you are prohibited from using or accessing this
              website.
            </p>
          </section>

          {/* Eligibility */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              2. Eligibility
            </h2>
            <p className="text-gray-700 leading-relaxed">
              By using our services, you represent and warrant that:
            </p>
            <ul className="list-disc list-inside text-gray-700 mt-2 space-y-2 ml-4">
              <li>You are at least 13 years of age</li>
              <li>
                If you are under 18, you have obtained parental or guardian consent
              </li>
              <li>You have the legal capacity to enter into binding contracts</li>
              <li>
                You will not use the website for any illegal or unauthorized purpose
              </li>
              <li>
                Your use of the website will not violate any applicable law or
                regulation
              </li>
            </ul>
          </section>

          {/* User Accounts */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              3. User Accounts
            </h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Account Creation
                </h3>
                <p className="text-gray-700 leading-relaxed">
                  To use certain features, you must create an account. You agree to:
                </p>
                <ul className="list-disc list-inside text-gray-700 mt-2 space-y-1 ml-4">
                  <li>Provide accurate and complete information</li>
                  <li>Maintain and update your information</li>
                  <li>Keep your password secure and confidential</li>
                  <li>Notify us immediately of any unauthorized access</li>
                  <li>Accept responsibility for all activities under your account</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Account Termination
                </h3>
                <p className="text-gray-700 leading-relaxed">
                  We reserve the right to suspend or terminate your account at any
                  time for violations of these Terms, illegal activities, or at our
                  discretion.
                </p>
              </div>
            </div>
          </section>

          {/* Purchases and Payments */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              4. Purchases and Payments
            </h2>
            <div className="space-y-3">
              <p className="text-gray-700 leading-relaxed">
                <strong>Pricing:</strong> All prices are in the currency specified
                and are subject to change without notice. We reserve the right to
                correct any pricing errors.
              </p>
              <p className="text-gray-700 leading-relaxed">
                <strong>Payment:</strong> We accept various payment methods as
                displayed at checkout. By providing payment information, you
                represent that you are authorized to use the payment method.
              </p>
              <p className="text-gray-700 leading-relaxed">
                <strong>Order Acceptance:</strong> We reserve the right to refuse or
                cancel any order for any reason, including product availability,
                errors in pricing, or suspected fraud.
              </p>
              <p className="text-gray-700 leading-relaxed">
                <strong>Taxes:</strong> You are responsible for any applicable taxes,
                duties, or customs fees.
              </p>
            </div>
          </section>

          {/* Shipping and Delivery */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              5. Shipping and Delivery
            </h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              Shipping terms and delivery times:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>
                Delivery times are estimates and not guaranteed
              </li>
              <li>
                Title and risk of loss pass to you upon delivery to the carrier
              </li>
              <li>
                You must provide accurate shipping information
              </li>
              <li>
                We are not responsible for delays caused by customs or carriers
              </li>
              <li>
                International orders may be subject to additional fees and delays
              </li>
            </ul>
          </section>

          {/* Returns and Refunds */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              6. Returns and Refunds
            </h2>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
              <p className="text-gray-700 leading-relaxed">
                <strong>Return Period:</strong> You may return most items within 30
                days of receipt for a full refund.
              </p>
              <p className="text-gray-700 leading-relaxed">
                <strong>Conditions:</strong> Items must be unused, in original
                packaging, and in resalable condition.
              </p>
              <p className="text-gray-700 leading-relaxed">
                <strong>Non-Returnable Items:</strong> Certain items cannot be
                returned, including perishable goods, personal care items, and custom
                products.
              </p>
              <p className="text-gray-700 leading-relaxed">
                <strong>Refund Processing:</strong> Refunds will be issued to the
                original payment method within 5-10 business days after we receive
                and inspect the return.
              </p>
            </div>
          </section>

          {/* Intellectual Property */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              7. Intellectual Property Rights
            </h2>
            <p className="text-gray-700 leading-relaxed">
              All content on this website, including text, graphics, logos, images,
              and software, is the property of ShopHub or its licensors and is
              protected by copyright, trademark, and other intellectual property
              laws.
            </p>
            <p className="text-gray-700 leading-relaxed mt-3">
              You may not reproduce, distribute, modify, or create derivative works
              without our express written permission.
            </p>
          </section>

          {/* User Content */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              8. User-Generated Content
            </h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              When you submit reviews, comments, or other content, you grant us:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>
                A worldwide, non-exclusive, royalty-free license to use, reproduce,
                and display your content
              </li>
              <li>
                The right to moderate, edit, or remove content at our discretion
              </li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-3">
              You agree not to submit content that is illegal, offensive, defamatory,
              or infringes on others' rights.
            </p>
          </section>

          {/* Prohibited Activities */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              9. Prohibited Activities
            </h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              You may not:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>Use the website for any illegal purpose</li>
              <li>Attempt to gain unauthorized access to our systems</li>
              <li>Interfere with the proper functioning of the website</li>
              <li>Impersonate any person or entity</li>
              <li>Transmit viruses or malicious code</li>
              <li>Scrape or harvest data from the website</li>
              <li>Use automated systems to access the website</li>
              <li>Engage in any fraudulent activities</li>
            </ul>
          </section>

          {/* Disclaimer of Warranties */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              10. Disclaimer of Warranties
            </h2>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-gray-700 leading-relaxed">
                THE WEBSITE AND SERVICES ARE PROVIDED "AS IS" AND "AS AVAILABLE"
                WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED. WE DO NOT
                WARRANT THAT THE WEBSITE WILL BE UNINTERRUPTED, ERROR-FREE, OR FREE
                FROM VIRUSES.
              </p>
            </div>
          </section>

          {/* Limitation of Liability */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              11. Limitation of Liability
            </h2>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-gray-700 leading-relaxed">
                TO THE MAXIMUM EXTENT PERMITTED BY LAW, SHOPHUB SHALL NOT BE LIABLE
                FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE
                DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES, WHETHER INCURRED
                DIRECTLY OR INDIRECTLY.
              </p>
            </div>
          </section>

          {/* Indemnification */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              12. Indemnification
            </h2>
            <p className="text-gray-700 leading-relaxed">
              You agree to indemnify and hold harmless ShopHub and its officers,
              directors, employees, and agents from any claims, liabilities, damages,
              and expenses arising from your use of the website or violation of these
              Terms.
            </p>
          </section>

          {/* Governing Law */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              13. Governing Law
            </h2>
            <p className="text-gray-700 leading-relaxed">
              These Terms shall be governed by and construed in accordance with the
              laws of Pakistan. Any disputes shall be resolved in the courts of
              Karachi, Pakistan.
            </p>
          </section>

          {/* Changes to Terms */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              14. Changes to Terms
            </h2>
            <p className="text-gray-700 leading-relaxed">
              We reserve the right to modify these Terms at any time. Changes will be
              effective immediately upon posting. Your continued use of the website
              after changes constitutes acceptance of the modified Terms.
            </p>
          </section>

          {/* Contact Information */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              15. Contact Us
            </h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              For questions about these Terms, please contact us:
            </p>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-2">
              <p className="text-gray-700">
                <strong>Email:</strong>{' '}
                <a
                  href="mailto:legal@shophub.com"
                  className="text-indigo-600 hover:underline"
                >
                  legal@shophub.com
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

          {/* Acknowledgment */}
          <section className="bg-indigo-50 border border-indigo-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-indigo-900 mb-2">
              Acknowledgment
            </h3>
            <p className="text-indigo-800 leading-relaxed">
              BY USING OUR WEBSITE AND SERVICES, YOU ACKNOWLEDGE THAT YOU HAVE READ
              THESE TERMS OF SERVICE AND AGREE TO BE BOUND BY THEM.
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

export default TermsOfService;
