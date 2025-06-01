import React, { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Typography,
  Chip,
} from '@mui/material';
import { Add as AddIcon, LocalShipping } from '@mui/icons-material';
import { addOrder, updateOrder } from '../../store/slices/orderSlice';
import { setAvailablePartners } from '../../store/slices/deliverySlice';
import axios from 'axios';

const OrderManagement = () => {
  const dispatch = useDispatch();
  const { orders } = useSelector((state) => state.orders);
  const { availablePartners } = useSelector((state) => state.delivery);
  
  const [openDialog, setOpenDialog] = useState(false);
  const [openAssignDialog, setOpenAssignDialog] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [newOrder, setNewOrder] = useState({
    items: '',
    prepTime: '',
  });

  const fetchAvailablePartners = useCallback(async () => {
    try {
      const response = await axios.get('/api/v1/delivery-partners/available');
      dispatch(setAvailablePartners(response.data));
    } catch (error) {
      console.error('Error fetching available partners:', error);
    }
  }, [dispatch]);

  useEffect(() => {
    fetchAvailablePartners();
  }, [fetchAvailablePartners]);

  const handleAddOrder = async () => {
    try {
      const response = await axios.post('/api/v1/orders', newOrder);
      dispatch(addOrder(response.data));
      setOpenDialog(false);
      setNewOrder({ items: '', prepTime: '' });
    } catch (error) {
      console.error('Error adding order:', error);
    }
  };

  const handleAssignPartner = async (orderId, partnerId) => {
    try {
      const response = await axios.post(`/api/v1/orders/${orderId}/assign`, {
        partnerId,
      });
      dispatch(updateOrder(response.data));
      setOpenAssignDialog(false);
      setSelectedOrder(null);
      fetchAvailablePartners(); // Refresh available partners
    } catch (error) {
      console.error('Error assigning partner:', error);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      PREP: 'warning',
      PICKED: 'info',
      ON_ROUTE: 'primary',
      DELIVERED: 'success',
    };
    return colors[status] || 'default';
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5">Order Management</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpenDialog(true)}
        >
          New Order
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Order ID</TableCell>
              <TableCell>Items</TableCell>
              <TableCell>Prep Time (mins)</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Delivery Partner</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {orders.map((order) => (
              <TableRow key={order.id}>
                <TableCell>{order.id}</TableCell>
                <TableCell>{order.items}</TableCell>
                <TableCell>{order.prepTime}</TableCell>
                <TableCell>
                  <Chip
                    label={order.status}
                    color={getStatusColor(order.status)}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  {order.deliveryPartnerName || 'Not Assigned'}
                </TableCell>
                <TableCell>
                  {!order.deliveryPartnerId && order.status === 'PREP' && (
                    <IconButton
                      color="primary"
                      onClick={() => {
                        setSelectedOrder(order);
                        setOpenAssignDialog(true);
                      }}
                    >
                      <LocalShipping />
                    </IconButton>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* New Order Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>Add New Order</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Items"
            fullWidth
            multiline
            rows={3}
            value={newOrder.items}
            onChange={(e) => setNewOrder({ ...newOrder, items: e.target.value })}
          />
          <TextField
            margin="dense"
            label="Preparation Time (minutes)"
            type="number"
            fullWidth
            value={newOrder.prepTime}
            onChange={(e) => setNewOrder({ ...newOrder, prepTime: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleAddOrder} variant="contained">
            Add Order
          </Button>
        </DialogActions>
      </Dialog>

      {/* Assign Partner Dialog */}
      <Dialog open={openAssignDialog} onClose={() => setOpenAssignDialog(false)}>
        <DialogTitle>Assign Delivery Partner</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Select Partner</InputLabel>
            <Select
              value=""
              onChange={(e) => handleAssignPartner(selectedOrder?.id, e.target.value)}
            >
              {availablePartners.map((partner) => (
                <MenuItem key={partner.id} value={partner.id}>
                  {partner.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAssignDialog(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default OrderManagement; 