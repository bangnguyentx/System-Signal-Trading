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

// MongoDB Connection với timeout dài hơn
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/quantum_trading';

const connectWithRetry = () => {
  console.log('🔗 Connecting to MongoDB...');
  mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 30000, // 30 seconds
    socketTimeoutMS: 45000, // 45 seconds
  }).catch(err => {
    console.error('❌ MongoDB connection error:', err);
    console.log('🔄 Retrying connection in 5 seconds...');
    setTimeout(connectWithRetry, 5000);
  });
};

connectWithRetry();

// Import routes với error handling
let signalsRoute, statsRoute;
try {
  signalsRoute = require('./routes/signals');
  statsRoute = require('./routes/stats');
  console.log('✅ Routes loaded successfully');
} catch (error) {
  console.error('❌ Error loading routes:', error);
  process.exit(1);
}

// Routes
app.use('/api/signals', signalsRoute);
app.use('/api/stats', statsRoute);

// Serve frontend
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Health check endpoint for Render
app.get('/health', (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    database: dbStatus,
    service: 'Quantum Trading Pro'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('💥 Server Error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found'
  });
});

// Start server
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Quantum Trading Pro running on port ${PORT}`);
  console.log(`📍 Health check: http://0.0.0.0:${PORT}/health`);
  console.log(`📍 Main app: http://0.0.0.0:${PORT}`);
});

// Import và start background services SAU KHI server khởi động
mongoose.connection.on('connected', () => {
  console.log('✅ Connected to MongoDB');
  
  // Import services sau khi DB connected
  const AnalyzerService = require('./services/analyzer');
  const MonitorService = require('./services/monitor');
  
  // Start background services với delay
  setTimeout(() => {
    try {
      const analyzer = new AnalyzerService();
      analyzer.start();
      console.log('✅ Analyzer service started');
      
      const monitor = new MonitorService();
      monitor.start();
      console.log('✅ Monitor service started');
    } catch (error) {
      console.error('❌ Error starting background services:', error);
    }
  }, 3000);
});

mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('⚠️ MongoDB disconnected');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully');
  server.close(() => {
    mongoose.connection.close();
    console.log('✅ Server shut down gracefully');
    process.exit(0);
  });
});

process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});
