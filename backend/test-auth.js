// Test script for authentication endpoints
const axios = require('axios');

const API_BASE = 'http://localhost:6081/api/auth';

async function testAuth() {
  console.log('Testing Persona Bot Authentication API...\n');
  
  try {
    // Test 1: Register a new user
    console.log('1. Testing user registration...');
    const registerData = {
      email: 'test@example.com',
      password: 'Test123!',
      name: 'Test User'
    };
    
    try {
      const registerResponse = await axios.post(`${API_BASE}/register`, registerData);
      console.log('✅ Registration successful:', registerResponse.data);
    } catch (error) {
      if (error.response?.data?.error?.code === 'USER_EXISTS') {
        console.log('⚠️  User already exists, skipping registration');
      } else {
        console.log('❌ Registration failed:', error.response?.data || error.message);
      }
    }
    
    // Test 2: Login
    console.log('\n2. Testing user login...');
    const loginData = {
      email: 'test@example.com',
      password: 'Test123!'
    };
    
    try {
      const loginResponse = await axios.post(`${API_BASE}/login`, loginData);
      console.log('✅ Login successful');
      const { accessToken, refreshToken, user } = loginResponse.data.data;
      console.log(`   User: ${user.email} (${user.role})`);
      console.log(`   Access Token: ${accessToken.substring(0, 20)}...`);
      console.log(`   Refresh Token: ${refreshToken.substring(0, 20)}...`);
      
      // Test 3: Get current user (protected route)
      console.log('\n3. Testing protected route (GET /me)...');
      try {
        const meResponse = await axios.get(`${API_BASE}/me`, {
          headers: {
            Authorization: `Bearer ${accessToken}`
          }
        });
        console.log('✅ Protected route accessed successfully:', meResponse.data);
      } catch (error) {
        console.log('❌ Protected route failed:', error.response?.data || error.message);
      }
      
      // Test 4: Refresh token
      console.log('\n4. Testing token refresh...');
      try {
        const refreshResponse = await axios.post(`${API_BASE}/refresh`, {
          refreshToken
        });
        console.log('✅ Token refresh successful');
        console.log(`   New Access Token: ${refreshResponse.data.data.accessToken.substring(0, 20)}...`);
        console.log(`   New Refresh Token: ${refreshResponse.data.data.refreshToken.substring(0, 20)}...`);
      } catch (error) {
        console.log('❌ Token refresh failed:', error.response?.data || error.message);
      }
      
      // Test 5: Logout
      console.log('\n5. Testing logout...');
      try {
        const logoutResponse = await axios.post(`${API_BASE}/logout`, {
          refreshToken
        });
        console.log('✅ Logout successful:', logoutResponse.data);
      } catch (error) {
        console.log('❌ Logout failed:', error.response?.data || error.message);
      }
      
    } catch (error) {
      console.log('❌ Login failed:', error.response?.data || error.message);
    }
    
    // Test 6: Invalid login
    console.log('\n6. Testing invalid login...');
    const invalidLoginData = {
      email: 'test@example.com',
      password: 'WrongPassword123!'
    };
    
    try {
      await axios.post(`${API_BASE}/login`, invalidLoginData);
      console.log('❌ Invalid login should have failed but succeeded');
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Invalid login correctly rejected:', error.response.data.error.message);
      } else {
        console.log('❌ Invalid login test failed:', error.response?.data || error.message);
      }
    }
    
  } catch (error) {
    console.log('❌ Test setup failed:', error.message);
  }
  
  console.log('\n✅ Authentication API tests completed!');
}

// Check if server is running
axios.get('http://localhost:6081/health')
  .then(() => {
    testAuth();
  })
  .catch(error => {
    console.log('❌ Backend server is not running. Please start it with:');
    console.log('   cd backend && npm run dev');
    process.exit(1);
  });