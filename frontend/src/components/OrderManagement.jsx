/**
 * OrderManagement Component
 * Admin interface for managing all customer orders
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';
import Toast from './common/Toast';
import { getAllOrdersAdmin, updateOrderStatus } from '../services/checkoutService';
import { DEFAULT_SETTINGS, formatDateTimeWithSettings } from '../utils/settings';

const SOCKET_SERVER_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';

const OrderManagement = ({ darkMode, settings = DEFAULT_SETTINGS, initialOrderId }) => {
  const socketRef = useRef(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [pagination, setPagination] = useState({ 
    currentPage: 1, 
    totalPages: 1, 
    total: 0 
  });
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  const hideToast = () => {
    setToast(null);
  };

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getAllOrdersAdmin(
        pagination.currentPage, 
        20, 
        filterStatus
      );
      
      if (response.success) {
        setOrders(response.data.orders || []);
        setPagination(prev => response.data.pagination || prev);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      showToast('Failed to fetch orders', 'error');
    } finally {
      setLoading(false);
    }
  }, [pagination.currentPage, filterStatus]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Setup Socket.IO for real-time order updates
  useEffect(() => {
    if (!socketRef.current) {
      socketRef.current = io(SOCKET_SERVER_URL, {
        transports: ['websocket'],
        withCredentials: true
      });

      // Listen for order status updates
      socketRef.current.on('orderStatusUpdated', (updatedOrder) => {
        console.log('Order status updated via socket:', updatedOrder);
        
        // Update the order in the local list
        setOrders(prevOrders =>
          prevOrders.map(order =>
            order._id === updatedOrder._id ? updatedOrder : order
          )
        );
        
        // Update selected order if it's the one being updated
        if (selectedOrder && selectedOrder._id === updatedOrder._id) {
          setSelectedOrder(updatedOrder);
          showToast('Order status updated!', 'success');
        }
      });

      // Listen for new orders
      socketRef.current.on('newOrder', (newOrder) => {
        console.log('New order received via socket:', newOrder);
        // Refetch orders to show the new one
        fetchOrders();
      });
    }

    return () => {
      // Don't disconnect on unmount - keep connection alive
    };
  }, [selectedOrder, fetchOrders]);

  // Handle navigation from notification - select specific order
  useEffect(() => {
    if (initialOrderId && orders.length > 0) {
      const selectedOrderId = initialOrderId;
      console.log('Looking for order:', selectedOrderId);
      console.log('Available orders:', orders);
      
      // Try to find order in current orders list
      let order = orders.find(o => o._id === selectedOrderId);
      
      if (order) {
        console.log('Found order in list:', order);
        setSelectedOrder(order);
        // Scroll to modal
        setTimeout(() => {
          const detailsSection = document.querySelector('[data-order-details]');
          if (detailsSection) {
            detailsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 100);
      } else {
        // If order not found in list, it might be on another page
        console.log('Order not found in current page, fetching all orders...');
        // Fetch all orders without pagination to find the specific order
        getAllOrdersAdmin(1, 1000, 'all').then(response => {
          if (response.success && response.data.orders) {
            const foundOrder = response.data.orders.find(o => o._id === selectedOrderId);
            if (foundOrder) {
              console.log('Found order in full list:', foundOrder);
              setSelectedOrder(foundOrder);
              // Don't update orders list to keep current pagination
              setTimeout(() => {
                const detailsSection = document.querySelector('[data-order-details]');
                if (detailsSection) {
                  detailsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
              }, 100);
            }
          }
        }).catch(err => console.error('Error fetching all orders:', err));
      }
    }
  }, [initialOrderId, orders]);

  const handleStatusUpdate = async (orderId, newStatus) => {
    // Show confirmation dialog for cancellation
    if (newStatus === 'cancelled') {
      const confirmed = window.confirm(
        'Are you sure you want to cancel this order? This action will restore the product stock.'
      );
      if (!confirmed) {
        return;
      }
    }

    try {
      const response = await updateOrderStatus(orderId, { status: newStatus });
      if (response.success) {
        showToast(`Order status updated to ${newStatus}`, 'success');
        
        // Update the order in the local state instead of refetching all orders
        const updatedOrder = response.data.order;
        setOrders(orders.map(order => 
          order._id === orderId ? updatedOrder : order
        ));
        
        // Update selected order if it's the one being updated
        if (selectedOrder && selectedOrder._id === orderId) {
          setSelectedOrder(updatedOrder);
        }

        // Emit socket event to notify other admin users
        if (socketRef.current) {
          socketRef.current.emit('orderStatusChanged', {
            orderId: orderId,
            newStatus: newStatus,
            updatedOrder: updatedOrder
          });
        }
      } else {
        showToast(response.message || 'Failed to update order status', 'error');
      }
    } catch (error) {
      console.error('Error updating order:', error);
      showToast('Failed to update order status', 'error');
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

  const formatDate = (date) => {
    return formatDateTimeWithSettings(
      date,
      {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      },
      settings
    );
  };

  const getStatusColor = (status) => {
    const normalizedStatus = status?.toLowerCase() || '';
    switch (normalizedStatus) {
      case 'pending':
        return 'text-gray-900 border-gray-300';
      case 'processing':
      case 'confirmed':
        return darkMode ? 'bg-blue-900/30 text-blue-300 border-blue-600' : 'bg-blue-100 text-blue-800 border-blue-300';
      case 'shipping':
      case 'shipped':
        return darkMode ? 'bg-purple-900/30 text-purple-300 border-purple-600' : 'bg-purple-100 text-purple-800 border-purple-300';
      case 'delivered':
        return darkMode ? 'bg-green-900/30 text-green-300 border-green-600' : 'bg-green-100 text-green-800 border-green-300';
      case 'cancelled':
        return darkMode ? 'bg-red-900/30 text-red-300 border-red-600' : 'bg-red-100 text-red-800 border-red-300';
      default:
        return darkMode ? 'bg-gray-900/30 text-gray-300 border-gray-600' : 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order._id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.user?.email?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const getOrderStats = () => {
    return {
      total: orders.length,
      pending: orders.filter(o => ['pending', 'processing'].includes(o.orderStatus?.toLowerCase())).length,
      confirmed: orders.filter(o => o.orderStatus?.toLowerCase() === 'confirmed').length,
      delivered: orders.filter(o => o.orderStatus?.toLowerCase() === 'delivered').length,
      cancelled: orders.filter(o => o.orderStatus?.toLowerCase() === 'cancelled').length,
    };
  };

  const stats = getOrderStats();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2" style={{ borderColor: '#492273' }}></div>
      </div>
    );
  }

  return (
    <>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={hideToast}
          darkMode={darkMode}
        />
      )}
      <div className="space-y-6 pl-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Order Management</h2>
            <p className="text-sm text-indigo-600 mt-1 font-medium">
              View and manage all customer orders
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { label: 'Total Orders', value: stats.total, color: '#492273' },
            { label: 'Pending', value: stats.pending, color: '#f59e0b' },
            { label: 'Confirmed', value: stats.confirmed, color: '#3b82f6' },
            { label: 'Delivered', value: stats.delivered, color: '#10b981' },
            { label: 'Cancelled', value: stats.cancelled, color: '#ef4444' },
          ].map((stat, idx) => (
            <div
              key={idx}
              className="bg-cream rounded-xl p-4 border border-gray-200"
            >
              <p className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{stat.label}</p>
              <p className="text-2xl font-bold mt-1" style={{ color: stat.color }}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-cream rounded-lg shadow-md p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search by order ID, customer name, or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="all">All Orders</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="processing">Processing</option>
              <option value="shipping">Shipping</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-cream rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-cream divide-y divide-gray-200">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-8 text-center">
                      <p className="text-sm text-gray-500">No orders found</p>
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order) => (
                    <tr key={order._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {order.orderNumber || `#${order._id?.slice(-8)}`}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div>
                          <p className="font-medium">{order.user?.name || 'N/A'}</p>
                          <p className="text-xs text-gray-500">{order.user?.email || ''}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(order.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                        {formatPrice(order.totalPrice || 0)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span 
                          className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${getStatusColor(order.orderStatus)}`}
                          style={order.orderStatus?.toLowerCase() === 'pending' ? { backgroundColor: '#fae955' } : {}}
                        >
                          {order.orderStatus || 'Pending'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="font-medium text-purple-600 hover:text-purple-900"
                          style={{ color: '#492273' }}
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Order Details Modal */}
        {selectedOrder && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" data-order-details>
            <div className={`rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
              <div className={`sticky top-0 px-6 py-4 border-b flex items-center justify-between ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                <div className="flex items-center gap-3">
                  <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    Order Details #{selectedOrder.orderNumber || selectedOrder._id?.slice(-8)}
                  </h3>
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold capitalize ${
                    selectedOrder.orderStatus?.toLowerCase() === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    selectedOrder.orderStatus?.toLowerCase() === 'processing' ? 'bg-blue-100 text-blue-800' :
                    selectedOrder.orderStatus?.toLowerCase() === 'shipped' ? 'bg-cyan-100 text-cyan-800' :
                    selectedOrder.orderStatus?.toLowerCase() === 'delivered' ? 'bg-green-100 text-green-800' :
                    selectedOrder.orderStatus?.toLowerCase() === 'cancelled' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {selectedOrder.orderStatus || 'Pending'}
                  </span>
                </div>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className={`p-2 rounded-lg hover:bg-gray-100 ${darkMode ? 'hover:bg-gray-700' : ''}`}
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Customer Info */}
                <div>
                  <h4 className={`text-sm font-semibold uppercase mb-3 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Customer Information</h4>
                  <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                    <p className={`text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      <span className="font-medium">Name:</span> {selectedOrder.user?.name || 'N/A'}
                    </p>
                    <p className={`text-sm mt-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      <span className="font-medium">Email:</span> {selectedOrder.user?.email || 'N/A'}
                    </p>
                    <p className={`text-sm mt-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      <span className="font-medium">Phone:</span> {selectedOrder.shippingAddress?.phone || 'N/A'}
                    </p>
                  </div>
                </div>

                {/* Shipping Address */}
                <div>
                  <h4 className={`text-sm font-semibold uppercase mb-3 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Shipping Address</h4>
                  <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                    <p className={`text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {selectedOrder.shippingAddress?.street || 'N/A'}<br />
                      {selectedOrder.shippingAddress?.city}, {selectedOrder.shippingAddress?.state} {selectedOrder.shippingAddress?.zipCode}<br />
                      {selectedOrder.shippingAddress?.country}
                    </p>
                  </div>
                </div>

                {/* Order Items */}
                <div>
                  <h4 className={`text-sm font-semibold uppercase mb-3 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Order Items</h4>
                  <div className="space-y-3">
                    {selectedOrder.items?.map((item, idx) => (
                      <div key={idx} className={`p-4 rounded-lg flex items-center gap-4 ${darkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                        {item.product?.images?.[0]?.url && (
                          <img
                            src={item.product.images[0].url}
                            alt={item.product.name}
                            className="w-16 h-16 object-cover rounded-lg"
                          />
                        )}
                        <div className="flex-1">
                          <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{item.product?.name || 'Product'}</p>
                          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            Quantity: {item.quantity} × {formatPrice(item.price)}
                          </p>
                        </div>
                        <p className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                          {formatPrice(item.quantity * item.price)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Order Summary */}
                <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                  <div className="flex justify-between mb-2">
                    <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Subtotal:</span>
                    <span className={darkMode ? 'text-white' : 'text-gray-900'}>{formatPrice(selectedOrder.itemsPrice || selectedOrder.totalPrice || 0)}</span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Tax:</span>
                    <span className={darkMode ? 'text-white' : 'text-gray-900'}>{formatPrice(selectedOrder.taxPrice || 0)}</span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Shipping:</span>
                    <span className={darkMode ? 'text-white' : 'text-gray-900'}>{formatPrice(selectedOrder.shippingPrice || 0)}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-gray-300">
                    <span className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Total:</span>
                    <span className={`font-bold text-lg ${darkMode ? 'text-white' : 'text-gray-900'}`}>{formatPrice(selectedOrder.totalPrice || 0)}</span>
                  </div>
                </div>

                {/* Update Status */}
                <div>
                  <h4 className={`text-sm font-semibold uppercase mb-3 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Update Order Status</h4>
                  {selectedOrder.orderStatus?.toLowerCase() === 'delivered' ? (
                    <p className={`text-sm font-medium ${darkMode ? 'text-yellow-400' : 'text-yellow-700'}`}>
                      ✅ Order has been delivered. Status cannot be changed.
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {['pending', 'processing', 'shipped', 'delivered', 'cancelled'].map((status) => (
                        <button
                          key={status}
                          onClick={() => handleStatusUpdate(selectedOrder._id, status)}
                          disabled={selectedOrder.orderStatus?.toLowerCase() === 'delivered'}
                          className={`px-4 py-2 rounded-lg font-medium transition-all capitalize ${
                            selectedOrder.orderStatus?.toLowerCase() === status.toLowerCase()
                              ? 'bg-purple-600 text-white'
                              : darkMode
                              ? 'bg-gray-900 text-gray-200 hover:bg-gray-800 border border-gray-700 disabled:opacity-50 disabled:cursor-not-allowed'
                              : 'bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed'
                          }`}
                          style={
                            selectedOrder.orderStatus?.toLowerCase() === status.toLowerCase()
                              ? { backgroundColor: '#492273' }
                              : {}
                          }
                        >
                          {status}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default OrderManagement;
