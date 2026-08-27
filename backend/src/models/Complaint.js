const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema({
  ticket_number: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    required: true,
    index: true
  },
  location: {
    type: String,
    required: true,
    trim: true
  },
  building: {
    type: String,
    default: null,
    trim: true
  },
  room: {
    type: String,
    default: null,
    trim: true
  },
  image_url: {
    type: String,
    default: null
  },
  status: {
    type: String,
    enum: ['Submitted', 'Under Review', 'Assigned', 'In Progress', 'Resolved', 'Closed'],
    default: 'Submitted',
    index: true
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Critical'],
    default: 'Medium',
    index: true
  },
  student_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  assigned_to: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
    index: true
  },
  department: {
    type: String,
    default: null,
    trim: true
  },
  resolution_notes: {
    type: String,
    default: null
  },
  resolution_image: {
    type: String,
    default: null
  },
  resolved_at: {
    type: Date,
    default: null
  },
  closed_at: {
    type: Date,
    default: null
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
});

complaintSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model('Complaint', complaintSchema);
