const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters long'],
    select: false,
  },
  role: {
    type: String,
    enum: ['RESTAURANT_MANAGER', 'DELIVERY_PARTNER'],
    required: [true, 'Role is required'],
  },
  name: {
    type: String,
    required: [true, 'Name is required'],
  },
  isAvailable: {
    type: Boolean,
    default: true,
  },
  currentLocation: {
    type: {
      type: String,
      enum: ['Point'],
    },
    coordinates: {
      type: [Number],
    },
  },
}, {
  timestamps: true,
});

// Create index for location-based queries
userSchema.index({ currentLocation: '2dsphere' });

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Sign JWT and return
userSchema.methods.getSignedJwtToken = function() {
  const jwtSecret = process.env.JWT_SECRET || 'your_jwt_secret_key_here_change_in_production';
  return jwt.sign(
    { id: this._id, role: this.role },
    jwtSecret,
    { expiresIn: '30d' } // Fixed 30 days expiration
  );
};

// Match password
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema); 