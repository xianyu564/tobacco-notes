#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Parallel processing utilities for build process.
"""
import multiprocessing
from concurrent.futures import ThreadPoolExecutor, ProcessPoolExecutor
from typing import List, Callable, Any, Optional
from pathlib import Path
import os

from build_logger import setup_logging, BuildError

logger = setup_logging('parallel_processor')

class ParallelProcessor:
    """Manages parallel processing of build tasks."""
    
    def __init__(self, max_workers: Optional[int] = None):
        """Initialize processor with optional worker limit."""
        if max_workers is None:
            max_workers = min(32, (os.cpu_count() or 1) + 4)
        self.max_workers = max_workers
        
    def process_files(self, 
                     files: List[Path],
                     processor: Callable[[Path], Any],
                     use_processes: bool = False,
                     chunk_size: Optional[int] = None) -> List[Exception]:
        """
        Process files in parallel using either threads or processes.
        
        Args:
            files: List of files to process
            processor: Function to process each file
            use_processes: If True, use ProcessPoolExecutor instead of ThreadPoolExecutor
            chunk_size: Optional chunk size for batching files
            
        Returns:
            List of exceptions that occurred during processing
        """
        if not files:
            return []
            
        errors = []
        executor_class = ProcessPoolExecutor if use_processes else ThreadPoolExecutor
        
        with executor_class(max_workers=self.max_workers) as executor:
            if chunk_size and len(files) > chunk_size:
                # Process in chunks for better memory management
                chunks = [files[i:i + chunk_size] 
                         for i in range(0, len(files), chunk_size)]
                
                for chunk in chunks:
                    futures = {executor.submit(processor, f): f for f in chunk}
                    for future in futures:
                        try:
                            future.result()
                        except Exception as e:
                            errors.append(e)
                            logger.error(f"Error processing {futures[future]}: {e}")
            else:
                # Process all files at once
                futures = {executor.submit(processor, f): f for f in files}
                for future in futures:
                    try:
                        future.result()
                    except Exception as e:
                        errors.append(e)
                        logger.error(f"Error processing {futures[future]}: {e}")
        
        return errors

    def process_tasks(self,
                     tasks: List[Callable[[], Any]],
                     use_processes: bool = False) -> List[Exception]:
        """
        Execute multiple tasks in parallel.
        
        Args:
            tasks: List of task functions to execute
            use_processes: If True, use ProcessPoolExecutor instead of ThreadPoolExecutor
            
        Returns:
            List of exceptions that occurred during processing
        """
        if not tasks:
            return []
            
        errors = []
        executor_class = ProcessPoolExecutor if use_processes else ThreadPoolExecutor
        
        with executor_class(max_workers=self.max_workers) as executor:
            futures = [executor.submit(task) for task in tasks]
            for future in futures:
                try:
                    future.result()
                except Exception as e:
                    errors.append(e)
                    logger.error(f"Error executing task: {e}")
        
        return errors

def get_optimal_chunk_size(total_items: int) -> int:
    """Calculate optimal chunk size based on system resources and workload."""
    cpu_count = os.cpu_count() or 1
    
    # Base chunk size on CPU count and total items
    if total_items < 100:
        return total_items  # Process all at once for small workloads
    elif total_items < 1000:
        return total_items // (cpu_count * 2)  # Split workload across CPUs
    else:
        return 100  # Cap chunk size for very large workloads

def is_io_bound(file_path: Path) -> bool:
    """Determine if a file operation is likely to be IO-bound."""
    # Image files and large files are typically IO-bound
    io_bound_extensions = {'.jpg', '.jpeg', '.png', '.gif', '.webp'}
    
    return (
        file_path.suffix.lower() in io_bound_extensions or
        file_path.stat().st_size > 1024 * 1024  # Files larger than 1MB
    )
