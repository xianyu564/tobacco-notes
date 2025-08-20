#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Convert labeled GitHub issues (from forms) into markdown notes under /notes.

Triggered by GH Actions on issues labeled 'tasting' or 'one-liner'.
Parses the issue form sections to extract 'Category' and a one-line message.
Falls back to minimal content if fields are missing.
"""
import json
import os
import re
from datetime import datetime
from pathlib import Path

CATEGORIES = {"cigars","cigarettes","pipe","ryo","snus","ecig"}

def slugify(text: str) -> str:
    text = re.sub(r"[^\w\- ]+", "", text.strip()).replace(" ", "-")
    return re.sub(r"-{2,}", "-", text).lower()[:80]

def parse_field(body: str, field_heading_pattern: str) -> str | None:
    """Extract the value following a '### Heading' in GitHub issue forms.
    Matches the heading line and captures following non-empty line(s) until a blank line.
    """
    pattern = re.compile(rf"^###\s*{field_heading_pattern}\s*$\n+([\s\S]*?)(?:\n\s*\n|\Z)", re.MULTILINE)
    m = pattern.search(body)
    if not m:
        return None
    value = m.group(1).strip()
    # In forms, single-select dropdown typically yields one line
    # Normalize to first non-empty line
    for line in value.splitlines():
        if line.strip():
            return line.strip()
    return None

def infer_category(body: str) -> str | None:
    # Match both '分类 / Category' and 'Category' variants
    for heading in [r"分类\s*/\s*Category", r"Category", r"分类"]:
        value = parse_field(body, heading)
        if value:
            # Normalize option like 'cigarettes (纸烟)' -> 'cigarettes'
            key = value.split(" ")[0].strip().lower()
            if key in CATEGORIES:
                return key
    return None

def extract_message(body: str) -> str | None:
    for heading in [r"一句话\s*/\s*One sentence", r"One sentence", r"一句话", r"风味笔记\s*/\s*Flavor Notes", r"Notes"]:
        value = parse_field(body, heading)
        if value:
            return value.strip()
    # Fallback: use entire body minus headings
    cleaned = re.sub(r"^### .*?$", "", body, flags=re.MULTILINE).strip()
    return cleaned if cleaned else None

def extract_date(body: str) -> str:
    v = parse_field(body, r"日期\s*/\s*Date|Date|日期")
    if v:
        v = v.strip()
        # Basic YYYY-MM-DD validation
        if re.match(r"^\d{4}-\d{2}-\d{2}$", v):
            return v
    return datetime.now().strftime("%Y-%m-%d")

def main() -> None:
    event_path = os.environ.get("GITHUB_EVENT_PATH")
    if not event_path or not Path(event_path).exists():
        print("GITHUB_EVENT_PATH not found; skipping.")
        return

    with open(event_path, "r", encoding="utf-8") as f:
        event = json.load(f)

    issue = event.get("issue", {})
    labels = {l.get("name", "") for l in (issue.get("labels") or [])}
    # Also capture label from 'labeled' event payload if present
    triggered_label = (event.get("label") or {}).get("name")
    if triggered_label:
        labels.add(triggered_label)
    if labels.isdisjoint({"tasting", "one-liner"}):
        print(f"Labels {labels} not targeted; skipping.")
        return

    title = issue.get("title", "Tasting note")
    body = issue.get("body", "") or ""
    number = issue.get("number") or event.get("number") or 0
    user = (issue.get("user") or {}).get("login", "unknown")

    category = infer_category(body) or "cigarettes"
    note_date = extract_date(body)
    message = extract_message(body) or title

    # Build filename
    slug_source = title if title and title.strip() else message
    filename = f"{note_date}-{slugify(slug_source)}.md"

    repo_root = Path(__file__).resolve().parents[1]
    notes_dir = repo_root / "notes" / category
    notes_dir.mkdir(parents=True, exist_ok=True)
    filepath = notes_dir / filename

    if filepath.exists():
        # Append a short suffix to avoid collision
        suffix = datetime.now().strftime("%H%M%S")
        filepath = notes_dir / f"{note_date}-{slugify(slug_source)}-{suffix}.md"

    content_lines = []
    content_lines.append("---")
    content_lines.append(f"title: {title}")
    content_lines.append(f"category: {category}")
    content_lines.append(f"date: {note_date}")
    content_lines.append(f"source_issue: #{number}")
    content_lines.append("type: quick")
    content_lines.append("tags: []")
    content_lines.append("---\n")
    content_lines.append(f"- One-liner｜一句话：{message}\n")

    filepath.write_text("\n".join(content_lines), encoding="utf-8")
    # Print path relative to repo root for downstream steps
    repo_root = Path(__file__).resolve().parents[1]
    print(str(filepath.relative_to(repo_root)))

if __name__ == "__main__":
    main()


