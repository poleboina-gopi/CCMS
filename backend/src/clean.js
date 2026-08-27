const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const { connectDB, User, Complaint, Comment, Feedback, Notification, Email, AuditLog } = require('./db');

async function cleanAndPrepareProduction() {
  console.log('🧹 Preparing CampusResolve for Production Deployment on MongoDB Atlas...');
  await connectDB();

  // 1. Wipe all complaints, comments, feedback, notifications, emails, and audit logs
  await Complaint.deleteMany({});
  await Comment.deleteMany({});
  await Feedback.deleteMany({});
  await Notification.deleteMany({});
  await Email.deleteMany({});
  await AuditLog.deleteMany({});

  console.log('✅ All complaint records, comments, ratings, and temporary notification logs cleared from MongoDB Atlas.');

  // 2. Clean temporary file uploads in uploads/ directory
  const uploadsDir = path.join(__dirname, '..', 'uploads');
  if (fs.existsSync(uploadsDir)) {
    const files = fs.readdirSync(uploadsDir);
    for (const file of files) {
      if (file !== '.gitkeep') {
        try {
          fs.unlinkSync(path.join(uploadsDir, file));
        } catch (e) {
          // ignore
        }
      }
    }
    console.log(`✅ Uploads storage purged (${files.length} files removed).`);
  }

  // 3. Ensure base admin and staff accounts exist
  const adminExists = await User.findOne({ email: 'admin@campus.edu' });
  if (!adminExists) {
    const passwordHash = await bcrypt.hash('password123', 10);
    await User.create([
      {
        name: 'Dr. Rajesh Verma',
        email: 'admin@campus.edu',
        password: passwordHash,
        role: 'admin',
        department: 'Administration',
        student_id: 'ADM-001',
        phone: '+91 98765 43210'
      },
      {
        name: 'Alex Miller',
        email: 'alex.it@campus.edu',
        password: passwordHash,
        role: 'staff',
        department: 'Wi-Fi & IT',
        student_id: 'STF-IT-101',
        phone: '+91 98444 55667'
      },
      {
        name: 'Priya Nair',
        email: 'priya.hostel@campus.edu',
        password: passwordHash,
        role: 'staff',
        department: 'Hostel Affairs',
        student_id: 'STF-HST-202',
        phone: '+91 98555 66778'
      },
      {
        name: 'Vikram Rao',
        email: 'vikram.maintenance@campus.edu',
        password: passwordHash,
        role: 'staff',
        department: 'Maintenance & Infrastructure',
        student_id: 'STF-MNT-303',
        phone: '+91 98666 77889'
      },
      {
        name: 'Ramesh Kumar',
        email: 'ramesh.canteen@campus.edu',
        password: passwordHash,
        role: 'staff',
        department: 'Canteen & Mess',
        student_id: 'STF-CNT-404',
        phone: '+91 98777 88990'
      },
      {
        name: 'Suresh Patil',
        email: 'suresh.electrical@campus.edu',
        password: passwordHash,
        role: 'staff',
        department: 'Electrical & Plumbing',
        student_id: 'STF-ELC-505',
        phone: '+91 98888 99001'
      },
      {
        name: 'Rahul Sharma',
        email: 'rahul.student@campus.edu',
        password: passwordHash,
        role: 'student',
        department: null,
        student_id: 'CS2023-042',
        phone: '+91 98111 22334'
      }
    ]);
    console.log('✅ Base administrator (admin@campus.edu) and department accounts ready in MongoDB Atlas.');
  }

  const complaintCount = await Complaint.countDocuments();
  const userCount = await User.countDocuments();

  console.log(`\n============================================================`);
  console.log(`✨ MONGODB ATLAS PRODUCTION READY!`);
  console.log(`Total Complaints in Database: ${complaintCount}`);
  console.log(`Total Accounts Configured: ${userCount}`);
  console.log(`Admin Login: admin@campus.edu / password123`);
  console.log(`============================================================\n`);
}

if (require.main === module) {
  cleanAndPrepareProduction().then(() => {
    process.exit(0);
  }).catch(err => {
    console.error('Clean error:', err);
    process.exit(1);
  });
}

module.exports = {
  cleanAndPrepareProduction
};
