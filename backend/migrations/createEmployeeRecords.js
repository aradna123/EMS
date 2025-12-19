const pool = require('../config/database');

async function createMissingEmployeeRecords() {
  try {
    console.log('Starting to create missing employee records...');
    
    await pool.query('BEGIN');

    // Find users without employee records
    const users = await pool.query(`
      SELECT u.id, u.name, u.role 
      FROM users u 
      LEFT JOIN employees e ON u.id = e.user_id 
      WHERE e.id IS NULL AND (u.role = 'employee' OR u.role = 'manager')
    `);

    console.log(`Found ${users.rows.length} users without employee records`);

    for (const user of users.rows) {
      // Get current employee count
      const countResult = await pool.query('SELECT COUNT(*) as count FROM employees');
      const employeeCode = `EMP${String(parseInt(countResult.rows[0].count) + 1).padStart(4, '0')}`;

      // Create employee record
      await pool.query(
        'INSERT INTO employees (user_id, employee_code, status, join_date) VALUES ($1, $2, $3, CURRENT_DATE)',
        [user.id, employeeCode, 'active']
      );

      console.log(`Created employee record for user ${user.name} (ID: ${user.id}) with code ${employeeCode}`);
    }

    await pool.query('COMMIT');
    console.log('Done! All employee records created successfully.');
    
  } catch (error) {
    await pool.query('ROLLBACK');
    console.error('Error creating employee records:', error);
  } finally {
    process.exit();
  }
}

createMissingEmployeeRecords();
