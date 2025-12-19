const pool = require('../config/database');

// Submit leave request
const submitLeaveRequest = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { leave_type, start_date, end_date, reason } = req.body;

    // Get employee_id
    const empResult = await pool.query('SELECT id FROM employees WHERE user_id = $1', [userId]);
    if (empResult.rows.length === 0) {
      return res.status(404).json({ message: 'Employee record not found' });
    }

    const employeeId = empResult.rows[0].id;

    // Calculate days (excluding weekends)
    const start = new Date(start_date);
    const end = new Date(end_date);
    let days = 0;
    const currentDate = new Date(start);

    while (currentDate <= end) {
      const dayOfWeek = currentDate.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        days++;
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }

    if (days <= 0) {
      return res.status(400).json({ message: 'Invalid date range' });
    }

    // Check leave balance
    const currentYear = new Date().getFullYear();
    const balanceResult = await pool.query(
      'SELECT * FROM leave_balances WHERE employee_id = $1 AND year = $2',
      [employeeId, currentYear]
    );

    if (balanceResult.rows.length === 0) {
      // Initialize leave balance
      await pool.query(
        'INSERT INTO leave_balances (employee_id, year) VALUES ($1, $2)',
        [employeeId, currentYear]
      );
    }

    const balance = balanceResult.rows[0] || {
      sick_leave: 10,
      vacation_leave: 20,
      personal_leave: 5,
      emergency_leave: 3,
    };

    const balanceField = `${leave_type}_leave`;
    if (balance[balanceField] < days) {
      return res.status(400).json({
        message: `Insufficient leave balance. Available: ${balance[balanceField]} days`,
      });
    }

    // Check for overlapping leave requests
    // Only check pending requests and approved/pending requests for today or future dates
    const today = new Date().toISOString().split('T')[0];
    const overlapping = await pool.query(
      `SELECT id, start_date, end_date, status FROM leave_requests 
       WHERE employee_id = $1 
       AND (
         (status = 'pending') OR 
         (status = 'approved' AND end_date >= $4)
       )
       AND (
         (start_date <= $2 AND end_date >= $2) OR
         (start_date <= $3 AND end_date >= $3) OR
         (start_date >= $2 AND end_date <= $3)
       )`,
      [employeeId, start_date, end_date, today]
    );

    console.log('Overlapping check:', {
      employeeId,
      requestedDates: { start_date, end_date },
      today,
      overlappingRequests: overlapping.rows
    });

    if (overlapping.rows.length > 0) {
      return res.status(400).json({ 
        message: 'Overlapping leave request already exists',
        details: overlapping.rows.map(r => ({
          dates: `${r.start_date} to ${r.end_date}`,
          status: r.status
        }))
      });
    }

    // Create leave request
    const result = await pool.query(
      'INSERT INTO leave_requests (employee_id, leave_type, start_date, end_date, days, reason) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [employeeId, leave_type, start_date, end_date, days, reason || null]
    );

    // Get employee name for notification
    const userResult = await pool.query('SELECT name FROM users WHERE id = $1', [userId]);
    const employeeName = userResult.rows[0]?.name || 'Employee';

    // Get all managers and admins to save notifications
    const managersResult = await pool.query(
      "SELECT id FROM users WHERE role IN ('admin', 'manager')"
    );

    console.log('Found managers/admins:', managersResult.rows.length);

    // Save notification to database for each manager/admin
    const notificationData = {
      leaveRequestId: result.rows[0].id,
      employeeId,
      employeeName,
      leaveType: leave_type,
      startDate: start_date,
      endDate: end_date,
      days,
    };

    const notificationPromises = managersResult.rows.map(manager => {
      console.log('Saving notification for manager:', manager.id);
      return pool.query(
        `INSERT INTO notifications (user_id, type, title, message, data) 
         VALUES ($1, $2, $3, $4, $5)`,
        [
          manager.id,
          'leave_request',
          'New Leave Request',
          `${employeeName} requested ${days} day(s) of ${leave_type} leave`,
          JSON.stringify(notificationData)
        ]
      );
    });
    await Promise.all(notificationPromises);
    console.log('All notifications saved successfully');

    // Send real-time notification to managers and admins via Socket.IO
    const io = req.app.get('io');
    if (io) {
      const notificationPayload = {
        id: result.rows[0].id,
        employeeName,
        leaveType: leave_type,
        startDate: start_date,
        endDate: end_date,
        days,
        reason: reason || 'No reason provided',
        timestamp: new Date(),
      };
      
      console.log('Emitting socket event to managers room:', notificationPayload);
      io.to('managers').emit('newLeaveRequest', notificationPayload);
      console.log('Leave notification sent to managers room');
    } else {
      console.log('Socket.IO instance not found!');
    }

    res.status(201).json({
      message: 'Leave request submitted successfully',
      leave_request: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
};

// Get leave requests
const getLeaveRequests = async (req, res, next) => {
  try {
    const { employee_id, status, leave_type, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT lr.id, lr.leave_type, lr.start_date, lr.end_date, lr.days, lr.reason, 
             lr.status, lr.approved_by, lr.approved_at, lr.created_at,
             e.id as employee_id, e.employee_code,
             u.name as employee_name, u.email, u.role as requester_role,
             approver.name as approver_name
      FROM leave_requests lr
      INNER JOIN employees e ON lr.employee_id = e.id
      INNER JOIN users u ON e.user_id = u.id
      LEFT JOIN users approver ON lr.approved_by = approver.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;

    // Role-based filtering
    if (req.user.role === 'employee') {
      const empResult = await pool.query('SELECT id FROM employees WHERE user_id = $1', [req.user.id]);
      if (empResult.rows.length > 0) {
        query += ` AND lr.employee_id = $${paramCount}`;
        params.push(empResult.rows[0].id);
        paramCount++;
      }
    } else if (req.user.role === 'manager') {
      // Managers can see:
      // 1. Leave requests from their department employees
      // 2. Their own leave requests
      const managerDeptResult = await pool.query(
        'SELECT id FROM departments WHERE manager_id = $1',
        [req.user.id]
      );
      const managerEmpResult = await pool.query('SELECT id FROM employees WHERE user_id = $1', [req.user.id]);
      
      if (managerDeptResult.rows.length > 0 || managerEmpResult.rows.length > 0) {
        const conditions = [];
        if (managerDeptResult.rows.length > 0) {
          conditions.push(`e.department_id = $${paramCount}`);
          params.push(managerDeptResult.rows[0].id);
          paramCount++;
        }
        if (managerEmpResult.rows.length > 0) {
          conditions.push(`lr.employee_id = $${paramCount}`);
          params.push(managerEmpResult.rows[0].id);
          paramCount++;
        }
        if (conditions.length > 0) {
          query += ` AND (${conditions.join(' OR ')})`;
        }
      } else {
        // Manager has no department assigned and no employee record, return empty result
        query += ` AND 1=0`;
      }
      // If specific employee_id is requested, still filter by department or own requests
      if (employee_id) {
        // Verify employee belongs to manager's department or is the manager themselves
        const empDeptResult = await pool.query(
          'SELECT department_id FROM employees WHERE id = $1',
          [employee_id]
        );
        if (managerDeptResult.rows.length > 0 && empDeptResult.rows.length > 0) {
          if (empDeptResult.rows[0].department_id !== managerDeptResult.rows[0].id) {
            // Check if it's the manager's own request
            if (managerEmpResult.rows.length > 0 && parseInt(employee_id) !== managerEmpResult.rows[0].id) {
              query += ` AND 1=0`; // Employee not in manager's department and not manager themselves
            }
          }
        }
      }
    } else if (employee_id) {
      query += ` AND lr.employee_id = $${paramCount}`;
      params.push(employee_id);
      paramCount++;
    }

    if (status) {
      query += ` AND lr.status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }

    if (leave_type) {
      query += ` AND lr.leave_type = $${paramCount}`;
      params.push(leave_type);
      paramCount++;
    }

    query += ` ORDER BY lr.created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    // Get total count
    let countQuery = `SELECT COUNT(*) as total FROM leave_requests lr INNER JOIN employees e ON lr.employee_id = e.id WHERE 1=1`;
    const countParams = [];
    let countParamCount = 1;

    if (req.user.role === 'employee') {
      const empResult = await pool.query('SELECT id FROM employees WHERE user_id = $1', [req.user.id]);
      if (empResult.rows.length > 0) {
        countQuery += ` AND lr.employee_id = $${countParamCount}`;
        countParams.push(empResult.rows[0].id);
        countParamCount++;
      }
    } else if (req.user.role === 'manager') {
      // Managers can only count leave requests for their department employees
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
      countQuery += ` AND lr.employee_id = $${countParamCount}`;
      countParams.push(employee_id);
      countParamCount++;
    }

    if (status) {
      countQuery += ` AND lr.status = $${countParamCount}`;
      countParams.push(status);
      countParamCount++;
    }

    if (leave_type) {
      countQuery += ` AND lr.leave_type = $${countParamCount}`;
      countParams.push(leave_type);
      countParamCount++;
    }

    const countResult = await pool.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].total);

    res.json({
      leaves: result.rows,
      leave_requests: result.rows, // For backward compatibility
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

// Approve/Reject leave request
const approveLeaveRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    console.log('Approve/Reject request:', { id, status, body: req.body });

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Status must be approved or rejected' });
    }

    // Parse ID to integer
    const leaveRequestId = parseInt(id);
    
    if (isNaN(leaveRequestId)) {
      return res.status(400).json({ message: 'Invalid leave request ID' });
    }

    // Get leave request with employee and user info
    const leaveResult = await pool.query(
      `SELECT lr.*, e.user_id, u.role as requester_role
       FROM leave_requests lr
       INNER JOIN employees e ON lr.employee_id = e.id
       INNER JOIN users u ON e.user_id = u.id
       WHERE lr.id = $1`,
      [leaveRequestId]
    );

    if (leaveResult.rows.length === 0) {
      return res.status(404).json({ message: 'Leave request not found' });
    }

    const leaveRequest = leaveResult.rows[0];

    // Validate required fields
    if (!leaveRequest.employee_id) {
      return res.status(400).json({ message: 'Leave request has invalid employee record' });
    }

    if (!leaveRequest.user_id) {
      return res.status(400).json({ message: 'Leave request has invalid user record' });
    }

    if (leaveRequest.status !== 'pending') {
      return res.status(400).json({ message: 'Leave request has already been processed' });
    }

    // If the requester is a manager, only admins can approve/reject
    if (leaveRequest.requester_role === 'manager' && req.user.role !== 'admin') {
      return res.status(403).json({ 
        message: 'Only administrators can approve or reject manager leave requests' 
      });
    }

    // Use a client connection to ensure transaction isolation
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      console.log(`Updating leave request ${leaveRequestId} to status: ${status}`);
      console.log(`Current leave request status: ${leaveRequest.status}`);
      console.log(`Approver user ID: ${req.user.id}`);
      
      // First, check the current state
      const checkResult = await client.query(
        'SELECT id, status, approved_by FROM leave_requests WHERE id = $1',
        [leaveRequestId]
      );
      console.log('Before update - Current record:', checkResult.rows[0]);
      
      // Update leave request
      const updateResult = await client.query(
        'UPDATE leave_requests SET status = $1, approved_by = $2, approved_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING *',
        [status, req.user.id, leaveRequestId]
      );
      
      console.log('Update result:', {
        rowCount: updateResult.rowCount,
        updatedRecord: updateResult.rows[0]
      });
      
      if (updateResult.rowCount === 0) {
        throw new Error(`Leave request ${leaveRequestId} not found or update failed`);
      }
      
      // Verify immediately within the transaction
      const verifyInTransaction = await client.query(
        'SELECT id, status, approved_by, approved_at FROM leave_requests WHERE id = $1',
        [leaveRequestId]
      );
      console.log('Within transaction - Verified status:', verifyInTransaction.rows[0]?.status);

      // If approved, deduct from leave balance
      if (status === 'approved') {
        const currentYear = new Date().getFullYear();
        
        // Validate leave_type and build column name safely
        const validLeaveTypes = ['sick', 'vacation', 'personal', 'emergency'];
        if (!validLeaveTypes.includes(leaveRequest.leave_type)) {
          throw new Error('Invalid leave type');
        }
        
        const balanceField = `${leaveRequest.leave_type}_leave`;
        
        // Check if leave balance exists, create if not
        const balanceCheck = await client.query(
          'SELECT * FROM leave_balances WHERE employee_id = $1 AND year = $2',
          [leaveRequest.employee_id, currentYear]
        );
        
        if (balanceCheck.rows.length === 0) {
          // Initialize with default values to avoid NULL issues
          await client.query(
            `INSERT INTO leave_balances (employee_id, year, sick_leave, vacation_leave, personal_leave, emergency_leave) 
             VALUES ($1, $2, 10, 20, 5, 3)`,
            [leaveRequest.employee_id, currentYear]
          );
        }

        // Use parameterized query with safe column name and handle NULL values
        const updateQuery = `UPDATE leave_balances 
           SET ${balanceField} = GREATEST(COALESCE(${balanceField}, 0) - $1, 0)
           WHERE employee_id = $2 AND year = $3`;
           
        await client.query(updateQuery, [leaveRequest.days, leaveRequest.employee_id, currentYear]);
      }

      // Get employee name for notification
      try {
        const employeeResult = await client.query('SELECT name FROM users WHERE id = $1', [leaveRequest.user_id]);
        const employeeName = employeeResult.rows[0]?.name || 'Employee';
        
        // Get approver name
        const approverResult = await client.query('SELECT name FROM users WHERE id = $1', [req.user.id]);
        const approverName = approverResult.rows[0]?.name || 'Admin';

        // Create notification for the employee
        const notificationData = {
          leaveRequestId: parseInt(id),
          leaveType: leaveRequest.leave_type,
          startDate: leaveRequest.start_date,
          endDate: leaveRequest.end_date,
          days: leaveRequest.days,
          status: status,
          approverName: approverName,
        };

        await client.query(
          `INSERT INTO notifications (user_id, type, title, message, data) 
           VALUES ($1, $2, $3, $4, $5)`,
          [
            leaveRequest.user_id,
            'leave_status',
            `Leave Request ${status === 'approved' ? 'Approved' : 'Rejected'}`,
            `Your ${leaveRequest.leave_type} leave request for ${leaveRequest.days} day(s) has been ${status} by ${approverName}`,
            JSON.stringify(notificationData)
          ]
        );

        // Send real-time notification via Socket.IO
        const io = req.app.get('io');
        if (io) {
          const socketPayload = {
            leaveRequestId: leaveRequestId,
            status: status,
            employeeId: leaveRequest.user_id,
            message: `Your leave request has been ${status}`,
            timestamp: new Date(),
          };
          // Send to specific user's socket if connected
          const connectedUsers = req.app.get('connectedUsers');
          if (connectedUsers) {
            const userSocketId = connectedUsers.get(leaveRequest.user_id);
            if (userSocketId) {
              io.to(userSocketId).emit('leaveStatusUpdate', socketPayload);
            }
          }
          // Also emit to all users (fallback)
          io.emit('leaveStatusUpdate', socketPayload);
          console.log(`Leave status update sent to user ${leaveRequest.user_id}`);
        }
      } catch (notifError) {
        // Log notification error but don't fail the transaction
        console.error('Error creating notification:', notifError);
      }

      await client.query('COMMIT');
      
      console.log(`Leave request ${leaveRequestId} ${status} successfully`);
      
      // Verify the update was persisted (using a new query from the pool)
      const verifyResult = await pool.query(
        'SELECT id, status, approved_by, approved_at FROM leave_requests WHERE id = $1',
        [leaveRequestId]
      );
      
      console.log('After commit - Verified status:', verifyResult.rows[0]?.status);
      console.log('After commit - Full record:', verifyResult.rows[0]);

      res.json({ 
        message: `Leave request ${status} successfully`,
        leave_request: updateResult.rows[0]
      });
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error in approveLeaveRequest transaction:', error);
      console.error('Error stack:', error.stack);
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error in approveLeaveRequest:', error);
    next(error);
  }
};

// Get leave balance
const getLeaveBalance = async (req, res, next) => {
  try {
    const { employee_id, year } = req.query;

    let employeeId;

    // Employees and managers can get their own balance
    if (req.user.role === 'employee' || req.user.role === 'manager') {
      const empResult = await pool.query('SELECT id FROM employees WHERE user_id = $1', [req.user.id]);
      if (empResult.rows.length === 0) {
        return res.status(404).json({ message: 'Employee record not found' });
      }
      employeeId = empResult.rows[0].id;
    } else if (employee_id) {
      // Admins can query any employee's balance
      employeeId = employee_id;
    } else {
      return res.status(400).json({ message: 'Employee ID is required' });
    }

    const currentYear = year || new Date().getFullYear();

    const result = await pool.query(
      'SELECT * FROM leave_balances WHERE employee_id = $1 AND year = $2',
      [employeeId, currentYear]
    );

    if (result.rows.length === 0) {
      // Initialize if doesn't exist
      await pool.query(
        'INSERT INTO leave_balances (employee_id, year) VALUES ($1, $2) RETURNING *',
        [employeeId, currentYear]
      );
      const newResult = await pool.query(
        'SELECT * FROM leave_balances WHERE employee_id = $1 AND year = $2',
        [employeeId, currentYear]
      );
      return res.json(newResult.rows[0]);
    }

    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
};

// Get leave calendar
const getLeaveCalendar = async (req, res, next) => {
  try {
    const { year, month } = req.query;
    const currentYear = year || new Date().getFullYear();
    const currentMonth = month || new Date().getMonth() + 1;

    let query = `
      SELECT lr.start_date, lr.end_date, lr.leave_type, lr.status,
             e.employee_code,
             u.name as employee_name
      FROM leave_requests lr
      INNER JOIN employees e ON lr.employee_id = e.id
      INNER JOIN users u ON e.user_id = u.id
      WHERE EXTRACT(YEAR FROM lr.start_date) = $1 
      AND EXTRACT(MONTH FROM lr.start_date) = $2
      AND lr.status = 'approved'
    `;

    const result = await pool.query(query, [currentYear, currentMonth]);

    res.json({
      year: currentYear,
      month: currentMonth,
      leaves: result.rows,
    });
  } catch (error) {
    next(error);
  }
};

// Get single leave request
const getLeaveRequest = async (req, res, next) => {
  try {
    const { id } = req.params;

    const query = `
      SELECT lr.id, lr.leave_type, lr.start_date, lr.end_date, lr.days, lr.reason, 
             lr.status, lr.approved_by, lr.approved_at, lr.created_at,
             e.id as employee_id, e.employee_code,
             u.name as employee_name, u.email, u.role as requester_role,
             approver.name as approver_name
      FROM leave_requests lr
      INNER JOIN employees e ON lr.employee_id = e.id
      INNER JOIN users u ON e.user_id = u.id
      LEFT JOIN users approver ON lr.approved_by = approver.id
      WHERE lr.id = $1
    `;

    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Leave request not found' });
    }

    const leaveRequest = result.rows[0];

    // Role-based access control: employees can only view their own requests
    if (req.user.role === 'employee') {
      const empResult = await pool.query('SELECT id FROM employees WHERE user_id = $1', [req.user.id]);
      if (empResult.rows.length > 0 && leaveRequest.employee_id !== empResult.rows[0].id) {
        return res.status(403).json({ message: 'Access denied. You can only view your own leave requests' });
      }
    }

    res.json(leaveRequest);
  } catch (error) {
    next(error);
  }
};

// Update own pending leave request
const updateLeaveRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { leave_type, start_date, end_date, reason } = req.body;

    // Get leave request
    const leaveResult = await pool.query(
      'SELECT * FROM leave_requests WHERE id = $1',
      [id]
    );

    if (leaveResult.rows.length === 0) {
      return res.status(404).json({ message: 'Leave request not found' });
    }

    const leaveRequest = leaveResult.rows[0];

    // Check if user owns this leave request
    const empResult = await pool.query('SELECT id FROM employees WHERE user_id = $1', [req.user.id]);
    if (empResult.rows.length === 0) {
      return res.status(404).json({ message: 'Employee record not found' });
    }

    if (leaveRequest.employee_id !== empResult.rows[0].id) {
      return res.status(403).json({ message: 'Access denied. You can only update your own leave requests' });
    }

    // Only allow updates to pending requests
    if (leaveRequest.status !== 'pending') {
      return res.status(400).json({ message: 'Only pending leave requests can be updated' });
    }

    // Calculate days if dates are provided
    let days = leaveRequest.days;
    if (start_date && end_date) {
      const start = new Date(start_date);
      const end = new Date(end_date);
      let calculatedDays = 0;
      const currentDate = new Date(start);

      while (currentDate <= end) {
        const dayOfWeek = currentDate.getDay();
        if (dayOfWeek !== 0 && dayOfWeek !== 6) {
          calculatedDays++;
        }
        currentDate.setDate(currentDate.getDate() + 1);
      }

      if (calculatedDays <= 0) {
        return res.status(400).json({ message: 'Invalid date range' });
      }
      days = calculatedDays;
    }

    // Check leave balance if leave type or days changed
    if (leave_type || (start_date && end_date)) {
      const finalLeaveType = leave_type || leaveRequest.leave_type;
      const currentYear = new Date().getFullYear();
      
      const balanceResult = await pool.query(
        'SELECT * FROM leave_balances WHERE employee_id = $1 AND year = $2',
        [leaveRequest.employee_id, currentYear]
      );

      const balance = balanceResult.rows[0] || {
        sick_leave: 10,
        vacation_leave: 20,
        personal_leave: 5,
        emergency_leave: 3,
      };

      const balanceField = `${finalLeaveType}_leave`;
      
      // Calculate used leaves of this type
      const usedLeaves = await pool.query(
        `SELECT COALESCE(SUM(days), 0) as used 
         FROM leave_requests 
         WHERE employee_id = $1 
         AND leave_type = $2 
         AND status = 'approved'
         AND id != $3`,
        [leaveRequest.employee_id, finalLeaveType, id]
      );

      const available = balance[balanceField] - parseInt(usedLeaves.rows[0].used || 0);
      
      if (available < days) {
        return res.status(400).json({
          message: `Insufficient leave balance. Available: ${available} days`,
        });
      }
    }

    // Check for overlapping leave requests (excluding current one)
    if (start_date && end_date) {
      const today = new Date().toISOString().split('T')[0];
      const overlapping = await pool.query(
        `SELECT id, start_date, end_date, status FROM leave_requests 
         WHERE employee_id = $1 
         AND id != $4
         AND (
           (status = 'pending') OR 
           (status = 'approved' AND end_date >= $5)
         )
         AND (
           (start_date <= $2 AND end_date >= $2) OR
           (start_date <= $3 AND end_date >= $3) OR
           (start_date >= $2 AND end_date <= $3)
         )`,
        [leaveRequest.employee_id, start_date, end_date, id, today]
      );

      if (overlapping.rows.length > 0) {
        return res.status(400).json({ 
          message: 'Overlapping leave request already exists',
          details: overlapping.rows.map(r => ({
            dates: `${r.start_date} to ${r.end_date}`,
            status: r.status
          }))
        });
      }
    }

    // Build update query
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (leave_type) {
      updates.push(`leave_type = $${paramCount++}`);
      values.push(leave_type);
    }

    if (start_date) {
      updates.push(`start_date = $${paramCount++}`);
      values.push(start_date);
    }

    if (end_date) {
      updates.push(`end_date = $${paramCount++}`);
      values.push(end_date);
    }

    if (days !== leaveRequest.days) {
      updates.push(`days = $${paramCount++}`);
      values.push(days);
    }

    if (reason !== undefined) {
      updates.push(`reason = $${paramCount++}`);
      values.push(reason || null);
    }

    if (updates.length === 0) {
      return res.status(400).json({ message: 'No fields to update' });
    }

    values.push(id);
    const query = `UPDATE leave_requests SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`;
    
    const result = await pool.query(query, values);

    res.json({
      message: 'Leave request updated successfully',
      leave_request: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
};

// Delete own pending leave request
const deleteLeaveRequest = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Get leave request
    const leaveResult = await pool.query(
      'SELECT * FROM leave_requests WHERE id = $1',
      [id]
    );

    if (leaveResult.rows.length === 0) {
      return res.status(404).json({ message: 'Leave request not found' });
    }

    const leaveRequest = leaveResult.rows[0];

    // Check if user owns this leave request
    const empResult = await pool.query('SELECT id FROM employees WHERE user_id = $1', [req.user.id]);
    if (empResult.rows.length === 0) {
      return res.status(404).json({ message: 'Employee record not found' });
    }

    if (leaveRequest.employee_id !== empResult.rows[0].id) {
      return res.status(403).json({ message: 'Access denied. You can only delete your own leave requests' });
    }

    // Only allow deletion of pending requests
    if (leaveRequest.status !== 'pending') {
      return res.status(400).json({ message: 'Only pending leave requests can be deleted' });
    }

    await pool.query('DELETE FROM leave_requests WHERE id = $1', [id]);

    res.json({ message: 'Leave request deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  submitLeaveRequest,
  getLeaveRequests,
  getLeaveRequest,
  updateLeaveRequest,
  deleteLeaveRequest,
  approveLeaveRequest,
  getLeaveBalance,
  getLeaveCalendar,
};

