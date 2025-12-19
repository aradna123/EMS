# Employee Management System

A comprehensive full-stack web application for managing employees, departments, attendance, and leave requests with role-based access control and real-time notifications.

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Database Schema](#database-schema)
- [Setup Instructions](#setup-instructions)
- [API Documentation](#api-documentation)
- [Authentication Flow](#authentication-flow)
- [Frontend Architecture](#frontend-architecture)
- [Backend Architecture](#backend-architecture)
- [Key Components](#key-components)
- [Development Workflow](#development-workflow)
- [Environment Variables](#environment-variables)
- [Deployment](#deployment)

---

## 🎯 Overview

The Employee Management System is a modern HR solution that enables organizations to efficiently manage their workforce. It provides comprehensive features for employee management, attendance tracking, leave management, and department organization with role-based access control.

### Key Highlights

- **Role-Based Access Control**: Three user roles (Admin, Manager, Employee) with different permissions
- **Real-Time Notifications**: Socket.IO integration for instant updates
- **Modern UI/UX**: Beautiful, responsive interface with Tailwind CSS
- **Secure Authentication**: JWT-based authentication with password reset functionality
- **Comprehensive Reporting**: Dashboard with statistics and analytics
- **File Upload**: Employee photo management with Multer
- **Data Export**: CSV export functionality for employee records

---

## ✨ Features

### 🔐 Authentication & Authorization
- User registration and login
- JWT-based authentication
- Password reset via email (with console fallback for development)
- Profile management with avatar upload
- Role-based access control (Admin, Manager, Employee)
- Protected routes on frontend

### 👥 Employee Management
- Complete CRUD operations for employee records
- Employee photo upload
- Search and filter employees (by name, email, employee code, department, status)
- Employee detail view
- Export employee list to CSV
- Pagination support
- Department assignment

### 🏢 Department Management
- Create, read, update, delete departments
- Assign employees to departments
- Department hierarchy (parent/child departments)
- Department statistics (employee count, average salary)
- Manager assignment to departments
- Department-based data filtering for managers

### ⏰ Attendance Tracking
- Check-in/Check-out system
- Daily attendance records
- Monthly attendance reports
- Late arrival tracking
- Hours worked calculation
- Attendance statistics dashboard
- Manager can view department employees' attendance

### 🏖️ Leave Management
- Submit leave requests (sick, vacation, personal, emergency)
- Approve/reject leave requests (Manager/Admin only)
- Leave balance tracking per year
- Leave history
- Edit pending leave requests
- Manager leave requests (approved by Admin only)
- Real-time notifications for leave status changes
- Automatic leave balance deduction on approval

### 📊 Dashboard & Reports
- Role-specific dashboards (Admin, Manager, Employee)
- Employee count by department
- Attendance overview
- Pending leave requests
- Recent activities
- Monthly statistics
- Interactive charts and graphs

### 🔔 Notifications
- Real-time notifications via Socket.IO
- Notification dropdown in navbar
- Mark as read/unread
- Delete notifications
- Leave status update notifications

---

## 🛠️ Tech Stack

### Frontend
- **React 19** - UI library
- **React Router DOM 6** - Client-side routing
- **Vite** - Build tool and dev server
- **Tailwind CSS 3** - Utility-first CSS framework
- **Axios** - HTTP client
- **Socket.IO Client** - Real-time communication
- **Recharts** - Chart library
- **React Hot Toast** - Toast notifications
- **Lucide React** - Icon library
- **date-fns** - Date manipulation

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **PostgreSQL** - Relational database
- **Socket.IO** - Real-time bidirectional communication
- **JWT (jsonwebtoken)** - Authentication tokens
- **bcryptjs** - Password hashing
- **Multer** - File upload handling
- **express-validator** - Input validation
- **Helmet** - Security middleware
- **CORS** - Cross-origin resource sharing
- **express-rate-limit** - Rate limiting
- **Nodemailer** - Email service (optional)
- **Morgan** - HTTP request logger

---

## 📁 Project Structure

```
employeement-management-systems/
│
├── frontend/                    # React frontend application
│   ├── public/                  # Static assets
│   ├── src/
│   │   ├── components/         # Reusable React components
│   │   │   ├── Layout/         # Layout components (Navbar, Sidebar, MainLayout)
│   │   │   └── Notifications/  # Notification components
│   │   ├── context/            # React Context providers
│   │   │   ├── AuthContext.jsx  # Authentication state management
│   │   │   └── SocketContext.jsx # Socket.IO connection management
│   │   ├── pages/              # Page components
│   │   │   ├── Dashboard/       # Dashboard pages (Admin, Manager, Employee)
│   │   │   ├── Employees/       # Employee management pages
│   │   │   ├── Departments/     # Department management pages
│   │   │   ├── Attendance/      # Attendance tracking pages
│   │   │   ├── Leaves/          # Leave management pages
│   │   │   ├── Profile/         # User profile page
│   │   │   ├── Login.jsx        # Login page
│   │   │   ├── ForgotPassword.jsx # Password reset request page
│   │   │   └── ResetPassword.jsx  # Password reset page
│   │   ├── services/            # API service functions
│   │   │   ├── authService.js
│   │   │   ├── employeeService.js
│   │   │   ├── departmentService.js
│   │   │   ├── attendanceService.js
│   │   │   ├── leaveService.js
│   │   │   ├── dashboardService.js
│   │   │   └── notificationService.js
│   │   ├── utils/               # Utility functions
│   │   │   └── api.js           # Axios instance with interceptors
│   │   ├── App.jsx              # Main app component with routes
│   │   ├── main.jsx             # Application entry point
│   │   └── index.css            # Global styles
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
│
├── back/                        # Node.js backend application
│   ├── config/                  # Configuration files
│   │   └── database.js          # PostgreSQL connection pool
│   ├── controllers/             # Request handlers
│   │   ├── authController.js    # Authentication logic
│   │   ├── employeeController.js
│   │   ├── departmentController.js
│   │   ├── attendanceController.js
│   │   ├── leaveController.js
│   │   ├── dashboardController.js
│   │   └── notificationController.js
│   ├── middleware/              # Express middleware
│   │   ├── auth.js              # JWT authentication middleware
│   │   ├── errorHandler.js      # Global error handler
│   │   └── upload.js            # Multer configuration for file uploads
│   ├── migrations/              # Database migrations
│   │   ├── schema.sql           # Main database schema
│   │   ├── runMigrations.js     # Migration runner
│   │   └── *.js                 # Additional migration scripts
│   ├── routes/                  # API route definitions
│   │   ├── authRoutes.js
│   │   ├── employeeRoutes.js
│   │   ├── departmentRoutes.js
│   │   ├── attendanceRoutes.js
│   │   ├── leaveRoutes.js
│   │   ├── dashboardRoutes.js
│   │   └── notificationRoutes.js
│   ├── utils/                   # Utility functions
│   │   └── validators.js        # Input validation schemas
│   ├── uploads/                 # Uploaded files directory
│   ├── seed-data.js             # Database seeding script
│   ├── server.js                # Express server entry point
│   ├── package.json
│   └── .env                      # Environment variables (not in repo)
│
└── README.md                    # This file
```

---

## 🗄️ Database Schema

### Core Tables

#### `users`
Stores user authentication and profile information.
- `id` (SERIAL PRIMARY KEY)
- `name` (VARCHAR)
- `email` (VARCHAR, UNIQUE)
- `password` (VARCHAR, hashed)
- `role` (VARCHAR: 'admin', 'manager', 'employee')
- `avatar` (VARCHAR, file path)
- `is_active` (BOOLEAN)
- `created_at`, `updated_at` (TIMESTAMPTZ)

#### `departments`
Stores department information and hierarchy.
- `id` (SERIAL PRIMARY KEY)
- `name` (VARCHAR)
- `description` (TEXT)
- `parent_id` (INTEGER, self-reference)
- `manager_id` (INTEGER, references users.id)
- `created_at` (TIMESTAMPTZ)

#### `employees`
Stores employee-specific information linked to users.
- `id` (SERIAL PRIMARY KEY)
- `user_id` (INTEGER, references users.id, ON DELETE CASCADE)
- `employee_code` (VARCHAR, UNIQUE)
- `department_id` (INTEGER, references departments.id)
- `position` (VARCHAR)
- `salary` (DECIMAL)
- `join_date` (DATE)
- `status` (VARCHAR: 'active', 'on_leave', 'terminated')
- `phone` (VARCHAR)
- `address` (TEXT)
- `created_at` (TIMESTAMPTZ)

#### `attendance`
Tracks daily attendance records.
- `id` (SERIAL PRIMARY KEY)
- `employee_id` (INTEGER, references employees.id)
- `date` (DATE)
- `check_in` (TIME)
- `check_out` (TIME)
- `status` (VARCHAR: 'present', 'absent', 'late', 'half_day')
- `notes` (TEXT)
- `created_at` (TIMESTAMPTZ)
- UNIQUE(employee_id, date)

#### `leave_requests`
Stores leave request information.
- `id` (SERIAL PRIMARY KEY)
- `employee_id` (INTEGER, references employees.id)
- `leave_type` (VARCHAR: 'sick', 'vacation', 'personal', 'emergency')
- `start_date` (DATE)
- `end_date` (DATE)
- `days` (INTEGER)
- `reason` (TEXT)
- `status` (VARCHAR: 'pending', 'approved', 'rejected')
- `approved_by` (INTEGER, references users.id)
- `approved_at` (TIMESTAMPTZ)
- `created_at` (TIMESTAMPTZ)

#### `leave_balances`
Tracks annual leave balances per employee.
- `id` (SERIAL PRIMARY KEY)
- `employee_id` (INTEGER, references employees.id)
- `year` (INTEGER)
- `sick_leave` (INTEGER, default: 10)
- `vacation_leave` (INTEGER, default: 20)
- `personal_leave` (INTEGER, default: 5)
- `emergency_leave` (INTEGER, default: 3)
- UNIQUE(employee_id, year)

#### `password_reset_tokens`
Stores password reset tokens.
- `id` (SERIAL PRIMARY KEY)
- `user_id` (INTEGER, references users.id)
- `token` (VARCHAR)
- `expires_at` (TIMESTAMPTZ)
- `created_at` (TIMESTAMPTZ)

#### `notifications`
Stores user notifications.
- `id` (SERIAL PRIMARY KEY)
- `user_id` (INTEGER, references users.id)
- `type` (VARCHAR)
- `title` (VARCHAR)
- `message` (TEXT)
- `data` (JSONB)
- `status` (VARCHAR: 'unread', 'read')
- `created_at` (TIMESTAMPTZ)
- `read_at` (TIMESTAMPTZ)

### Relationships

```
users (1) ──< (1) employees
departments (1) ──< (N) employees
departments (1) ──< (1) users (manager)
employees (1) ──< (N) attendance
employees (1) ──< (N) leave_requests
employees (1) ──< (N) leave_balances
users (1) ──< (N) password_reset_tokens
users (1) ──< (N) notifications
```

---

## 🚀 Setup Instructions

### Prerequisites

- **Node.js** (v18 or higher)
- **PostgreSQL** (v12 or higher)
- **npm** or **yarn**

### Backend Setup

1. **Navigate to backend directory:**
   ```bash
   cd back
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Create `.env` file:**
   ```env
   # Database Configuration
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=employee_management
   DB_USER=postgres
   DB_PASSWORD=your_password
   DB_SSL=false

   # Server Configuration
   PORT=5000
   NODE_ENV=development

   # JWT Configuration
   JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
   JWT_EXPIRE=7d

   # Frontend URL
   FRONTEND_URL=http://localhost:5173

   # File Upload
   UPLOAD_PATH=./uploads

   # Email Configuration (Optional)
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASS=your_app_password
   ```

4. **Create PostgreSQL database:**
   ```sql
   CREATE DATABASE employee_management;
   ```

5. **Run database migrations:**
   ```bash
   npm run migrate
   ```

6. **Seed the database (optional):**
   ```bash
   npm run seed
   ```

7. **Start the server:**
   ```bash
   # Development mode (with auto-reload)
   npm run dev

   # Production mode
   npm start
   ```

   The backend server will run on `http://localhost:5000`

### Frontend Setup

1. **Navigate to frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Create `.env` file (optional):**
   ```env
   VITE_API_URL=http://localhost:5000/api
   ```

4. **Start the development server:**
   ```bash
   npm run dev
   ```

   The frontend will run on `http://localhost:5173`

### Default Login Credentials

After seeding the database, you can use these credentials:

- **Admin:**
  - Email: `admin@example.com`
  - Password: `password123`

- **Manager:**
  - Email: `manager@example.com`
  - Password: `password123`

- **Employee:**
  - Email: `employee@example.com`
  - Password: `password123`

---

## 📡 API Documentation

### Base URL
```
http://localhost:5000/api
```

### Authentication Endpoints

#### `POST /api/auth/register`
Register a new user.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "employee"
}
```

#### `POST /api/auth/login`
Login user and receive JWT token.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "role": "employee"
  }
}
```

#### `POST /api/auth/forgot-password`
Request password reset.

**Request Body:**
```json
{
  "email": "john@example.com"
}
```

#### `POST /api/auth/reset-password`
Reset password with token.

**Request Body:**
```json
{
  "token": "reset_token_here",
  "password": "new_password123"
}
```

#### `GET /api/auth/profile`
Get current user profile (Protected).

#### `PUT /api/auth/profile`
Update user profile (Protected).

### Employee Endpoints

#### `GET /api/employees`
Get all employees with filters and pagination.

**Query Parameters:**
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10)
- `search` - Search by name, email, or employee code
- `department_id` - Filter by department
- `status` - Filter by status

#### `GET /api/employees/:id`
Get single employee details.

#### `POST /api/employees`
Create new employee (Manager/Admin only).

**Request Body:**
```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "password123",
  "employee_code": "EMP001",
  "department_id": 1,
  "position": "Software Engineer",
  "salary": 50000,
  "join_date": "2024-01-15",
  "phone": "+1234567890",
  "address": "123 Main St"
}
```

#### `PUT /api/employees/:id`
Update employee (Manager/Admin only).

#### `DELETE /api/employees/:id`
Delete employee (Admin only).

#### `POST /api/employees/:id/photo`
Upload employee photo (Manager/Admin only).

**Request:** `multipart/form-data` with `photo` field.

#### `GET /api/employees/export/csv`
Export employees to CSV (Manager/Admin only).

### Department Endpoints

#### `GET /api/departments`
Get all departments.

#### `GET /api/departments/hierarchy`
Get department hierarchy tree.

#### `GET /api/departments/:id`
Get single department with employees.

#### `GET /api/departments/:id/stats`
Get department statistics.

#### `POST /api/departments`
Create department (Manager/Admin only).

#### `PUT /api/departments/:id`
Update department (Manager/Admin only).

#### `DELETE /api/departments/:id`
Delete department (Admin only).

### Attendance Endpoints

#### `POST /api/attendance/check-in`
Check in for the day.

#### `POST /api/attendance/check-out`
Check out for the day.

#### `GET /api/attendance`
Get attendance records (filtered by role).

**Query Parameters:**
- `page`, `limit` - Pagination
- `start_date`, `end_date` - Date range
- `employee_id` - Filter by employee (Manager/Admin only)

#### `GET /api/attendance/monthly`
Get monthly attendance report.

#### `GET /api/attendance/stats`
Get attendance statistics.

#### `POST /api/attendance/record`
Create/update attendance record (Manager/Admin only).

### Leave Endpoints

#### `POST /api/leaves/request`
Submit leave request.

**Request Body:**
```json
{
  "leave_type": "vacation",
  "start_date": "2024-02-01",
  "end_date": "2024-02-05",
  "reason": "Family vacation"
}
```

#### `GET /api/leaves/requests`
Get leave requests (filtered by role).

#### `PUT /api/leaves/requests/:id/approve`
Approve/reject leave request (Manager/Admin only).

**Request Body:**
```json
{
  "status": "approved"
}
```

#### `GET /api/leaves/balance`
Get leave balance for current user.

### Dashboard Endpoints

#### `GET /api/dashboard/stats`
Get dashboard statistics (role-specific).

### Notification Endpoints

#### `GET /api/notifications`
Get user notifications.

#### `PUT /api/notifications/:id/read`
Mark notification as read.

#### `PUT /api/notifications/read-all`
Mark all notifications as read.

#### `DELETE /api/notifications/:id`
Delete notification.

---

## 🔐 Authentication Flow

### Login Flow

1. User submits email and password on login page
2. Frontend sends POST request to `/api/auth/login`
3. Backend validates credentials and checks user exists
4. Backend hashes password and compares with stored hash
5. If valid, backend generates JWT token
6. Backend returns token and user data
7. Frontend stores token in `localStorage`
8. Frontend stores user data in `localStorage` and `AuthContext`
9. Frontend redirects to dashboard

### Protected Route Flow

1. User navigates to protected route
2. `ProtectedRoute` component checks `AuthContext` for authentication
3. If not authenticated, redirects to `/login`
4. If authenticated, checks role requirements
5. If role doesn't match, shows access denied
6. If authorized, renders the protected component

### API Request Flow

1. Frontend service function is called
2. `api.js` interceptor adds JWT token to `Authorization` header
3. Request sent to backend
4. Backend `auth.js` middleware verifies JWT token
5. If valid, extracts user info and adds to `req.user`
6. Controller processes request with user context
7. Response sent back to frontend
8. If 401 error, frontend interceptor clears storage and redirects to login

### Password Reset Flow

1. User clicks "Forgot Password" on login page
2. User enters email on forgot password page
3. Frontend sends POST to `/api/auth/forgot-password`
4. Backend generates reset token and stores in database
5. Backend sends email with reset link (or logs to console in dev)
6. User clicks reset link (contains token in query param)
7. Frontend `ResetPassword` component extracts token from URL
8. User enters new password
9. Frontend sends POST to `/api/auth/reset-password` with token and password
10. Backend validates token and expiration
11. Backend hashes new password and updates user
12. Backend deletes reset token
13. User redirected to login page

---

## 🎨 Frontend Architecture

### Component Hierarchy

```
App.jsx
├── AuthProvider
│   └── SocketProvider
│       └── Router
│           ├── Routes
│           │   ├── /login → Login
│           │   ├── /forgot-password → ForgotPassword
│           │   ├── /reset-password → ResetPassword
│           │   └── Protected Routes
│           │       └── MainLayout
│           │           ├── Navbar
│           │           │   └── NotificationDropdown
│           │           ├── Sidebar
│           │           └── Page Components
│           └── Toaster
```

### State Management

- **AuthContext**: Manages authentication state, user data, and auth methods
- **SocketContext**: Manages Socket.IO connection and real-time events
- **Local State**: Component-level state using `useState` hook
- **LocalStorage**: Persists token and user data across sessions

### Routing

- **Public Routes**: `/login`, `/forgot-password`, `/reset-password`
- **Protected Routes**: All other routes require authentication
- **Role-Based Routes**: Some routes require specific roles (e.g., `/employees` requires manager role)

### Service Layer

Each service file (`authService.js`, `employeeService.js`, etc.) contains functions that:
- Make API calls using the `api` utility
- Handle request/response transformation
- Provide a clean interface for components

### API Integration

- **Base URL**: Configured in `api.js` via environment variable
- **Interceptors**: 
  - Request: Adds JWT token to headers
  - Response: Handles 401 errors and redirects to login

---

## ⚙️ Backend Architecture

### Request Flow

```
Client Request
    ↓
Express Server (server.js)
    ↓
CORS Middleware
    ↓
Rate Limiting
    ↓
Body Parser
    ↓
Route Handler (routes/*.js)
    ↓
Validation Middleware (validators.js)
    ↓
Authentication Middleware (auth.js) [if protected]
    ↓
Controller (controllers/*.js)
    ↓
Database Query (database.js)
    ↓
Response
```

### Middleware Stack

1. **CORS**: Handles cross-origin requests
2. **Helmet**: Security headers
3. **Morgan**: Request logging
4. **Rate Limiter**: Prevents abuse
5. **Body Parser**: Parses JSON and URL-encoded data
6. **Authentication**: Verifies JWT tokens
7. **Error Handler**: Catches and formats errors

### Controller Pattern

Each controller file contains:
- Business logic
- Database queries
- Error handling
- Response formatting

### Database Connection

- Uses `pg` (node-postgres) connection pool
- Pool configuration in `config/database.js`
- Automatic connection management
- SSL support for remote databases

### Socket.IO Integration

- Real-time notifications
- User authentication via socket events
- Role-based room joining
- Event emission for leave status updates

---

## 🧩 Key Components

### Frontend Components

#### `AuthContext.jsx`
- Manages authentication state
- Provides `login`, `logout`, `updateUser` methods
- Persists user data in localStorage
- Exposes `isAuthenticated`, `isAdmin`, `isManager`, `isEmployee` flags

#### `SocketContext.jsx`
- Establishes Socket.IO connection
- Handles authentication on connection
- Listens for real-time events
- Provides socket instance to components

#### `ProtectedRoute.jsx`
- Wraps protected routes
- Checks authentication status
- Validates role requirements
- Redirects unauthorized users

#### `MainLayout.jsx`
- Main application layout wrapper
- Contains `Navbar` and `Sidebar`
- Provides consistent layout structure

#### `Navbar.jsx`
- Top navigation bar
- User profile dropdown
- Notification dropdown
- Search functionality (optional)

#### `Sidebar.jsx`
- Side navigation menu
- Role-based menu items
- Active route highlighting
- Collapsible design

### Backend Components

#### `auth.js` (Middleware)
- JWT token verification
- Extracts user info from token
- Adds `req.user` to request object
- Handles token expiration

#### `errorHandler.js` (Middleware)
- Global error handler
- Formats error responses
- Logs errors
- Handles different error types

#### `upload.js` (Middleware)
- Multer configuration
- File upload handling
- Image validation
- Storage configuration

---

## 🔄 Development Workflow

### Adding a New Feature

1. **Backend:**
   - Create controller function in appropriate controller file
   - Create route in appropriate route file
   - Add validation in `validators.js` if needed
   - Test with Postman or similar tool

2. **Frontend:**
   - Create service function in appropriate service file
   - Create page component in `pages/` directory
   - Add route in `App.jsx`
   - Update navigation if needed

### Database Changes

1. Create migration file in `migrations/` directory
2. Update `schema.sql` if needed
3. Run migration: `npm run migrate`
4. Update seed data if needed

### Testing

1. **Backend:** Test endpoints with Postman or curl
2. **Frontend:** Test components in browser
3. **Integration:** Test full user flows

---

## 🌍 Environment Variables

### Backend (.env)

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=employee_management
DB_USER=postgres
DB_PASSWORD=your_password
DB_SSL=false

# Server
PORT=5000
NODE_ENV=development

# JWT
JWT_SECRET=your_secret_key
JWT_EXPIRE=7d

# Frontend
FRONTEND_URL=http://localhost:5173

# Uploads
UPLOAD_PATH=./uploads

# Email (Optional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
```

### Frontend (.env)

```env
VITE_API_URL=http://localhost:5000/api
```

---

## 🚢 Deployment

### Backend Deployment

1. Set `NODE_ENV=production` in environment variables
2. Update database credentials for production database
3. Set secure `JWT_SECRET`
4. Configure CORS with production frontend URL
5. Set up file storage (consider cloud storage for uploads)
6. Configure email service for production
7. Use process manager (PM2) for Node.js
8. Set up reverse proxy (Nginx) if needed

### Frontend Deployment

1. Build production bundle:
   ```bash
   npm run build
   ```

2. Deploy `dist/` folder to static hosting (Vercel, Netlify, etc.)

3. Update `VITE_API_URL` to production API URL

4. Configure environment variables in hosting platform

### Database Migration

Run migrations on production database:
```bash
npm run migrate
```

---

## 📝 Additional Notes

### Security Considerations

- Passwords are hashed using bcrypt
- JWT tokens expire after 7 days
- Rate limiting prevents abuse
- CORS configured for specific origins
- Helmet adds security headers
- Input validation on all endpoints
- SQL injection prevention via parameterized queries

### Performance Optimizations

- Database connection pooling
- Indexed database columns
- Pagination on list endpoints
- Efficient database queries
- Frontend code splitting (Vite)

### Future Enhancements

- Email notifications
- File upload to cloud storage
- Advanced reporting
- Mobile app support
- Multi-language support
- Audit logging
- Two-factor authentication

---

## 📄 License

This project is licensed under the ISC License.

---

