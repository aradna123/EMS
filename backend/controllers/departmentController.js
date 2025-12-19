const pool = require('../config/database');

// Get all departments
const getDepartments = async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT d.id, d.name, d.description, d.parent_id, d.manager_id, d.created_at,
              parent.name as parent_name,
              m.name as manager_name,
              COUNT(e.id) as employee_count,
              COALESCE(AVG(e.salary), 0) as avg_salary
       FROM departments d
       LEFT JOIN departments parent ON d.parent_id = parent.id
       LEFT JOIN users m ON d.manager_id = m.id
       LEFT JOIN employees e ON d.id = e.department_id
       GROUP BY d.id, parent.name, m.name
       ORDER BY d.name`
    );

    res.json(result.rows);
  } catch (error) {
    next(error);
  }
};

// Get single department
const getDepartment = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT d.id, d.name, d.description, d.parent_id, d.manager_id, d.created_at,
              parent.name as parent_name,
              m.name as manager_name, m.email as manager_email,
              COUNT(e.id) as employee_count,
              COALESCE(AVG(e.salary), 0) as avg_salary,
              COALESCE(SUM(CASE WHEN e.status = 'active' THEN 1 ELSE 0 END), 0) as active_employees
       FROM departments d
       LEFT JOIN departments parent ON d.parent_id = parent.id
       LEFT JOIN users m ON d.manager_id = m.id
       LEFT JOIN employees e ON d.id = e.department_id
       WHERE d.id = $1
       GROUP BY d.id, parent.name, m.name, m.email`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Department not found' });
    }

    // Get sub-departments
    const subDepts = await pool.query(
      'SELECT id, name, description FROM departments WHERE parent_id = $1',
      [id]
    );

    // Get employees
    const employees = await pool.query(
      `SELECT e.id, e.employee_code, e.position, e.status,
              u.name, u.email, u.avatar
       FROM employees e
       INNER JOIN users u ON e.user_id = u.id
       WHERE e.department_id = $1
       ORDER BY u.name`,
      [id]
    );

    res.json({
      ...result.rows[0],
      sub_departments: subDepts.rows,
      employees: employees.rows,
    });
  } catch (error) {
    next(error);
  }
};

// Create department
const createDepartment = async (req, res, next) => {
  try {
    const { name, description, parent_id, manager_id } = req.body;

    // Validate parent_id if provided
    if (parent_id) {
      const parentCheck = await pool.query('SELECT id FROM departments WHERE id = $1', [parent_id]);
      if (parentCheck.rows.length === 0) {
        return res.status(400).json({ message: 'Parent department not found' });
      }
    }

    // Validate manager_id if provided
    if (manager_id) {
      const managerCheck = await pool.query("SELECT id FROM users WHERE id = $1 AND role IN ('manager', 'admin')", [
        manager_id,
      ]);
      if (managerCheck.rows.length === 0) {
        return res.status(400).json({ message: 'Manager not found or invalid role' });
      }
    }

    const result = await pool.query(
      'INSERT INTO departments (name, description, parent_id, manager_id) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, description || null, parent_id || null, manager_id || null]
    );

    res.status(201).json({
      message: 'Department created successfully',
      department: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
};

// Update department
const updateDepartment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, parent_id, manager_id } = req.body;

    // Check if department exists
    const deptCheck = await pool.query('SELECT id FROM departments WHERE id = $1', [id]);
    if (deptCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Department not found' });
    }

    // Prevent circular reference
    if (parent_id && parseInt(parent_id) === parseInt(id)) {
      return res.status(400).json({ message: 'Department cannot be its own parent' });
    }

    // Validate parent_id if provided
    if (parent_id) {
      const parentCheck = await pool.query('SELECT id FROM departments WHERE id = $1', [parent_id]);
      if (parentCheck.rows.length === 0) {
        return res.status(400).json({ message: 'Parent department not found' });
      }
    }

    // Validate manager_id if provided
    if (manager_id) {
      const managerCheck = await pool.query("SELECT id FROM users WHERE id = $1 AND role IN ('manager', 'admin')", [
        manager_id,
      ]);
      if (managerCheck.rows.length === 0) {
        return res.status(400).json({ message: 'Manager not found or invalid role' });
      }
    }

    const updates = [];
    const values = [];
    let paramCount = 1;

    if (name) {
      updates.push(`name = $${paramCount++}`);
      values.push(name);
    }
    if (description !== undefined) {
      updates.push(`description = $${paramCount++}`);
      values.push(description);
    }
    if (parent_id !== undefined) {
      updates.push(`parent_id = $${paramCount++}`);
      values.push(parent_id || null);
    }
    if (manager_id !== undefined) {
      updates.push(`manager_id = $${paramCount++}`);
      values.push(manager_id || null);
    }

    if (updates.length === 0) {
      return res.status(400).json({ message: 'No fields to update' });
    }

    values.push(id);
    const result = await pool.query(`UPDATE departments SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`, values);

    res.json({
      message: 'Department updated successfully',
      department: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
};

// Delete department
const deleteDepartment = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if department exists
    const deptCheck = await pool.query('SELECT id FROM departments WHERE id = $1', [id]);
    if (deptCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Department not found' });
    }

    // Check if department has employees
    const employeesCheck = await pool.query('SELECT COUNT(*) as count FROM employees WHERE department_id = $1', [id]);
    if (parseInt(employeesCheck.rows[0].count) > 0) {
      return res.status(400).json({ message: 'Cannot delete department with employees. Please reassign employees first.' });
    }

    // Check if department has sub-departments
    const subDeptsCheck = await pool.query('SELECT COUNT(*) as count FROM departments WHERE parent_id = $1', [id]);
    if (parseInt(subDeptsCheck.rows[0].count) > 0) {
      return res.status(400).json({ message: 'Cannot delete department with sub-departments. Please delete or reassign sub-departments first.' });
    }

    await pool.query('DELETE FROM departments WHERE id = $1', [id]);

    res.json({ message: 'Department deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// Get department statistics
const getDepartmentStats = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT 
        COUNT(e.id) as total_employees,
        COUNT(CASE WHEN e.status = 'active' THEN 1 END) as active_employees,
        COUNT(CASE WHEN e.status = 'on_leave' THEN 1 END) as on_leave_employees,
        COUNT(CASE WHEN e.status = 'terminated' THEN 1 END) as terminated_employees,
        COALESCE(AVG(e.salary), 0) as avg_salary,
        COALESCE(MAX(e.salary), 0) as max_salary,
        COALESCE(MIN(e.salary), 0) as min_salary,
        COALESCE(SUM(e.salary), 0) as total_salary
       FROM departments d
       LEFT JOIN employees e ON d.id = e.department_id
       WHERE d.id = $1
       GROUP BY d.id`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Department not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
};

// Get department hierarchy
const getDepartmentHierarchy = async (req, res, next) => {
  try {
    const buildHierarchy = async (parentId = null) => {
      const result = await pool.query(
        `SELECT d.id, d.name, d.description, d.parent_id, d.manager_id,
                m.name as manager_name,
                COUNT(e.id) as employee_count
         FROM departments d
         LEFT JOIN users m ON d.manager_id = m.id
         LEFT JOIN employees e ON d.id = e.department_id
         WHERE d.parent_id ${parentId ? '= $1' : 'IS NULL'}
         GROUP BY d.id, m.name
         ORDER BY d.name`,
        parentId ? [parentId] : []
      );

      const departments = result.rows;

      for (const dept of departments) {
        dept.sub_departments = await buildHierarchy(dept.id);
      }

      return departments;
    };

    const hierarchy = await buildHierarchy();
    res.json(hierarchy);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDepartments,
  getDepartment,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  getDepartmentStats,
  getDepartmentHierarchy,
};

