const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  complaint_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Complaint',
    required: true,
    index: true
  },
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  message: {
    type: String,
    required: true,
    trim: true
  },
  is_internal: {
    type: Boolean,
    default: false
  },
  status_update: {
    type: String,
    default: null
  },
  created_at: {
    type: Date,
    default: Date.now
  }
});

commentSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model('Comment', commentSchema);
