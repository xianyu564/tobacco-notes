#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Build a simple index under notes/README.md grouping notes by category and date.

The script scans notes/<category> directories, infers title from front matter
or filename, sorts entries by date (from filename prefix), and writes a clean
Markdown index for quick browsing.
"""
from __future__ import annotations

import json
import re
import shutil
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Dict, Optional, Tuple, List, Any

from process_images import process_image

CATEGORIES = ["cigars", "cigarettes", "pipe", "ryo", "snus", "ecig"]

RE_DATE_PREFIX = re.compile(r"^(\d{4}-\d{2}-\d{2})-")


@dataclass
class NoteEntry:
    category: str
    date: str
    path: Path
    title: str
    images: List[Dict[str, str]]


def read_front_matter(filepath: Path) -> Dict[str, Any]:
    content = filepath.read_text(encoding="utf-8", errors="ignore")
    if not content.startswith("---\n"):
        return {}
    end = content.find("\n---", 4)
    if end == -1:
        return {}
    block = content[4:end].strip()
    meta: Dict[str, Any] = {}
    current_key = None
    current_list = []
    
    for line in block.splitlines():
        if not line.strip():
            continue
        if not line.startswith(" "):  # New key
            if current_key and current_list:
                meta[current_key] = current_list
                current_list = []
            if ":" not in line:
                continue
            key, value = line.split(":", 1)
            key = key.strip()
            value = value.strip()
            if value:  # Single value
                meta[key] = value
            else:  # Start of a list
                current_key = key
                current_list = []
        elif line.startswith("  - "):  # List item
            if current_key:
                item_dict = {}
                item_content = line[4:].strip()
                if ":" in item_content:
                    item_key, item_value = item_content.split(":", 1)
                    item_dict[item_key.strip()] = item_value.strip()
                    while True:
                        next_line_idx = block.find("\n", block.find(line) + len(line))
                        if next_line_idx == -1:
                            break
                        next_line = block[next_line_idx + 1:block.find("\n", next_line_idx + 1)].strip()
                        if not next_line.startswith(" ") or next_line.startswith("  - "):
                            break
                        if ":" in next_line:
                            sub_key, sub_value = next_line.split(":", 1)
                            item_dict[sub_key.strip()] = sub_value.strip()
                    current_list.append(item_dict)
                else:
                    current_list.append(item_content)
    
    if current_key and current_list:
        meta[current_key] = current_list
    
    return meta


def infer_title(meta: Dict[str, Any], fallback: str) -> str:
    for key in [
        "title",
        "product",
        "brand",
        "blend",
        "tobacco",
        "liquid",
    ]:
        v = meta.get(key)
        if v:
            return v
    return fallback


def parse_date_from_filename(name: str) -> Optional[str]:
    m = RE_DATE_PREFIX.match(name)
    if m:
        return m.group(1)
    return None


def process_note_images(root: Path, meta: Dict[str, Any], force_rebuild: bool = False) -> List[Dict[str, str]]:
    """处理笔记中的图片，返回处理后的图片信息"""
    from image_processor import ImageProcessor
    
    processed_images = []
    if "images" not in meta:
        return processed_images
    
    # 设置图片处理器
    static_img_dir = root / "docs" / "images"
    processor = ImageProcessor(
        output_dir=static_img_dir,
        cache_dir=static_img_dir / '.cache'
    )
    
    # 收集需要处理的图片
    images_to_process = []
    for img in meta["images"]:
        if not isinstance(img, dict) or "path" not in img:
            continue
            
        img_path = root / img["path"]
        if not img_path.exists():
            continue
            
        images_to_process.append((img_path, img.get("caption", "")))
    
    # 批量处理图片
    for img_path, caption in images_to_process:
        try:
            result = processor.process_image(img_path)
            
            # 添加处理结果
            processed_images.append({
                "path": str(img_path.relative_to(root)),
                "thumb": result["thumbnail"],
                "caption": caption,
                "url": result["optimized"],
                "webp": result["webp"]
            })
        except Exception as e:
            logger.error(f"Failed to process image {img_path}: {e}")
            continue
    
    return processed_images


def collect_notes(root: Path) -> list[NoteEntry]:
    entries: list[NoteEntry] = []
    for category in CATEGORIES:
        cat_dir = root / "notes" / category
        if not cat_dir.exists():
            continue
        for fp in sorted(cat_dir.glob("*.md")):
            # Only index notes whose filename starts with YYYY-MM-DD-
            date = parse_date_from_filename(fp.name)
            if not date:
                continue
            meta = read_front_matter(fp)
            title = infer_title(meta, fallback=fp.stem)
            # 处理图片
            images = process_note_images(root, meta)
            entries.append(NoteEntry(
                category=category,
                date=date,
                path=fp.relative_to(root),
                title=title,
                images=images
            ))
    
    # Sort by date desc, then title
    def sort_key(e: NoteEntry) -> Tuple[datetime, str]:
        try:
            dt = datetime.strptime(e.date, "%Y-%m-%d")
        except Exception:
            dt = datetime(1970, 1, 1)
        return (dt, e.title.lower())
    
    entries.sort(key=sort_key, reverse=True)
    return entries


def write_index(root: Path, entries: list[NoteEntry]) -> None:
    lines: list[str] = []
    lines.append("# Notes Index｜笔记索引")
    lines.append("")
    lines.append("> 自动生成：按日期倒序，按分类分组 | Auto-generated: newest first, grouped by category")
    lines.append("")

    # Group by category, keep global date order within each
    by_cat: Dict[str, list[NoteEntry]] = {c: [] for c in CATEGORIES}
    for e in entries:
        by_cat.setdefault(e.category, []).append(e)

    for category in CATEGORIES:
        group = by_cat.get(category, [])
        if not group:
            continue
        lines.append(f"## {category}")
        lines.append("")
        for e in group:
            # [YYYY-MM-DD] Title (relative path)
            # Try to show author if present in front matter
            meta = read_front_matter(root / e.path)
            author = meta.get("author", "")
            author_str = f" — @{author}" if author else ""
            
            # Add thumbnail if available
            thumb_str = ""
            if e.images:
                first_image = e.images[0]
                if "thumb" in first_image:
                    thumb_str = f" ![{first_image.get('caption', '')}]({first_image['thumb']})"
            
            lines.append(f"- [{e.date}] [{e.title}]({e.path.as_posix()}){thumb_str}{author_str}")
        lines.append("")

    notes_dir = root / "notes"
    notes_dir.mkdir(parents=True, exist_ok=True)
    out_path = notes_dir / "README.md"
    out_path.write_text("\n".join(lines).rstrip() + "\n", encoding="utf-8")

    # JSON indices
    json_entries = []
    for e in entries:
        fm = read_front_matter(root / e.path)
        json_entries.append({
            "category": e.category,
            "date": e.date,
            "path": e.path.as_posix(),
            "title": e.title,
            "author": fm.get("author", ""),
            "images": e.images
        })
    (notes_dir / "index.json").write_text(json.dumps(json_entries, ensure_ascii=False, indent=2), encoding="utf-8")

    # Also write to docs/data for GitHub Pages
    docs_data = root / "docs" / "data"
    docs_data.mkdir(parents=True, exist_ok=True)
    (docs_data / "index.json").write_text(json.dumps(json_entries, ensure_ascii=False, indent=2), encoding="utf-8")

    latest = json_entries[:20]
    (docs_data / "latest.json").write_text(json.dumps(latest, ensure_ascii=False, indent=2), encoding="utf-8")

    print(out_path)


def main() -> None:
    repo_root = Path(__file__).resolve().parents[1]
    entries = collect_notes(repo_root)
    write_index(repo_root, entries)
    
    # Also build tag aggregation data
    try:
        import subprocess
        import sys
        result = subprocess.run([
            sys.executable, 
            str(repo_root / "tools" / "build_tags.py")
        ], capture_output=True, text=True)
        if result.returncode == 0:
            print("Tag aggregation data built successfully")
        else:
            print(f"Warning: Tag building failed: {result.stderr}")
    except Exception as e:
        print(f"Warning: Could not build tag data: {e}")


if __name__ == "__main__":
    main()