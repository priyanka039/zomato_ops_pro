const Order = require('../models/order.model');
const User = require('../models/user.model');

// @desc    Create new order
// @route   POST /api/v1/orders
// @access  Private/Restaurant
exports.createOrder = async (req, res, next) => {
  try {
    req.body.restaurant = req.user.id;
    const order = await Order.create(req.body);

    res.status(201).json({
      success: true,
      data: order,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get all orders
// @route   GET /api/v1/orders
// @access  Private/Restaurant
exports.getOrders = async (req, res, next) => {
  try {
    let query;

    if (req.user.role === 'RESTAURANT_MANAGER') {
      query = Order.find({ restaurant: req.user.id });
    } else {
      query = Order.find({ deliveryPartner: req.user.id });
    }

    const orders = await query
      .populate('restaurant', 'name')
      .populate('deliveryPartner', 'name')
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      count: orders.length,
      data: orders,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single order
// @route   GET /api/v1/orders/:id
// @access  Private
exports.getOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('restaurant', 'name')
      .populate('deliveryPartner', 'name');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    // Make sure user is order owner or delivery partner
    if (
      order.restaurant.toString() !== req.user.id &&
      (order.deliveryPartner && order.deliveryPartner.toString() !== req.user.id)
    ) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this order',
      });
    }

    res.status(200).json({
      success: true,
      data: order,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update order status
// @route   PUT /api/v1/orders/:id/status
// @access  Private
exports.updateOrderStatus = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    // Make sure user is order owner or delivery partner
    if (
      order.restaurant.toString() !== req.user.id &&
      (order.deliveryPartner && order.deliveryPartner.toString() !== req.user.id)
    ) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to update this order',
      });
    }

    order.status = req.body.status;

    if (req.body.status === 'DELIVERED') {
      order.deliveredAt = Date.now();
    }

    await order.save();

    res.status(200).json({
      success: true,
      data: order,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Assign delivery partner to order
// @route   POST /api/v1/orders/:id/assign
// @access  Private/Restaurant
exports.assignDeliveryPartner = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    // Make sure user is order owner
    if (order.restaurant.toString() !== req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to assign delivery partner to this order',
      });
    }

    const deliveryPartner = await User.findById(req.body.partnerId);

    if (!deliveryPartner || deliveryPartner.role !== 'DELIVERY_PARTNER') {
      return res.status(400).json({
        success: false,
        message: 'Invalid delivery partner',
      });
    }

    if (!deliveryPartner.isAvailable) {
      return res.status(400).json({
        success: false,
        message: 'Delivery partner is not available',
      });
    }

    order.deliveryPartner = deliveryPartner._id;
    order.assignedAt = Date.now();
    await order.save();

    // Update delivery partner availability
    deliveryPartner.isAvailable = false;
    await deliveryPartner.save();

    res.status(200).json({
      success: true,
      data: order,
    });
  } catch (err) {
    next(err);
  }
}; 