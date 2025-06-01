import React, { useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Paper,
  Typography,
  Button,
  Stepper,
  Step,
  StepLabel,
  Card,
  CardContent,
  CardActions,
  Grid,
  Chip,
} from '@mui/material';
import {
  LocalShipping,
  Restaurant,
  DirectionsBike,
  DoneAll,
} from '@mui/icons-material';
import { setCurrentDelivery, updateDeliveryStatus } from '../../store/slices/deliverySlice';
import axios from 'axios';

const steps = [
  { label: 'Preparing', icon: <Restaurant />, status: 'PREP' },
  { label: 'Picked Up', icon: <LocalShipping />, status: 'PICKED' },
  { label: 'On Route', icon: <DirectionsBike />, status: 'ON_ROUTE' },
  { label: 'Delivered', icon: <DoneAll />, status: 'DELIVERED' },
];

const DeliveryDashboard = () => {
  const dispatch = useDispatch();
  const { currentDelivery } = useSelector((state) => state.delivery);
  const { user } = useSelector((state) => state.auth);

  const fetchCurrentDelivery = useCallback(async () => {
    try {
      const response = await axios.get(`/api/v1/delivery-partners/${user.id}/current-delivery`);
      dispatch(setCurrentDelivery(response.data));
    } catch (error) {
      console.error('Error fetching current delivery:', error);
    }
  }, [dispatch, user.id]);

  useEffect(() => {
    fetchCurrentDelivery();
  }, [fetchCurrentDelivery]);

  const handleStatusUpdate = async (newStatus) => {
    try {
      await axios.post(`/api/v1/orders/${currentDelivery.id}/status`, {
        status: newStatus,
      });
      dispatch(updateDeliveryStatus({ orderId: currentDelivery.id, status: newStatus }));
      
      if (newStatus === 'DELIVERED') {
        // Mark partner as available after delivery
        await axios.post(`/api/v1/delivery-partners/${user.id}/available`, {
          isAvailable: true,
        });
        // Fetch new delivery if available
        fetchCurrentDelivery();
      }
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const getActiveStep = () => {
    if (!currentDelivery) return -1;
    return steps.findIndex(step => step.status === currentDelivery.status);
  };

  const canUpdateStatus = (stepStatus) => {
    if (!currentDelivery) return false;
    const currentIndex = steps.findIndex(step => step.status === currentDelivery.status);
    const targetIndex = steps.findIndex(step => step.status === stepStatus);
    return targetIndex === currentIndex + 1;
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Delivery Dashboard
      </Typography>

      {currentDelivery ? (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Current Delivery Status
              </Typography>
              <Stepper activeStep={getActiveStep()} alternativeLabel>
                {steps.map((step) => (
                  <Step key={step.label}>
                    <StepLabel
                      StepIconComponent={() => (
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          {step.icon}
                        </Box>
                      )}
                    >
                      {step.label}
                    </StepLabel>
                  </Step>
                ))}
              </Stepper>
            </Paper>
          </Grid>

          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Order Details
                </Typography>
                <Typography variant="body1">
                  Order ID: {currentDelivery.id}
                </Typography>
                <Typography variant="body1">
                  Items: {currentDelivery.items}
                </Typography>
                <Typography variant="body1">
                  Restaurant: {currentDelivery.restaurantName}
                </Typography>
                <Typography variant="body1">
                  Status: <Chip label={currentDelivery.status} color="primary" />
                </Typography>
              </CardContent>
              <CardActions>
                {steps.map((step) => (
                  <Button
                    key={step.status}
                    variant="contained"
                    startIcon={step.icon}
                    disabled={!canUpdateStatus(step.status)}
                    onClick={() => handleStatusUpdate(step.status)}
                  >
                    Mark as {step.label}
                  </Button>
                ))}
              </CardActions>
            </Card>
          </Grid>
        </Grid>
      ) : (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h6" color="textSecondary">
            No active deliveries at the moment
          </Typography>
        </Paper>
      )}
    </Box>
  );
};

export default DeliveryDashboard; 