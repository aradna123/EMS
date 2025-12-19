const pool = require('../config/database');

async function addEmergencyLeaveColumn() {
  try {
    console.log('Checking if emergency_leave column exists...');
    
    // Check if column exists
    const checkColumn = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name='leave_balances' 
      AND column_name='emergency_leave'
    `);

    if (checkColumn.rows.length === 0) {
      console.log('emergency_leave column does not exist. Adding it now...');
      
      await pool.query(`
        ALTER TABLE leave_balances 
        ADD COLUMN IF NOT EXISTS emergency_leave INTEGER DEFAULT 3
      `);
      
      console.log('✓ emergency_leave column added successfully!');
    } else {
      console.log('✓ emergency_leave column already exists.');
    }

  } catch (error) {
    console.error('Error adding emergency_leave column:', error);
  } finally {
    process.exit();
  }
}

addEmergencyLeaveColumn();
