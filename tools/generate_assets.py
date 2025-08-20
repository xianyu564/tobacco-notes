#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Generate site assets: favicon and OG image
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import os

BRAND_COLOR = "#ff4d6d"
BG_COLOR = "#0f1115"
CARD_COLOR = "#151924"
TEXT_COLOR = "#e6e9ef"

def create_icon(size, output_path):
    """Create a simple icon with 'TN' text."""
    img = Image.new('RGBA', (size, size), BG_COLOR)
    draw = ImageDraw.Draw(img)
    
    # 计算字体大小
    font_size = int(size * 0.6)
    try:
        font = ImageFont.truetype("arial.ttf", font_size)
    except:
        font = ImageFont.load_default()
    
    # 绘制文字
    text = "TN"
    bbox = draw.textbbox((0, 0), text, font=font)
    text_width = bbox[2] - bbox[0]
    text_height = bbox[3] - bbox[1]
    
    x = (size - text_width) / 2
    y = (size - text_height) / 2
    
    # 绘制背景圆形
    padding = size * 0.1
    circle_bbox = [padding, padding, size - padding, size - padding]
    draw.ellipse(circle_bbox, fill=BRAND_COLOR)
    
    # 绘制文字
    draw.text((x, y), text, font=font, fill=TEXT_COLOR)
    
    # 保存
    img.save(output_path)

def create_og_image(output_path):
    """Create OG image (1200x630) with site title and description."""
    width = 1200
    height = 630
    
    img = Image.new('RGB', (width, height), BG_COLOR)
    draw = ImageDraw.Draw(img)
    
    # 绘制卡片背景
    card_padding = 40
    card_bbox = [card_padding, card_padding, 
                width - card_padding, height - card_padding]
    draw.rectangle(card_bbox, fill=CARD_COLOR)
    
    try:
        title_font = ImageFont.truetype("arial.ttf", 72)
        desc_font = ImageFont.truetype("arial.ttf", 36)
    except:
        title_font = ImageFont.load_default()
        desc_font = ImageFont.load_default()
    
    # 标题
    title = "Tobacco Notes｜烟草笔记"
    title_bbox = draw.textbbox((0, 0), title, font=title_font)
    title_width = title_bbox[2] - title_bbox[0]
    x = (width - title_width) / 2
    y = height * 0.35
    draw.text((x, y), title, font=title_font, fill=TEXT_COLOR)
    
    # 描述
    desc = "轻量、开放的烟草品鉴笔记"
    desc_bbox = draw.textbbox((0, 0), desc, font=desc_font)
    desc_width = desc_bbox[2] - desc_bbox[0]
    x = (width - desc_width) / 2
    y = height * 0.6
    draw.text((x, y), desc, font=desc_font, fill=TEXT_COLOR)
    
    # 保存
    img.save(output_path, quality=95)

def main():
    # 确保目录存在
    assets_dir = Path(__file__).resolve().parents[1] / 'docs' / 'assets'
    assets_dir.mkdir(parents=True, exist_ok=True)
    
    # 生成各种尺寸的图标
    create_icon(16, assets_dir / 'favicon-16x16.png')
    create_icon(32, assets_dir / 'favicon-32x32.png')
    create_icon(180, assets_dir / 'apple-touch-icon.png')
    create_icon(192, assets_dir / 'icon-192.png')
    create_icon(512, assets_dir / 'icon-512.png')
    
    # 生成 OG 图片
    create_og_image(assets_dir / 'og-image.png')
    
    print("Generated all assets in", assets_dir)

if __name__ == '__main__':
    main()
