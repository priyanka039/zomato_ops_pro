import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Outlet } from 'react-router-dom';
import {
  Grid,
  Paper,
  Typography,
  Box,
  CircularProgress,
} from '@mui/material';
import { fetchOrdersStart, fetchOrdersSuccess, fetchOrdersFailure } from '../../store/slices/orderSlice';
import axios from 'axios';

const RestaurantDashboard = () => {
  const dispatch = useDispatch();
  const { orders, loading } = useSelector((state) => state.orders);

  useEffect(() => {
    const fetchOrders = async () => {
      dispatch(fetchOrdersStart());
      try {
        const response = await axios.get('/api/v1/orders');
        dispatch(fetchOrdersSuccess(response.data));
      } catch (error) {
        dispatch(fetchOrdersFailure(error.message));
      }
    };

    fetchOrders();
  }, [dispatch]);

  const getOrderStats = () => {
    return {
      total: orders.length,
      preparing: orders.filter(order => order.status === 'PREP').length,
      delivering: orders.filter(order => ['PICKED', 'ON_ROUTE'].includes(order.status)).length,
      completed: orders.filter(order => order.status === 'DELIVERED').length,
    };
  };

  const stats = getOrderStats();

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Restaurant Dashboard
      </Typography>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Paper
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              bgcolor: 'primary.main',
              color: 'white',
            }}
          >
            <Typography variant="h6">Total Orders</Typography>
            <Typography variant="h3">{stats.total}</Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Paper
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              bgcolor: 'warning.main',
              color: 'white',
            }}
          >
            <Typography variant="h6">Preparing</Typography>
            <Typography variant="h3">{stats.preparing}</Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Paper
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              bgcolor: 'info.main',
              color: 'white',
            }}
          >
            <Typography variant="h6">Out for Delivery</Typography>
            <Typography variant="h3">{stats.delivering}</Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Paper
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              bgcolor: 'success.main',
              color: 'white',
            }}
          >
            <Typography variant="h6">Completed</Typography>
            <Typography variant="h3">{stats.completed}</Typography>
          </Paper>
        </Grid>
      </Grid>

      <Outlet />
    </Box>
  );
};

export default RestaurantDashboard; 