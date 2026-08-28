const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['student', 'admin', 'staff'],
    default: 'student'
  },
  department: {
    type: String,
    default: null,
    trim: true
  },
  student_id: {
    type: String,
    default: null,
    trim: true
  },
  phone: {
    type: String,
    default: null,
    trim: true
  },
  avatar: {
    type: String,
    default: null
  },
  failed_login_attempts: {
    type: Number,
    default: 0
  },
  lock_until: {
    type: Date,
    default: null
  },
  created_at: {
    type: Date,
    default: Date.now
  }
});

// Format object for client (id alias for _id)
userSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model('User', userSchema);
