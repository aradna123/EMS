const pool = require('./config/database');
const bcrypt = require('bcryptjs');

async function createAdmin() {
  const client = await pool.connect();
  try {
    console.log('Creating admin user...');    
    const existing = await client.query(
      "SELECT id, email FROM users WHERE email = 'admin@example.com'"
    );
    
    if (existing.rows.length > 0) {
      console.log('⚠️  Admin user already exists:', existing.rows[0].email);
      return;
    }
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('admin123', salt);
    
    // Create admin user
    const result = await client.query(
      `INSERT INTO users (name, email, password, role, is_active) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING id, name, email, role`,
      ['Admin User', 'admin@example.com', hashedPassword, 'admin', true]
    );
    
    console.log('✅ Admin user created successfully:');
    console.log('   Email: admin@example.com');
    console.log('   Password: admin123');
    console.log('   User ID:', result.rows[0].id);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    client.release();
    process.exit();
  }
}

createAdmin();
