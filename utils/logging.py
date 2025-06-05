# scraper/utils/logging.py

import datetime

DEBUG_LOG_FILE = "debug_log.txt"

def log_debug_message(message):
    """Logs a debug message to a file."""
    timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    with open(DEBUG_LOG_FILE, "a", encoding="utf-8") as log_file:
        log_file.write(f"[{timestamp}] {message}\n")
