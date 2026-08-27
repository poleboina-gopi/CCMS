const express = require('express');
const { Complaint, Feedback, AuditLog, User } = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

// GET /api/analytics/dashboard - Analytics & KPI summary
router.get('/dashboard', requireAuth, async (req, res) => {
  try {
    const user = req.user;
    const userId = user.id || user._id;
    const isStudent = user.role === 'student';
    const isStaff = user.role === 'staff';

    const filter = {};
    if (isStudent) {
      filter.student_id = userId;
    } else if (isStaff) {
      const staffConds = [{ assigned_to: userId }];
      if (user.department) {
        staffConds.push({ department: user.department });
      }
      filter.$or = staffConds;
    }

    // 1. KPI Counts
    const total = await Complaint.countDocuments(filter);
    const submittedCount = await Complaint.countDocuments({ ...filter, status: 'Submitted' });
    const underReviewCount = await Complaint.countDocuments({ ...filter, status: 'Under Review' });
    const assignedCount = await Complaint.countDocuments({ ...filter, status: 'Assigned' });
    const inProgressCount = await Complaint.countDocuments({ ...filter, status: 'In Progress' });
    const resolvedCount = await Complaint.countDocuments({ ...filter, status: 'Resolved' });
    const closedCount = await Complaint.countDocuments({ ...filter, status: 'Closed' });
    const criticalCount = await Complaint.countDocuments({
      ...filter,
      priority: 'Critical',
      status: { $nin: ['Resolved', 'Closed'] }
    });

    const totalResolved = resolvedCount + closedCount;
    const resolutionRate = total > 0 ? Math.round((totalResolved / total) * 100) : 0;

    // 2. Average Rating
    let feedbackFilter = {};
    if (isStudent) {
      feedbackFilter.student_id = userId;
    } else if (isStaff) {
      const staffComplaints = await Complaint.find(filter).select('_id').lean();
      feedbackFilter.complaint_id = { $in: staffComplaints.map(c => c._id) };
    }

    const feedbacks = await Feedback.find(feedbackFilter).select('rating').lean();
    let averageRating = 0;
    const ratingCount = feedbacks.length;
    if (ratingCount > 0) {
      const sum = feedbacks.reduce((acc, f) => acc + (f.rating || 0), 0);
      averageRating = Number((sum / ratingCount).toFixed(1));
    }

    // 3. Category Breakdown
    const complaintsForStats = await Complaint.find(filter).select('category status priority department').lean();
    const categoryMap = {};
    complaintsForStats.forEach(c => {
      const cat = c.category || 'Other';
      if (!categoryMap[cat]) {
        categoryMap[cat] = { category: cat, total: 0, resolved: 0, pending: 0 };
      }
      categoryMap[cat].total++;
      if (['Resolved', 'Closed'].includes(c.status)) {
        categoryMap[cat].resolved++;
      } else {
        categoryMap[cat].pending++;
      }
    });
    const categoryStats = Object.values(categoryMap).sort((a, b) => b.total - a.total);

    // 4. Status Breakdown
    const statusStats = [
      { status: 'Submitted', count: submittedCount, color: '#6366f1' },
      { status: 'Under Review', count: underReviewCount, color: '#8b5cf6' },
      { status: 'Assigned', count: assignedCount, color: '#3b82f6' },
      { status: 'In Progress', count: inProgressCount, color: '#f59e0b' },
      { status: 'Resolved', count: resolvedCount, color: '#10b981' },
      { status: 'Closed', count: closedCount, color: '#64748b' }
    ];

    // 5. Priority Distribution
    const priorityMap = { Low: 0, Medium: 0, High: 0, Critical: 0 };
    complaintsForStats.forEach(c => {
      if (priorityMap[c.priority] !== undefined) {
        priorityMap[c.priority]++;
      }
    });
    const priorityStats = Object.keys(priorityMap).map(p => ({
      priority: p,
      count: priorityMap[p]
    }));

    // 6. Department Workload
    const allComplaints = await Complaint.find({}).select('department status').lean();
    const deptMap = {};
    allComplaints.forEach(c => {
      const dept = c.department || 'Unassigned';
      if (!deptMap[dept]) {
        deptMap[dept] = { department: dept, total: 0, resolved: 0, active: 0 };
      }
      deptMap[dept].total++;
      if (['Resolved', 'Closed'].includes(c.status)) {
        deptMap[dept].resolved++;
      } else {
        deptMap[dept].active++;
      }
    });
    const departmentStats = Object.values(deptMap).sort((a, b) => b.total - a.total);

    // 7. Recent Urgent Complaints
    const urgentDocs = await Complaint.find({
      ...filter,
      status: { $nin: ['Resolved', 'Closed'] }
    })
      .populate('student_id', 'name')
      .sort({ created_at: -1 })
      .limit(6)
      .lean();

    const urgentQueue = urgentDocs.map(c => ({
      id: c._id.toString(),
      ticket_number: c.ticket_number,
      title: c.title,
      category: c.category,
      location: c.location,
      priority: c.priority,
      status: c.status,
      created_at: c.created_at,
      student_name: c.student_id?.name || 'Student'
    }));

    res.json({
      kpis: {
        total,
        pending: submittedCount + underReviewCount,
        inProgress: assignedCount + inProgressCount,
        resolved: totalResolved,
        critical: criticalCount,
        resolutionRate,
        averageRating,
        ratingCount
      },
      statusStats,
      categoryStats,
      priorityStats,
      departmentStats,
      urgentQueue
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ error: 'Failed to compute analytics.' });
  }
});

// GET /api/analytics/audit-logs - View security and administrative event audit trails (Admin only)
router.get('/audit-logs', requireAuth, requireRole(['admin']), async (req, res) => {
  try {
    const logDocs = await AuditLog.find({})
      .sort({ created_at: -1 })
      .limit(100)
      .lean();

    res.json({
      logs: logDocs.map(l => ({
        ...l,
        id: l._id.toString()
      }))
    });
  } catch (error) {
    console.error('Fetch audit logs error:', error);
    res.status(500).json({ error: 'Failed to retrieve audit logs.' });
  }
});

module.exports = router;
