const http = require('http');

const server = http.createServer((req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Content-Type', 'application/json');

  // Handle OPTIONS
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // Mock endpoints
  if (req.url === '/api/v1/auth/login' && req.method === 'POST') {
    res.writeHead(200);
    res.end(JSON.stringify({
      data: {
        accessToken: 'mock-token-12345',
        refreshToken: 'mock-refresh-token',
        user: {
          id: '1',
          email: 'admin@opticrm.com',
          name: 'Administrator',
          role: 'ADMIN'
        }
      }
    }));
    return;
  }

  if (req.url === '/api/v1/auth/me' && req.method === 'GET') {
    res.writeHead(200);
    res.end(JSON.stringify({
      data: {
        id: '1',
        email: 'admin@opticrm.com',
        name: 'Administrator',
        role: 'ADMIN'
      }
    }));
    return;
  }

  if (req.url === '/swagger-ui.html' && req.method === 'GET') {
    res.setHeader('Content-Type', 'text/html');
    res.writeHead(200);
    res.end('<html><body>Swagger UI - Mock Backend</body></html>');
    return;
  }

  res.writeHead(404);
  res.end(JSON.stringify({ error: 'Not found' }));
});

server.listen(8081, () => {
  console.log('✓ Mock Backend running on http://localhost:8081');
});
