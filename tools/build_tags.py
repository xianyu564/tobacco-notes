#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Build tag aggregation data for the tobacco notes site.

This script scans all note files, extracts tags from frontmatter,
and generates aggregated tag data for the tag browsing feature.
"""
from __future__ import annotations

import json
import re
from collections import defaultdict, Counter
from pathlib import Path
from typing import Dict, List, Any, Set

# Reuse the same categories and functions from build_index.py
CATEGORIES = ["cigars", "cigarettes", "pipe", "ryo", "snus", "ecig"]
RE_DATE_PREFIX = re.compile(r"^(\d{4}-\d{2}-\d{2})-")


def read_front_matter(filepath: Path) -> Dict[str, Any]:
    """Extract frontmatter from a markdown file."""
    try:
        content = filepath.read_text(encoding="utf-8", errors="ignore")
    except:
        return {}
    
    if not content.startswith("---\n"):
        return {}
    
    end = content.find("\n---", 4)
    if end == -1:
        return {}
    
    block = content[4:end].strip()
    meta: Dict[str, Any] = {}
    
    for line in block.splitlines():
        line = line.strip()
        if not line or ":" not in line:
            continue
            
        key, value = line.split(":", 1)
        key = key.strip()
        value = value.strip()
        
        # Handle list format: tags: [tag1, tag2, tag3]
        if value.startswith("[") and value.endswith("]"):
            # Parse simple list format
            list_content = value[1:-1].strip()
            if list_content:
                # Split by comma and clean up
                items = [item.strip().strip("'\"") for item in list_content.split(",")]
                meta[key] = [item for item in items if item]
            else:
                meta[key] = []
        else:
            meta[key] = value
    
    return meta


def parse_date_from_filename(filename: str) -> str | None:
    """Extract date from filename like '2025-08-21-title.md'."""
    match = RE_DATE_PREFIX.match(filename)
    return match.group(1) if match else None


def collect_tags_from_notes(root: Path) -> Dict[str, Any]:
    """Collect all tags from note files and build aggregation data."""
    
    # Tag statistics
    all_tags = Counter()  # tag -> count
    tag_to_notes = defaultdict(list)  # tag -> list of note info
    category_tags = defaultdict(Counter)  # category -> {tag: count}
    notes_with_tags = []  # All notes that have tags
    
    # Process each category
    for category in CATEGORIES:
        cat_dir = root / "notes" / category
        if not cat_dir.exists():
            continue
            
        for note_file in sorted(cat_dir.glob("*.md")):
            # Only process dated notes
            date = parse_date_from_filename(note_file.name)
            if not date:
                continue
                
            # Read frontmatter
            meta = read_front_matter(note_file)
            tags = meta.get("tags", [])
            
            if not tags or not isinstance(tags, list):
                continue
                
            # Get note title/name
            title = (meta.get("title") or 
                    meta.get("product") or 
                    meta.get("brand") or 
                    note_file.stem.replace(f"{date}-", "").replace("-", " ").title())
            
            note_info = {
                "category": category,
                "date": date,
                "path": note_file.relative_to(root).as_posix(),
                "title": title,
                "author": meta.get("author", ""),
                "rating": meta.get("rating", ""),
                "tags": tags
            }
            
            notes_with_tags.append(note_info)
            
            # Aggregate tag statistics
            for tag in tags:
                tag = tag.strip().lower()
                if tag:
                    all_tags[tag] += 1
                    tag_to_notes[tag].append(note_info)
                    category_tags[category][tag] += 1
    
    # Build featured tag collections based on frequency and categories
    featured_tags = build_featured_collections(all_tags, category_tags, tag_to_notes)
    
    # Sort tags by frequency for tag cloud
    popular_tags = [{"tag": tag, "count": count} for tag, count in all_tags.most_common(50)]
    
    return {
        "summary": {
            "total_tags": len(all_tags),
            "total_notes_with_tags": len(notes_with_tags),
            "categories_with_tags": len([cat for cat in category_tags if category_tags[cat]])
        },
        "all_tags": dict(all_tags),
        "popular_tags": popular_tags,
        "tag_to_notes": dict(tag_to_notes),
        "category_tags": {cat: dict(tags) for cat, tags in category_tags.items()},
        "featured_collections": featured_tags,
        "notes_with_tags": notes_with_tags
    }


def build_featured_collections(all_tags: Counter, category_tags: Dict, tag_to_notes: Dict) -> List[Dict]:
    """Build curated featured tag collections."""
    featured = []
    
    # Most popular tags across all categories
    if all_tags:
        top_tags = [tag for tag, _ in all_tags.most_common(10)]
        featured.append({
            "id": "popular",
            "title": "热门标签",
            "title_en": "Popular Tags",
            "description": "使用频率最高的标签",
            "description_en": "Most frequently used tags",
            "tags": top_tags,
            "type": "popular"
        })
    
    # Flavor-related tags
    flavor_keywords = ["sweet", "甜", "spicy", "辣", "woody", "木", "fruity", "果", 
                      "floral", "花", "nutty", "坚果", "smoky", "烟", "earthy", "土",
                      "pepper", "胡椒", "cocoa", "可可", "caramel", "焦糖"]
    flavor_tags = [tag for tag in all_tags if any(kw in tag.lower() for kw in flavor_keywords)]
    if flavor_tags:
        featured.append({
            "id": "flavors",
            "title": "风味标签",
            "title_en": "Flavor Tags", 
            "description": "描述口感和风味的标签",
            "description_en": "Tags describing taste and flavor profiles",
            "tags": flavor_tags[:15],
            "type": "flavor"
        })
    
    # Intensity/strength tags
    intensity_keywords = ["mild", "温和", "medium", "中等", "full", "浓郁", "strong", "强", 
                         "light", "轻", "heavy", "重"]
    intensity_tags = [tag for tag in all_tags if any(kw in tag.lower() for kw in intensity_keywords)]
    if intensity_tags:
        featured.append({
            "id": "intensity", 
            "title": "强度标签",
            "title_en": "Intensity Tags",
            "description": "描述强度和浓度的标签", 
            "description_en": "Tags describing strength and intensity",
            "tags": intensity_tags[:10],
            "type": "intensity"
        })
    
    # Quality/experience tags  
    quality_keywords = ["smooth", "顺滑", "clean", "清", "rough", "粗", "complex", "复杂",
                       "balanced", "平衡", "rich", "丰富", "cooling", "清凉"]
    quality_tags = [tag for tag in all_tags if any(kw in tag.lower() for kw in quality_keywords)]
    if quality_tags:
        featured.append({
            "id": "quality",
            "title": "体验标签", 
            "title_en": "Experience Tags",
            "description": "描述品质和体验的标签",
            "description_en": "Tags describing quality and experience",
            "tags": quality_tags[:12],
            "type": "quality"
        })
    
    return featured


def write_tag_data(root: Path, tag_data: Dict[str, Any]) -> None:
    """Write tag aggregation data to JSON files."""
    docs_data = root / "docs" / "data"
    docs_data.mkdir(parents=True, exist_ok=True)
    
    # Write comprehensive tag data
    tag_file = docs_data / "tags.json"
    tag_file.write_text(
        json.dumps(tag_data, ensure_ascii=False, indent=2),
        encoding="utf-8"
    )
    
    # Write a simplified version for faster loading
    simple_data = {
        "summary": tag_data["summary"],
        "popular_tags": tag_data["popular_tags"],
        "featured_collections": tag_data["featured_collections"]
    }
    
    simple_file = docs_data / "tags-simple.json" 
    simple_file.write_text(
        json.dumps(simple_data, ensure_ascii=False, indent=2),
        encoding="utf-8"
    )
    
    print(f"Tag data written to {tag_file}")
    print(f"Simple tag data written to {simple_file}")
    print(f"Found {tag_data['summary']['total_tags']} unique tags in {tag_data['summary']['total_notes_with_tags']} notes")


def main() -> None:
    """Main entry point."""
    repo_root = Path(__file__).resolve().parents[1]
    tag_data = collect_tags_from_notes(repo_root)
    write_tag_data(repo_root, tag_data)


if __name__ == "__main__":
    main()