#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Image processing utilities for tobacco notes.
"""
import os
from pathlib import Path
from typing import Optional, Tuple, Dict
import hashlib
from PIL import Image, ImageOps
import piexif
from concurrent.futures import ThreadPoolExecutor

from build_logger import setup_logging, BuildError

logger = setup_logging('image_processor')

class ImageProcessor:
    """处理和优化图片的工具类"""
    
    def __init__(self, output_dir: Path, cache_dir: Optional[Path] = None):
        self.output_dir = output_dir
        self.cache_dir = cache_dir or output_dir / '.cache'
        self.cache_dir.mkdir(parents=True, exist_ok=True)
        
        # 支持的图片格式
        self.supported_formats = {'.jpg', '.jpeg', '.png', '.webp'}
        
        # 缩略图尺寸
        self.thumb_size = (300, 300)
        
        # 质量设置
        self.jpeg_quality = 85
        self.webp_quality = 80
        
    def process_image(self, image_path: Path) -> Dict[str, str]:
        """处理单个图片，返回处理后的图片信息"""
        if not image_path.exists():
            raise BuildError(f"Image not found: {image_path}")
            
        if image_path.suffix.lower() not in self.supported_formats:
            raise BuildError(f"Unsupported image format: {image_path}")
            
        try:
            # 计算缓存键
            cache_key = self._compute_cache_key(image_path)
            cached_info = self._get_cached_info(cache_key)
            
            if cached_info:
                logger.info(f"Using cached version for {image_path.name}")
                return cached_info
            
            # 打开并处理图片
            with Image.open(image_path) as img:
                # 保留 EXIF 数据
                exif_data = None
                if 'exif' in img.info:
                    exif_data = img.info['exif']
                
                # 自动旋转图片
                img = ImageOps.exif_transpose(img)
                
                # 生成优化后的图片
                optimized = self._optimize_image(img, image_path.name)
                
                # 生成 WebP 版本
                webp = self._convert_to_webp(img, image_path.name)
                
                # 生成缩略图
                thumb = self._create_thumbnail(img, image_path.name)
                
                # 保存处理结果
                info = {
                    'original': str(image_path),
                    'optimized': optimized,
                    'webp': webp,
                    'thumbnail': thumb
                }
                
                # 缓存结果
                self._cache_info(cache_key, info)
                
                return info
                
        except Exception as e:
            logger.error(f"Error processing image {image_path}: {e}")
            raise BuildError(f"Failed to process image {image_path}") from e
            
    def _optimize_image(self, img: Image.Image, name: str) -> str:
        """优化图片质量和大小"""
        output_path = self.output_dir / name
        
        # 转换为RGB模式
        if img.mode in ('RGBA', 'LA'):
            background = Image.new('RGB', img.size, (255, 255, 255))
            background.paste(img, mask=img.split()[-1])
            img = background
        
        # 保存优化后的图片
        img.save(
            output_path,
            'JPEG',
            quality=self.jpeg_quality,
            optimize=True,
            progressive=True
        )
        
        return str(output_path.relative_to(self.output_dir))
        
    def _convert_to_webp(self, img: Image.Image, name: str) -> str:
        """转换图片为WebP格式"""
        output_path = self.output_dir / f"{Path(name).stem}.webp"
        
        # 保存WebP版本
        img.save(
            output_path,
            'WEBP',
            quality=self.webp_quality,
            method=6,  # 最高质量压缩
            lossless=False
        )
        
        return str(output_path.relative_to(self.output_dir))
        
    def _create_thumbnail(self, img: Image.Image, name: str) -> str:
        """创建缩略图"""
        output_path = self.output_dir / f"{Path(name).stem}_thumb.jpg"
        
        # 创建缩略图
        thumb = img.copy()
        thumb.thumbnail(self.thumb_size, Image.Resampling.LANCZOS)
        
        # 保存缩略图
        thumb.save(
            output_path,
            'JPEG',
            quality=self.jpeg_quality,
            optimize=True
        )
        
        return str(output_path.relative_to(self.output_dir))
        
    def _compute_cache_key(self, image_path: Path) -> str:
        """计算图片的缓存键"""
        stat = image_path.stat()
        content = f"{image_path}:{stat.st_size}:{stat.st_mtime}"
        return hashlib.sha1(content.encode()).hexdigest()
        
    def _get_cached_info(self, cache_key: str) -> Optional[Dict[str, str]]:
        """获取缓存的处理结果"""
        cache_file = self.cache_dir / f"{cache_key}.cache"
        if cache_file.exists():
            try:
                import json
                return json.loads(cache_file.read_text())
            except:
                return None
        return None
        
    def _cache_info(self, cache_key: str, info: Dict[str, str]) -> None:
        """缓存处理结果"""
        cache_file = self.cache_dir / f"{cache_key}.cache"
        try:
            import json
            cache_file.write_text(json.dumps(info))
        except:
            logger.warning(f"Failed to cache info for {cache_key}")
            
    def process_batch(self, image_paths: list[Path], max_workers: Optional[int] = None) -> Dict[str, Dict[str, str]]:
        """并行处理多个图片"""
        results = {}
        
        with ThreadPoolExecutor(max_workers=max_workers) as executor:
            future_to_path = {
                executor.submit(self.process_image, path): path
                for path in image_paths
            }
            
            for future in future_to_path:
                path = future_to_path[future]
                try:
                    results[str(path)] = future.result()
                except Exception as e:
                    logger.error(f"Failed to process {path}: {e}")
                    
        return results

def main():
    """主入口函数"""
    import argparse
    parser = argparse.ArgumentParser(description='Process images for the website')
    parser.add_argument('input_dir', type=Path, help='Input directory containing images')
    parser.add_argument('output_dir', type=Path, help='Output directory for processed images')
    parser.add_argument('--cache-dir', type=Path, help='Cache directory')
    args = parser.parse_args()
    
    try:
        processor = ImageProcessor(args.output_dir, args.cache_dir)
        
        # 收集所有图片
        image_paths = []
        for ext in processor.supported_formats:
            image_paths.extend(args.input_dir.rglob(f"*{ext}"))
            
        if not image_paths:
            logger.warning("No images found")
            return
            
        # 处理图片
        results = processor.process_batch(image_paths)
        logger.info(f"Successfully processed {len(results)} images")
        
    except Exception as e:
        logger.error(f"Image processing failed: {e}")
        raise SystemExit(1)

if __name__ == '__main__':
    main()
