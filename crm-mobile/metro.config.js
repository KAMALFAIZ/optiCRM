const { getDefaultConfig } = require('expo/metro-config');
const { createProxyMiddleware } = require('http-proxy-middleware');

const config = getDefaultConfig(__dirname);

// Proxy /api/v1 requests to the backend (avoids CORS in web dev)
config.server = {
  enhanceMiddleware: (middleware) => {
    return (req, res, next) => {
      if (req.url.startsWith('/api/')) {
        // Remove Origin header so backend CORS filter doesn't block the proxied request
        delete req.headers['origin'];
        delete req.headers['referer'];
        createProxyMiddleware({
          target: 'http://localhost:8081',
          changeOrigin: true,
          on: {
            proxyReq: (proxyReq) => {
              proxyReq.removeHeader('origin');
              proxyReq.removeHeader('referer');
            },
          },
        })(req, res, next);
      } else {
        middleware(req, res, next);
      }
    };
  },
};

module.exports = config;
