const express = require('express');
const {
  getAvailablePartners,
  updateAvailability,
  getCurrentDelivery,
  updateLocation,
} = require('../controllers/delivery.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

const router = express.Router();

router.use(protect);

router
  .route('/available')
  .get(authorize('RESTAURANT_MANAGER'), getAvailablePartners);

router
  .route('/:id/available')
  .post(authorize('DELIVERY_PARTNER'), updateAvailability);

router
  .route('/:id/current-delivery')
  .get(authorize('DELIVERY_PARTNER'), getCurrentDelivery);

router
  .route('/:id/location')
  .put(authorize('DELIVERY_PARTNER'), updateLocation);

module.exports = router; 