import React from 'react';

export default function ConfirmCancelModal({ open, onClose, onConfirm, darkMode, loading = false }) {
  if (!open) return null;
  
  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center bg-black/40`}>
      <div className={`rounded-xl shadow-xl p-8 w-full max-w-sm border ${
        darkMode 
          ? 'bg-gray-900 border-gray-700' 
          : 'bg-white border-gray-200'
      }`}>
        <div className="flex items-center justify-center mb-4">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
            darkMode
              ? 'bg-red-900/30'
              : 'bg-red-100'
          }`}>
            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4v2m0 4v2m0-12a9 9 0 110-18 9 9 0 010 18z" />
            </svg>
          </div>
        </div>
        
        <h2 className={`text-xl font-semibold text-center mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          Cancel Order?
        </h2>
        <p className={`text-center text-sm mb-6 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          Are you sure you want to cancel this order? This action cannot be undone.
        </p>
        
        <div className="flex gap-3">
          <button
            className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
              darkMode
                ? 'border-gray-600 bg-gray-800 text-gray-200 hover:bg-gray-700'
                : 'border-gray-300 bg-gray-100 text-gray-700 hover:bg-gray-200'
            } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            onClick={!loading ? onClose : undefined}
            disabled={loading}
          >
            {loading ? 'Please wait…' : 'No, Go Back'}
          </button>
          <button
            className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
              darkMode
                ? 'border-red-600 bg-red-600 text-white hover:bg-red-700'
                : 'border-red-600 bg-red-600 text-white hover:bg-red-700'
            } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            onClick={!loading ? onConfirm : undefined}
            disabled={loading}
          >
            {loading ? 'Cancelling…' : 'Yes, Cancel Order'}
          </button>
        </div>
      </div>
    </div>
  );
}
