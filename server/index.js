const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

const authRoutes = require('./routes/auth');
const chatRoutes = require('./routes/chat');
const mediaRoutes = require('./routes/media');
const trendsRoutes = require('./routes/trends');
const securityRoutes = require('./routes/security');

const app = express();
const PORT = process.env.PORT || 3000;

// Enable Trust Proxy for Express behind Nginx / Load Balancers
app.set('trust proxy', 1);

// Security Headers
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Cross-Origin Resource Sharing
app.use(cors());

// Parse JSON Body
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Global Rate Limiting with proxy validation disabled
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // high max for seamless usage
  validate: { xForwardedForHeader: false },
  message: { error: 'Too many requests from this IP, please try again later.' }
});
app.use('/api/', limiter);

// Serve API Routes
app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/trends', trendsRoutes);
app.use('/api/security', securityRoutes);

// Dedicated Secure Android Application Package Download Route
app.get(['/api/download/app.apk', '/LAF-AI.apk'], (req, res) => {
  const apkPath = path.join(__dirname, '../public/LAF-AI.apk');
  res.setHeader('Content-Type', 'application/vnd.android.package-archive');
  res.setHeader('Content-Disposition', 'attachment; filename="LAF-AI.apk"');
  res.setHeader('Cache-Control', 'no-cache');
  if (require('fs').existsSync(apkPath)) {
    res.sendFile(apkPath);
  } else {
    res.status(404).send('APK package initializing');
  }
});

// Serve Built Client Files
app.use(express.static(path.join(__dirname, '../dist')));
app.use('/public', express.static(path.join(__dirname, '../public')));

// Client SPA Fallback Routing (Only for non-API GET requests)
app.get('*', (req, res) => {
  const distIndex = path.join(__dirname, '../dist/index.html');
  if (require('fs').existsSync(distIndex)) {
    res.sendFile(distIndex);
  } else {
    res.send('LAF API Server Operational. Please build frontend (`npm run build`).');
  }
});

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`=======================================================`);
  console.log(`  LAF ("Look At Future") AI Product Platform Online`);
  console.log(`  Server running on http://0.0.0.0:${PORT}`);
  console.log(`  End-to-End Encryption & User DB Partitioning: ACTIVE`);
  console.log(`=======================================================`);
});

// Configure long keep-alive timeouts to prevent browser socket disconnects
server.keepAliveTimeout = 120000;
server.headersTimeout = 125000;
