const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const { Complaint, Comment, Feedback, Notification, User } = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');
const { sendResolutionEmail } = require('../services/emailService');
const { complaintLimiter } = require('../middleware/rateLimiter');
const { validateComplaintInput, validateCommentInput, validateFeedbackInput } = require('../middleware/validation');
const { logAuditEvent } = require('../middleware/auditLogger');

const router = express.Router();

// Configure file uploads directory
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const ALLOWED_IMAGE_EXTS = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp', '.svg', '.avif', '.jfif'];

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const cleanExt = ALLOWED_IMAGE_EXTS.includes(ext) ? ext : '.jpg';
    const uniqueName = `complaint_${Date.now()}_${Math.round(Math.random() * 1e9)}${cleanExt}`;
    cb(null, uniqueName);
  }
});

// Robust image upload security: Only Images (JPG, PNG, WEBP, GIF, SVG, BMP, AVIF) up to 10MB
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const isImageExt = ALLOWED_IMAGE_EXTS.includes(ext);
    const isImageMime = file.mimetype && (file.mimetype.startsWith('image/') || /^application\/(octet-stream)$/.test(file.mimetype));

    if (isImageExt || isImageMime) {
      cb(null, true);
    } else {
      cb(new Error('Security restriction: Only image files (JPG, PNG, WEBP, GIF, SVG, BMP) under 10MB are permitted.'));
    }
  }
});

// Middleware wrapper to catch multer errors gracefully with 400 status
function handleImageUpload(fieldName) {
  const uploadSingle = upload.single(fieldName);
  return (req, res, next) => {
    uploadSingle(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ error: 'File size exceeds maximum allowed limit of 10MB.' });
        }
        return res.status(400).json({ error: `File upload error: ${err.message}` });
      } else if (err) {
        return res.status(400).json({ error: err.message || 'Invalid file format. Please upload an image.' });
      }
      next();
    });
  };
}

// Helper: generate guaranteed unique ticket number
async function generateTicketNumber() {
  const year = new Date().getFullYear();
  const count = await Complaint.countDocuments();
  let nextSeq = count + 1;
  let ticketNumber = `CCMS-${year}-${nextSeq.toString().padStart(4, '0')}`;

  while (await Complaint.findOne({ ticket_number: ticketNumber })) {
    nextSeq++;
    ticketNumber = `CCMS-${year}-${nextSeq.toString().padStart(4, '0')}`;
  }
  return ticketNumber;
}

// Helper: send notification
async function sendNotification(userId, title, message, complaintId) {
  try {
    if (!userId) return;
    await Notification.create({
      user_id: userId,
      title,
      message,
      complaint_id: complaintId || null
    });
  } catch (err) {
    console.error('Notification error:', err);
  }
}

// Format complaint document with student/assignee/feedback details
function formatComplaint(doc, commentCount = 0, feedback = null) {
  const c = doc.toObject ? doc.toObject() : doc;
  const idStr = (c._id || c.id).toString();

  const student = c.student_id && typeof c.student_id === 'object' ? c.student_id : null;
  const assigned = c.assigned_to && typeof c.assigned_to === 'object' ? c.assigned_to : null;

  return {
    ...c,
    id: idStr,
    student_id: student ? (student._id || student.id).toString() : (c.student_id ? c.student_id.toString() : null),
    student_name: student ? student.name : null,
    student_email: student ? student.email : null,
    student_roll: student ? student.student_id : null,
    student_phone: student ? student.phone : null,
    assigned_to: assigned ? (assigned._id || assigned.id).toString() : (c.assigned_to ? c.assigned_to.toString() : null),
    assigned_name: assigned ? assigned.name : null,
    assigned_email: assigned ? assigned.email : null,
    assigned_dept: assigned ? assigned.department : null,
    image_url: c.image_url || null,
    resolution_image: c.resolution_image || null,
    resolution_notes: c.resolution_notes || null,
    comments_count: commentCount,
    feedback_rating: feedback ? feedback.rating : (c.feedback_rating || null),
    feedback_comments: feedback ? feedback.comments : (c.feedback_comments || null)
  };
}

// 1. GET /api/complaints - List complaints with rich filtering & role scoping
router.get('/', requireAuth, async (req, res) => {
  try {
    const {
      status,
      category,
      priority,
      department,
      scope,
      search,
      sortBy = 'created_at',
      sortOrder = 'DESC',
      limit = 100,
      offset = 0
    } = req.query;

    const user = req.user;
    const userId = user.id || user._id;
    const query = {};

    // Role-based visibility
    if (user.role === 'student' || scope === 'mine') {
      if (user.role === 'student') {
        query.student_id = userId;
      }
    } else if (user.role === 'staff' && (!scope || scope === 'assigned')) {
      const staffConditions = [{ assigned_to: userId }];
      if (user.department) {
        staffConditions.push({ department: user.department });
      }
      query.$or = staffConditions;
    }

    if (status && status !== 'all') {
      query.status = status;
    }
    if (category && category !== 'all') {
      query.category = category;
    }
    if (priority && priority !== 'all') {
      query.priority = priority;
    }
    if (department && department !== 'all') {
      query.department = department;
    }

    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      query.$or = [
        { title: regex },
        { description: regex },
        { location: regex },
        { ticket_number: regex }
      ];
    }

    const sortDir = sortOrder.toUpperCase() === 'ASC' ? 1 : -1;
    const sortField = ['created_at', 'updated_at', 'priority', 'status'].includes(sortBy) ? sortBy : 'created_at';

    const complaints = await Complaint.find(query)
      .populate('student_id', 'name email student_id phone')
      .populate('assigned_to', 'name email department')
      .sort({ [sortField]: sortDir })
      .skip(Number(offset) || 0)
      .limit(Number(limit) || 100);

    const total = await Complaint.countDocuments(query);

    // Fetch comment counts and feedbacks for these complaints
    const complaintIds = complaints.map(c => c._id);
    const feedbacks = await Feedback.find({ complaint_id: { $in: complaintIds } }).lean();
    const feedbackMap = {};
    feedbacks.forEach(f => {
      feedbackMap[f.complaint_id.toString()] = f;
    });

    const formattedComplaints = complaints.map(c => {
      const fb = feedbackMap[c._id.toString()] || null;
      return formatComplaint(c, 0, fb);
    });

    res.json({
      complaints: formattedComplaints,
      pagination: {
        total,
        limit: Number(limit) || 100,
        offset: Number(offset) || 0,
        hasMore: (Number(offset) + complaints.length) < total
      }
    });
  } catch (error) {
    console.error('Fetch complaints error:', error);
    res.status(500).json({ error: 'Failed to retrieve complaints.' });
  }
});

// 2. GET /api/complaints/:id - Single complaint details
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    let complaint;

    if (mongoose.isValidObjectId(id)) {
      complaint = await Complaint.findById(id)
        .populate('student_id', 'name email student_id phone')
        .populate('assigned_to', 'name email department');
    } else {
      complaint = await Complaint.findOne({ ticket_number: id })
        .populate('student_id', 'name email student_id phone')
        .populate('assigned_to', 'name email department');
    }

    if (!complaint) {
      return res.status(404).json({ error: 'Complaint not found.' });
    }

    // Role check: Students can only view their own
    const studentObjId = complaint.student_id?._id || complaint.student_id;
    const currentUserId = req.user.id || req.user._id;
    if (req.user.role === 'student' && studentObjId.toString() !== currentUserId.toString()) {
      return res.status(403).json({ error: 'Access forbidden: You can only view your own complaints.' });
    }

    // Fetch comments
    const commentDocs = await Comment.find({ complaint_id: complaint._id })
      .populate('user_id', 'name email role department avatar')
      .sort({ created_at: 1 });

    const comments = commentDocs.map(cm => {
      const u = cm.user_id && typeof cm.user_id === 'object' ? cm.user_id : null;
      return {
        id: cm._id.toString(),
        complaint_id: cm.complaint_id.toString(),
        user_id: u ? (u._id || u.id).toString() : cm.user_id.toString(),
        user_name: u ? u.name : null,
        user_email: u ? u.email : null,
        user_role: u ? u.role : null,
        user_department: u ? u.department : null,
        user_avatar: u ? u.avatar : null,
        message: cm.message,
        is_internal: cm.is_internal,
        status_update: cm.status_update,
        created_at: cm.created_at
      };
    });

    // Fetch feedback
    const feedbackDoc = await Feedback.findOne({ complaint_id: complaint._id })
      .populate('student_id', 'name')
      .lean();

    const feedback = feedbackDoc ? {
      id: feedbackDoc._id.toString(),
      complaint_id: feedbackDoc.complaint_id.toString(),
      student_id: feedbackDoc.student_id ? (feedbackDoc.student_id._id || feedbackDoc.student_id).toString() : null,
      student_name: feedbackDoc.student_id ? feedbackDoc.student_id.name : null,
      rating: feedbackDoc.rating,
      comments: feedbackDoc.comments,
      created_at: feedbackDoc.created_at
    } : null;

    res.json({
      complaint: formatComplaint(complaint, comments.length, feedback),
      comments,
      feedback
    });
  } catch (error) {
    console.error('Fetch complaint details error:', error);
    res.status(500).json({ error: 'Failed to retrieve complaint details.' });
  }
});

// 3. POST /api/complaints - Submit new complaint
router.post('/', requireAuth, complaintLimiter, handleImageUpload('image'), validateComplaintInput, async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      location,
      building,
      room,
      priority = 'Medium'
    } = req.body;

    const validCategories = [
      'Wi-Fi & IT',
      'Hostel Affairs',
      'Hostel',
      'Maintenance & Infrastructure',
      'Infrastructure',
      'Infrastructure & Maintenance',
      'Electrical & Plumbing',
      'Academics',
      'Canteen & Mess',
      'Mess / Canteen',
      'Transport',
      'Transportation',
      'Library',
      'Sports & Gymnasium',
      'Security & Discipline',
      'Other'
    ];

    if (!validCategories.includes(category)) {
      return res.status(400).json({ error: `Invalid category. Must be one of: ${validCategories.join(', ')}` });
    }

    const validPriorities = ['Low', 'Medium', 'High', 'Critical'];
    const assignedPriority = validPriorities.includes(priority) ? priority : 'Medium';

    const categoryDepartmentMap = {
      'Wi-Fi & IT': 'Wi-Fi & IT',
      'Hostel Affairs': 'Hostel Affairs',
      'Hostel': 'Hostel Affairs',
      'Maintenance & Infrastructure': 'Maintenance & Infrastructure',
      'Infrastructure': 'Maintenance & Infrastructure',
      'Infrastructure & Maintenance': 'Maintenance & Infrastructure',
      'Electrical & Plumbing': 'Electrical & Plumbing',
      'Academics': 'Academic Cell',
      'Canteen & Mess': 'Canteen & Mess',
      'Mess / Canteen': 'Canteen & Mess',
      'Transport': 'Transport Operations',
      'Transportation': 'Transport Operations',
      'Library': 'Library Administration',
      'Sports & Gymnasium': 'Sports Cell',
      'Security & Discipline': 'Campus Security',
      'Other': 'General Grievance Cell'
    };

    const autoDepartment = categoryDepartmentMap[category] || 'General Grievance Cell';
    const ticketNumber = await generateTicketNumber();
    
    let imageUrl = null;
    if (req.file) {
      try {
        const fileBuffer = fs.readFileSync(req.file.path);
        const mime = req.file.mimetype || 'image/jpeg';
        imageUrl = `data:${mime};base64,${fileBuffer.toString('base64')}`;
      } catch (err) {
        imageUrl = `/uploads/${req.file.filename}`;
      }
    } else if (req.body.image_data && typeof req.body.image_data === 'string' && req.body.image_data.startsWith('data:image/')) {
      imageUrl = req.body.image_data;
    }

    const currentUserId = req.user.id || req.user._id;

    const newComplaint = await Complaint.create({
      ticket_number: ticketNumber,
      title: title.trim(),
      description: description.trim(),
      category,
      location: location.trim(),
      building: building ? building.trim() : null,
      room: room ? room.trim() : null,
      image_url: imageUrl,
      status: 'Submitted',
      priority: assignedPriority,
      student_id: currentUserId,
      department: autoDepartment
    });

    // Create initial tracking comment
    await Comment.create({
      complaint_id: newComplaint._id,
      user_id: currentUserId,
      message: `Grievance registered in portal. Auto-assigned to department: ${autoDepartment}.`,
      status_update: 'Submitted'
    });

    // Send notification to student
    await sendNotification(
      currentUserId,
      `Complaint Submitted: ${ticketNumber}`,
      `Your complaint "${title}" has been received and assigned ticket #${ticketNumber}.`,
      newComplaint._id
    );

    // Audit log
    await logAuditEvent({
      userId: currentUserId,
      userEmail: req.user.email,
      action: 'COMPLAINT_CREATED',
      entityType: 'Complaint',
      entityId: newComplaint._id,
      ipAddress: req.ip,
      details: { ticketNumber, category, priority: assignedPriority, autoDepartment }
    });

    res.status(201).json({
      message: 'Complaint submitted successfully.',
      complaint: formatComplaint(newComplaint)
    });
  } catch (error) {
    console.error('Submit complaint error:', error);
    res.status(500).json({ error: 'Failed to submit complaint. Please try again.' });
  }
});

// 4. PUT /api/complaints/:id/status - Update status & resolution
router.put('/:id/status', requireAuth, requireRole(['admin', 'staff']), handleImageUpload('resolution_image'), async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes, resolution_notes } = req.body;
    const finalNotes = (resolution_notes && resolution_notes.trim()) || (notes && notes.trim()) || '';

    const validStatuses = ['Submitted', 'Under Review', 'Assigned', 'In Progress', 'Resolved', 'Closed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
    }

    const complaint = await Complaint.findById(id).populate('student_id', 'name email');
    if (!complaint) {
      return res.status(404).json({ error: 'Complaint not found.' });
    }

    const previousStatus = complaint.status;
    complaint.status = status;
    complaint.updated_at = new Date();

    if (req.file) {
      try {
        const fileBuffer = fs.readFileSync(req.file.path);
        const mime = req.file.mimetype || 'image/jpeg';
        complaint.resolution_image = `data:${mime};base64,${fileBuffer.toString('base64')}`;
      } catch (err) {
        complaint.resolution_image = `/uploads/${req.file.filename}`;
      }
    } else if (req.body.resolution_image_data && typeof req.body.resolution_image_data === 'string' && req.body.resolution_image_data.startsWith('data:image/')) {
      complaint.resolution_image = req.body.resolution_image_data;
    }

    if (finalNotes) {
      complaint.resolution_notes = finalNotes;
    }

    if (status === 'Resolved') {
      complaint.resolved_at = new Date();
    } else if (status === 'Closed') {
      complaint.closed_at = new Date();
    }

    await complaint.save();

    const currentUserId = req.user.id || req.user._id;

    // Add status update comment
    const commentMessage = finalNotes
      ? `Status updated from "${previousStatus}" to "${status}". Notes: ${finalNotes}`
      : `Status updated from "${previousStatus}" to "${status}".`;

    await Comment.create({
      complaint_id: complaint._id,
      user_id: currentUserId,
      message: commentMessage,
      status_update: status
    });

    // Notify student
    const studentId = complaint.student_id?._id || complaint.student_id;
    await sendNotification(
      studentId,
      `Status Update: #${complaint.ticket_number}`,
      `Your complaint status is now "${status}".`,
      complaint._id
    );

    // If marked as Resolved -> Dispatch automated campus resolution email
    if (status === 'Resolved') {
      const studentEmail = complaint.student_id?.email;
      const studentName = complaint.student_id?.name || 'Student';

      if (studentEmail) {
        sendResolutionEmail({
          to: studentEmail,
          studentName,
          ticketNumber: complaint.ticket_number,
          title: complaint.title,
          category: complaint.category,
          resolutionNotes: notes && notes.trim() ? notes.trim() : 'The reported issue has been repaired and verified by the campus service team.',
          resolvedBy: req.user.name || 'Campus Service Staff',
          complaintId: complaint._id
        }).catch(e => console.error('Automated email dispatch error:', e));
      }
    }

    // Audit log
    await logAuditEvent({
      userId: currentUserId,
      userEmail: req.user.email,
      action: 'COMPLAINT_STATUS_UPDATED',
      entityType: 'Complaint',
      entityId: complaint._id,
      ipAddress: req.ip,
      details: { previousStatus, newStatus: status, notes }
    });

    res.json({
      message: `Complaint status updated to "${status}".`,
      complaint: formatComplaint(complaint)
    });
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({ error: 'Failed to update complaint status.' });
  }
});

// 5. PUT /api/complaints/:id/assign - Assign staff member & department
router.put('/:id/assign', requireAuth, requireRole(['admin', 'staff']), async (req, res) => {
  try {
    const { id } = req.params;
    const { assigned_to, department } = req.body;

    const complaint = await Complaint.findById(id);
    if (!complaint) {
      return res.status(404).json({ error: 'Complaint not found.' });
    }

    let staff = null;
    if (assigned_to) {
      staff = await User.findById(assigned_to);
      if (!staff) {
        return res.status(404).json({ error: 'Assigned staff user not found.' });
      }
    }

    complaint.assigned_to = assigned_to || null;
    if (department) {
      complaint.department = department;
    }
    if (complaint.status === 'Submitted') {
      complaint.status = 'Assigned';
    }
    complaint.updated_at = new Date();
    await complaint.save();

    const currentUserId = req.user.id || req.user._id;

    // Comment
    const assignText = staff
      ? `Complaint assigned to ${staff.name} (${staff.department || department || 'Staff'}). Status set to Assigned.`
      : `Department updated to ${department}.`;

    await Comment.create({
      complaint_id: complaint._id,
      user_id: currentUserId,
      message: assignText,
      status_update: complaint.status
    });

    // Notify assigned staff
    if (staff) {
      await sendNotification(
        staff._id,
        `New Task Assigned: #${complaint.ticket_number}`,
        `You have been assigned complaint: "${complaint.title}".`,
        complaint._id
      );
    }

    // Notify student
    await sendNotification(
      complaint.student_id,
      `Task Assigned: #${complaint.ticket_number}`,
      `Your complaint has been assigned to ${staff ? staff.name : 'the service team'}.`,
      complaint._id
    );

    // Audit log
    await logAuditEvent({
      userId: currentUserId,
      userEmail: req.user.email,
      action: 'COMPLAINT_ASSIGNED',
      entityType: 'Complaint',
      entityId: complaint._id,
      ipAddress: req.ip,
      details: { assignedTo: staff?.name, department }
    });

    res.json({
      message: 'Complaint successfully assigned.',
      complaint: formatComplaint(complaint)
    });
  } catch (error) {
    console.error('Assign complaint error:', error);
    res.status(500).json({ error: 'Failed to assign complaint.' });
  }
});

// 6. PUT /api/complaints/:id/priority - Elevate/Update priority
router.put('/:id/priority', requireAuth, requireRole(['admin', 'staff']), async (req, res) => {
  try {
    const { id } = req.params;
    const { priority } = req.body;

    const validPriorities = ['Low', 'Medium', 'High', 'Critical'];
    if (!validPriorities.includes(priority)) {
      return res.status(400).json({ error: `Invalid priority. Must be one of: ${validPriorities.join(', ')}` });
    }

    const complaint = await Complaint.findById(id);
    if (!complaint) {
      return res.status(404).json({ error: 'Complaint not found.' });
    }

    const prevPriority = complaint.priority;
    complaint.priority = priority;
    complaint.updated_at = new Date();
    await complaint.save();

    const currentUserId = req.user.id || req.user._id;

    await Comment.create({
      complaint_id: complaint._id,
      user_id: currentUserId,
      message: `Priority adjusted from ${prevPriority} to ${priority}.`
    });

    res.json({
      message: `Priority updated to ${priority}.`,
      complaint: formatComplaint(complaint)
    });
  } catch (error) {
    console.error('Update priority error:', error);
    res.status(500).json({ error: 'Failed to update priority.' });
  }
});

// 7. POST /api/complaints/:id/comments - Add comment/message
router.post('/:id/comments', requireAuth, validateCommentInput, async (req, res) => {
  try {
    const { id } = req.params;
    const { message, is_internal = false } = req.body;

    const complaint = await Complaint.findById(id);
    if (!complaint) {
      return res.status(404).json({ error: 'Complaint not found.' });
    }

    const currentUserId = req.user.id || req.user._id;

    // Student can only comment on own complaint
    if (req.user.role === 'student' && complaint.student_id.toString() !== currentUserId.toString()) {
      return res.status(403).json({ error: 'Access forbidden: You cannot comment on this complaint.' });
    }

    // Only staff/admin can post internal notes
    const isInternalFinal = (req.user.role === 'admin' || req.user.role === 'staff') ? !!is_internal : false;

    const newComment = await Comment.create({
      complaint_id: complaint._id,
      user_id: currentUserId,
      message: message.trim(),
      is_internal: isInternalFinal
    });

    // Notify other party
    if (req.user.role === 'student') {
      if (complaint.assigned_to) {
        await sendNotification(
          complaint.assigned_to,
          `New Message on #${complaint.ticket_number}`,
          `${req.user.name}: "${message.slice(0, 60)}..."`,
          complaint._id
        );
      }
    } else if (!isInternalFinal) {
      await sendNotification(
        complaint.student_id,
        `Staff Responded to #${complaint.ticket_number}`,
        `${req.user.name}: "${message.slice(0, 60)}..."`,
        complaint._id
      );
    }

    res.status(201).json({
      message: 'Comment added successfully.',
      comment: {
        id: newComment._id.toString(),
        complaint_id: newComment.complaint_id.toString(),
        user_id: currentUserId.toString(),
        user_name: req.user.name,
        user_email: req.user.email,
        user_role: req.user.role,
        user_department: req.user.department,
        message: newComment.message,
        is_internal: newComment.is_internal,
        created_at: newComment.created_at
      }
    });
  } catch (error) {
    console.error('Post comment error:', error);
    res.status(500).json({ error: 'Failed to post comment.' });
  }
});

// 8. POST /api/complaints/:id/feedback - Submit rating
router.post('/:id/feedback', requireAuth, validateFeedbackInput, async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, comments } = req.body;

    const complaint = await Complaint.findById(id);
    if (!complaint) {
      return res.status(404).json({ error: 'Complaint not found.' });
    }

    const currentUserId = req.user.id || req.user._id;

    if (complaint.student_id.toString() !== currentUserId.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only the student who submitted this complaint can provide feedback.' });
    }

    const existingFeedback = await Feedback.findOne({ complaint_id: complaint._id });
    if (existingFeedback) {
      return res.status(409).json({ error: 'Feedback has already been submitted for this complaint.' });
    }

    const numericRating = Number(rating);
    if (isNaN(numericRating) || numericRating < 1 || numericRating > 5) {
      return res.status(400).json({ error: 'Rating must be a whole number between 1 and 5.' });
    }

    const newFeedback = await Feedback.create({
      complaint_id: complaint._id,
      student_id: currentUserId,
      rating: numericRating,
      comments: comments ? comments.trim() : null
    });

    // Auto-close ticket
    complaint.status = 'Closed';
    complaint.closed_at = new Date();
    complaint.updated_at = new Date();
    await complaint.save();

    await Comment.create({
      complaint_id: complaint._id,
      user_id: currentUserId,
      message: `Student closed ticket with a ${numericRating}-star rating.${comments ? ' Feedback: "' + comments.trim() + '"' : ''}`,
      status_update: 'Closed'
    });

    if (complaint.assigned_to) {
      await sendNotification(
        complaint.assigned_to,
        `Feedback Received: #${complaint.ticket_number}`,
        `Student rated your resolution ${numericRating}/5 stars. Ticket is now Closed.`,
        complaint._id
      );
    }

    res.status(201).json({
      message: 'Thank you! Your feedback has been recorded and the complaint is now closed.',
      feedback: {
        id: newFeedback._id.toString(),
        complaint_id: newFeedback.complaint_id.toString(),
        rating: newFeedback.rating,
        comments: newFeedback.comments,
        created_at: newFeedback.created_at
      }
    });
  } catch (error) {
    console.error('Submit feedback error:', error);
    res.status(500).json({ error: 'Failed to submit feedback.' });
  }
});

// 9. DELETE /api/complaints/:id - Delete complaint (Admin or Student Owner)
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const currentUserId = (req.user.id || req.user._id).toString();
    const userRole = req.user.role;

    // Support lookup by MongoDB _id or ticket_number
    let complaint = null;
    if (mongoose.Types.ObjectId.isValid(id)) {
      complaint = await Complaint.findById(id);
    }
    if (!complaint) {
      complaint = await Complaint.findOne({ ticket_number: id });
    }

    if (!complaint) {
      return res.status(404).json({ error: 'Complaint not found.' });
    }

    const isOwner = complaint.student_id && complaint.student_id.toString() === currentUserId;
    const isAdmin = userRole === 'admin';

    // Only Dean / Admin or the student creator can delete
    if (!isAdmin && !isOwner) {
      return res.status(403).json({ error: 'Access denied: You can only delete complaints that you created.' });
    }

    await Comment.deleteMany({ complaint_id: complaint._id });
    await Feedback.deleteMany({ complaint_id: complaint._id });
    await Notification.deleteMany({ complaint_id: complaint._id });
    await Complaint.findByIdAndDelete(complaint._id);

    await logAuditEvent({
      userId: currentUserId,
      userEmail: req.user.email,
      action: 'COMPLAINT_DELETED',
      entityType: 'Complaint',
      entityId: complaint._id,
      ipAddress: req.ip,
      details: { ticketNumber: complaint.ticket_number, title: complaint.title, deletedBy: userRole }
    });

    res.json({ message: `Complaint #${complaint.ticket_number} deleted successfully.` });
  } catch (error) {
    console.error('Delete complaint error:', error);
    res.status(500).json({ error: 'Failed to delete complaint.' });
  }
});

module.exports = router;
