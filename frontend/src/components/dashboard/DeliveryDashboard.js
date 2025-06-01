import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import axios from 'axios';

import StatCard from '../shared/StatCard';
import DeliveryProgressTracker from '../shared/DeliveryProgressTracker';

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

const AchievementCard = ({ icon, title, value, target, message, improvement }) => {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="bg-white rounded-xl p-6 shadow-md"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="text-3xl">{icon}</div>
        {target && (
          <div className="text-sm text-gray-500">
            Target: {target}
          </div>
        )}
      </div>
      <h3 className="text-lg font-medium text-gray-800">{title}</h3>
      <p className="text-2xl font-bold mt-1 text-indigo-600">{value}</p>
      {improvement && (
        <p className="text-sm text-green-600 mt-1">{improvement}</p>
      )}
      {message && (
        <p className="text-sm text-gray-600 mt-2">{message}</p>
      )}
    </motion.div>
  );
};

const EmptyStateCard = () => (
  <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-2xl p-8 text-center">
    <div className="text-6xl mb-4">🛌</div>
    <h3 className="text-xl font-bold text-gray-700 mb-2">All caught up!</h3>
    <p className="text-gray-600 mb-4">No active deliveries right now. Time to grab a coffee! ☕</p>
    <button className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-6 py-2 rounded-lg hover:shadow-lg transition-all">
      Refresh for New Orders
    </button>
  </div>
);

const DeliveryDashboard = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  
  const [currentOrder, setCurrentOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isAvailable, setIsAvailable] = useState(user.isAvailable);
  const [stats, setStats] = useState({
    deliveriesToday: 0,
    avgDeliveryTime: 0,
    rating: 4.9,
    earnings: 0
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const orderRes = await api.get(`/delivery-partners/${user._id}/current-delivery`);
      setCurrentOrder(orderRes.data.data);

      // Fetch stats
      const statsRes = await api.get(`/delivery-partners/${user._id}/stats`);
      if (statsRes.data.success) {
        setStats(statsRes.data.data);
      }
    } catch (err) {
      if (!err.response?.status === 404) {
        toast.error(err.response?.data?.message || 'Failed to fetch data');
      }
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

  const handleAvailabilityChange = async () => {
    try {
      setLoading(true);
      const response = await api.post(`/delivery-partners/${user._id}/available`, {
        isAvailable: !isAvailable
      });
      
      if (response.data.success) {
        setIsAvailable(!isAvailable);
        const updatedUser = { ...user, isAvailable: !isAvailable };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        toast.success(`You are now ${!isAvailable ? 'available' : 'unavailable'} for deliveries`);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update availability');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      setLoading(true);
      const response = await api.put(`/orders/${orderId}/status`, { status: newStatus });
      
      if (response.data.success) {
        toast.success('Order status updated successfully!');
        
        if (newStatus === 'DELIVERED') {
          // Make delivery partner available again
          await api.post(`/delivery-partners/${user._id}/available`, { isAvailable: true });
          setIsAvailable(true);
          const updatedUser = { ...user, isAvailable: true };
          localStorage.setItem('user', JSON.stringify(updatedUser));
          toast.success('🎉 Great job! Ready for the next delivery!');
        }
        
        fetchData();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update order status');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white p-6 shadow-lg">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold mb-2">🏍️ Rider Hub</h1>
              <p className="text-indigo-100">Hey {user.name}! Ready to hit the road? 🛣️</p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={handleAvailabilityChange}
                disabled={loading || !!currentOrder}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  isAvailable 
                    ? 'bg-green-500 hover:bg-green-600' 
                    : 'bg-gray-500 hover:bg-gray-600'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${isAvailable ? 'bg-green-300' : 'bg-gray-300'} animate-pulse`}></div>
                  <span>{isAvailable ? 'Available' : 'Unavailable'}</span>
                </div>
              </button>
              <div className="bg-white/20 rounded-lg p-3 backdrop-blur-sm text-center">
                <p className="text-sm opacity-90">Today's Earnings</p>
                <p className="text-lg font-bold">₹{stats.earnings}</p>
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
        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <AchievementCard 
            icon="🎯" 
            title="Deliveries Today" 
            value={stats.deliveriesToday} 
            target="15"
            message="Keep going! You're doing great!"
          />
          <AchievementCard 
            icon="⚡" 
            title="Avg Delivery Time" 
            value={`${stats.avgDeliveryTime} min`}
            improvement="-3 min from yesterday"
            message="Lightning fast! ⚡"
          />
          <AchievementCard 
            icon="⭐" 
            title="Customer Rating" 
            value={stats.rating}
            message="You're crushing it! 🔥"
          />
        </div>

        {/* Active Delivery Section */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        ) : currentOrder ? (
          <div className="bg-white rounded-2xl p-6 shadow-lg border-l-4 border-green-400">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-xl font-bold text-gray-800">🍽️ Active Delivery</h3>
                <p className="text-gray-600">Order #{currentOrder._id.slice(-6)}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Estimated Earnings</p>
                <p className="text-lg font-bold text-green-600">₹{currentOrder.earnings || '150'}</p>
              </div>
            </div>
            
            <DeliveryProgressTracker 
              currentStatus={currentOrder.status}
              orderId={currentOrder._id}
              onUpdateStatus={handleUpdateStatus}
            />
            
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-semibold mb-2">📍 Delivery Details</h4>
              <p className="text-sm text-gray-600 mb-1">Items: {currentOrder.items}</p>
              <p className="text-sm text-gray-600">
                Address: {currentOrder.customerLocation?.address || 'Address will be provided soon'}
              </p>
            </div>
          </div>
        ) : (
          <EmptyStateCard />
        )}
      </main>
    </div>
  );
};

export default DeliveryDashboard; 