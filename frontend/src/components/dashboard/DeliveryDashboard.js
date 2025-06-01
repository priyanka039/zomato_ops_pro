import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LocationMarkerIcon, CheckIcon, TruckIcon } from '@heroicons/react/outline';
import toast from 'react-hot-toast';
import axios from 'axios';

import StatCard from '../shared/StatCard';
import DeliveryProgressTracker from '../shared/DeliveryProgressTracker';
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
    <button 
      onClick={() => window.location.reload()}
      className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-6 py-2 rounded-lg hover:shadow-lg transition-all"
    >
      Refresh for New Orders
    </button>
  </div>
);

const DeliveryDashboard = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  
  const [activeDelivery, setActiveDelivery] = useState(null);
  const [isAvailable, setIsAvailable] = useState(true);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    deliveriesToday: 0,
    avgDeliveryTime: 0,
    totalEarnings: 0,
    rating: 0
  });

  // Change watchId to use useRef
  const watchIdRef = useRef(null);

  const startLocationTracking = useCallback(() => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser 😞');
      return;
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      async (position) => {
        try {
          await api.post(`/delivery-partners/${user._id}/location`, {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            timestamp: new Date().toISOString()
          });
        } catch (err) {
          console.error('Error updating location:', err);
        }
      },
      (error) => {
        console.error('Error getting location:', error);
        toast.error('Please enable location services to continue 📍');
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  }, [user._id]);

  const stopLocationTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  }, []);

  const handleDeliveryComplete = useCallback(async (order) => {
    setIsAvailable(true);
    stopLocationTracking();
    
    // Update stats
    setStats(prev => ({
      ...prev,
      deliveriesToday: prev.deliveriesToday + 1,
      totalEarnings: prev.totalEarnings + (order.earnings || 0)
    }));
    
    setActiveDelivery(null);
    
    try {
      // Make delivery partner available again
      await api.post(`/delivery-partners/${user._id}/available`, {
        isAvailable: true
      });
      
      // Notify WebSocket about availability
      wsService.send('PARTNER_UPDATE', {
        type: 'AVAILABILITY',
        partnerId: user._id,
        isAvailable: true
      });
      
      toast.success('🎉 Great job! Order delivered successfully!');
    } catch (err) {
      console.error('Error updating availability:', err);
      toast.error('Failed to update availability status');
    }
  }, [user._id, stopLocationTracking]);

  const initializeDashboard = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch current delivery and active orders
      const [activeRes, statsRes, ordersRes] = await Promise.all([
        api.get(`/delivery-partners/${user._id}/current-delivery`),
        api.get(`/delivery-partners/${user._id}/stats`),
        api.get(`/delivery-partners/${user._id}/orders`)
      ]);
      
      // Handle active delivery
      if (activeRes.data.success && activeRes.data.data) {
        console.log('Current delivery:', activeRes.data.data);
        setActiveDelivery(activeRes.data.data);
        setIsAvailable(false);
        startLocationTracking();
      }
      
      // Handle stats
      if (statsRes.data.success) {
        setStats(statsRes.data.data);
      }

      // Handle orders - check for any assigned orders
      if (ordersRes.data.success && ordersRes.data.data.length > 0) {
        const assignedOrders = ordersRes.data.data.filter(
          order => order.deliveryPartnerId === user._id && order.status !== 'DELIVERED'
        );
        
        if (assignedOrders.length > 0) {
          console.log('Found assigned order:', assignedOrders[0]);
          setActiveDelivery(assignedOrders[0]);
          setIsAvailable(false);
          startLocationTracking();
        }
      }
      
      // Show welcome message
      const greeting = getTimeBasedGreeting();
      toast.success(`${greeting} ${user.name}! Ready to hit the road? 🛵`);
      
    } catch (err) {
      console.error('Dashboard initialization error:', err);
      if (err.response?.status === 404) {
        setActiveDelivery(null);
        setIsAvailable(true);
      } else {
        toast.error('Failed to load dashboard data 😞');
      }
    } finally {
      setLoading(false);
    }
  }, [user._id, user.name, startLocationTracking]);

  useEffect(() => {
    initializeDashboard();
    
    wsService.connect();
    
    // Subscribe to order updates
    const orderUnsubscribe = wsService.subscribe('orders', (data) => {
      console.log('Received order update:', data);
      
      if (data.type === 'ASSIGNMENT' && data.deliveryPartnerId === user._id) {
        console.log('New order assigned:', data);
        setActiveDelivery(data);
        setIsAvailable(false);
        startLocationTracking();
        
        toast.success('🎉 New order assigned to you!');
      } else if (data.type === 'STATUS_UPDATE' && data.deliveryPartnerId === user._id) {
        setActiveDelivery(prev => prev && prev._id === data._id ? { ...prev, status: data.status } : prev);
        
        if (data.status === 'DELIVERED') {
          handleDeliveryComplete(data);
        }
      }
    });
    
    return () => {
      orderUnsubscribe();
      wsService.disconnect();
      stopLocationTracking();
    };
  }, [user._id, initializeDashboard, startLocationTracking, stopLocationTracking, handleDeliveryComplete]);

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

  const handleToggleAvailability = async () => {
    if (activeDelivery) {
      toast.error('Please complete your current delivery first! 🚚');
      return;
    }

    try {
      setLoading(true);
      const newStatus = !isAvailable;
      
      const response = await api.post(`/delivery-partners/${user._id}/available`, { 
        isAvailable: newStatus
      });
      
      if (response.data.success) {
        setIsAvailable(newStatus);
        
        // Notify WebSocket about availability change
        wsService.send('PARTNER_UPDATE', {
          partnerId: user._id,
          isAvailable: newStatus
        });
        
        if (newStatus) {
          startLocationTracking();
        } else {
          stopLocationTracking();
        }
        
        toast.success(
          newStatus 
            ? 'You\'re back online! Ready for orders! 🚀' 
            : 'Going offline. Take care and see you soon! 👋'
        );
      }
    } catch (err) {
      console.error('Error updating availability:', err);
      toast.error('Failed to update availability 😞');
    } finally {
      setLoading(false);
    }
  };

  const getCurrentLocation = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        position => resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        }),
        error => reject(error)
      );
    });
  };

  // Update handleUpdateStatus to include type
  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      setLoading(true);
      
      const location = await getCurrentLocation();
      
      const response = await api.put(`/orders/${orderId}/status`, {
        status: newStatus,
        location,
        timestamp: new Date().toISOString(),
        type: 'STATUS_UPDATE'
      });
      
      if (response.data.success) {
        const updatedOrder = response.data.data;
        setActiveDelivery(updatedOrder);
        
        // Notify WebSocket about status update
        wsService.send('ORDER_UPDATE', {
          ...updatedOrder,
          type: 'STATUS_UPDATE'
        });
        
        // Show appropriate success message
        const messages = {
          'PICKED': '📦 Great! Order picked up successfully!',
          'ON_ROUTE': '🚴‍♂️ You\'re on your way! Safe journey!',
          'DELIVERED': '✨ Order delivered! Great job!'
        };
        
        toast.success(messages[newStatus]);
        
        // If delivery is complete
        if (newStatus === 'DELIVERED') {
          setActiveDelivery(null);
          setIsAvailable(true);
          stopLocationTracking();
          
          // Update stats
          setStats(prev => ({
            ...prev,
            deliveriesToday: prev.deliveriesToday + 1,
            totalEarnings: prev.totalEarnings + (updatedOrder.earnings || 0)
          }));

          // Make delivery partner available again
          await api.post(`/delivery-partners/${user._id}/available`, {
            isAvailable: true
          });
          
          // Notify WebSocket about availability
          wsService.send('PARTNER_UPDATE', {
            type: 'AVAILABILITY',
            partnerId: user._id,
            isAvailable: true
          });
        }
      }
    } catch (err) {
      console.error('Error updating delivery status:', err);
      toast.error('Failed to update delivery status 😞');
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
              <h1 className="text-3xl font-bold mb-2">🏍️ Delivery Partner Hub</h1>
              <p className="text-indigo-100">Hey {user.name}! Ready to hit the road?</p>
            </div>
            <div className="flex items-center space-x-4">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleToggleAvailability}
                disabled={loading || activeDelivery}
                className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center space-x-2 ${
                  isAvailable 
                    ? 'bg-green-500 hover:bg-green-600' 
                    : 'bg-red-500 hover:bg-red-600'
                }`}
              >
                <div className={`w-2 h-2 rounded-full ${isAvailable ? 'bg-green-300' : 'bg-red-300'} animate-pulse`} />
                <span>{isAvailable ? 'Available' : 'Offline'}</span>
              </motion.button>
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
            icon="🎯" 
            title="Deliveries Today" 
            value={stats.deliveriesToday} 
            change={`${stats.deliveriesToday} completed`}
            color="bg-gradient-to-br from-blue-400 to-indigo-500"
          />
          <StatCard 
            icon="⚡" 
            title="Avg Delivery Time" 
            value={`${stats.avgDeliveryTime} min`}
            change="-2 min from avg"
            color="bg-gradient-to-br from-green-400 to-emerald-500"
          />
          <StatCard 
            icon="💰" 
            title="Today's Earnings" 
            value={`₹${stats.totalEarnings}`}
            change="+₹150 from last delivery"
            color="bg-gradient-to-br from-yellow-400 to-orange-500"
          />
          <AchievementCard 
            icon="⭐" 
            title="Your Rating" 
            value={stats.rating.toFixed(1)}
            target="4.8"
            improvement="+0.1 this week"
            message="Keep up the great work!"
          />
        </div>

        {/* Active Delivery Section */}
        {loading && !activeDelivery ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        ) : activeDelivery ? (
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">🍽️ Active Delivery</h2>
                <div className="flex items-center space-x-2 mt-1">
                  <span className="text-sm font-medium bg-indigo-100 text-indigo-800 px-2 py-1 rounded">
                    #{activeDelivery._id.slice(-6)}
                  </span>
                  <span className="text-gray-500">•</span>
                  <span className="text-gray-600 font-medium">
                    {activeDelivery.items}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Earnings</p>
                <p className="text-lg font-bold text-green-600">₹{activeDelivery.earnings}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold mb-3 text-gray-800 flex items-center">
                  <TruckIcon className="w-5 h-5 mr-2 text-indigo-500" />
                  Order Details
                </h3>
                <div className="space-y-2">
                  <p className="text-gray-600">
                    <span className="font-medium text-gray-700">Items:</span>
                    <br />
                    <span className="text-sm">{activeDelivery.items}</span>
                  </p>
                  <p className="text-gray-600">
                    <span className="font-medium text-gray-700">Restaurant:</span>
                    <br />
                    <span className="text-sm">{activeDelivery.restaurantName}</span>
                  </p>
                  <p className="text-gray-600">
                    <span className="font-medium text-gray-700">Prep Time:</span>
                    <br />
                    <span className="text-sm">{activeDelivery.prepTime} minutes</span>
                  </p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold mb-3 text-gray-800 flex items-center">
                  <LocationMarkerIcon className="w-5 h-5 mr-2 text-indigo-500" />
                  Delivery Location
                </h3>
                <div className="space-y-2">
                  <p className="text-gray-600">
                    <span className="font-medium text-gray-700">Customer:</span>
                    <br />
                    <span className="text-sm">{activeDelivery.customerName}</span>
                  </p>
                  <p className="text-gray-600">
                    <span className="font-medium text-gray-700">Address:</span>
                    <br />
                    <span className="text-sm">{activeDelivery.deliveryAddress}</span>
                  </p>
                  <p className="text-gray-600">
                    <span className="font-medium text-gray-700">Contact:</span>
                    <br />
                    <span className="text-sm">{activeDelivery.customerPhone}</span>
                  </p>
                </div>
              </div>
            </div>

            <DeliveryProgressTracker
              currentStatus={activeDelivery.status}
              onUpdateStatus={handleUpdateStatus}
            />
          </div>
        ) : (
          <EmptyStateCard />
        )}
      </main>
    </div>
  );
};

export default DeliveryDashboard; 