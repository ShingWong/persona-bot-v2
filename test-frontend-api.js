const axios = require('axios');

async function testFrontendBackendConnection() {
  try {
    console.log('Testing frontend-backend connection...');
    
    // Test 1: Health endpoint
    const healthResponse = await axios.get('http://localhost:3001/health');
    console.log('✅ Backend health check:', healthResponse.data);
    
    // Test 2: API root
    const apiResponse = await axios.get('http://localhost:3001/api');
    console.log('✅ API root:', apiResponse.data);
    
    // Test 3: Personas endpoint
    const personasResponse = await axios.get('http://localhost:3001/api/personas');
    console.log('✅ Personas count:', personasResponse.data.length);
    
    console.log('\n🎉 Frontend can connect to backend!');
    console.log('Backend URL: http://localhost:3001');
    console.log('Frontend URL: http://localhost:6080');
    
  } catch (error) {
    console.error('❌ Connection test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testFrontendBackendConnection();
