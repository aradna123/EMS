const bcrypt = require('bcryptjs');
const pool = require('../config/database');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const path = require('path');
const fs = require('fs');

// Get all employees with filters
const getEmployees = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search, department_id, status, sort_by = 'created_at', order = 'DESC' } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT e.id, e.employee_code, e.position, e.salary, e.join_date, e.status, e.phone, e.address,
             u.id as user_id, u.name, u.email, u.avatar, u.role,
             d.id as department_id, d.name as department_name
      FROM employees e
      INNER JOIN users u ON e.user_id = u.id
      LEFT JOIN departments d ON e.department_id = d.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;

    // If user is a manager, only show employees from their department
    if (req.user.role === 'manager') {
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
    }

    if (search) {
      query += ` AND (u.name ILIKE $${paramCount} OR u.email ILIKE $${paramCount} OR e.employee_code ILIKE $${paramCount})`;
      params.push(`%${search}%`);
      paramCount++;
    }

    if (department_id) {
      query += ` AND e.department_id = $${paramCount}`;
      params.push(department_id);
      paramCount++;
    }

    if (status) {
      query += ` AND e.status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }

    // Validate sort_by and add table alias
    const sortFieldMap = {
      'created_at': 'e.created_at',
      'name': 'u.name',
      'join_date': 'e.join_date',
      'salary': 'e.salary',
      'employee_code': 'e.employee_code'
    };
    const sortField = sortFieldMap[sort_by] || 'e.created_at';
    const sortOrder = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    query += ` ORDER BY ${sortField} ${sortOrder} LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    // Get total count
    let countQuery = `
      SELECT COUNT(*) as total
      FROM employees e
      INNER JOIN users u ON e.user_id = u.id
      WHERE 1=1
    `;
    const countParams = [];
    let countParamCount = 1;

    // If user is a manager, only count employees from their department
    if (req.user.role === 'manager') {
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
    }

    if (search) {
      countQuery += ` AND (u.name ILIKE $${countParamCount} OR u.email ILIKE $${countParamCount} OR e.employee_code ILIKE $${countParamCount})`;
      countParams.push(`%${search}%`);
      countParamCount++;
    }

    if (department_id) {
      countQuery += ` AND e.department_id = $${countParamCount}`;
      countParams.push(department_id);
      countParamCount++;
    }

    if (status) {
      countQuery += ` AND e.status = $${countParamCount}`;
      countParams.push(status);
      countParamCount++;
    }

    const countResult = await pool.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].total);

    res.json({
      employees: result.rows,
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

// Get single employee
const getEmployee = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT e.id, e.employee_code, e.position, e.salary, e.join_date, e.status, e.phone, e.address,
              u.id as user_id, u.name, u.email, u.avatar, u.role, u.created_at,
              d.id as department_id, d.name as department_name, d.description as department_description
       FROM employees e
       INNER JOIN users u ON e.user_id = u.id
       LEFT JOIN departments d ON e.department_id = d.id
       WHERE e.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
};

// Create employee
const createEmployee = async (req, res, next) => {
  try {
    console.log('Creating employee with data:', req.body);
    const { name, email, password, employee_code, department_id, position, salary, join_date, phone, address, role } = req.body;

    // Check if user exists
    const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      console.log('User already exists:', email);
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    // Check if employee code exists
    const existingCode = await pool.query('SELECT id FROM employees WHERE employee_code = $1', [employee_code]);
    if (existingCode.rows.length > 0) {
      console.log('Employee code already exists:', employee_code);
      return res.status(400).json({ message: 'Employee code already exists' });
    }

    // Only admin can create managers
    let userRole = 'employee';
    if (role === 'manager' && req.user.role === 'admin') {
      userRole = 'manager';
    } else if (role === 'manager' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admin can create managers' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password || 'password123', salt);

    // Start transaction
    await pool.query('BEGIN');

    try {
      // Create user with specified role
      const userResult = await pool.query(
        'INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id',
        [name, email, hashedPassword, userRole]
      );

      const userId = userResult.rows[0].id;

      // Create employee
      const employeeResult = await pool.query(
        `INSERT INTO employees (user_id, employee_code, department_id, position, salary, join_date, phone, address)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
        [userId, employee_code, department_id || null, position || null, salary || null, join_date, phone || null, address || null]
      );

      // Initialize leave balance for current year
      const currentYear = new Date().getFullYear();
      await pool.query(
        'INSERT INTO leave_balances (employee_id, year) VALUES ($1, $2)',
        [employeeResult.rows[0].id, currentYear]
      );

      await pool.query('COMMIT');

      res.status(201).json({
        message: 'Employee created successfully',
        employee: employeeResult.rows[0],
      });
    } catch (error) {
      await pool.query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    next(error);
  }
};

// Update employee
const updateEmployee = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, email, department_id, position, salary, status, phone, address } = req.body;

    console.log('Updating employee:', id, 'with data:', { name, email, department_id, position, salary, status, phone, address });

    // Check if employee exists
    const employeeResult = await pool.query('SELECT user_id FROM employees WHERE id = $1', [id]);
    if (employeeResult.rows.length === 0) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    const userId = employeeResult.rows[0].user_id;

    await pool.query('BEGIN');

    try {
      // Update user
      if (name || email) {
        const userUpdates = [];
        const userValues = [];
        let paramCount = 1;

        if (name) {
          userUpdates.push(`name = $${paramCount++}`);
          userValues.push(name);
        }
        if (email) {
          userUpdates.push(`email = $${paramCount++}`);
          userValues.push(email);
        }
        userUpdates.push(`updated_at = CURRENT_TIMESTAMP`);
        userValues.push(userId);

        await pool.query(`UPDATE users SET ${userUpdates.join(', ')} WHERE id = $${paramCount}`, userValues);
      }

      // Update employee
      const empUpdates = [];
      const empValues = [];
      let paramCount = 1;

      if (department_id !== undefined) {
        empUpdates.push(`department_id = $${paramCount++}`);
        empValues.push(department_id || null);
      }
      if (position !== undefined) {
        empUpdates.push(`position = $${paramCount++}`);
        empValues.push(position && position.trim() !== '' ? position.trim() : null);
      }
      if (salary !== undefined) {
        empUpdates.push(`salary = $${paramCount++}`);
        empValues.push(salary);
      }
      if (status !== undefined) {
        empUpdates.push(`status = $${paramCount++}`);
        empValues.push(status);
      }
      if (phone !== undefined) {
        empUpdates.push(`phone = $${paramCount++}`);
        empValues.push(phone && phone.trim() !== '' ? phone.trim() : null);
      }
      if (address !== undefined) {
        empUpdates.push(`address = $${paramCount++}`);
        empValues.push(address && address.trim() !== '' ? address.trim() : null);
      }

      if (empUpdates.length > 0) {
        empValues.push(id);
        await pool.query(`UPDATE employees SET ${empUpdates.join(', ')} WHERE id = $${paramCount}`, empValues);
      }

      await pool.query('COMMIT');

      console.log('Employee updated successfully');

      // Get updated employee
      const result = await pool.query(
        `SELECT e.*, u.name, u.email, u.avatar, u.role
         FROM employees e
         INNER JOIN users u ON e.user_id = u.id
         WHERE e.id = $1`,
        [id]
      );

      res.json({
        message: 'Employee updated successfully',
        employee: result.rows[0],
      });
    } catch (error) {
      await pool.query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    next(error);
  }
};

// Delete employee
const deleteEmployee = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await pool.query('SELECT id FROM employees WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    // Cascade delete will handle user deletion
    await pool.query('DELETE FROM employees WHERE id = $1', [id]);

    res.json({ message: 'Employee deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// Upload employee photo
const uploadPhoto = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const result = await pool.query('SELECT user_id FROM employees WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    const userId = result.rows[0].user_id;

    // Delete old avatar if exists
    const userResult = await pool.query('SELECT avatar FROM users WHERE id = $1', [userId]);
    if (userResult.rows[0].avatar) {
      const oldAvatarPath = path.join(process.env.UPLOAD_PATH || './uploads', userResult.rows[0].avatar);
      if (fs.existsSync(oldAvatarPath)) {
        fs.unlinkSync(oldAvatarPath);
      }
    }

    // Update avatar
    await pool.query('UPDATE users SET avatar = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [
      req.file.filename,
      userId,
    ]);

    res.json({
      message: 'Photo uploaded successfully',
      avatar: req.file.filename,
    });
  } catch (error) {
    next(error);
  }
};

// Export employees to CSV
const exportEmployees = async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT e.employee_code, u.name, u.email, e.position, d.name as department, 
              e.salary, e.join_date, e.status, e.phone
       FROM employees e
       INNER JOIN users u ON e.user_id = u.id
       LEFT JOIN departments d ON e.department_id = d.id
       ORDER BY e.created_at DESC`
    );

    const timestamp = Date.now();
    const fileName = `employees_export_${timestamp}.csv`;
    const filePath = path.join(__dirname, '..', fileName);

    const csvWriter = createCsvWriter({
      path: filePath,
      header: [
        { id: 'employee_code', title: 'Employee Code' },
        { id: 'name', title: 'Name' },
        { id: 'email', title: 'Email' },
        { id: 'position', title: 'Position' },
        { id: 'department', title: 'Department' },
        { id: 'salary', title: 'Salary' },
        { id: 'join_date', title: 'Join Date' },
        { id: 'status', title: 'Status' },
        { id: 'phone', title: 'Phone' },
      ],
    });

    await csvWriter.writeRecords(result.rows);

    res.download(filePath, 'employees_export.csv', (err) => {
      if (err) {
        console.error('Error downloading file:', err);
      }
      // Clean up file after download
      setTimeout(() => {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }, 1000);
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getEmployees,
  getEmployee,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  uploadPhoto,
  exportEmployees,
};

