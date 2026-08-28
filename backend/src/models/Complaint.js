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
  // Enterprise Feature 1: Community Upvoting & "Me Too" System
  upvotes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  upvotes_count: {
    type: Number,
    default: 0,
    index: true
  },
  // Enterprise Feature 2: Automated SLA Engine & Escalation Matrix
  sla_hours: {
    type: Number,
    default: 48
  },
  sla_deadline: {
    type: Date,
    default: null,
    index: true
  },
  is_escalated: {
    type: Boolean,
    default: false,
    index: true
  },
  escalated_at: {
    type: Date,
    default: null
  },
  // Enterprise Feature 5: AI Duplicate Detection & Master Ticket Merging
  duplicate_of: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Complaint',
    default: null,
    index: true
  },
  duplicate_count: {
    type: Number,
    default: 0
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
