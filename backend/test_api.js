const http = require('http');

const loginData = JSON.stringify({ username: 'student', password: 'Student@123' });
const loginReq = http.request({
  hostname: 'localhost',
  port: 8080,
  path: '/api/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': loginData.length
  }
}, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const token = JSON.parse(data).token;
    console.log("Token:", token);
    
    const getReq = http.request({
      hostname: 'localhost',
      port: 8080,
      path: '/api/orders',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }, (res2) => {
      let data2 = '';
      res2.on('data', chunk => data2 += chunk);
      res2.on('end', () => {
        console.log("Response Body:", data2);
        console.log("Is Array?", Array.isArray(JSON.parse(data2)));
      });
    });
    getReq.end();
  });
});
loginReq.write(loginData);
loginReq.end();
