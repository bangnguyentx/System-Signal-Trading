# signal_engine.py
import os
import json
import time
import math
import logging
import requests
from datetime import datetime, timezone, timedelta
from statistics import mean

from config import (
    DATA_DIR, SIGNALS_FILE, RESULTS_FILE, TIMEFRAMES, COINS,
    BINANCE_FAPI, SCAN_LIMIT, SQUEEZE_THRESHOLD,
    MONITOR_CHECK_INTERVAL, SIGNAL_COOLDOWN_MINUTES,
    TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID
)

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

# ----------------------------
# Helpers: file load/save (thread-safe-ish)
# ----------------------------
def ensure_data_dir():
    if not os.path.exists(DATA_DIR):
        os.makedirs(DATA_DIR, exist_ok=True)

def load_json_safe(path, default):
    ensure_data_dir()
    if not os.path.exists(path):
        save_json_safe(path, default)
        return default
    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        logger.error("Failed read %s: %s", path, e)
        save_json_safe(path, default)
        return default

def save_json_safe(path, data):
    ensure_data_dir()
    tmp = path + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    os.replace(tmp, path)

# initialize files
_signals_data = load_json_safe(SIGNALS_FILE, {"signals": []})
_results_data = load_json_safe(RESULTS_FILE, {"results": []})

# ----------------------------
# Binance klines fetch
# ----------------------------
def fetch_klines(symbol, interval, limit=SC...  if False else None):
    # (placeholder unreachable; below real impl)
    pass
