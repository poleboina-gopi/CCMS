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

    let feedbackFilter = {};
    if (isStudent) {
      feedbackFilter.student_id = userId;
    }

    // High Performance: Run all 4 independent queries concurrently in parallel
    const [complaintsForStats, allComplaints, feedbacks, urgentDocs] = await Promise.all([
      Complaint.find(filter).select('category status priority department created_at ticket_number title location student_id').lean(),
      Complaint.find({}).select('department status').lean(),
      Feedback.find(feedbackFilter).select('rating complaint_id').lean(),
      Complaint.find({
        ...filter,
        status: { $nin: ['Resolved', 'Closed'] }
      })
        .populate('student_id', 'name')
        .sort({ created_at: -1 })
        .limit(6)
        .lean()
    ]);

    // Compute all KPI stats from complaintsForStats in memory (microsecond speed)
    const total = complaintsForStats.length;
    let submittedCount = 0;
    let underReviewCount = 0;
    let assignedCount = 0;
    let inProgressCount = 0;
    let resolvedCount = 0;
    let closedCount = 0;
    let criticalCount = 0;

    const categoryMap = {};
    const priorityMap = { Low: 0, Medium: 0, High: 0, Critical: 0 };

    for (let i = 0; i < complaintsForStats.length; i++) {
      const c = complaintsForStats[i];
      const st = c.status;
      if (st === 'Submitted') submittedCount++;
      else if (st === 'Under Review') underReviewCount++;
      else if (st === 'Assigned') assignedCount++;
      else if (st === 'In Progress') inProgressCount++;
      else if (st === 'Resolved') resolvedCount++;
      else if (st === 'Closed') closedCount++;

      if (c.priority === 'Critical' && st !== 'Resolved' && st !== 'Closed') {
        criticalCount++;
      }

      if (priorityMap[c.priority] !== undefined) {
        priorityMap[c.priority]++;
      }

      const cat = c.category || 'Other';
      if (!categoryMap[cat]) {
        categoryMap[cat] = { category: cat, total: 0, resolved: 0, pending: 0 };
      }
      categoryMap[cat].total++;
      if (st === 'Resolved' || st === 'Closed') {
        categoryMap[cat].resolved++;
      } else {
        categoryMap[cat].pending++;
      }
    }

    const totalResolved = resolvedCount + closedCount;
    const resolutionRate = total > 0 ? Math.round((totalResolved / total) * 100) : 0;

    // Average Rating
    let averageRating = 0;
    const ratingCount = feedbacks.length;
    if (ratingCount > 0) {
      const sum = feedbacks.reduce((acc, f) => acc + (f.rating || 0), 0);
      averageRating = Number((sum / ratingCount).toFixed(1));
    }

    const categoryStats = Object.values(categoryMap).sort((a, b) => b.total - a.total);

    const statusStats = [
      { status: 'Submitted', count: submittedCount, color: '#6366f1' },
      { status: 'Under Review', count: underReviewCount, color: '#8b5cf6' },
      { status: 'Assigned', count: assignedCount, color: '#3b82f6' },
      { status: 'In Progress', count: inProgressCount, color: '#f59e0b' },
      { status: 'Resolved', count: resolvedCount, color: '#10b981' },
      { status: 'Closed', count: closedCount, color: '#64748b' }
    ];

    const priorityStats = Object.keys(priorityMap).map(p => ({
      priority: p,
      count: priorityMap[p]
    }));

    // Department workload
    const deptMap = {};
    for (let i = 0; i < allComplaints.length; i++) {
      const c = allComplaints[i];
      const dept = c.department || 'Unassigned';
      if (!deptMap[dept]) {
        deptMap[dept] = { department: dept, total: 0, resolved: 0, active: 0 };
      }
      deptMap[dept].total++;
      if (c.status === 'Resolved' || c.status === 'Closed') {
        deptMap[dept].resolved++;
      } else {
        deptMap[dept].active++;
      }
    }
    const departmentStats = Object.values(deptMap).sort((a, b) => b.total - a.total);

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

// GET /api/analytics/heatmaps - Campus facility complaint density (Enterprise Feature 6)
router.get('/heatmaps', requireAuth, async (req, res) => {
  try {
    const complaints = await Complaint.find({}).select('building room category status priority upvotes_count').lean();

    const buildingMap = {};
    complaints.forEach(c => {
      const b = c.building || 'General Campus';
      if (!buildingMap[b]) {
        buildingMap[b] = {
          building: b,
          total: 0,
          active: 0,
          resolved: 0,
          critical: 0,
          categories: {}
        };
      }
      buildingMap[b].total++;
      if (['Resolved', 'Closed'].includes(c.status)) {
        buildingMap[b].resolved++;
      } else {
        buildingMap[b].active++;
      }
      if (c.priority === 'Critical') {
        buildingMap[b].critical++;
      }
      const cat = c.category || 'Other';
      buildingMap[b].categories[cat] = (buildingMap[b].categories[cat] || 0) + 1;
    });

    const heatmaps = Object.values(buildingMap).sort((a, b) => b.total - a.total);
    res.json({ heatmaps });
  } catch (error) {
    console.error('Heatmap error:', error);
    res.status(500).json({ error: 'Failed to generate heatmap analytics.' });
  }
});

// GET /api/analytics/leaderboard - Staff Performance Leaderboard & MTTR (Enterprise Feature 6)
router.get('/leaderboard', requireAuth, async (req, res) => {
  try {
    const staffMembers = await User.find({ role: { $in: ['staff', 'admin'] } }).select('name email department role avatar').lean();
    const resolvedComplaints = await Complaint.find({ status: { $in: ['Resolved', 'Closed'] } }).lean();
    const feedbacks = await Feedback.find({}).lean();

    const feedbackMap = {};
    feedbacks.forEach(f => {
      feedbackMap[f.complaint_id.toString()] = f.rating;
    });

    const leaderboard = staffMembers.map(staff => {
      const assignedResolved = resolvedComplaints.filter(c => c.assigned_to && c.assigned_to.toString() === staff._id.toString());
      
      let totalResolutionHours = 0;
      let validMttrCount = 0;
      const ratings = [];

      assignedResolved.forEach(c => {
        if (c.resolved_at && c.created_at) {
          const diffHours = (new Date(c.resolved_at) - new Date(c.created_at)) / (1000 * 3600);
          if (diffHours >= 0) {
            totalResolutionHours += diffHours;
            validMttrCount++;
          }
        }
        if (feedbackMap[c._id.toString()]) {
          ratings.push(feedbackMap[c._id.toString()]);
        }
      });

      const mttr = validMttrCount > 0 ? Number((totalResolutionHours / validMttrCount).toFixed(1)) : 0;
      const avgRating = ratings.length > 0 ? Number((ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1)) : 5.0;

      return {
        id: staff._id.toString(),
        name: staff.name,
        email: staff.email,
        department: staff.department || 'Administration',
        role: staff.role,
        resolved_count: assignedResolved.length,
        mttr_hours: mttr,
        avg_rating: avgRating,
        total_ratings: ratings.length
      };
    }).sort((a, b) => b.resolved_count - a.resolved_count || b.avg_rating - a.avg_rating);

    res.json({ leaderboard });
  } catch (error) {
    console.error('Leaderboard error:', error);
    res.status(500).json({ error: 'Failed to generate staff leaderboard.' });
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
