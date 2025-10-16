import sys
from loguru import logger


def setup_logging():
    """Configure logging for the application"""
    # Remove default handler
    logger.remove()
    
    # Add custom handler for stdout
    logger.add(
        sys.stdout,
        format="{time:YYYY-MM-DD HH:mm:ss} | {level} | {name}:{function}:{line} | {message}",
        level="INFO",
        colorize=True
    )
    
    # Add file handler
    logger.add(
        "logs/ai-core.log",
        rotation="500 MB",
        retention="10 days",
        level="DEBUG",
        format="{time:YYYY-MM-DD HH:mm:ss} | {level} | {name}:{function}:{line} | {message}"
    )
    
    return logger


app_logger = setup_logging()

