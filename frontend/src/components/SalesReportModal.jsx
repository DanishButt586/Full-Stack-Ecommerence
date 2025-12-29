import React, { useState, useEffect, useCallback } from 'react';
import reportService from '../services/reportService';

const SalesReportModal = ({ isOpen, onClose, settings }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [reportData, setReportData] = useState(null);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [status, setStatus] = useState('all');

    const isDarkMode = settings?.theme === 'dark';

    const fetchReport = useCallback(async () => {
        try {
            setLoading(true);
            setError('');
            const data = await reportService.getSalesReport(startDate, endDate, status);
            setReportData(data.data);
        } catch (err) {
            console.error('🔴 Report Error:', err);
            // Handle both error object structures
            let errorMessage = 'Failed to generate sales report';
            if (typeof err === 'object') {
                errorMessage = err.message || err.data?.message || JSON.stringify(err);
            } else {
                errorMessage = String(err);
            }
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    }, [startDate, endDate, status]);

    useEffect(() => {
        if (isOpen && !reportData) {
            fetchReport();
        }
    }, [isOpen, reportData, fetchReport]);

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-PK', {
            style: 'currency',
            currency: 'PKR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const formatDate = (date) => {
        return new Intl.DateTimeFormat('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        }).format(new Date(date));
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center overflow-y-auto">
            <div className={`rounded-2xl shadow-2xl max-w-6xl w-full mx-4 my-8 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                {/* Header */}
                <div className={`flex items-center justify-between p-6 border-b ${isDarkMode ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-white'}`}>
                    <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>📊 Sales Report</h2>
                    <button
                        onClick={onClose}
                        className={`text-2xl font-bold transition-colors ${isDarkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                        ✕
                    </button>
                </div>

                {/* Filters */}
                <div className={`p-6 border-b ${isDarkMode ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-gray-50'}`}>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                        <div>
                            <label className={`block text-sm font-semibold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Start Date</label>
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                            />
                        </div>
                        <div>
                            <label className={`block text-sm font-semibold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>End Date</label>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                            />
                        </div>
                        <div>
                            <label className={`block text-sm font-semibold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Status</label>
                            <select
                                value={status}
                                onChange={(e) => setStatus(e.target.value)}
                                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                            >
                                <option value="all">All Orders</option>
                                <option value="pending">Pending</option>
                                <option value="processing">Processing</option>
                                <option value="shipped">Shipped</option>
                                <option value="delivered">Delivered</option>
                                <option value="cancelled">Cancelled</option>
                            </select>
                        </div>
                        <button
                            onClick={fetchReport}
                            disabled={loading}
                            className={`w-full px-4 py-2 font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                                isDarkMode 
                                    ? 'bg-indigo-600 hover:bg-indigo-700 text-white' 
                                    : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                            }`}
                        >
                            {loading ? 'Generating...' : 'Generate'}
                        </button>
                    </div>
                </div>

                {/* Error Message */}
                {error && (
                    <div className={`p-4 m-4 border rounded-lg ${isDarkMode ? 'bg-red-900 border-red-700 text-red-200' : 'bg-red-50 border-red-200 text-red-700'}`}>
                        {error}
                    </div>
                )}

                {/* Content */}
                {reportData && !loading && (
                    <div className="p-6 space-y-6">
                        {/* Summary Cards */}
                        <div>
                            <h3 className={`text-lg font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>📊 Summary Overview</h3>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div className={`p-6 rounded-xl border ${isDarkMode ? 'bg-gradient-to-br from-blue-900 to-blue-800 border-blue-700' : 'bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200'}`}>
                                    <p className={`text-sm font-semibold mb-1 ${isDarkMode ? 'text-blue-300' : 'text-blue-600'}`}>Total Orders</p>
                                    <p className={`text-3xl font-bold ${isDarkMode ? 'text-blue-100' : 'text-blue-900'}`}>{reportData.summary.totalOrders}</p>
                                </div>
                                <div className={`p-6 rounded-xl border ${isDarkMode ? 'bg-gradient-to-br from-green-900 to-green-800 border-green-700' : 'bg-gradient-to-br from-green-50 to-green-100 border-green-200'}`}>
                                    <p className={`text-sm font-semibold mb-1 ${isDarkMode ? 'text-green-300' : 'text-green-600'}`}>Total Revenue</p>
                                    <p className={`text-3xl font-bold ${isDarkMode ? 'text-green-100' : 'text-green-900'}`}>{formatCurrency(reportData.summary.totalRevenue)}</p>
                                </div>
                                <div className={`p-6 rounded-xl border ${isDarkMode ? 'bg-gradient-to-br from-purple-900 to-purple-800 border-purple-700' : 'bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200'}`}>
                                    <p className={`text-sm font-semibold mb-1 ${isDarkMode ? 'text-purple-300' : 'text-purple-600'}`}>Items Sold</p>
                                    <p className={`text-3xl font-bold ${isDarkMode ? 'text-purple-100' : 'text-purple-900'}`}>{reportData.summary.totalItemsSold}</p>
                                </div>
                                <div className={`p-6 rounded-xl border ${isDarkMode ? 'bg-gradient-to-br from-indigo-900 to-indigo-800 border-indigo-700' : 'bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-200'}`}>
                                    <p className={`text-sm font-semibold mb-1 ${isDarkMode ? 'text-indigo-300' : 'text-indigo-600'}`}>Avg Order Value</p>
                                    <p className={`text-3xl font-bold ${isDarkMode ? 'text-indigo-100' : 'text-indigo-900'}`}>{formatCurrency(reportData.summary.averageOrderValue)}</p>
                                </div>
                            </div>
                        </div>

                        {/* Top Products Table */}
                        {reportData.topProducts && reportData.topProducts.length > 0 && (
                            <div>
                                <h3 className={`text-lg font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>🏆 Top Selling Products</h3>
                                <div className={`overflow-x-auto rounded-lg border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                                    <table className="w-full text-sm">
                                        <thead className={`${isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-gray-50 border-gray-200'} border-b`}>
                                            <tr>
                                                <th className={`px-4 py-3 text-left font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Rank</th>
                                                <th className={`px-4 py-3 text-left font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Product</th>
                                                <th className={`px-4 py-3 text-left font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>SKU</th>
                                                <th className={`px-4 py-3 text-right font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Quantity Sold</th>
                                                <th className={`px-4 py-3 text-right font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Revenue</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {reportData.topProducts.map((product, idx) => (
                                                <tr key={idx} className={`border-b ${isDarkMode ? 'border-gray-700 hover:bg-gray-900' : 'border-gray-100 hover:bg-gray-50'}`}>
                                                    <td className={`px-4 py-3 font-bold ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>#{idx + 1}</td>
                                                    <td className={`px-4 py-3 font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>{product.productName}</td>
                                                    <td className={`px-4 py-3 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{product.productSku || 'N/A'}</td>
                                                    <td className={`px-4 py-3 text-right font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{product.totalQuantity}</td>
                                                    <td className={`px-4 py-3 text-right font-bold ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>{formatCurrency(product.totalRevenue)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* Daily Sales Table */}
                        {reportData.dailySales && reportData.dailySales.length > 0 && (
                            <div>
                                <h3 className={`text-lg font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>📅 Daily Sales Breakdown</h3>
                                <div className={`overflow-x-auto rounded-lg border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                                    <table className="w-full text-sm">
                                        <thead className={`${isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-gray-50 border-gray-200'} border-b`}>
                                            <tr>
                                                <th className={`px-4 py-3 text-left font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Date</th>
                                                <th className={`px-4 py-3 text-center font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Orders</th>
                                                <th className={`px-4 py-3 text-right font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Items Sold</th>
                                                <th className={`px-4 py-3 text-right font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Revenue</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {reportData.dailySales.map((day, idx) => (
                                                <tr key={idx} className={`border-b ${isDarkMode ? 'border-gray-700 hover:bg-gray-900' : 'border-gray-100 hover:bg-gray-50'}`}>
                                                    <td className={`px-4 py-3 font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>{formatDate(day.date)}</td>
                                                    <td className={`px-4 py-3 text-center ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{day.count}</td>
                                                    <td className={`px-4 py-3 text-right ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{day.items}</td>
                                                    <td className={`px-4 py-3 text-right font-semibold ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>{formatCurrency(day.revenue)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {loading && (
                    <div className="p-8 flex justify-center">
                        <div className={`animate-spin rounded-full h-12 w-12 border-b-2 ${isDarkMode ? 'border-indigo-400' : 'border-indigo-600'}`}></div>
                    </div>
                )}

                {/* Footer */}
                <div className={`flex justify-end gap-4 p-6 border-t ${isDarkMode ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-gray-50'}`}>
                    <button
                        onClick={onClose}
                        className={`px-6 py-2 font-semibold rounded-lg transition-colors ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-300 hover:bg-gray-400 text-gray-900'}`}
                    >
                        Close
                    </button>
                    <button
                        onClick={() => window.print()}
                        className={`px-6 py-2 font-semibold rounded-lg transition-colors ${
                            isDarkMode 
                                ? 'bg-indigo-600 hover:bg-indigo-700 text-white' 
                                : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                        }`}
                    >
                        Print Report
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SalesReportModal;
