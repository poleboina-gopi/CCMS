const mongoose = require('mongoose');

const emailSchema = new mongoose.Schema({
  recipient_email: {
    type: String,
    required: true,
    index: true
  },
  recipient_name: {
    type: String,
    default: null
  },
  subject: {
    type: String,
    required: true
  },
  body_html: {
    type: String,
    required: true
  },
  complaint_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Complaint',
    default: null
  },
  status: {
    type: String,
    default: 'sent'
  },
  created_at: {
    type: Date,
    default: Date.now
  }
});

emailSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model('Email', emailSchema);
