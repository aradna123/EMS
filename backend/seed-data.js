const pool = require('./config/database');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Sample data
const admins = [
  { name: 'Admin One', email: 'admin1@example.com', password: 'Admin123$' },
  { name: 'Admin Two', email: 'admin2@example.com', password: 'Admin123$' },
];

const managers = [
  { name: 'Manager One', email: 'manager1@example.com', password: 'Manager123$', position: 'Engineering Manager', salary: 80000, department: 'Engineering' },
  { name: 'Manager Two', email: 'manager2@example.com', password: 'Manager123$', position: 'Sales Manager', salary: 75000, department: 'Sales' },
  { name: 'Manager Three', email: 'manager3@example.com', password: 'Manager123$', position: 'Marketing Manager', salary: 70000, department: 'Marketing' },
];

const employees = [
  { name: 'John Doe', email: 'john.doe@example.com', password: 'Employee123$', position: 'Software Developer', salary: 60000, phone: '+1234567890', department: 'Engineering' },
  { name: 'Jane Smith', email: 'jane.smith@example.com', password: 'Employee123$', position: 'UI/UX Designer', salary: 55000, phone: '+1234567891', department: 'Engineering' },
  { name: 'Mike Johnson', email: 'mike.johnson@example.com', password: 'Employee123$', position: 'QA Engineer', salary: 52000, phone: '+1234567892', department: 'Engineering' },
  { name: 'Sarah Williams', email: 'sarah.williams@example.com', password: 'Employee123$', position: 'Product Manager', salary: 65000, phone: '+1234567893', department: 'Engineering' },
  { name: 'David Brown', email: 'david.brown@example.com', password: 'Employee123$', position: 'DevOps Engineer', salary: 62000, phone: '+1234567894', department: 'Engineering' },
  { name: 'Emily Davis', email: 'emily.davis@example.com', password: 'Employee123$', position: 'Marketing Specialist', salary: 48000, phone: '+1234567895', department: 'Marketing' },
  { name: 'Chris Wilson', email: 'chris.wilson@example.com', password: 'Employee123$', position: 'Sales Executive', salary: 45000, phone: '+1234567896', department: 'Sales' },
  { name: 'Lisa Anderson', email: 'lisa.anderson@example.com', password: 'Employee123$', position: 'HR Coordinator', salary: 50000, phone: '+1234567897', department: 'Human Resources' },
  { name: 'Robert Taylor', email: 'robert.taylor@example.com', password: 'Employee123$', position: 'Business Analyst', salary: 58000, phone: '+1234567898', department: 'Finance' },
  { name: 'Amanda Martinez', email: 'amanda.martinez@example.com', password: 'Employee123$', position: 'Content Writer', salary: 47000, phone: '+1234567899', department: 'Marketing' },
];

const defaultDepartments = [
  { name: 'Engineering', description: 'Software development and technical operations' },
  { name: 'Sales', description: 'Sales and customer relations' },
  { name: 'Marketing', description: 'Marketing and brand management' },
  { name: 'Human Resources', description: 'HR and employee management' },
  { name: 'Finance', description: 'Financial planning and accounting' },
  { name: 'Operations', description: 'Business operations and logistics' },
];

async function generateEmployeeCode(count) {
  return `EMP${String(count).padStart(4, '0')}`;
}

async function hashPassword(password) {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
}

async function createDepartmentIfNotExist(deptData) {
  const client = await pool.connect();
  
  try {
    // Check if department already exists
    const existing = await client.query(
      'SELECT id FROM departments WHERE name = $1',
      [deptData.name]
    );

    if (existing.rows.length > 0) {
      console.log(`⚠️  Department already exists: ${deptData.name}`);
      return existing.rows[0].id;
    }

    // Create department
    const result = await client.query(
      `INSERT INTO departments (name, description) 
       VALUES ($1, $2) 
       RETURNING id, name`,
      [deptData.name, deptData.description || null]
    );

    return result.rows[0].id;
  } catch (error) {
    throw error;
  } finally {
    client.release();
  }
}

async function createAttendanceRecords() {
  const client = await pool.connect();
  
  try {
    // Get all employees (managers and regular employees)
    const employeesResult = await client.query(`
      SELECT e.id as employee_id, e.user_id
      FROM employees e
      INNER JOIN users u ON e.user_id = u.id
      WHERE u.role IN ('manager', 'employee')
    `);

    if (employeesResult.rows.length === 0) {
      console.log('   ⚠️  No employees found to create attendance records');
      return;
    }

    const today = new Date();
    const recordsCreated = [];

    // Create attendance records for the last 30 days
    for (let dayOffset = 0; dayOffset < 30; dayOffset++) {
      const date = new Date(today);
      date.setDate(date.getDate() - dayOffset);
      
      // Skip weekends
      const dayOfWeek = date.getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) continue;

      const dateStr = date.toISOString().split('T')[0];

      for (const employee of employeesResult.rows) {
        // Randomly skip some days (10% chance of absence)
        if (Math.random() < 0.1) continue;

        // Generate check-in time (between 8:00 AM and 10:00 AM)
        const checkInHour = 8 + Math.floor(Math.random() * 2);
        const checkInMinute = Math.floor(Math.random() * 60);
        const checkInTime = `${String(checkInHour).padStart(2, '0')}:${String(checkInMinute).padStart(2, '0')}`;

        // Determine status (late if after 9:00 AM)
        const status = (checkInHour > 9 || (checkInHour === 9 && checkInMinute > 0)) ? 'late' : 'present';

        // Generate check-out time (between 5:00 PM and 7:00 PM)
        const checkOutHour = 17 + Math.floor(Math.random() * 2);
        const checkOutMinute = Math.floor(Math.random() * 60);
        const checkOutTime = `${String(checkOutHour).padStart(2, '0')}:${String(checkOutMinute).padStart(2, '0')}`;

        try {
          await client.query(
            `INSERT INTO attendance (employee_id, date, check_in, check_out, status)
             VALUES ($1, $2, $3, $4, $5)
             ON CONFLICT (employee_id, date) DO NOTHING`,
            [employee.employee_id, dateStr, checkInTime, checkOutTime, status]
          );
          recordsCreated.push({ employee_id: employee.employee_id, date: dateStr });
        } catch (error) {
          // Ignore duplicate key errors
          if (!error.message.includes('duplicate key')) {
            throw error;
          }
        }
      }
    }

    console.log(`   ✅ Created ${recordsCreated.length} attendance records`);
  } catch (error) {
    throw error;
  } finally {
    client.release();
  }
}

async function createLeaveRequests() {
  const client = await pool.connect();
  
  try {
    // Get all employees (managers and regular employees)
    const employeesResult = await client.query(`
      SELECT e.id as employee_id, e.user_id, u.name as employee_name
      FROM employees e
      INNER JOIN users u ON e.user_id = u.id
      WHERE u.role IN ('manager', 'employee')
    `);

    if (employeesResult.rows.length === 0) {
      console.log('   ⚠️  No employees found to create leave requests');
      return;
    }

    const leaveTypes = ['sick', 'vacation', 'personal', 'emergency'];
    const statuses = ['pending', 'approved', 'rejected'];
    const reasons = [
      'Medical appointment',
      'Family emergency',
      'Personal matters',
      'Vacation',
      'Sick leave',
      'Family event',
      'Mental health day',
      null
    ];

    const today = new Date();
    const requestsCreated = [];

    // Create 2-4 leave requests per employee
    for (const employee of employeesResult.rows) {
      const numRequests = 2 + Math.floor(Math.random() * 3); // 2-4 requests

      for (let i = 0; i < numRequests; i++) {
        // Random date in the past 6 months or future 3 months
        const dateOffset = -180 + Math.floor(Math.random() * 270); // -180 to +90 days
        const startDate = new Date(today);
        startDate.setDate(startDate.getDate() + dateOffset);

        // Random duration (1-5 days)
        const duration = 1 + Math.floor(Math.random() * 5);
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + duration - 1);

        // Skip if end date is in the past and too old
        if (endDate < today && (today - endDate) > 180 * 24 * 60 * 60 * 1000) {
          continue;
        }

        const leaveType = leaveTypes[Math.floor(Math.random() * leaveTypes.length)];
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        const reason = reasons[Math.floor(Math.random() * reasons.length)];

        // Calculate working days (excluding weekends)
        let days = 0;
        const currentDate = new Date(startDate);
        while (currentDate <= endDate) {
          const dayOfWeek = currentDate.getDay();
          if (dayOfWeek !== 0 && dayOfWeek !== 6) {
            days++;
          }
          currentDate.setDate(currentDate.getDate() + 1);
        }

        if (days <= 0) continue;

        // Check leave balance
        const currentYear = new Date().getFullYear();
        const balanceResult = await client.query(
          'SELECT * FROM leave_balances WHERE employee_id = $1 AND year = $2',
          [employee.employee_id, currentYear]
        );

        if (balanceResult.rows.length > 0) {
          const balance = balanceResult.rows[0];
          const balanceField = `${leaveType}_leave`;
          if (balance[balanceField] < days) {
            continue; // Skip if insufficient balance
          }
        }

        // Get a random manager/admin for approval
        let approvedBy = null;
        let approvedAt = null;
        if (status === 'approved' || status === 'rejected') {
          const approverResult = await client.query(
            `SELECT id FROM users WHERE role IN ('admin', 'manager') ORDER BY RANDOM() LIMIT 1`
          );
          if (approverResult.rows.length > 0) {
            approvedBy = approverResult.rows[0].id;
            approvedAt = new Date();
            // Set approved_at to a date between start_date and now
            if (startDate < today) {
              approvedAt = new Date(startDate.getTime() + Math.random() * (today.getTime() - startDate.getTime()));
            }
          }
        }

        try {
          await client.query(
            `INSERT INTO leave_requests 
             (employee_id, leave_type, start_date, end_date, days, reason, status, approved_by, approved_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
            [
              employee.employee_id,
              leaveType,
              startDate.toISOString().split('T')[0],
              endDate.toISOString().split('T')[0],
              days,
              reason,
              status,
              approvedBy,
              approvedAt ? approvedAt.toISOString() : null
            ]
          );
          requestsCreated.push({ employee_name: employee.employee_name, leave_type: leaveType, status });
        } catch (error) {
          // Ignore errors and continue
          console.error(`   ⚠️  Failed to create leave request for ${employee.employee_name}:`, error.message);
        }
      }
    }

    console.log(`   ✅ Created ${requestsCreated.length} leave requests`);
  } catch (error) {
    throw error;
  } finally {
    client.release();
  }
}

async function createUser(userData, role, departmentId = null) {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    // Check if user already exists
    const existing = await client.query(
      'SELECT id FROM users WHERE email = $1',
      [userData.email]
    );

    if (existing.rows.length > 0) {
      console.log(`⚠️  User already exists: ${userData.email}`);
      await client.query('ROLLBACK');
      return existing.rows[0].id;
    }

    // Hash password
    const hashedPassword = await hashPassword(userData.password);

    // Create user
    const userResult = await client.query(
      `INSERT INTO users (name, email, password, role, is_active) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING id, name, email, role`,
      [userData.name, userData.email, hashedPassword, role, true]
    );

    const userId = userResult.rows[0].id;

    // Create employee record for managers and employees
    if (role === 'manager' || role === 'employee') {
      // Get current employee count for code generation
      const countResult = await client.query('SELECT COUNT(*) as count FROM employees');
      const employeeCount = parseInt(countResult.rows[0].count) + 1;
      const employeeCode = await generateEmployeeCode(employeeCount);

      // Calculate join date (random date within last 2 years)
      const joinDate = new Date();
      joinDate.setFullYear(joinDate.getFullYear() - Math.floor(Math.random() * 2));
      joinDate.setMonth(Math.floor(Math.random() * 12));
      joinDate.setDate(Math.floor(Math.random() * 28) + 1);

      await client.query(
        `INSERT INTO employees (user_id, employee_code, department_id, position, salary, join_date, status, phone, address) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          userId,
          employeeCode,
          departmentId,
          userData.position || 'Employee',
          userData.salary || 50000,
          joinDate.toISOString().split('T')[0],
          'active',
          userData.phone || null,
          userData.address || null,
        ]
      );

      // Create leave balance for current year
      const currentYear = new Date().getFullYear();
      const employeeResult = await client.query('SELECT id FROM employees WHERE user_id = $1', [userId]);
      const employeeId = employeeResult.rows[0].id;

      await client.query(
        `INSERT INTO leave_balances (employee_id, year, sick_leave, vacation_leave, personal_leave, emergency_leave) 
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (employee_id, year) DO NOTHING`,
        [employeeId, currentYear, 10, 20, 5, 3]
      );
    }

    await client.query('COMMIT');
    return userId;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function seedDatabase() {
  console.log('🌱 Starting database seeding...\n');

  try {
    // Create departments and store their IDs
    console.log('📝 Creating Departments...');
    const departmentMap = {};
    for (const dept of defaultDepartments) {
      try {
        const deptId = await createDepartmentIfNotExist(dept);
        if (deptId) {
          departmentMap[dept.name] = deptId;
          console.log(`   ✅ ${dept.name}`);
        }
      } catch (error) {
        console.error(`   ❌ Failed to create ${dept.name}:`, error.message);
      }
    }

    // Create admins
    console.log('\n📝 Creating Admins...');
    for (const admin of admins) {
      try {
        const userId = await createUser(admin, 'admin');
        if (userId) {
          console.log(`   ✅ ${admin.name} (${admin.email})`);
        }
      } catch (error) {
        console.error(`   ❌ Failed to create ${admin.name}:`, error.message);
      }
    }

    // Create managers and assign them to departments
    console.log('\n📝 Creating Managers...');
    const managerUserIds = {};
    for (const manager of managers) {
      try {
        const deptId = departmentMap[manager.department] || null;
        const userId = await createUser(manager, 'manager', deptId);
        if (userId) {
          managerUserIds[manager.department] = userId;
          console.log(`   ✅ ${manager.name} (${manager.email}) - ${manager.department}`);
          
          // Update department with manager_id
          if (deptId) {
            const client = await pool.connect();
            try {
              await client.query(
                'UPDATE departments SET manager_id = $1 WHERE id = $2',
                [userId, deptId]
              );
            } finally {
              client.release();
            }
          }
        }
      } catch (error) {
        console.error(`   ❌ Failed to create ${manager.name}:`, error.message);
      }
    }

    // Create employees and assign them to departments
    console.log('\n📝 Creating Employees...');
    for (const employee of employees) {
      try {
        const deptId = departmentMap[employee.department] || null;
        const userId = await createUser(employee, 'employee', deptId);
        if (userId) {
          console.log(`   ✅ ${employee.name} (${employee.email}) - ${employee.department || 'No Department'}`);
        }
      } catch (error) {
        console.error(`   ❌ Failed to create ${employee.name}:`, error.message);
      }
    }

    // Create attendance records
    console.log('\n📝 Creating Attendance Records...');
    try {
      await createAttendanceRecords();
      console.log('   ✅ Attendance records created');
    } catch (error) {
      console.error(`   ❌ Failed to create attendance records:`, error.message);
    }

    // Create leave requests
    console.log('\n📝 Creating Leave Requests...');
    try {
      await createLeaveRequests();
      console.log('   ✅ Leave requests created');
    } catch (error) {
      console.error(`   ❌ Failed to create leave requests:`, error.message);
    }

    console.log('\n✨ Database seeding completed successfully!');
    console.log('\n📋 Login Credentials:');
    console.log('\n   Admins:');
    admins.forEach(admin => {
      console.log(`     Email: ${admin.email} | Password: ${admin.password}`);
    });
    console.log('\n   Managers:');
    managers.forEach(manager => {
      console.log(`     Email: ${manager.email} | Password: ${manager.password}`);
    });
    console.log('\n   Employees:');
    employees.forEach(employee => {
      console.log(`     Email: ${employee.email} | Password: ${employee.password}`);
    });
    console.log('\n');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

// Run the seed script
seedDatabase();

