import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material';
import Login from './components/auth/Login';
import Signup from './components/auth/Signup';
import RestaurantDashboard from './components/dashboard/RestaurantDashboard';
import DeliveryDashboard from './components/dashboard/DeliveryDashboard';

// Create theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#e23744', // Zomato red
    },
    secondary: {
      main: '#1976d2',
    },
  },
});

// Auth checker component
const AuthChecker = ({ children }) => {
  const navigate = useNavigate();
  
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
    }
  }, [navigate]);

  return children;
};

// Protected Route component
const ProtectedRoute = ({ children, allowedRole }) => {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== allowedRole) {
    if (user.role === 'RESTAURANT_MANAGER') {
      return <Navigate to="/restaurant-dashboard" replace />;
    } else {
      return <Navigate to="/delivery-dashboard" replace />;
    }
  }

  return <AuthChecker>{children}</AuthChecker>;
};

function App() {
  return (
    <ThemeProvider theme={theme}>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          
          {/* Protected Routes */}
          <Route
            path="/restaurant-dashboard/*"
            element={
              <ProtectedRoute allowedRole="RESTAURANT_MANAGER">
                <RestaurantDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/delivery-dashboard/*"
            element={
              <ProtectedRoute allowedRole="DELIVERY_PARTNER">
                <DeliveryDashboard />
              </ProtectedRoute>
            }
          />
          
          {/* Redirect root to login */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          
          {/* Catch all route */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
