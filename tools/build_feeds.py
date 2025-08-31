#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Generate RSS/Atom/JSON Feed from notes.
"""
from datetime import datetime, timezone
import json
import os
from pathlib import Path
import re
import yaml

SITE_URL = "https://xianyu564.github.io/tobacco-notes"
SITE_TITLE = "Tobacco Notes｜烟草笔记"
SITE_DESCRIPTION = "轻量、开放的烟草品鉴笔记；一键一句话投稿；浏览最新/全部笔记。"

def parse_frontmatter(content):
    """Extract and parse YAML frontmatter."""
    if not content.startswith('---\n'):
        return {}, content
    
    end = content.find('\n---', 4)
    if end == -1:
        return {}, content
    
    try:
        meta = yaml.safe_load(content[4:end])
        body = content[end + 4:].strip()
        return meta or {}, body
    except:
        return {}, content

def extract_description(content, max_length=200):
    """Extract a description from markdown content."""
    # Remove headers
    content = re.sub(r'^#+\s+.*$', '', content, flags=re.MULTILINE)
    # Remove links
    content = re.sub(r'\[([^\]]+)\]\([^)]+\)', r'\1', content)
    # Remove emphasis
    content = re.sub(r'[*_]{1,2}([^*_]+)[*_]{1,2}', r'\1', content)
    # Collapse whitespace
    content = ' '.join(content.split())
    return content[:max_length] + ('...' if len(content) > max_length else '')

def format_datetime(dt):
    """Format datetime in RFC 3339 format."""
    return dt.astimezone(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')

def build_feed_items(notes_dir):
    """Build feed items from notes directory."""
    items = []
    
    for category in ['cigars', 'cigarettes', 'pipe', 'ryo', 'snus', 'ecig']:
        cat_dir = notes_dir / category
        if not cat_dir.exists():
            continue
            
        for note_file in cat_dir.glob('*.md'):
            if note_file.name.startswith('TEMPLATE'):
                continue
                
            # Parse date from filename
            date_match = re.match(r'(\d{4}-\d{2}-\d{2})', note_file.name)
            if not date_match:
                continue
                
            date_str = date_match.group(1)
            try:
                date = datetime.strptime(date_str, '%Y-%m-%d').replace(tzinfo=timezone.utc)
            except:
                continue
            
            # Read and parse note
            try:
                content = note_file.read_text(encoding='utf-8')
                meta, body = parse_frontmatter(content)
                
                # Build item
                item = {
                    'id': f"{SITE_URL}/notes/{category}/{note_file.name}",
                    'url': f"{SITE_URL}/notes/{category}/{note_file.name}",
                    'title': meta.get('title', note_file.stem),
                    'content_html': body,  # TODO: Convert markdown to HTML
                    'content_text': body,
                    'summary': extract_description(body),
                    'date_published': format_datetime(date),
                    'date_modified': format_datetime(date),
                    'author': {
                        'name': meta.get('author', 'Anonymous')
                    },
                    'tags': meta.get('tags', []),
                    '_category': category,
                    '_rating': meta.get('rating', '')
                }
                
                items.append(item)
            except Exception as e:
                print(f"Error processing {note_file}: {e}")
                continue
    
    # Sort by date, newest first
    items.sort(key=lambda x: x['date_published'], reverse=True)
    return items

def build_rss(items):
    """Build RSS 2.0 feed."""
    rss = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
        '<channel>',
        f'<title>{SITE_TITLE}</title>',
        f'<link>{SITE_URL}</link>',
        f'<description>{SITE_DESCRIPTION}</description>',
        f'<atom:link href="{SITE_URL}/feed.xml" rel="self" type="application/rss+xml"/>',
        '<language>zh-CN</language>',
        f'<lastBuildDate>{format_datetime(datetime.now(timezone.utc))}</lastBuildDate>'
    ]
    
    for item in items[:50]:  # Latest 50 items
        rss.extend([
            '<item>',
            f'<title>{item["title"]}</title>',
            f'<link>{item["url"]}</link>',
            f'<guid isPermaLink="true">{item["url"]}</guid>',
            f'<pubDate>{item["date_published"]}</pubDate>',
            f'<description><![CDATA[{item["summary"]}]]></description>',
            f'<category>{item["_category"]}</category>',
            '</item>'
        ])
    
    rss.extend(['</channel>', '</rss>'])
    return '\n'.join(rss)

def build_atom(items):
    """Build Atom feed."""
    atom = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<feed xmlns="http://www.w3.org/2005/Atom">',
        f'<title>{SITE_TITLE}</title>',
        f'<subtitle>{SITE_DESCRIPTION}</subtitle>',
        f'<link href="{SITE_URL}"/>',
        f'<link href="{SITE_URL}/feed.atom" rel="self"/>',
        f'<id>{SITE_URL}/</id>',
        f'<updated>{format_datetime(datetime.now(timezone.utc))}</updated>'
    ]
    
    for item in items[:50]:
        atom.extend([
            '<entry>',
            f'<title>{item["title"]}</title>',
            f'<link href="{item["url"]}"/>',
            f'<id>{item["id"]}</id>',
            f'<updated>{item["date_modified"]}</updated>',
            f'<published>{item["date_published"]}</published>',
            f'<author><name>{item["author"]["name"]}</name></author>',
            f'<summary type="text">{item["summary"]}</summary>',
            f'<content type="text">{item["content_text"]}</content>',
            f'<category term="{item["_category"]}"/>',
            '</entry>'
        ])
    
    atom.append('</feed>')
    return '\n'.join(atom)

def build_json_feed(items):
    """Build JSON Feed."""
    feed = {
        "version": "https://jsonfeed.org/version/1.1",
        "title": SITE_TITLE,
        "description": SITE_DESCRIPTION,
        "home_page_url": SITE_URL,
        "feed_url": f"{SITE_URL}/feed.json",
        "authors": [
            {
                "name": "Contributors",
                "url": f"{SITE_URL}/docs/contributors.md"
            }
        ],
        "language": "zh-CN",
        "items": items[:50]  # Latest 50 items
    }
    return json.dumps(feed, ensure_ascii=False, indent=2)

def main():
    from build_logger import setup_logging, BuildError
    logger = setup_logging('build_feeds')
    
    try:
        repo_root = Path(__file__).resolve().parents[1]
        notes_dir = repo_root / 'notes'
        docs_dir = repo_root / 'docs'
        
        if not notes_dir.exists():
            raise BuildError(f"Notes directory not found: {notes_dir}")
        
        # Build feed items
        logger.info("Building feed items...")
        items = build_feed_items(notes_dir)
        if not items:
            logger.warning("No feed items found")
            return
        
        # Ensure docs directory exists
        docs_dir.mkdir(parents=True, exist_ok=True)
        
        # Write feeds in parallel
        from concurrent.futures import ThreadPoolExecutor
        
        def write_rss():
            logger.info("Building RSS feed...")
            (docs_dir / 'feed.xml').write_text(build_rss(items), encoding='utf-8')
            
        def write_atom():
            logger.info("Building Atom feed...")
            (docs_dir / 'feed.atom').write_text(build_atom(items), encoding='utf-8')
            
        def write_json():
            logger.info("Building JSON feed...")
            (docs_dir / 'feed.json').write_text(build_json_feed(items), encoding='utf-8')
        
        with ThreadPoolExecutor() as executor:
            futures = [
                executor.submit(write_rss),
                executor.submit(write_atom),
                executor.submit(write_json)
            ]
            
            # Wait for all feeds to be written
            for future in futures:
                future.result()
        
        logger.info(f"Generated feeds with {len(items)} items")
        
    except Exception as e:
        logger.error(f"Failed to generate feeds: {e}")
        raise BuildError("Feed generation failed") from e

if __name__ == '__main__':
    main()
