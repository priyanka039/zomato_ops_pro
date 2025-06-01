const User = require('../models/user.model');
const Order = require('../models/order.model');

// @desc    Get all available delivery partners
// @route   GET /api/v1/delivery-partners/available
// @access  Private/Restaurant
exports.getAvailablePartners = async (req, res, next) => {
  try {
    const partners = await User.find({
      role: 'DELIVERY_PARTNER',
      isAvailable: true,
    }).select('name currentLocation');

    res.status(200).json({
      success: true,
      count: partners.length,
      data: partners,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update delivery partner availability
// @route   POST /api/v1/delivery-partners/:id/available
// @access  Private/Delivery
exports.updateAvailability = async (req, res, next) => {
  try {
    const partner = await User.findById(req.params.id);

    if (!partner) {
      return res.status(404).json({
        success: false,
        message: 'Delivery partner not found',
      });
    }

    // Make sure user is updating their own availability
    if (partner._id.toString() !== req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to update this delivery partner',
      });
    }

    partner.isAvailable = req.body.isAvailable;
    await partner.save();

    res.status(200).json({
      success: true,
      data: partner,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get current delivery
// @route   GET /api/v1/delivery-partners/:id/current-delivery
// @access  Private/Delivery
exports.getCurrentDelivery = async (req, res, next) => {
  try {
    const order = await Order.findOne({
      deliveryPartner: req.params.id,
      status: { $in: ['PICKED', 'ON_ROUTE'] },
    })
      .populate('restaurant', 'name')
      .sort('-assignedAt');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'No active delivery found',
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

// @desc    Update delivery partner location
// @route   PUT /api/v1/delivery-partners/:id/location
// @access  Private/Delivery
exports.updateLocation = async (req, res, next) => {
  try {
    const partner = await User.findById(req.params.id);

    if (!partner) {
      return res.status(404).json({
        success: false,
        message: 'Delivery partner not found',
      });
    }

    // Make sure user is updating their own location
    if (partner._id.toString() !== req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to update this delivery partner',
      });
    }

    partner.currentLocation = req.body.location;
    await partner.save();

    res.status(200).json({
      success: true,
      data: partner,
    });
  } catch (err) {
    next(err);
  }
}; 