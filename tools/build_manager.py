#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Static site build manager for tobacco notes.
Manages and coordinates all build processes.
"""
import os
import sys
from pathlib import Path
from typing import List, Dict, Any, Optional
from concurrent.futures import ThreadPoolExecutor
import time

from build_logger import setup_logging, BuildError, log_build_error

# Set up logging
logger = setup_logging('build_manager', Path('logs'))

class BuildManager:
    """Manages the static site build process."""
    
    def __init__(self, repo_root: Path):
        self.repo_root = repo_root
        self.notes_dir = repo_root / 'notes'
        self.docs_dir = repo_root / 'docs'
        self.assets_dir = self.docs_dir / 'assets'
        self.data_dir = self.docs_dir / 'data'
        self.images_dir = self.docs_dir / 'images'
        
        # Ensure directories exist
        self.data_dir.mkdir(parents=True, exist_ok=True)
        self.images_dir.mkdir(parents=True, exist_ok=True)
        
        # Track modified files
        self.modified_notes: List[Path] = []
        self.modified_images: List[Path] = []
        
    def get_modified_files(self, since: Optional[float] = None) -> None:
        """Get list of files modified since last build."""
        if since is None:
            # If no timestamp provided, process all files
            self.modified_notes = list(self.notes_dir.rglob('*.md'))
            self.modified_images = []
            for img_dir in self.notes_dir.glob('*/images'):
                self.modified_images.extend(img_dir.rglob('*'))
            return
            
        for note in self.notes_dir.rglob('*.md'):
            if note.stat().st_mtime > since:
                self.modified_notes.append(note)
                
        for img_dir in self.notes_dir.glob('*/images'):
            for img in img_dir.rglob('*'):
                if img.stat().st_mtime > since:
                    self.modified_images.append(img)
    
    def process_notes(self) -> None:
        """Process notes in parallel."""
        if not self.modified_notes:
            logger.info("No notes to process")
            return
            
        logger.info(f"Processing {len(self.modified_notes)} notes...")
        
        from parallel_processor import ParallelProcessor, get_optimal_chunk_size
        processor = ParallelProcessor()
        
        def process_note_wrapper(note: Path) -> None:
            from build_index import process_note
            process_note(note, self.docs_dir)
            logger.info(f"Processed note: {note.name}")
        
        chunk_size = get_optimal_chunk_size(len(self.modified_notes))
        errors = processor.process_files(
            self.modified_notes,
            process_note_wrapper,
            use_processes=False,  # Notes are typically CPU-bound
            chunk_size=chunk_size
        )
        
        if errors:
            raise BuildError(f"Failed to process {len(errors)} notes")
    
    def process_images(self) -> None:
        """Process images in parallel."""
        if not self.modified_images:
            logger.info("No images to process")
            return
            
        logger.info(f"Processing {len(self.modified_images)} images...")
        
        from parallel_processor import ParallelProcessor, get_optimal_chunk_size, is_io_bound
        processor = ParallelProcessor()
        
        def process_image_wrapper(image: Path) -> None:
            from build_index import process_image
            process_image(image)
            logger.info(f"Processed image: {image.name}")
        
        # Group images by whether they're IO-bound
        io_bound_images = [img for img in self.modified_images if is_io_bound(img)]
        cpu_bound_images = [img for img in self.modified_images if not is_io_bound(img)]
        
        errors = []
        
        # Process IO-bound images with processes
        if io_bound_images:
            chunk_size = get_optimal_chunk_size(len(io_bound_images))
            errors.extend(processor.process_files(
                io_bound_images,
                process_image_wrapper,
                use_processes=True,
                chunk_size=chunk_size
            ))
        
        # Process CPU-bound images with threads
        if cpu_bound_images:
            chunk_size = get_optimal_chunk_size(len(cpu_bound_images))
            errors.extend(processor.process_files(
                cpu_bound_images,
                process_image_wrapper,
                use_processes=False,
                chunk_size=chunk_size
            ))
        
        if errors:
            raise BuildError(f"Failed to process {len(errors)} images")
    
    def build_feeds(self) -> None:
        """Build RSS/Atom/JSON feeds."""
        try:
            from build_feeds import main as build_feeds_main
            build_feeds_main()
            logger.info("Built feeds successfully")
        except Exception as e:
            log_build_error(logger, e, "Building feeds")
            raise BuildError("Failed to build feeds")
    
    def generate_assets(self) -> None:
        """Generate site assets."""
        try:
            from generate_assets import main as generate_assets_main
            generate_assets_main()
            logger.info("Generated assets successfully")
        except Exception as e:
            log_build_error(logger, e, "Generating assets")
            raise BuildError("Failed to generate assets")
    
    def build(self, incremental: bool = True) -> None:
        """Run the full build process."""
        from performance_monitor import PerformanceMonitor, TaskTimer
        
        # 初始化性能监控
        monitor = PerformanceMonitor(self.docs_dir)
        monitor.start_monitoring()
        
        try:
            with TaskTimer(monitor, 'full_build'):
                logger.info("Starting build process...")
                
                # Get modified files if doing incremental build
                with TaskTimer(monitor, 'get_modified_files', {'incremental': incremental}):
                    if incremental:
                        last_build_file = self.docs_dir / '.lastbuild'
                        last_build_time = None
                        if last_build_file.exists():
                            last_build_time = float(last_build_file.read_text().strip())
                        self.get_modified_files(last_build_time)
                    else:
                        self.get_modified_files()
                
                # Process content
                with TaskTimer(monitor, 'process_notes', {'count': len(self.modified_notes)}):
                    self.process_notes()
                    
                with TaskTimer(monitor, 'process_images', {'count': len(self.modified_images)}):
                    self.process_images()
                
                # Build feeds and assets
                with TaskTimer(monitor, 'build_feeds'):
                    self.build_feeds()
                    
                with TaskTimer(monitor, 'generate_assets'):
                    self.generate_assets()
                
                # Process static assets
                with TaskTimer(monitor, 'process_static_assets'):
                    self._process_static_assets()
                
                # Build search index
                with TaskTimer(monitor, 'build_search_index'):
                    self._build_search_index()
                
                # Record build time
                (self.docs_dir / '.lastbuild').write_text(str(time.time()))
                
    def _build_search_index(self) -> None:
        """Build search index for the website."""
        try:
            from build_search_index import SearchIndexBuilder
            
            logger.info("Building search index...")
            builder = SearchIndexBuilder(self.repo_root)
            builder.build_index()
            
        except Exception as e:
            logger.error(f"Search index build failed: {e}")
            raise BuildError("Failed to build search index") from e
            
            # 生成性能报告
            monitor.generate_report()
            
        except Exception as e:
            logger.error(f"Build failed: {e}")
            monitor.stop_monitoring()  # 确保停止监控
            raise BuildError("Build process failed") from e
            
    def _process_static_assets(self) -> None:
        """Process static assets with versioning and caching."""
        try:
            from asset_manager import AssetManager
            
            logger.info("Processing static assets...")
            manager = AssetManager(self.repo_root)
            manager.process_assets()
            
        except Exception as e:
            logger.error(f"Static asset processing failed: {e}")
            raise BuildError("Failed to process static assets") from e

def main():
    """Main entry point."""
    try:
        # Get repo root
        repo_root = Path(__file__).resolve().parents[1]
        
        # Parse arguments
        import argparse
        parser = argparse.ArgumentParser(description='Build static site')
        parser.add_argument('--full', action='store_true', 
                          help='Force full rebuild instead of incremental')
        parser.add_argument('--debug', action='store_true',
                          help='Enable debug logging')
        args = parser.parse_args()
        
        # Configure debug logging if requested
        if args.debug:
            import logging
            logger.logger.setLevel(logging.DEBUG)
        
        # Run build
        manager = BuildManager(repo_root)
        manager.build(incremental=not args.full)
        
        return 0
    except BuildError as e:
        logger.error(str(e))
        return 1
    except Exception as e:
        log_build_error(logger, e, "Unexpected error in build process")
        return 2

if __name__ == '__main__':
    main()
