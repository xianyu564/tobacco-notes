#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Build a simple index under notes/README.md grouping notes by category and date.

The script scans notes/<category> directories, infers title from front matter
or filename, sorts entries by date (from filename prefix), and writes a clean
Markdown index for quick browsing.
"""
from __future__ import annotations

import re
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Dict, Optional, Tuple

CATEGORIES = ["cigars", "cigarettes", "pipe", "ryo", "snus", "ecig"]

RE_DATE_PREFIX = re.compile(r"^(\d{4}-\d{2}-\d{2})-")


@dataclass
class NoteEntry:
    category: str
    date: str
    path: Path
    title: str


def read_front_matter(filepath: Path) -> Dict[str, str]:
    content = filepath.read_text(encoding="utf-8", errors="ignore")
    if not content.startswith("---\n"):
        return {}
    end = content.find("\n---", 4)
    if end == -1:
        return {}
    block = content[4 : end].strip()
    meta: Dict[str, str] = {}
    for line in block.splitlines():
        if ":" not in line:
            continue
        key, value = line.split(":", 1)
        meta[key.strip()] = value.strip()
    return meta


def infer_title(meta: Dict[str, str], fallback: str) -> str:
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


def collect_notes(root: Path) -> list[NoteEntry]:
    entries: list[NoteEntry] = []
    for category in CATEGORIES:
        cat_dir = root / "notes" / category
        if not cat_dir.exists():
            continue
        for fp in sorted(cat_dir.glob("*.md")):
            date = parse_date_from_filename(fp.name) or "1970-01-01"
            meta = read_front_matter(fp)
            title = infer_title(meta, fallback=fp.stem)
            entries.append(NoteEntry(category=category, date=date, path=fp.relative_to(root), title=title))
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
            lines.append(f"- [{e.date}] [{e.title}]({e.path.as_posix()})")
        lines.append("")

    out_path = root / "notes" / "README.md"
    out_path.write_text("\n".join(lines).rstrip() + "\n", encoding="utf-8")
    print(out_path)


def main() -> None:
    repo_root = Path(__file__).resolve().parents[1]
    entries = collect_notes(repo_root)
    write_index(repo_root, entries)


if __name__ == "__main__":
    main()


