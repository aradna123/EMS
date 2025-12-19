// Quick test script to verify backend is accessible
// Uses Node's built-in http module for compatibility

const http = require('http');

function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const parsed = body ? JSON.parse(body) : {};
          resolve({ status: res.statusCode, data: parsed, headers: res.headers });
        } catch (e) {
          resolve({ status: res.statusCode, data: body, headers: res.headers });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function testConnection() {
  try {
    console.log('Testing backend connection...\n');
    
    // Test health endpoint
    console.log('1. Testing health endpoint...');
    try {
      const healthResponse = await makeRequest({
        hostname: 'localhost',
        port: 5000,
        path: '/health',
        method: 'GET',
      });
      
      if (healthResponse.status === 200) {
        console.log('   ✅ Health check:', healthResponse.data);
      } else {
        console.log('   ❌ Health check failed:', healthResponse.status);
        return;
      }
    } catch (error) {
      console.error('   ❌ Cannot connect to backend server');
      console.error('   Error:', error.message);
      console.error('\n   💡 Make sure the backend server is running:');
      console.error('      cd back && npm run dev');
      return;
    }
    
    // Test login endpoint
    console.log('\n2. Testing login endpoint...');
    try {
      const loginResponse = await makeRequest({
        hostname: 'localhost',
        port: 5000,
        path: '/api/auth/login',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      }, {
        email: 'admin1@example.com',
        password: 'admin123'
      });
      
      if (loginResponse.status === 200) {
        console.log('   ✅ Login test successful!');
        console.log('   Token received:', loginResponse.data.token ? 'Yes' : 'No');
        console.log('   User:', loginResponse.data.user?.email);
        console.log('   Role:', loginResponse.data.user?.role);
      } else {
        console.log('   ❌ Login failed:');
        console.log('   Status:', loginResponse.status);
        console.log('   Message:', loginResponse.data.message || 'Unknown error');
        
        if (loginResponse.status === 401) {
          console.log('\n   💡 Tip: Make sure you have run the seed script:');
          console.log('      cd back && npm run seed');
        }
      }
    } catch (error) {
      console.error('   ❌ Login test failed:', error.message);
    }
    
  } catch (error) {
    console.error('\n❌ Connection test failed:');
    console.error('   Error:', error.message);
  }
}

testConnection();

