const express = require('express');
const {
  createOrder,
  getOrders,
  getOrder,
  updateOrderStatus,
  assignDeliveryPartner,
} = require('../controllers/order.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

const router = express.Router();

router.use(protect);

router
  .route('/')
  .post(authorize('RESTAURANT_MANAGER'), createOrder)
  .get(getOrders);

router
  .route('/:id')
  .get(getOrder);

router
  .route('/:id/status')
  .put(updateOrderStatus);

router
  .route('/:id/assign')
  .post(authorize('RESTAURANT_MANAGER'), assignDeliveryPartner);

module.exports = router; 