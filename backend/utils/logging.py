import logging
from logging.handlers import RotatingFileHandler

from backend.config import BASE_DIR


LOG_DIR = BASE_DIR / "logs"
LOG_DIR.mkdir(parents=True, exist_ok=True)


def build_logger(name: str, file_prefix: str) -> logging.Logger:
    logger = logging.getLogger(name)
    if logger.handlers:
        return logger
    logger.setLevel(logging.INFO)
    handler = RotatingFileHandler(LOG_DIR / f"{file_prefix}.log", maxBytes=100 * 1024 * 1024, backupCount=30, encoding="utf-8")
    formatter = logging.Formatter("%(asctime)s %(levelname)s %(message)s")
    handler.setFormatter(formatter)
    logger.addHandler(handler)
    return logger


request_logger = build_logger("request_logger", "request")
error_logger = build_logger("error_logger", "error")
performance_logger = build_logger("performance_logger", "perf")
