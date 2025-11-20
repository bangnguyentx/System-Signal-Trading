const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 10000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/quantum_trading';
mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Routes
app.use('/api/signals', require('./routes/signals'));
app.use('/api/stats', require('./routes/stats'));

// Serve frontend
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Health check endpoint for Render
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'Quantum Trading Pro'
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Quantum Trading Pro running on port ${PORT}`);
  console.log(`📍 Access via: http://0.0.0.0:${PORT}`);
});

// Import and start background services
const AnalyzerService = require('./services/analyzer');
const MonitorService = require('./services/monitor');

// Start background services after DB connection
mongoose.connection.on('connected', () => {
  console.log('✅ Connected to MongoDB');
  
  // Start analyzer service (15-minute intervals)
  const analyzer = new AnalyzerService();
  analyzer.start();
  
  // Start monitor service (5-minute intervals for active signals)
  const monitor = new MonitorService();
  monitor.start();
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully');
  mongoose.connection.close();
  process.exit(0);
});
