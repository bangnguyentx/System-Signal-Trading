const express = require('express');
const Signal = require('../models/Signal');
const router = express.Router();

// Get all active signals
router.get('/active', async (req, res) => {
  try {
    const signals = await Signal.find({ status: 'active' })
      .sort({ analysisTime: -1 })
      .limit(50);
    
    res.json({
      success: true,
      data: signals,
      count: signals.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get signal history
router.get('/history', async (req, res) => {
  try {
    const { days = 1 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));
    
    const signals = await Signal.find({
      status: { $in: ['win', 'lose'] },
      exitTime: { $gte: startDate }
    })
    .sort({ exitTime: -1 })
    .limit(100);
    
    res.json({
      success: true,
      data: signals,
      count: signals.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get today's summary
router.get('/today-stats', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const [activeSignals, todayHistory] = await Promise.all([
      Signal.find({ status: 'active' }),
      Signal.find({
        exitTime: { $gte: today, $lt: tomorrow },
        status: { $in: ['win', 'lose'] }
      })
    ]);
    
    const totalSignals = todayHistory.length;
    const winSignals = todayHistory.filter(s => s.status === 'win').length;
    const loseSignals = todayHistory.filter(s => s.status === 'lose').length;
    const totalProfit = todayHistory.reduce((sum, s) => sum + s.profitLoss, 0);
    const winRate = totalSignals > 0 ? (winSignals / totalSignals * 100) : 0;
    
    res.json({
      success: true,
      data: {
        activeCount: activeSignals.length,
        todayStats: {
          totalSignals,
          winSignals,
          loseSignals,
          totalProfit: parseFloat(totalProfit.toFixed(2)),
          winRate: parseFloat(winRate.toFixed(1))
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
