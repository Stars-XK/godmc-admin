const { createProxyMiddleware } = require('http-proxy-middleware');
const proxy = createProxyMiddleware({ target: 'http://localhost:3000', pathFilter: '/system' });
const req1 = { url: '/system/user', method: 'GET' };
const req2 = { url: '/sys', method: 'GET' };
console.log('Matches /system/user?', proxy.pathFilter(req1.url, req1));
console.log('Matches /sys?', proxy.pathFilter(req2.url, req2));
