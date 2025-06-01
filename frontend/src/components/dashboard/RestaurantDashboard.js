import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { PlusIcon } from '@heroicons/react/outline';
import toast from 'react-hot-toast';
import axios from 'axios';

import StatCard from '../shared/StatCard';
import OrderCard from '../shared/OrderCard';

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
  const [error, setError] = useState('');
  const [stats, setStats] = useState({
    todayOrders: 0,
    avgPrepTime: 0,
    availableRiders: 0,
    successRate: 0
  });
  
  const [newOrder, setNewOrder] = useState({
    items: '',
    prepTime: '',
    customerLocation: {
      address: '',
      coordinates: [0, 0]
    }
  });

  // Fetch orders and stats
  const fetchData = async () => {
    try {
      setLoading(true);
      const [ordersRes, partnersRes] = await Promise.all([
        api.get('/orders'),
        api.get('/delivery-partners/available')
      ]);
      
      setOrders(ordersRes.data.data);
      setAvailablePartners(partnersRes.data.data);
      
      // Calculate stats
      const todayOrders = ordersRes.data.data.filter(
        order => new Date(order.createdAt).toDateString() === new Date().toDateString()
      ).length;
      
      const completedOrders = ordersRes.data.data.filter(
        order => order.status === 'DELIVERED'
      );
      
      const avgPrepTime = completedOrders.length
        ? Math.round(completedOrders.reduce((acc, curr) => acc + curr.prepTime, 0) / completedOrders.length)
        : 0;
      
      setStats({
        todayOrders,
        avgPrepTime,
        availableRiders: partnersRes.data.data.length,
        successRate: Math.round((completedOrders.length / ordersRes.data.data.length) * 100) || 0
      });
      
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const handleCreateOrder = async () => {
    try {
      if (!newOrder.items.trim()) {
        toast.error('Please enter order items');
        return;
      }
      
      if (!newOrder.prepTime || newOrder.prepTime < 1) {
        toast.error('Preparation time must be at least 1 minute');
        return;
      }

      setLoading(true);
      const response = await api.post('/orders', {
        ...newOrder,
        prepTime: parseInt(newOrder.prepTime)
      });
      
      if (response.data.success) {
        toast.success('Order created successfully!');
        setOpenNewOrder(false);
        setNewOrder({
          items: '',
          prepTime: '',
          customerLocation: {
            address: '',
            coordinates: [0, 0]
          }
        });
        fetchData();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create order');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignPartner = async (partnerId) => {
    try {
      setLoading(true);
      const response = await api.post(`/orders/${selectedOrder._id}/assign`, { partnerId });
      
      if (response.data.success) {
        toast.success('Delivery partner assigned successfully!');
        setOpenAssignPartner(false);
        setSelectedOrder(null);
        fetchData();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to assign delivery partner');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-red-500 to-orange-500 text-white p-6 shadow-lg">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold mb-2">🍽️ Restaurant Command Center</h1>
              <p className="text-red-100">Welcome back, {user.name}! Ready to serve some delicious orders?</p>
            </div>
            <button
              onClick={handleLogout}
              className="bg-white/20 px-4 py-2 rounded-lg hover:bg-white/30 transition-colors"
            >
              Logout
            </button>
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

          {loading ? (
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
                  onAssignRider={!order.deliveryPartner ? setSelectedOrder : undefined}
                />
              ))}
            </div>
          )}
        </div>

        {/* Create Order Modal */}
        {openNewOrder && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl"
            >
              <h3 className="text-2xl font-bold mb-6 text-gray-800">🍕 New Order</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Order Items
                  </label>
                  <input
                    type="text"
                    value={newOrder.items}
                    onChange={(e) => setNewOrder({ ...newOrder, items: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    placeholder="2x Margherita Pizza, 1x Garlic Bread..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Preparation Time (minutes)
                  </label>
                  <input
                    type="number"
                    value={newOrder.prepTime}
                    onChange={(e) => setNewOrder({ ...newOrder, prepTime: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    min="1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Delivery Address (Optional)
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
                    placeholder="Customer's delivery address"
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
                  disabled={loading || !newOrder.items.trim() || !newOrder.prepTime || newOrder.prepTime < 1}
                  className="bg-gradient-to-r from-red-500 to-orange-500 text-white px-6 py-2 rounded-lg font-medium hover:shadow-lg transition-all disabled:opacity-50"
                >
                  {loading ? 'Creating...' : 'Create Order'}
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Assign Partner Modal */}
        {openAssignPartner && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl"
            >
              <h3 className="text-2xl font-bold mb-6 text-gray-800">
                🚴‍♂️ Assign Delivery Partner
              </h3>
              {availablePartners.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-4">😢</div>
                  <p className="text-gray-600">No delivery partners available</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {availablePartners.map((partner) => (
                    <motion.button
                      key={partner._id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleAssignPartner(partner._id)}
                      className="w-full flex items-center justify-between p-4 rounded-xl border-2 border-transparent hover:border-blue-500 hover:bg-blue-50 transition-all"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                          {partner.name.charAt(0)}
                        </div>
                        <div className="text-left">
                          <p className="font-medium text-gray-800">{partner.name}</p>
                          <p className="text-sm text-gray-500">Available Now</p>
                        </div>
                      </div>
                      <div className="text-blue-500">→</div>
                    </motion.button>
                  ))}
                </div>
              )}
              <div className="flex justify-end mt-6">
                <button
                  onClick={() => setOpenAssignPartner(false)}
                  className="px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </main>
    </div>
  );
};

export default RestaurantDashboard; 