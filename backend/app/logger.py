import os
import logging
from os.path import abspath, join, basename, splitext, dirname
from datetime import datetime
import inspect

LOG_DIR = abspath(join(dirname(__file__), "..", "..", "log_files"))

def setup_logger():
    os.makedirs(LOG_DIR, exist_ok=True)

    frame = inspect.stack()[1]
    module = inspect.getmodule(frame[0])
    module_name = "app"
    if module and hasattr(module, "__file__"):
        module_file = basename(module.__file__)
        module_name = splitext(module_file)[0]

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    log_filename = os.path.join(LOG_DIR, f"{module_name}_{timestamp}.log")
    logger = logging.getLogger(module_name)
    logger.setLevel(logging.DEBUG)

    if not logger.hasHandlers():
        fh = logging.FileHandler(log_filename)
        fh.setLevel(logging.DEBUG)
        ch = logging.StreamHandler()
        ch.setLevel(logging.INFO)
        formatter = logging.Formatter('%(asctime)s - %(levelname)s - %(name)s - %(message)s')
        fh.setFormatter(formatter)
        ch.setFormatter(formatter)
        logger.addHandler(fh)
        logger.addHandler(ch)

    logger.info(f"Logger started, file: {log_filename}")
    return logger
