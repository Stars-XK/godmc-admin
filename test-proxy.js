const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();

app.use('/api/login', createProxyMiddleware({
  target: 'http://127.0.0.1:3002',
  changeOrigin: true,
  onProxyReq: (proxyReq, req, res) => {
    console.log('Proxying:', req.originalUrl, '->', proxyReq.path);
  }
}));

app.listen(8889, () => {
  console.log('Test proxy listening on 8889');
});
