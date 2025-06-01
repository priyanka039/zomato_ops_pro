const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  items: {
    type: String,
    required: [true, 'Order items are required'],
  },
  status: {
    type: String,
    enum: ['PREP', 'PICKED', 'ON_ROUTE', 'DELIVERED'],
    default: 'PREP',
  },
  prepTime: {
    type: Number,
    required: [true, 'Preparation time is required'],
    min: [1, 'Preparation time must be at least 1 minute'],
  },
  restaurant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Restaurant is required'],
  },
  deliveryPartner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  customerLocation: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point',
    },
    coordinates: {
      type: [Number],
      default: [0, 0]
    },
    address: {
      type: String,
      default: 'To be updated'
    },
  },
  assignedAt: {
    type: Date,
  },
  deliveredAt: {
    type: Date,
  },
}, {
  timestamps: true,
});

// Create index for location-based queries
orderSchema.index({ customerLocation: '2dsphere' });

// Add a virtual field for order duration
orderSchema.virtual('duration').get(function() {
  if (this.deliveredAt && this.createdAt) {
    return Math.round((this.deliveredAt - this.createdAt) / 1000 / 60); // Duration in minutes
  }
  return null;
});

// Ensure virtuals are included in JSON output
orderSchema.set('toJSON', { virtuals: true });
orderSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Order', orderSchema); 