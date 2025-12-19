const pool = require('../config/database');

async function addHoursWorkedColumn() {
  const client = await pool.connect();
  
  try {
    console.log('Adding hours_worked column to attendance table...');
    
    // Check if column already exists
    const checkColumn = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name='attendance' AND column_name='hours_worked'
    `);
    
    if (checkColumn.rows.length === 0) {
      // Add hours_worked column
      await client.query(`
        ALTER TABLE attendance 
        ADD COLUMN hours_worked DECIMAL(5,2)
      `);
      
      console.log('✅ hours_worked column added successfully');
    } else {
      console.log('⚠️  hours_worked column already exists');
    }
    
  } catch (error) {
    console.error('❌ Error adding hours_worked column:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Run if executed directly
if (require.main === module) {
  addHoursWorkedColumn()
    .then(() => {
      console.log('Migration completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}

module.exports = addHoursWorkedColumn;
