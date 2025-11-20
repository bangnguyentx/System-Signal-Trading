const cron = require('node-cron');
const axios = require('axios');
const Signal = require('../models/Signal');

class AnalyzerService {
  constructor() {
    this.topSymbols = [
      'BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'ADAUSDT', 'DOTUSDT',
      'LINKUSDT', 'LTCUSDT', 'BCHUSDT', 'XLMUSDT', 'XRPUSDT',
      'DOGEUSDT', 'UNIUSDT', 'SOLUSDT', 'MATICUSDT', 'ETCUSDT',
      'THETAUSDT', 'VETUSDT', 'TRXUSDT', 'EOSUSDT', 'AAVEUSDT'
    ];
    this.analyzedSymbols = new Map(); // Track recently analyzed symbols
    this.isRunning = false;
  }

  start() {
    console.log('🔧 Starting Quantum Analyzer Service...');
    
    // Run every 15 minutes at specific times (1, 16, 31, 46)
    cron.schedule('1,16,31,46 * * * *', () => {
      this.runTradingHoursAnalysis();
    }, {
      timezone: "Asia/Ho_Chi_Minh"
    });

    // Initial run
    setTimeout(() => {
      this.runTradingHoursAnalysis();
    }, 10000);
  }

  async runTradingHoursAnalysis() {
    const currentHour = new Date().getHours();
    
    // Only analyze between 5:00 and 21:31 (9:31 PM)
    if (currentHour < 5 || currentHour > 21) {
      console.log('⏸️ Analysis paused outside trading hours (5:00 - 21:31)');
      return;
    }

    if (this.isRunning) {
      console.log('⏳ Analysis already in progress, skipping...');
      return;
    }

    this.isRunning = true;
    console.log(`🚀 Starting batch analysis at ${new Date().toLocaleTimeString()}`);

    try {
      for (const symbol of this.topSymbols) {
        // Skip if analyzed recently (within 2 hours)
        const lastAnalysis = this.analyzedSymbols.get(symbol);
        if (lastAnalysis && Date.now() - lastAnalysis < 2 * 60 * 60 * 1000) {
          continue;
        }

        try {
          await this.analyzeSymbol(symbol);
          // Add delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 3000));
        } catch (error) {
          console.error(`❌ Error analyzing ${symbol}:`, error.message);
        }
      }
    } catch (error) {
      console.error('💥 Batch analysis failed:', error);
    } finally {
      this.isRunning = false;
    }
  }

  async analyzeSymbol(symbol) {
    console.log(`📊 Analyzing ${symbol}...`);
    
    try {
      const marketData = await this.fetchMarketData(symbol);
      const analysis = this.performTechnicalAnalysis(marketData);
      
      // ONLY proceed if confidence is 100%
      if (analysis.confidence === 100) {
        console.log(`🎯 HIGH CONFIDENCE SIGNAL for ${symbol}: ${analysis.direction}`);
        
        // Add to analyzed symbols to avoid re-analysis for 2 hours
        this.analyzedSymbols.set(symbol, Date.now());
        
        // Create signal document
        const signal = new Signal({
          symbol: symbol,
          direction: analysis.direction,
          entryPrice: parseFloat(analysis.entry),
          takeProfit: parseFloat(analysis.takeProfit),
          stopLoss: parseFloat(analysis.stopLoss),
          reason: analysis.reason,
          confidence: analysis.confidence,
          riskReward: analysis.riskReward,
          status: 'active',
          currentPrice: marketData.price,
          analysisTime: new Date()
        });

        await signal.save();
        console.log(`✅ Signal saved to database: ${symbol} ${analysis.direction}`);
        
        // Here you can add notification logic (Telegram, etc.)
        await this.sendSignalNotification(signal);
      }
      
    } catch (error) {
      console.error(`❌ Analysis failed for ${symbol}:`, error.message);
      throw error;
    }
  }

  async fetchMarketData(symbol) {
    try {
      const [priceResponse, klinesResponse] = await Promise.all([
        axios.get(`https://api.binance.com/api/v3/ticker/price?symbol=${symbol}`),
        axios.get(`https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=1h&limit=100`)
      ]);

      const klines = klinesResponse.data.map(k => ({
        open: parseFloat(k[1]),
        high: parseFloat(k[2]),
        low: parseFloat(k[3]),
        close: parseFloat(k[4]),
        volume: parseFloat(k[5]),
        time: k[0]
      }));

      return {
        symbol,
        price: parseFloat(priceResponse.data.price),
        klines: klines
      };
    } catch (error) {
      throw new Error(`Binance API error: ${error.message}`);
    }
  }

  performTechnicalAnalysis(marketData) {
    const { klines, price } = marketData;
    const closes = klines.map(k => k.close);
    
    // Your existing analysis logic here
    const sma = closes.reduce((a, b) => a + b) / closes.length;
    const trend = price > sma ? 'bullish' : 'bearish';
    
    // For demo - replace with your actual 100% confidence logic
    const isPerfectSignal = this.checkPerfectConditions(klines, price);
    
    const direction = trend === 'bullish' ? 'LONG' : 'SHORT';
    const entry = price.toFixed(4);
    const stopLoss = direction === 'LONG' 
      ? (price * 0.98).toFixed(4)   // 2% SL for long
      : (price * 1.02).toFixed(4);  // 2% SL for short
      
    const takeProfit = direction === 'LONG'
      ? (price * 1.04).toFixed(4)   // 4% TP for long
      : (price * 0.96).toFixed(4);  // 4% TP for short

    return {
      direction,
      confidence: isPerfectSignal ? 100 : 75, // Only 100% confidence signals proceed
      entry,
      stopLoss,
      takeProfit,
      riskReward: '2.0',
      reason: this.generateSignalReason(klines, trend)
    };
  }

  checkPerfectConditions(klines, currentPrice) {
    // YOUR EXISTING LOGIC FOR 100% CONFIDENCE
    // This is where you implement your specific analysis
    // For now, using random for demonstration
    const recentCloses = klines.slice(-5).map(k => k.close);
    const volatility = Math.max(...recentCloses) / Math.min(...recentCloses);
    
    // Example perfect condition: low volatility + strong trend
    return volatility < 1.02 && Math.random() > 0.9; // 10% chance for demo
  }

  generateSignalReason(klines, trend) {
    const reasons = [];
    if (trend === 'bullish') reasons.push('Xu hướng tăng mạnh');
    
    const volumes = klines.map(k => k.volume);
    const avgVolume = volumes.reduce((a, b) => a + b) / volumes.length;
    const recentVolume = volumes.slice(-3).reduce((a, b) => a + b) / 3;
    if (recentVolume > avgVolume * 1.2) reasons.push('Khối lượng tăng');
    
    return reasons.length > 0 ? reasons.join(', ') : 'Tín hiệu kỹ thuật mạnh';
  }

  async sendSignalNotification(signal) {
    // Implement your notification logic here
    // Telegram, email, etc.
    console.log(`📢 Notification: ${signal.symbol} ${signal.direction} at $${signal.entryPrice}`);
  }
}

module.exports = AnalyzerService;
