const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User = require('./models/User');
const Complaint = require('./models/Complaint');
const Comment = require('./models/Comment');
const Feedback = require('./models/Feedback');
const Notification = require('./models/Notification');
const Email = require('./models/Email');
const AuditLog = require('./models/AuditLog');

async function connectDB() {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ccms';
  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000
    });
    console.log(`🍃 Connected to MongoDB Database: ${conn.connection.name} @ ${conn.connection.host}`);
    await ensureBaseAdminUser();
    return conn;
  } catch (error) {
    console.error('❌ MongoDB Connection Error. Please verify your MONGODB_URI environment variable:', error.message);
    return null;
  }
}

/**
 * Ensure default Administrator and Department Staff Leads exist in MongoDB Atlas
 */
async function ensureBaseAdminUser() {
  try {
    const adminExists = await User.findOne({ email: 'admin@campus.edu' });
    if (!adminExists) {
      console.log('⚡ Initializing base administrator & department staff accounts in MongoDB Atlas...');
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
        },
        {
          name: 'Ananya Patel',
          email: 'ananya.student@campus.edu',
          password: passwordHash,
          role: 'student',
          department: null,
          student_id: 'EC2024-018',
          phone: '+91 98222 33445'
        }
      ]);
      console.log('✅ Base administrator (admin@campus.edu) and department accounts ready in MongoDB Atlas.');
    }
  } catch (err) {
    console.error('Base user initialization error:', err);
  }
}

module.exports = {
  connectDB,
  User,
  Complaint,
  Comment,
  Feedback,
  Notification,
  Email,
  AuditLog
};
