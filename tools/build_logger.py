#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Logging configuration for the build process.
"""
import logging
import sys
from pathlib import Path
from typing import Optional
from datetime import datetime

class BuildLogger:
    """Custom logger for the build process."""
    
    def __init__(self, name: str, log_dir: Optional[Path] = None):
        self.logger = logging.getLogger(name)
        self.logger.setLevel(logging.INFO)
        
        # Create formatters
        console_formatter = logging.Formatter(
            '%(asctime)s - %(levelname)s - %(message)s',
            datefmt='%H:%M:%S'
        )
        file_formatter = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        )
        
        # Console handler
        console_handler = logging.StreamHandler(sys.stdout)
        console_handler.setFormatter(console_formatter)
        self.logger.addHandler(console_handler)
        
        # File handler
        if log_dir:
            log_dir = Path(log_dir)
            log_dir.mkdir(parents=True, exist_ok=True)
            
            # Create daily log file
            today = datetime.now().strftime('%Y-%m-%d')
            log_file = log_dir / f'build-{today}.log'
            
            file_handler = logging.FileHandler(log_file)
            file_handler.setFormatter(file_formatter)
            self.logger.addHandler(file_handler)
    
    def info(self, msg: str) -> None:
        """Log info message."""
        self.logger.info(msg)
    
    def error(self, msg: str) -> None:
        """Log error message."""
        self.logger.error(msg)
    
    def warning(self, msg: str) -> None:
        """Log warning message."""
        self.logger.warning(msg)
    
    def debug(self, msg: str) -> None:
        """Log debug message."""
        self.logger.debug(msg)
    
    def critical(self, msg: str) -> None:
        """Log critical message."""
        self.logger.critical(msg)

class BuildError(Exception):
    """Custom exception for build errors."""
    pass

def setup_logging(name: str, log_dir: Optional[Path] = None) -> BuildLogger:
    """Set up logging for a module."""
    return BuildLogger(name, log_dir)

def log_build_error(logger: BuildLogger, error: Exception, context: str = '') -> None:
    """Log a build error with context."""
    if context:
        logger.error(f"Error in {context}: {str(error)}")
    else:
        logger.error(str(error))
    
    if isinstance(error, BuildError):
        logger.error("Build error details available")
    
    # Log stack trace for debugging
    import traceback
    logger.debug(traceback.format_exc())
