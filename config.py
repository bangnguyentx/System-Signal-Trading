# config.py
import os
from datetime import time

# Data files
DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
USERS_FILE = os.path.join(DATA_DIR, "users.json")
SIGNALS_FILE = os.path.join(DATA_DIR, "signals.json")
RESULTS_FILE = os.path.join(DATA_DIR, "results.json")

# Timeframes (giữ giống JS/HTML)
TIMEFRAMES = [
    {"label": "D1", "interval": "1d", "weight": 1.5},
    {"label": "H4", "interval": "4h", "weight": 1.3},
    {"label": "H1", "interval": "1h", "weight": 1.1},
    {"label": "M5", "interval": "5m", "weight": 0.8}
]

# Coins: 20 popular coins (you said temporarily 20)
COINS = [
    "BTCUSDT","ETHUSDT","SOLUSDT","BNBUSDT","XRPUSDT",
    "DOGEUSDT","ADAUSDT","TRXUSDT","AVAXUSDT","SHIBUSDT",
    "LINKUSDT","DOTUSDT","NEARUSDT","LTCUSDT","UNIUSDT",
    "PEPEUSDT","ICPUSDT","APTUSDT","HBARUSDT","CROUSDT"
]

# Scan scheduling
# We will run scan job every minute but only trigger actual full-scan when:
# (minute - 1) % 15 == 0 and time between START_HOUR and END_HOUR
SCAN_START_HOUR = 5    # 05:00
SCAN_END_HOUR = 21     # 21:00 (we'll allow up to 21:31 per your req; check minute)
# follow-up monitor interval (in seconds)
MONITOR_INTERVAL_SECONDS = 5 * 60  # 5 minutes

# Cooldown after sending a signal: 2 hours
SIGNAL_COOLDOWN_MINUTES = 2 * 60

# When new signal sent -> monitor every 5 minutes until TP/SL hit
MONITOR_CHECK_INTERVAL = 5 * 60

# Telegram integration (optional)
TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "")
TELEGRAM_CHAT_ID = os.getenv("TELEGRAM_CHAT_ID", "")  # for admin or broadcast

# Admin credentials
ADMIN_USERNAME = os.getenv("ADMIN_USERNAME", "BangNguyen89")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "NLB@0708.")  # recommended to override via env

# Binance API base
BINANCE_FAPI = "https://fapi.binance.com"

# other
SCAN_LIMIT = 300  # limit klines
SQUEEZE_THRESHOLD = 0.018
