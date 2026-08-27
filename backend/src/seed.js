const bcrypt = require('bcryptjs');
const { connectDB, User, Complaint, Comment, Feedback, Notification, Email, AuditLog } = require('./db');

async function seedDatabase() {
  console.log('🌱 Seeding MongoDB Atlas database with realistic campus data...');
  await connectDB();

  // Clean existing collections
  await Feedback.deleteMany({});
  await Comment.deleteMany({});
  await Notification.deleteMany({});
  await Email.deleteMany({});
  await AuditLog.deleteMany({});
  await Complaint.deleteMany({});
  await User.deleteMany({});

  const passwordHash = await bcrypt.hash('password123', 10);

  // 1. Insert Users
  const admin = await User.create({
    name: 'Dr. Rajesh Verma',
    email: 'admin@campus.edu',
    password: passwordHash,
    role: 'admin',
    department: 'Administration',
    student_id: 'ADM-001',
    phone: '+91 98765 43210'
  });

  const student1 = await User.create({
    name: 'Rahul Sharma',
    email: 'rahul.student@campus.edu',
    password: passwordHash,
    role: 'student',
    student_id: 'CS2023-042',
    phone: '+91 98111 22334'
  });

  const student2 = await User.create({
    name: 'Ananya Patel',
    email: 'ananya.student@campus.edu',
    password: passwordHash,
    role: 'student',
    student_id: 'EC2024-018',
    phone: '+91 98222 33445'
  });

  const student3 = await User.create({
    name: 'Karthik Sundaram',
    email: 'karthik.student@campus.edu',
    password: passwordHash,
    role: 'student',
    student_id: 'ME2023-089',
    phone: '+91 98333 44556'
  });

  const itStaff = await User.create({
    name: 'Alex Miller',
    email: 'alex.it@campus.edu',
    password: passwordHash,
    role: 'staff',
    department: 'Wi-Fi & IT',
    student_id: 'STF-IT-101',
    phone: '+91 98444 55667'
  });

  const hostelStaff = await User.create({
    name: 'Priya Nair',
    email: 'priya.hostel@campus.edu',
    password: passwordHash,
    role: 'staff',
    department: 'Hostel Affairs',
    student_id: 'STF-HST-202',
    phone: '+91 98555 66778'
  });

  const maintStaff = await User.create({
    name: 'Vikram Rao',
    email: 'vikram.maintenance@campus.edu',
    password: passwordHash,
    role: 'staff',
    department: 'Maintenance & Infrastructure',
    student_id: 'STF-MNT-303',
    phone: '+91 98666 77889'
  });

  const canteenStaff = await User.create({
    name: 'Ramesh Kumar',
    email: 'ramesh.canteen@campus.edu',
    password: passwordHash,
    role: 'staff',
    department: 'Canteen & Mess',
    student_id: 'STF-CNT-404',
    phone: '+91 98777 88990'
  });

  const elecStaff = await User.create({
    name: 'Suresh Patil',
    email: 'suresh.electrical@campus.edu',
    password: passwordHash,
    role: 'staff',
    department: 'Electrical & Plumbing',
    student_id: 'STF-ELC-505',
    phone: '+91 98888 99001'
  });

  console.log('✅ Base users created successfully in MongoDB Atlas.');

  // Sample Complaints
  const complaint1 = await Complaint.create({
    ticket_number: 'CCMS-2026-0001',
    title: 'Lab 3 High-Speed Wi-Fi Router Connection Drops Repeatedly',
    description: 'During CS laboratory sessions, the 5GHz network band repeatedly disconnects all workstations every 10 minutes.',
    category: 'Wi-Fi & IT',
    location: 'Computer Science Block, 3rd Floor',
    building: 'Turing Computer Complex',
    room: 'Lab 302',
    status: 'In Progress',
    priority: 'Critical',
    student_id: student1._id,
    assigned_to: itStaff._id,
    department: 'Wi-Fi & IT'
  });

  await Comment.create({
    complaint_id: complaint1._id,
    user_id: student1._id,
    message: 'Grievance submitted by student.',
    status_update: 'Submitted'
  });

  await Comment.create({
    complaint_id: complaint1._id,
    user_id: itStaff._id,
    message: 'Assigned to Alex Miller (Wi-Fi & IT). Technician inspecting access point firmware.',
    status_update: 'In Progress'
  });

  const complaint2 = await Complaint.create({
    ticket_number: 'CCMS-2026-0002',
    title: 'Hostel Block B 2nd Floor Geyser Thermostat Failure',
    description: 'The central water heater on the 2nd floor of Block B is overheating and causing power trip in corridor switchboard.',
    category: 'Electrical & Plumbing',
    location: 'Hostel Block B, Wing A',
    building: 'Kaveri Boys Hostel',
    room: '2nd Floor Washroom 4',
    status: 'Resolved',
    priority: 'High',
    student_id: student2._id,
    assigned_to: elecStaff._id,
    department: 'Electrical & Plumbing',
    resolution_notes: 'Replaced burnt thermostat unit and calibrated miniature circuit breaker.'
  });

  await Feedback.create({
    complaint_id: complaint2._id,
    student_id: student2._id,
    rating: 5,
    comments: 'Electrician arrived within 2 hours and fixed the circuit breaker quickly!'
  });

  console.log('🎉 MongoDB Atlas seeding complete!');
}

if (require.main === module) {
  seedDatabase().then(() => process.exit(0)).catch(e => {
    console.error(e);
    process.exit(1);
  });
}

module.exports = { seedDatabase };
