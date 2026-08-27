# 🏛️ College Complaint Management System — Specification Sheet & Tech Stack

## 1. Project Overview

The **College Complaint Management System (CCMS)** is a web-based platform designed to streamline the process of reporting, managing, and resolving complaints within a college campus. It replaces traditional manual complaint systems with a centralized digital solution, enabling transparency, accountability, and efficient issue resolution.

---

## 2. Objectives

- Provide students with an easy way to report issues
- Enable administrators to efficiently manage complaints
- Improve communication between students and departments
- Track complaint lifecycle from submission to resolution
- Maintain historical records for analysis and improvement

---

## 3. Stakeholders

- **Students** — Submit and track complaints  
- **Admin** — Manage complaints and assign departments  
- **Department Staff** — Resolve assigned complaints  

---

## 4. System Workflow

**Student ➔ Submit Complaint ➔ Admin Review ➔ Assign Department ➔ In Progress ➔ Resolved ➔ Closed**

---

## 5. Functional Requirements

### 5.1 User Authentication
- Student registration (name, email, ID, password)
- Login/logout functionality
- Role-based access (Student, Admin, Staff)

### 5.2 Student Module
- **Dashboard**: View submitted complaints, complaint statuses, quick complaint submission.
- **Complaint Submission**: Select category (Hostel, Wi-Fi, Infrastructure, etc.), enter description, add location details, upload images/files.
- **Complaint Tracking**: Visual status progression (`Submitted` ➔ `Under Review` ➔ `Assigned` ➔ `In Progress` ➔ `Resolved` ➔ `Closed`).
- **Complaint History**: View all past complaints, filter by status/category/date.
- **Feedback & Rating**: Rate resolution (1–5 stars) and confirm closure.

### 5.3 Admin Module
- **Admin Dashboard**: View all complaints, summary statistics (total, pending, resolved, category breakdown).
- **Complaint Management**: View complaint details, assign to department/staff, update status, add comments/notes.
- **Priority Management**: Set priority (Low, Medium, High, Critical).
- **Search & Filter**: Filter by status, category, priority, date.

### 5.4 Department/Staff Module
- View assigned complaints
- Update progress and add resolution details

---

## 6. Non-Functional Requirements

- **Performance**: Handle multiple users efficiently
- **Scalability**: Support increasing number of complaints
- **Security**: Password encryption, secure JWT authentication
- **Usability**: Simple UI/UX, responsive mobile/desktop design
- **Availability**: 24/7 access

---

## 7. Database Entities

- **Users**: id, name, email, password, role (student/admin/staff), department, created_at
- **Complaints**: id, title, description, category, location, image_url, status, priority, student_id, assigned_to, department, resolution_notes, created_at, updated_at
- **Comments / Updates**: id, complaint_id, user_id, message, is_internal, created_at
- **Feedback**: id, complaint_id, rating, comments, created_at
- **Notifications**: id, user_id, title, message, is_read, created_at

---

## 8. Technology Stack

- **Frontend**: React 18 + Vite, Custom CSS Design System, Responsive Glassmorphism UI, Lucide Icons
- **Backend**: Node.js + Express.js REST API, JWT, bcryptjs, Multer
- **Database**: Native `node:sqlite` (zero-setup relational database)
