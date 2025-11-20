const express = require('express');
const Signal = require('../models/Signal');
const router = express.Router();

// Get today's statistics
router.get('/today', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [activeSignals, todaysSignals] = await Promise.all([
      Signal.find({ status: 'active' }),
      Signal.find({
        exitTime: {
          $gte: today,
          $lt: tomorrow
        },
        status: { $in: ['win', 'lose'] }
      })
    ]);

    const totalSignals = todaysSignals.length;
    const winSignals = todaysSignals.filter(s => s.status === 'win').length;
    const loseSignals = todaysSignals.filter(s => s.status === 'lose').length;
    const totalProfit = todaysSignals.reduce((sum, s) => sum + (s.profitLoss || 0), 0);
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
    console.error('Error getting today stats:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get weekly statistics
router.get('/weekly', async (req, res) => {
  try {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    oneWeekAgo.setHours(0, 0, 0, 0);

    const weeklySignals = await Signal.find({
      exitTime: {
        $gte: oneWeekAgo
      },
      status: { $in: ['win', 'lose'] }
    });

    const totalSignals = weeklySignals.length;
    const winSignals = weeklySignals.filter(s => s.status === 'win').length;
    const loseSignals = weeklySignals.filter(s => s.status === 'lose').length;
    const totalProfit = weeklySignals.reduce((sum, s) => sum + (s.profitLoss || 0), 0);
    const winRate = totalSignals > 0 ? (winSignals / totalSignals * 100) : 0;

    // Daily breakdown
    const dailyStats = [];
    for (let i = 6; i >= 0; i--) {
      const day = new Date();
      day.setDate(day.getDate() - i);
      day.setHours(0, 0, 0, 0);
      const nextDay = new Date(day);
      nextDay.setDate(nextDay.getDate() + 1);

      const daySignals = weeklySignals.filter(s => 
        s.exitTime >= day && s.exitTime < nextDay
      );

      const dayProfit = daySignals.reduce((sum, s) => sum + (s.profitLoss || 0), 0);
      const dayWins = daySignals.filter(s => s.status === 'win').length;
      const dayTotal = daySignals.length;
      const dayWinRate = dayTotal > 0 ? (dayWins / dayTotal * 100) : 0;

      dailyStats.push({
        date: day.toISOString().split('T')[0],
        profit: parseFloat(dayProfit.toFixed(2)),
        signals: dayTotal,
        winRate: parseFloat(dayWinRate.toFixed(1))
      });
    }

    res.json({
      success: true,
      data: {
        totalSignals,
        winSignals,
        loseSignals,
        totalProfit: parseFloat(totalProfit.toFixed(2)),
        winRate: parseFloat(winRate.toFixed(1)),
        dailyStats
      }
    });
  } catch (error) {
    console.error('Error getting weekly stats:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
