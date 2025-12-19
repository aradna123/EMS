const pool = require('../config/database');

// Get dashboard data
const getDashboard = async (req, res, next) => {
  try {
    const role = req.user.role;

    if (role === 'employee') {
      return getEmployeeDashboard(req, res, next);
    } else if (role === 'manager' || role === 'admin') {
      return getAdminDashboard(req, res, next);
    }

    res.status(403).json({ message: 'Access denied' });
  } catch (error) {
    next(error);
  }
};

// Employee dashboard
const getEmployeeDashboard = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Get employee_id
    const empResult = await pool.query('SELECT id FROM employees WHERE user_id = $1', [userId]);
    if (empResult.rows.length === 0) {
      return res.status(404).json({ message: 'Employee record not found' });
    }

    const employeeId = empResult.rows[0].id;

    // Get pending leave requests
    const pendingLeaves = await pool.query(
      'SELECT COUNT(*) as count FROM leave_requests WHERE employee_id = $1 AND status = $2',
      [employeeId, 'pending']
    );

    // Get recent attendance (last 7 days)
    const recentAttendance = await pool.query(
      `SELECT date, check_in, check_out, status 
       FROM attendance 
       WHERE employee_id = $1 
       AND date >= CURRENT_DATE - INTERVAL '7 days'
       ORDER BY date DESC`,
      [employeeId]
    );

    // Get leave balance
    const currentYear = new Date().getFullYear();
    const leaveBalance = await pool.query(
      'SELECT * FROM leave_balances WHERE employee_id = $1 AND year = $2',
      [employeeId, currentYear]
    );

    // Get attendance stats (current month)
    const attendanceStats = await pool.query(
      `SELECT 
        COUNT(*) as total_days,
        COUNT(CASE WHEN status = 'present' THEN 1 END) as present,
        COUNT(CASE WHEN status = 'late' THEN 1 END) as late,
        COUNT(CASE WHEN status = 'absent' THEN 1 END) as absent
       FROM attendance
       WHERE employee_id = $1
       AND EXTRACT(YEAR FROM date) = $2
       AND EXTRACT(MONTH FROM date) = $3`,
      [employeeId, currentYear, new Date().getMonth() + 1]
    );

    res.json({
      pending_leave_requests: parseInt(pendingLeaves.rows[0].count),
      recent_attendance: recentAttendance.rows,
      leave_balance: leaveBalance.rows[0] || {
        sick_leave: 10,
        vacation_leave: 20,
        personal_leave: 5,
        emergency_leave: 3,
      },
      attendance_stats: attendanceStats.rows[0],
    });
  } catch (error) {
    next(error);
  }
};

// Admin/Manager dashboard
const getAdminDashboard = async (req, res, next) => {
  try {
    // Total employees
    const totalEmployees = await pool.query(
      "SELECT COUNT(*) as total, COUNT(CASE WHEN status = 'active' THEN 1 END) as active FROM employees"
    );

    // Total departments
    const totalDepartments = await pool.query(
      "SELECT COUNT(*) as count FROM departments"
    );

    // Employees by department
    const employeesByDept = await pool.query(
      `SELECT d.name as department, COUNT(e.id) as count
       FROM departments d
       LEFT JOIN employees e ON d.id = e.department_id AND e.status = 'active'
       GROUP BY d.id, d.name
       ORDER BY count DESC`
    );

    // Pending leave requests count
    const pendingLeaves = await pool.query(
      `SELECT COUNT(*) as count FROM leave_requests WHERE status = 'pending'`
    );

    // Pending leave requests details
    const pendingLeaveRequests = await pool.query(
      `SELECT lr.*, u.name as employee_name, 
        lr.leave_type, 
        (lr.end_date - lr.start_date) + 1 as days
       FROM leave_requests lr
       INNER JOIN employees e ON lr.employee_id = e.id
       INNER JOIN users u ON e.user_id = u.id
       WHERE lr.status = 'pending'
       ORDER BY lr.created_at DESC
       LIMIT 10`
    );

    // Leave requests by status
    const leaveStats = await pool.query(
      `SELECT 
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
        COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved,
        COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected
       FROM leave_requests`
    );

    // Attendance overview (today)
    const todayAttendance = await pool.query(
      `SELECT 
        COUNT(*) as total_employees,
        COUNT(CASE WHEN a.status = 'present' THEN 1 END) as present,
        COUNT(CASE WHEN a.status = 'late' THEN 1 END) as late,
        COUNT(CASE WHEN a.status = 'absent' THEN 1 END) as absent
       FROM employees e
       LEFT JOIN attendance a ON e.id = a.employee_id AND a.date = CURRENT_DATE
       WHERE e.status = 'active'`
    );

    // Recent activities (last 10)
    const recentActivities = await pool.query(
      `(SELECT 'leave_request' as type, lr.created_at, u.name as employee_name, 'Submitted leave request' as description
        FROM leave_requests lr
        INNER JOIN employees e ON lr.employee_id = e.id
        INNER JOIN users u ON e.user_id = u.id
        ORDER BY lr.created_at DESC LIMIT 5)
       UNION ALL
       (SELECT 'attendance' as type, a.created_at, u.name as employee_name, 'Checked in' as description
        FROM attendance a
        INNER JOIN employees e ON a.employee_id = e.id
        INNER JOIN users u ON e.user_id = u.id
        WHERE a.check_in IS NOT NULL
        ORDER BY a.created_at DESC LIMIT 5)
       ORDER BY created_at DESC LIMIT 10`
    );

    // Monthly statistics (current month)
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();

    const monthlyStats = await pool.query(
      `SELECT 
        COUNT(DISTINCT a.employee_id) as employees_with_attendance,
        COUNT(CASE WHEN a.status = 'present' THEN 1 END) as present_days,
        COUNT(CASE WHEN a.status = 'late' THEN 1 END) as late_days,
        COUNT(CASE WHEN a.status = 'absent' THEN 1 END) as absent_days
       FROM attendance a
       WHERE EXTRACT(YEAR FROM a.date) = $1
       AND EXTRACT(MONTH FROM a.date) = $2`,
      [currentYear, currentMonth]
    );

    // Format data for frontend
    const departmentStats = employeesByDept.rows.map(dept => ({
      name: dept.department,
      count: parseInt(dept.count)
    }));

    const leaveStatsData = [
      { name: 'Pending', value: parseInt(leaveStats.rows[0].pending || 0), color: '#f59e0b' },
      { name: 'Approved', value: parseInt(leaveStats.rows[0].approved || 0), color: '#10b981' },
      { name: 'Rejected', value: parseInt(leaveStats.rows[0].rejected || 0), color: '#ef4444' },
    ];

    const formattedActivities = recentActivities.rows.map(activity => ({
      title: `${activity.employee_name} - ${activity.description}`,
      time: new Date(activity.created_at).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    }));

    res.json({
      totalEmployees: parseInt(totalEmployees.rows[0].total),
      activeEmployees: parseInt(totalEmployees.rows[0].active),
      totalDepartments: parseInt(totalDepartments.rows[0].count),
      presentToday: parseInt(todayAttendance.rows[0].present || 0),
      pendingLeaves: parseInt(pendingLeaves.rows[0].count),
      approvedLeaves: parseInt(leaveStats.rows[0].approved || 0),
      rejectedLeaves: parseInt(leaveStats.rows[0].rejected || 0),
      attendance: {
        present: parseInt(todayAttendance.rows[0].present || 0),
        late: parseInt(todayAttendance.rows[0].late || 0),
        absent: parseInt(todayAttendance.rows[0].absent || 0),
        totalEmployees: parseInt(todayAttendance.rows[0].total_employees || 0),
      },
      departmentStats: departmentStats,
      leaveStats: leaveStatsData,
      recentActivities: formattedActivities,
      pendingLeaveRequests: pendingLeaveRequests.rows,
      monthlyStatistics: monthlyStats.rows[0],
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboard,
};

