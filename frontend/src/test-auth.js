// Test authentication flow
const testAuth = async () => {
  console.log('Testing authentication flow...');
  
  try {
    const response = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'syedadnanmohd61@gmail.com',
        password: '987654321Adnan!'
      })
    });
    
    const data = await response.json();
    console.log('Response status:', response.status);
    console.log('Response data:', data);
    
    if (response.ok) {
      console.log('✅ Login successful');
      console.log('Token:', data.accessToken);
      
      // Test token storage
      localStorage.setItem('token', data.accessToken);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      console.log('✅ Token stored in localStorage');
      console.log('Stored token:', localStorage.getItem('token'));
      console.log('Stored user:', localStorage.getItem('user'));
    } else {
      console.log('❌ Login failed:', data.message);
    }
  } catch (error) {
    console.log('❌ Network error:', error);
  }
};

// Run test
testAuth();