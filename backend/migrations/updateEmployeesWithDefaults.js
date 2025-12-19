const pool = require('../config/database');

async function updateEmployeesWithDefaults() {
  const client = await pool.connect();
  
  try {
    console.log('Updating employees with default department and position...');
    
    // Get a default department (first one)
    const deptResult = await client.query('SELECT id FROM departments ORDER BY id LIMIT 1');
    const defaultDeptId = deptResult.rows[0]?.id;
    
    if (!defaultDeptId) {
      console.log('No departments found. Please create departments first.');
      return;
    }
    
    // Update employees with null department_id and position
    const result = await client.query(`
      UPDATE employees
      SET 
        department_id = $1,
        position = 'Employee'
      WHERE department_id IS NULL OR position IS NULL
    `, [defaultDeptId]);
    
    console.log(`✅ Updated ${result.rowCount} employees with default department and position`);
    
  } catch (error) {
    console.error('❌ Error updating employees:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Run if executed directly
if (require.main === module) {
  updateEmployeesWithDefaults()
    .then(() => {
      console.log('Migration completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}

module.exports = updateEmployeesWithDefaults;
