const pool = require('../config/database');

async function createNotificationsTable() {
  const client = await pool.connect();
  
  try {
    console.log('Creating notifications table...');
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        type VARCHAR(50) NOT NULL,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        data JSONB,
        status VARCHAR(20) DEFAULT 'unread' CHECK (status IN ('unread', 'read')),
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        read_at TIMESTAMPTZ
      )
    `);
    
    // Create index for faster queries
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
      CREATE INDEX IF NOT EXISTS idx_notifications_status ON notifications(status);
      CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
    `);
    
    console.log('✅ Notifications table created successfully');
    
  } catch (error) {
    console.error('❌ Error creating notifications table:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Run if executed directly
if (require.main === module) {
  createNotificationsTable()
    .then(() => {
      console.log('Migration completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}

module.exports = createNotificationsTable;
