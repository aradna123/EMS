const pool = require('../config/database');

// Check in
const checkIn = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { date } = req.body;

    // Get employee_id from user_id
    const empResult = await pool.query('SELECT id FROM employees WHERE user_id = $1', [userId]);
    if (empResult.rows.length === 0) {
      return res.status(404).json({ message: 'Employee record not found' });
    }

    const employeeId = empResult.rows[0].id;
    const attendanceDate = date ? new Date(date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
    const checkInTime = new Date().toTimeString().split(' ')[0].substring(0, 5);

    // Check if attendance already exists for today
    const existing = await pool.query(
      'SELECT id, check_in FROM attendance WHERE employee_id = $1 AND date = $2',
      [employeeId, attendanceDate]
    );

    if (existing.rows.length > 0 && existing.rows[0].check_in) {
      return res.status(400).json({ message: 'Already checked in for this date' });
    }

    // Determine if late (assuming 9:00 AM is standard check-in time)
    const checkInHour = parseInt(checkInTime.split(':')[0]);
    const checkInMinute = parseInt(checkInTime.split(':')[1]);
    const isLate = checkInHour > 9 || (checkInHour === 9 && checkInMinute > 0);
    const status = isLate ? 'late' : 'present';

    if (existing.rows.length > 0) {
      // Update existing record
      await pool.query(
        'UPDATE attendance SET check_in = $1, status = $2 WHERE id = $3',
        [checkInTime, status, existing.rows[0].id]
      );
    } else {
      // Create new record
      await pool.query(
        'INSERT INTO attendance (employee_id, date, check_in, status) VALUES ($1, $2, $3, $4)',
        [employeeId, attendanceDate, checkInTime, status]
      );
    }

    res.json({
      message: 'Checked in successfully',
      date: attendanceDate,
      check_in: checkInTime,
      status,
    });
  } catch (error) {
    next(error);
  }
};

// Check out
const checkOut = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { date } = req.body;

    // Get employee_id from user_id
    const empResult = await pool.query('SELECT id FROM employees WHERE user_id = $1', [userId]);
    if (empResult.rows.length === 0) {
      return res.status(404).json({ message: 'Employee record not found' });
    }

    const employeeId = empResult.rows[0].id;
    const attendanceDate = date ? new Date(date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
    const checkOutTime = new Date().toTimeString().split(' ')[0].substring(0, 5);

    // Check if attendance exists and has check-in
    const existing = await pool.query(
      'SELECT id, check_in, check_out FROM attendance WHERE employee_id = $1 AND date = $2',
      [employeeId, attendanceDate]
    );

    if (existing.rows.length === 0 || !existing.rows[0].check_in) {
      return res.status(400).json({ message: 'Please check in first' });
    }

    if (existing.rows[0].check_out) {
      return res.status(400).json({ message: 'Already checked out for this date' });
    }

    const checkInTime = existing.rows[0].check_in;
    
    // Calculate hours worked
    const checkInParts = checkInTime.split(':');
    const checkOutParts = checkOutTime.split(':');
    const checkInMinutes = parseInt(checkInParts[0]) * 60 + parseInt(checkInParts[1]);
    const checkOutMinutes = parseInt(checkOutParts[0]) * 60 + parseInt(checkOutParts[1]);
    const hoursWorked = ((checkOutMinutes - checkInMinutes) / 60).toFixed(2);

    // Update check_out (hours_worked is calculated on the fly in queries)
    await pool.query(
      'UPDATE attendance SET check_out = $1 WHERE id = $2', 
      [checkOutTime, existing.rows[0].id]
    );

    res.json({
      message: 'Checked out successfully',
      date: attendanceDate,
      check_out: checkOutTime,
      hours_worked: hoursWorked,
    });
  } catch (error) {
    next(error);
  }
};

// Get attendance records
const getAttendance = async (req, res, next) => {
  try {
    const { employee_id, start_date, end_date, page = 1, limit = 30 } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT a.id, a.date, a.check_in, a.check_out, 
             CASE 
               WHEN a.check_in IS NOT NULL AND a.check_out IS NOT NULL THEN
                 ROUND(
                   EXTRACT(EPOCH FROM (
                     (a.date + a.check_out::time) - (a.date + a.check_in::time)
                   )) / 3600.0,
                   2
                 )
               ELSE NULL
             END as hours_worked,
             a.status, a.notes, a.created_at,
             e.id as employee_id, e.employee_code,
             u.name as employee_name, u.email
      FROM attendance a
      INNER JOIN employees e ON a.employee_id = e.id
      INNER JOIN users u ON e.user_id = u.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;

    // Role-based filtering
    if (req.user.role === 'employee') {
      const empResult = await pool.query('SELECT id FROM employees WHERE user_id = $1', [req.user.id]);
      if (empResult.rows.length > 0) {
        query += ` AND a.employee_id = $${paramCount}`;
        params.push(empResult.rows[0].id);
        paramCount++;
      }
    } else if (req.user.role === 'manager') {
      // Managers can only see attendance for their department employees
      const managerDeptResult = await pool.query(
        'SELECT id FROM departments WHERE manager_id = $1',
        [req.user.id]
      );
      if (managerDeptResult.rows.length > 0) {
        query += ` AND e.department_id = $${paramCount}`;
        params.push(managerDeptResult.rows[0].id);
        paramCount++;
      } else {
        // Manager has no department assigned, return empty result
        query += ` AND 1=0`;
      }
      // If specific employee_id is requested, still filter by department
      if (employee_id) {
        // Verify employee belongs to manager's department
        const empDeptResult = await pool.query(
          'SELECT department_id FROM employees WHERE id = $1',
          [employee_id]
        );
        if (managerDeptResult.rows.length > 0 && empDeptResult.rows.length > 0) {
          if (empDeptResult.rows[0].department_id !== managerDeptResult.rows[0].id) {
            query += ` AND 1=0`; // Employee not in manager's department
          }
        }
      }
    } else if (employee_id) {
      query += ` AND a.employee_id = $${paramCount}`;
      params.push(employee_id);
      paramCount++;
    }

    if (start_date) {
      query += ` AND a.date >= $${paramCount}`;
      params.push(start_date);
      paramCount++;
    }

    if (end_date) {
      query += ` AND a.date <= $${paramCount}`;
      params.push(end_date);
      paramCount++;
    }

    query += ` ORDER BY a.date DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    // Get total count
    let countQuery = `SELECT COUNT(*) as total FROM attendance a INNER JOIN employees e ON a.employee_id = e.id WHERE 1=1`;
    const countParams = [];
    let countParamCount = 1;

    if (req.user.role === 'employee') {
      const empResult = await pool.query('SELECT id FROM employees WHERE user_id = $1', [req.user.id]);
      if (empResult.rows.length > 0) {
        countQuery += ` AND a.employee_id = $${countParamCount}`;
        countParams.push(empResult.rows[0].id);
        countParamCount++;
      }
    } else if (req.user.role === 'manager') {
      // Managers can only count attendance for their department employees
      const managerDeptResult = await pool.query(
        'SELECT id FROM departments WHERE manager_id = $1',
        [req.user.id]
      );
      if (managerDeptResult.rows.length > 0) {
        countQuery += ` AND e.department_id = $${countParamCount}`;
        countParams.push(managerDeptResult.rows[0].id);
        countParamCount++;
      } else {
        countQuery += ` AND 1=0`;
      }
    } else if (employee_id) {
      countQuery += ` AND a.employee_id = $${countParamCount}`;
      countParams.push(employee_id);
      countParamCount++;
    }

    if (start_date) {
      countQuery += ` AND a.date >= $${countParamCount}`;
      countParams.push(start_date);
      countParamCount++;
    }

    if (end_date) {
      countQuery += ` AND a.date <= $${countParamCount}`;
      countParams.push(end_date);
      countParamCount++;
    }

    const countResult = await pool.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].total);

    res.json({
      attendance: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

// Create/Update attendance (Admin/Manager only)
const createAttendance = async (req, res, next) => {
  try {
    const { employee_id, date, check_in, check_out, status, notes } = req.body;

    const attendanceDate = date ? new Date(date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];

    // Check if record exists
    const existing = await pool.query(
      'SELECT id FROM attendance WHERE employee_id = $1 AND date = $2',
      [employee_id, attendanceDate]
    );

    if (existing.rows.length > 0) {
      // Update existing
      const updates = [];
      const values = [];
      let paramCount = 1;

      if (check_in) {
        updates.push(`check_in = $${paramCount++}`);
        values.push(check_in);
      }
      if (check_out) {
        updates.push(`check_out = $${paramCount++}`);
        values.push(check_out);
      }
      if (status) {
        updates.push(`status = $${paramCount++}`);
        values.push(status);
      }
      if (notes !== undefined) {
        updates.push(`notes = $${paramCount++}`);
        values.push(notes);
      }

      values.push(existing.rows[0].id);
      await pool.query(`UPDATE attendance SET ${updates.join(', ')} WHERE id = $${paramCount}`, values);
    } else {
      // Create new
      await pool.query(
        'INSERT INTO attendance (employee_id, date, check_in, check_out, status, notes) VALUES ($1, $2, $3, $4, $5, $6)',
        [employee_id, attendanceDate, check_in || null, check_out || null, status || 'present', notes || null]
      );
    }

    res.json({ message: 'Attendance record saved successfully' });
  } catch (error) {
    next(error);
  }
};

// Get monthly attendance report
const getMonthlyReport = async (req, res, next) => {
  try {
    const { employee_id, year, month } = req.query;

    if (!year || !month) {
      return res.status(400).json({ message: 'Year and month are required' });
    }

    let query = `
      SELECT a.date, a.check_in, a.check_out, a.status, a.notes,
             e.employee_code,
             u.name as employee_name
      FROM attendance a
      INNER JOIN employees e ON a.employee_id = e.id
      INNER JOIN users u ON e.user_id = u.id
      WHERE EXTRACT(YEAR FROM a.date) = $1 AND EXTRACT(MONTH FROM a.date) = $2
    `;
    const params = [year, month];
    let paramCount = 3;

    if (req.user.role === 'employee') {
      const empResult = await pool.query('SELECT id FROM employees WHERE user_id = $1', [req.user.id]);
      if (empResult.rows.length > 0) {
        query += ` AND a.employee_id = $${paramCount}`;
        params.push(empResult.rows[0].id);
        paramCount++;
      }
    } else if (employee_id) {
      query += ` AND a.employee_id = $${paramCount}`;
      params.push(employee_id);
      paramCount++;
    }

    query += ' ORDER BY a.date';

    const result = await pool.query(query, params);

    // Calculate statistics
    const stats = {
      total_days: result.rows.length,
      present: result.rows.filter((r) => r.status === 'present').length,
      late: result.rows.filter((r) => r.status === 'late').length,
      absent: result.rows.filter((r) => r.status === 'absent').length,
      half_day: result.rows.filter((r) => r.status === 'half_day').length,
    };

    res.json({
      records: result.rows,
      statistics: stats,
    });
  } catch (error) {
    next(error);
  }
};

// Get attendance statistics
const getAttendanceStats = async (req, res, next) => {
  try {
    const { employee_id, start_date, end_date } = req.query;

    let query = `
      SELECT 
        COUNT(*) as total_records,
        COUNT(CASE WHEN status = 'present' THEN 1 END) as present,
        COUNT(CASE WHEN status = 'late' THEN 1 END) as late,
        COUNT(CASE WHEN status = 'absent' THEN 1 END) as absent,
        COUNT(CASE WHEN status = 'half_day' THEN 1 END) as half_day
      FROM attendance
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;

    if (req.user.role === 'employee') {
      const empResult = await pool.query('SELECT id FROM employees WHERE user_id = $1', [req.user.id]);
      if (empResult.rows.length > 0) {
        query += ` AND employee_id = $${paramCount}`;
        params.push(empResult.rows[0].id);
        paramCount++;
      }
    } else if (employee_id) {
      query += ` AND employee_id = $${paramCount}`;
      params.push(employee_id);
      paramCount++;
    }

    if (start_date) {
      query += ` AND date >= $${paramCount}`;
      params.push(start_date);
      paramCount++;
    }

    if (end_date) {
      query += ` AND date <= $${paramCount}`;
      params.push(end_date);
      paramCount++;
    }

    const result = await pool.query(query, params);

    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  checkIn,
  checkOut,
  getAttendance,
  createAttendance,
  getMonthlyReport,
  getAttendanceStats,
};

