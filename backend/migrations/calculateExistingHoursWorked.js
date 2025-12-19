const pool = require('../config/database');

async function calculateExistingHoursWorked() {
  const client = await pool.connect();
  
  try {
    console.log('Calculating hours_worked for existing attendance records...');
    
    // Update all records that have both check_in and check_out but no hours_worked
    const result = await client.query(`
      UPDATE attendance
      SET hours_worked = ROUND(
        EXTRACT(EPOCH FROM (
          (date + check_out::time) - (date + check_in::time)
        )) / 3600.0,
        2
      )
      WHERE check_in IS NOT NULL 
        AND check_out IS NOT NULL 
        AND (hours_worked IS NULL OR hours_worked = 0)
    `);
    
    console.log(`✅ Updated ${result.rowCount} attendance records with calculated hours_worked`);
    
  } catch (error) {
    console.error('❌ Error calculating hours_worked:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Run if executed directly
if (require.main === module) {
  calculateExistingHoursWorked()
    .then(() => {
      console.log('Migration completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}

module.exports = calculateExistingHoursWorked;
