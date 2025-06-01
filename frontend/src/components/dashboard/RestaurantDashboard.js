import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { PlusIcon } from '@heroicons/react/outline';
import toast from 'react-hot-toast';
import axios from 'axios';

import StatCard from '../shared/StatCard';
import { wsService } from '../../services/websocket';

// Create axios instance with default config
const api = axios.create({
  baseURL: 'http://localhost:5000/api/v1',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const RestaurantDashboard = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  
  const [orders, setOrders] = useState([]);
  const [availablePartners, setAvailablePartners] = useState([]);
  const [openNewOrder, setOpenNewOrder] = useState(false);
  const [openAssignPartner, setOpenAssignPartner] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    todayOrders: 0,
    avgPrepTime: 0,
    availableRiders: 0,
    successRate: 0,
    totalEarnings: 0,
    unassignedOrders: 0
  });
  
  const [newOrder, setNewOrder] = useState({
    items: '',
    prepTime: '',
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    customerLocation: {
      address: '',
      city: '',
      state: '',
      pincode: '',
      coordinates: [0, 0]
    }
  });

  const [assignmentModal, setAssignmentModal] = useState({
    isOpen: false,
    order: null,
    partners: []
  });

  const [activeDeliveries, setActiveDeliveries] = useState([]);
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);

  const statusMessages = {
    'PREP': '👨‍🍳 Chef is preparing your delicious order',
    'PICKED': '📦 Order picked up by delivery hero',
    'ON_ROUTE': '🏃‍♂️ Your food is on its way!',
    'DELIVERED': '✨ Order delivered successfully'
  };

  // Function to calculate real-time stats
  const calculateStats = useCallback((ordersList) => {
    const todayOrders = ordersList.filter(
      order => new Date(order.createdAt).toDateString() === new Date().toDateString()
    );
    
    const completedOrders = ordersList.filter(
      order => order.status === 'DELIVERED'
    );

    const unassignedOrders = ordersList.filter(
      order => !order.deliveryPartnerId && order.status !== 'DELIVERED'
    );
    
    const avgPrepTime = completedOrders.length
      ? Math.round(completedOrders.reduce((acc, curr) => {
          const prepEndTime = curr.statusUpdates?.find(u => u.status === 'PICKED')?.timestamp;
          const prepStartTime = curr.createdAt;
          if (prepEndTime && prepStartTime) {
            return acc + (new Date(prepEndTime) - new Date(prepStartTime)) / (1000 * 60);
          }
          return acc;
        }, 0) / completedOrders.length)
      : 0;
    
    const successRate = ordersList.length
      ? Math.round((completedOrders.length / ordersList.length) * 100)
      : 0;

    return {
      todayOrders: todayOrders.length,
      avgPrepTime,
      availableRiders: availablePartners.length,
      successRate,
      totalEarnings: completedOrders.reduce((acc, curr) => acc + (curr.earnings || 0), 0),
      unassignedOrders: unassignedOrders.length
    };
  }, [availablePartners.length]);

  // Update initializeDashboard to use calculateStats
  const initializeDashboard = useCallback(async () => {
    try {
      setLoading(true);
      const [ordersRes, partnersRes] = await Promise.all([
        api.get('/orders'),
        api.get('/delivery-partners/available')
      ]);
      
      if (ordersRes.data.success) {
        const ordersList = ordersRes.data.data;
        setOrders(ordersList);
        setStats(calculateStats(ordersList));
        
        // Update active deliveries
        const activeDeliveryList = ordersList.filter(
          order => order.deliveryPartnerId && ['PREP', 'PICKED', 'ON_ROUTE'].includes(order.status)
        );
        setActiveDeliveries(activeDeliveryList);
      }
      
      if (partnersRes.data.success) {
        setAvailablePartners(partnersRes.data.data);
      }

      const greeting = getTimeBasedGreeting();
      toast.success(`${greeting} ${user.name}! You have ${ordersRes.data.data.length} orders today! 📊`);
      
    } catch (err) {
      console.error('Dashboard initialization error:', err);
      toast.error('Failed to load dashboard data 😞');
    } finally {
      setLoading(false);
    }
  }, [user.name, calculateStats]);

  // Add this new function to fetch available partners
  const fetchAvailablePartners = async () => {
    try {
      setLoading(true);
      const response = await api.get('/delivery-partners/available');
      
      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error('Failed to fetch delivery partners');
      }
    } catch (err) {
      console.error('Error fetching delivery partners:', err);
      toast.error('Unable to fetch available delivery partners 😞');
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Update the assignment modal open handler
  const handleOpenAssignmentModal = async (order) => {
    try {
      const availablePartners = await fetchAvailablePartners();
      
      setAssignmentModal({
        isOpen: true,
        order,
        partners: availablePartners
      });
    } catch (err) {
      console.error('Error opening assignment modal:', err);
      toast.error('Failed to load available delivery partners');
    }
  };

  // Update the assign partner handler
  const handleAssignPartner = async (partnerId) => {
    try {
      setLoading(true);
      
      const { order } = assignmentModal;
      const partner = assignmentModal.partners.find(p => p._id === partnerId);
      
      if (!partner) {
        throw new Error('Selected delivery partner not found');
      }

      console.log('Assigning order to partner:', {
        orderId: order._id,
        partnerId,
        partnerName: partner.name
      });

      const response = await api.post(`/orders/${order._id}/assign`, {
        deliveryPartnerId: partnerId,
        deliveryPartnerName: partner.name,
        status: 'PREP'
      });
      
      if (response.data.success) {
        const updatedOrder = {
          ...response.data.data,
          deliveryPartnerId: partnerId,
          deliveryPartnerName: partner.name
        };
        
        console.log('Order assigned successfully:', updatedOrder);
        
        // Update orders list
        setOrders(prev => prev.map(o => 
          o._id === order._id ? updatedOrder : o
        ));

        // Update available partners list
        setAvailablePartners(prev => prev.filter(p => p._id !== partnerId));
        
        // Notify via WebSocket
        wsService.send('ORDER_UPDATE', {
          ...updatedOrder,
          type: 'ASSIGNMENT',
          deliveryPartnerId: partnerId,
          deliveryPartnerName: partner.name
        });
        
        // Close modal
        setAssignmentModal({
          isOpen: false,
          order: null,
          partners: []
        });
        
        toast.success(`🚴‍♂️ Order assigned to ${partner.name}!`);
      }
    } catch (err) {
      console.error('Error assigning delivery partner:', err);
      toast.error('Failed to assign delivery partner. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Update useEffect to handle real-time updates
  useEffect(() => {
    initializeDashboard();
    
    wsService.connect();
    
    const orderUnsubscribe = wsService.subscribe('orders', (data) => {
      if (data.type === 'STATUS_UPDATE') {
        setOrders(prev => {
          const updatedOrders = prev.map(order => 
            order._id === data._id ? { ...order, status: data.status } : order
          );
          setStats(calculateStats(updatedOrders));
          
          // Update active deliveries
          const activeDeliveryList = updatedOrders.filter(
            order => order.deliveryPartnerId && ['PREP', 'PICKED', 'ON_ROUTE'].includes(order.status)
          );
          setActiveDeliveries(activeDeliveryList);
          
          return updatedOrders;
        });
      } else if (data.type === 'ASSIGNMENT') {
        setOrders(prev => {
          const updatedOrders = prev.map(order => 
            order._id === data._id ? data : order
          );
          setStats(calculateStats(updatedOrders));
          
          // Update active deliveries
          const activeDeliveryList = updatedOrders.filter(
            order => order.deliveryPartnerId && ['PREP', 'PICKED', 'ON_ROUTE'].includes(order.status)
          );
          setActiveDeliveries(activeDeliveryList);
          
          return updatedOrders;
        });
      }
    });
    
    const partnerUnsubscribe = wsService.subscribe('partners', (data) => {
      if (data.type === 'AVAILABILITY') {
        if (data.isAvailable) {
          setAvailablePartners(prev => [...prev, data.partner]);
        } else {
          setAvailablePartners(prev => prev.filter(p => p._id !== data.partnerId));
        }
      }
    });
    
    return () => {
      orderUnsubscribe();
      partnerUnsubscribe();
      wsService.disconnect();
    };
  }, [initializeDashboard, calculateStats]);

  const getTimeBasedGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning! ☀️';
    if (hour < 17) return 'Good afternoon! 🌤️';
    return 'Good evening! 🌙';
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const validateOrderForm = (formData) => {
    const errors = {};
    
    if (!formData.items.trim()) {
      errors.items = 'Please specify order items 🍽️';
    }
    
    if (!formData.prepTime || formData.prepTime < 5) {
      errors.prepTime = 'Prep time should be at least 5 minutes ⏰';
    }
    
    return { isValid: Object.keys(errors).length === 0, errors };
  };

  const handleCreateOrder = async () => {
    try {
      setLoading(true);
      
      // Basic validation
      if (!newOrder.items.trim()) {
        toast.error('Please enter order items! 🍽️');
        return;
      }

      if (!newOrder.prepTime || parseInt(newOrder.prepTime) < 1) {
        toast.error('Prep time should be at least 1 minute! ⏰');
        return;
      }

      if (!newOrder.customerName.trim()) {
        toast.error('Please enter customer name! 👤');
        return;
      }

      if (!newOrder.customerLocation.address.trim()) {
        toast.error('Please enter delivery address! 📍');
        return;
      }

      // Store customer details in localStorage for future use
      const existingCustomers = JSON.parse(localStorage.getItem('customers') || '[]');
      const customerExists = existingCustomers.find(c => c.phone === newOrder.customerPhone);
      
      if (!customerExists && newOrder.customerPhone) {
        existingCustomers.push({
          name: newOrder.customerName,
          phone: newOrder.customerPhone,
          email: newOrder.customerEmail,
          location: newOrder.customerLocation
        });
        localStorage.setItem('customers', JSON.stringify(existingCustomers));
      }

      // Create order payload
      const orderData = {
        items: newOrder.items.trim(),
        prepTime: parseInt(newOrder.prepTime),
        customerName: newOrder.customerName.trim(),
        customerPhone: newOrder.customerPhone.trim(),
        customerEmail: newOrder.customerEmail.trim(),
        customerLocation: {
          address: newOrder.customerLocation.address.trim(),
          city: newOrder.customerLocation.city.trim(),
          state: newOrder.customerLocation.state.trim(),
          pincode: newOrder.customerLocation.pincode.trim(),
          coordinates: newOrder.customerLocation.coordinates
        },
        status: 'PREP',
        restaurantId: user._id,
        restaurantName: user.name
      };

      const response = await api.post('/orders', orderData);
      
      if (response.data.success) {
        const newOrderData = response.data.data;
        
        // Update orders list and stats
        setOrders(prev => {
          const updatedOrders = [newOrderData, ...prev];
          setStats(calculateStats(updatedOrders));
          return updatedOrders;
        });
        
        // Reset form
        setNewOrder({
          items: '',
          prepTime: '',
          customerName: '',
          customerPhone: '',
          customerEmail: '',
          customerLocation: {
            address: '',
            city: '',
            state: '',
            pincode: '',
            coordinates: [0, 0]
          }
        });
        
        setOpenNewOrder(false);
        toast.success('🎉 New order created successfully!');
      }
    } catch (err) {
      console.error('Error creating order:', err);
      toast.error(err.response?.data?.message || 'Failed to create order. Please try again! 😞');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      setLoading(true);
      
      const order = orders.find(o => o._id === orderId);
      if (!order) {
        toast.error('Order not found!');
        return;
      }

      const response = await api.put(`/orders/${orderId}/status`, {
        status: newStatus
      });
      
      if (response.data.success) {
        const updatedOrder = response.data.data;
        
        // Update orders list optimistically
        setOrders(prev => prev.map(order => 
          order._id === orderId ? updatedOrder : order
        ));
        
        // Notify WebSocket about status update
        wsService.send('ORDER_UPDATE', updatedOrder);
        
        // Success feedback
        toast.success(`Order status updated to ${newStatus}! 🎉`);
        
        // Update stats if order is delivered
        if (newStatus === 'DELIVERED') {
          setStats(prev => ({
            ...prev,
            successRate: Math.round((prev.successRate * prev.todayOrders + 100) / prev.todayOrders),
            totalEarnings: prev.totalEarnings + (updatedOrder.earnings || 0)
          }));
        }
      }
    } catch (err) {
      console.error('Error updating order status:', err);
      toast.error('Failed to update order status 😞');
    } finally {
      setLoading(false);
    }
  };

  // Add customer autofill function
  const handleCustomerPhoneChange = (phone) => {
    const existingCustomers = JSON.parse(localStorage.getItem('customers') || '[]');
    const customer = existingCustomers.find(c => c.phone === phone);
    
    if (customer) {
      setNewOrder(prev => ({
        ...prev,
        customerPhone: phone,
        customerName: customer.name,
        customerEmail: customer.email,
        customerLocation: customer.location
      }));
      toast.success('📝 Customer details auto-filled!');
    } else {
      setNewOrder(prev => ({
        ...prev,
        customerPhone: phone
      }));
    }
  };

  // Update order card display
  const OrderCard = ({ order, onAssignRider, onUpdateStatus }) => (
    <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium bg-orange-100 text-orange-800 px-2 py-1 rounded">
              #{order._id.slice(-6)}
            </span>
            <span className="text-gray-500">•</span>
            <span className="text-gray-800 font-medium">
              {order.items}
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            {new Date(order.createdAt).toLocaleTimeString()}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            order.status === 'PREP' ? 'bg-yellow-100 text-yellow-800' :
            order.status === 'PICKED' ? 'bg-blue-100 text-blue-800' :
            order.status === 'ON_ROUTE' ? 'bg-purple-100 text-purple-800' :
            'bg-green-100 text-green-800'
          }`}>
            {order.status}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-1">Customer Details</h4>
          <div className="text-sm text-gray-600 space-y-1">
            <p>{order.customerName}</p>
            <p>{order.customerPhone}</p>
            <p className="text-xs">{order.customerLocation.address}</p>
          </div>
        </div>
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-1">Order Info</h4>
          <div className="text-sm text-gray-600 space-y-1">
            <p>Prep Time: {order.prepTime} mins</p>
            {order.deliveryPartnerName && (
              <p>Rider: {order.deliveryPartnerName}</p>
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-end space-x-3">
        {!order.deliveryPartnerId && (
          <button
            onClick={() => onAssignRider(order)}
            className="bg-indigo-50 text-indigo-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-100 transition-colors"
          >
            Assign Delivery Partner
          </button>
        )}
        <button
          onClick={() => onUpdateStatus(order._id, 'PREP')}
          className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:shadow-lg transition-all"
        >
          Update Status
        </button>
      </div>
    </div>
  );

  // Add Active Deliveries Modal Component
  const ActiveDeliveriesModal = () => (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-8 max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold text-gray-800">
            🚚 Active Deliveries ({activeDeliveries.length})
          </h3>
          <button
            onClick={() => setShowDeliveryModal(false)}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        {activeDeliveries.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-600">No active deliveries at the moment</p>
          </div>
        ) : (
          <div className="space-y-4">
            {activeDeliveries.map(delivery => (
              <div key={delivery._id} className="bg-gray-50 rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium bg-orange-100 text-orange-800 px-2 py-1 rounded">
                        #{delivery._id.slice(-6)}
                      </span>
                      <span className="text-gray-500">•</span>
                      <span className="text-gray-800 font-medium">
                        {delivery.items}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      Created: {new Date(delivery.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    delivery.status === 'PREP' ? 'bg-yellow-100 text-yellow-800' :
                    delivery.status === 'PICKED' ? 'bg-blue-100 text-blue-800' :
                    'bg-purple-100 text-purple-800'
                  }`}>
                    {delivery.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Delivery Partner</h4>
                    <div className="text-sm text-gray-600">
                      <p className="font-medium">{delivery.deliveryPartnerName}</p>
                      <p className="text-xs mt-1">ID: {delivery.deliveryPartnerId}</p>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Customer Details</h4>
                    <div className="text-sm text-gray-600">
                      <p>{delivery.customerName}</p>
                      <p>{delivery.customerPhone}</p>
                      <p className="text-xs mt-1">{delivery.customerLocation.address}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  // Update the Create Order Modal JSX
  const renderCreateOrderModal = () => (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
      >
        <h3 className="text-2xl font-bold mb-6 text-gray-800">🍕 New Order</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Order Items*
            </label>
            <input
              type="text"
              value={newOrder.items}
              onChange={(e) => setNewOrder({ ...newOrder, items: e.target.value })}
              className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-red-500 focus:border-red-500"
              placeholder="e.g., 2x Margherita Pizza, 1x Garlic Bread"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Preparation Time (minutes)*
            </label>
            <input
              type="number"
              value={newOrder.prepTime}
              onChange={(e) => setNewOrder({ ...newOrder, prepTime: e.target.value })}
              className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-red-500 focus:border-red-500"
              min="1"
              placeholder="Enter preparation time in minutes"
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Customer Phone*
              </label>
              <input
                type="tel"
                value={newOrder.customerPhone}
                onChange={(e) => handleCustomerPhoneChange(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-red-500 focus:border-red-500"
                placeholder="Enter customer phone number"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Customer Name*
              </label>
              <input
                type="text"
                value={newOrder.customerName}
                onChange={(e) => setNewOrder({ ...newOrder, customerName: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-red-500 focus:border-red-500"
                placeholder="Enter customer name"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Customer Email
            </label>
            <input
              type="email"
              value={newOrder.customerEmail}
              onChange={(e) => setNewOrder({ ...newOrder, customerEmail: e.target.value })}
              className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-red-500 focus:border-red-500"
              placeholder="Enter customer email"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Delivery Address*
            </label>
            <input
              type="text"
              value={newOrder.customerLocation.address}
              onChange={(e) => setNewOrder({
                ...newOrder,
                customerLocation: {
                  ...newOrder.customerLocation,
                  address: e.target.value
                }
              })}
              className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-red-500 focus:border-red-500"
              placeholder="Enter street address"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                City*
              </label>
              <input
                type="text"
                value={newOrder.customerLocation.city}
                onChange={(e) => setNewOrder({
                  ...newOrder,
                  customerLocation: {
                    ...newOrder.customerLocation,
                    city: e.target.value
                  }
                })}
                className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-red-500 focus:border-red-500"
                placeholder="Enter city"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                State*
              </label>
              <input
                type="text"
                value={newOrder.customerLocation.state}
                onChange={(e) => setNewOrder({
                  ...newOrder,
                  customerLocation: {
                    ...newOrder.customerLocation,
                    state: e.target.value
                  }
                })}
                className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-red-500 focus:border-red-500"
                placeholder="Enter state"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Pincode*
            </label>
            <input
              type="text"
              value={newOrder.customerLocation.pincode}
              onChange={(e) => setNewOrder({
                ...newOrder,
                customerLocation: {
                  ...newOrder.customerLocation,
                  pincode: e.target.value
                }
              })}
              className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-red-500 focus:border-red-500"
              placeholder="Enter pincode"
            />
          </div>
        </div>

        <div className="flex justify-end space-x-3 mt-6">
          <button
            onClick={() => setOpenNewOrder(false)}
            className="px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleCreateOrder}
            disabled={loading || !newOrder.items.trim() || !newOrder.prepTime || !newOrder.customerName.trim() || !newOrder.customerLocation.address.trim()}
            className="bg-gradient-to-r from-red-500 to-orange-500 text-white px-6 py-2 rounded-lg font-medium hover:shadow-lg transition-all disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Order'}
          </motion.button>
        </div>
      </motion.div>
    </div>
  );

  // Update the header section to show unassigned orders
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-gradient-to-r from-red-500 to-orange-500 text-white p-6 shadow-lg">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold mb-2">🍽️ Restaurant Command Center</h1>
              <p className="text-red-100">Welcome back, {user.name}! Ready to serve some delicious orders?</p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowDeliveryModal(true)}
                className="bg-white/20 px-4 py-2 rounded-lg hover:bg-white/30 transition-colors flex items-center space-x-2"
              >
                <span>🚚</span>
                <span>Unassigned Orders ({stats.unassignedOrders})</span>
              </button>
              <div className="bg-white/20 rounded-lg p-3 backdrop-blur-sm text-center">
                <p className="text-sm opacity-90">Today's Orders</p>
                <p className="text-2xl font-bold">{stats.todayOrders}</p>
              </div>
              <button
                onClick={handleLogout}
                className="bg-white/20 px-4 py-2 rounded-lg hover:bg-white/30 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <StatCard 
            icon="🔥" 
            title="Orders Today" 
            value={stats.todayOrders} 
            change={`+${stats.todayOrders}%`}
          />
          <StatCard 
            icon="⚡" 
            title="Avg Prep Time" 
            value={`${stats.avgPrepTime} min`}
            change="-2 min"
            color="bg-gradient-to-br from-blue-400 to-indigo-500"
          />
          <StatCard 
            icon="🚴‍♂️" 
            title="Available Riders" 
            value={stats.availableRiders}
            change={`${stats.availableRiders} active`}
            color="bg-gradient-to-br from-green-400 to-emerald-500"
          />
          <StatCard 
            icon="📈" 
            title="Success Rate" 
            value={`${stats.successRate}%`}
            change="+0.3%"
            color="bg-gradient-to-br from-purple-400 to-pink-500"
          />
        </div>

        {/* Orders Section */}
        <div className="space-y-4">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Active Orders</h2>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setOpenNewOrder(true)}
              className="bg-gradient-to-r from-red-500 to-orange-500 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:shadow-lg transition-all"
            >
              <PlusIcon className="w-5 h-5" />
              <span>Create Order</span>
            </motion.button>
          </div>

          {loading && orders.length === 0 ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading orders...</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl shadow-sm">
              <div className="text-6xl mb-4">🍽️</div>
              <h3 className="text-xl font-bold text-gray-700 mb-2">No orders yet</h3>
              <p className="text-gray-600">Create your first order to get started!</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {orders.map((order) => (
                <OrderCard
                  key={order._id}
                  order={order}
                  onAssignRider={handleOpenAssignmentModal}
                  onUpdateStatus={handleUpdateStatus}
                />
              ))}
            </div>
          )}
        </div>

        {/* Create Order Modal */}
        {openNewOrder && renderCreateOrderModal()}

        {/* Assignment Modal */}
        {assignmentModal.isOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-gray-800">
                  🚴‍♂️ Assign Delivery Partner
                </h3>
                <span className="text-sm text-gray-500">
                  Order #{assignmentModal.order?._id.slice(-6)}
                </span>
              </div>

              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                  <p className="mt-4 text-gray-600">Loading available partners...</p>
                </div>
              ) : assignmentModal.partners.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-6xl mb-4">😢</div>
                  <p className="text-gray-600 font-medium">No delivery partners available</p>
                  <p className="text-sm text-gray-500 mt-2">Please try again in a few minutes</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {assignmentModal.partners.map((partner) => (
                    <motion.button
                      key={partner._id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleAssignPartner(partner._id)}
                      disabled={loading}
                      className="w-full flex items-center justify-between p-4 rounded-xl border-2 border-transparent hover:border-blue-500 hover:bg-blue-50 transition-all disabled:opacity-50"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                          {partner.name.charAt(0)}
                        </div>
                        <div className="text-left">
                          <p className="font-medium text-gray-800">{partner.name}</p>
                          <div className="flex items-center text-sm text-gray-500">
                            <span className="flex items-center">
                              <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                              Available Now
                            </span>
                            {partner.rating && (
                              <span className="ml-3">⭐ {partner.rating.toFixed(1)}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-blue-500">→</div>
                    </motion.button>
                  ))}
                </div>
              )}

              <div className="flex justify-end mt-6">
                <button
                  onClick={() => setAssignmentModal({ isOpen: false, order: null, partners: [] })}
                  className="px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </main>

      {showDeliveryModal && <ActiveDeliveriesModal />}
    </div>
  );
};

export default RestaurantDashboard; 