#!/usr/bin/env python3
"""
图片处理和优化脚本
用于处理上传的图片，包括调整大小、优化质量、生成缩略图等。
"""

import os
import sys
from pathlib import Path
from PIL import Image, ExifTags
import piexif
import yaml
import glob
import logging
from typing import Tuple, Optional

# 配置日志
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# 图片处理配置
CONFIG = {
    'max_size': (2000, 2000),  # 最大尺寸
    'min_size': (800, 800),    # 最小尺寸
    'quality': 85,             # JPEG 质量
    'thumb_size': (400, 400),  # 缩略图尺寸
    'formats': ('.jpg', '.jpeg', '.png', '.webp'),  # 支持的格式
}

def get_image_paths() -> list[Path]:
    """获取所有需要处理的图片路径"""
    image_dir = Path('images')
    if not image_dir.exists():
        logging.error("图片目录不存在")
        sys.exit(1)
    
    paths = []
    for fmt in CONFIG['formats']:
        paths.extend(image_dir.rglob(f'*{fmt}'))
    return paths

def remove_exif(image: Image.Image) -> Image.Image:
    """移除 EXIF 数据"""
    try:
        data = list(image.getdata())
        image_without_exif = Image.new(image.mode, image.size)
        image_without_exif.putdata(data)
        return image_without_exif
    except Exception as e:
        logging.warning(f"移除 EXIF 数据时出错: {e}")
        return image

def calculate_new_size(width: int, height: int) -> Tuple[int, int]:
    """计算新的图片尺寸，保持宽高比"""
    max_w, max_h = CONFIG['max_size']
    min_w, min_h = CONFIG['min_size']
    
    # 如果图片太小，返回原尺寸
    if width < min_w and height < min_h:
        return width, height
    
    # 计算缩放比例
    ratio = min(max_w/width, max_h/height)
    if ratio >= 1:
        return width, height
    
    return int(width * ratio), int(height * ratio)

def create_thumbnail(image: Image.Image, path: Path) -> None:
    """创建缩略图"""
    thumb = image.copy()
    thumb.thumbnail(CONFIG['thumb_size'])
    thumb_path = path.parent / f"{path.stem}_thumb{path.suffix}"
    thumb.save(thumb_path, quality=CONFIG['quality'], optimize=True)

def process_image(path: Path) -> None:
    """处理单个图片"""
    try:
        # 打开图片
        with Image.open(path) as img:
            # 移除 EXIF 数据
            img = remove_exif(img)
            
            # 转换为 RGB（如果是 RGBA）
            if img.mode == 'RGBA':
                img = img.convert('RGB')
            
            # 调整尺寸
            width, height = img.size
            new_width, new_height = calculate_new_size(width, height)
            if (new_width, new_height) != (width, height):
                img = img.resize((new_width, new_height), Image.LANCZOS)
            
            # 创建缩略图
            create_thumbnail(img, path)
            
            # 保存优化后的图片
            img.save(path, quality=CONFIG['quality'], optimize=True)
            
            logging.info(f"处理完成: {path}")
            
    except Exception as e:
        logging.error(f"处理图片 {path} 时出错: {e}")

def process_all_images() -> None:
    """处理所有图片"""
    paths = get_image_paths()
    if not paths:
        logging.info("没有找到需要处理的图片")
        return
    
    for path in paths:
        logging.info(f"正在处理: {path}")
        process_image(path)

def main():
    """主函数"""
    logging.info("开始处理图片...")
    process_all_images()
    logging.info("图片处理完成")

if __name__ == '__main__':
    main()
