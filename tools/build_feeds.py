#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Generate RSS/Atom/JSON Feed from notes with SEO optimization.
"""
from datetime import datetime, timezone
import json
import os
from pathlib import Path
import re
import yaml
import html

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

def markdown_to_html(content):
    """Convert basic markdown to HTML for feeds."""
    # Convert bold/italic
    content = re.sub(r'\*\*([^\*]+)\*\*', r'<strong>\1</strong>', content)
    content = re.sub(r'\*([^\*]+)\*', r'<em>\1</em>', content)
    
    # Convert line breaks to <br> tags
    content = content.replace('\n', '<br>\n')
    
    # Escape HTML entities
    content = html.escape(content, quote=False)
    
    return content

def get_note_web_url(site_url, category, filename):
    """Generate proper web URL for note viewing instead of raw markdown."""
    # Remove .md extension for clean URLs
    note_id = filename.replace('.md', '')
    # Create hash-based URL for SPA navigation
    return f"{site_url}#{category}/{note_id}"

def enhanced_extract_metadata(meta, body):
    """Extract enhanced metadata from note frontmatter and content."""
    # Enhanced rating extraction
    rating = meta.get('rating', '')
    rating_numeric = None
    if rating:
        # Extract numeric rating (e.g., "90/100" -> 90)
        rating_match = re.search(r'(\d+)', str(rating))
        if rating_match:
            rating_numeric = int(rating_match.group(1))
    
    # Enhanced product info
    product = meta.get('product', '')
    vitola = meta.get('vitola', '')
    origin = meta.get('origin', '')
    price = meta.get('price', '')
    
    # Create enhanced title
    enhanced_title = product if product else meta.get('title', '')
    if vitola and product:
        enhanced_title = f"{product} ({vitola})"
    
    return {
        'enhanced_title': enhanced_title,
        'product': product,
        'vitola': vitola, 
        'origin': origin,
        'price': price,
        'rating_numeric': rating_numeric,
        'pairing': meta.get('pairing', ''),
        'tags': meta.get('tags', [])
    }

def format_datetime(dt):
    """Format datetime in RFC 3339 format."""
    return dt.astimezone(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')

def build_feed_items(notes_dir):
    """Build feed items from notes directory with enhanced SEO metadata."""
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
                
                # Extract enhanced metadata
                enhanced_meta = enhanced_extract_metadata(meta, body)
                
                # Generate proper web URL
                web_url = get_note_web_url(SITE_URL, category, note_file.name)
                
                # Build enhanced item
                item = {
                    'id': web_url,
                    'url': web_url,
                    'title': enhanced_meta['enhanced_title'] or note_file.stem,
                    'content_html': markdown_to_html(body),
                    'content_text': body,
                    'summary': extract_description(body),
                    'date_published': format_datetime(date),
                    'date_modified': format_datetime(date),
                    'author': {
                        'name': meta.get('author', 'Anonymous')
                    },
                    'tags': enhanced_meta['tags'],
                    '_category': category,
                    '_rating': meta.get('rating', ''),
                    '_rating_numeric': enhanced_meta['rating_numeric'],
                    '_product': enhanced_meta['product'],
                    '_vitola': enhanced_meta['vitola'],
                    '_origin': enhanced_meta['origin'],
                    '_price': enhanced_meta['price'],
                    '_pairing': enhanced_meta['pairing'],
                    'external_url': web_url,
                    # Add image if available (assuming convention)
                    'image': f"{SITE_URL}/assets/og-image.png"  # Default fallback
                }
                
                items.append(item)
            except Exception as e:
                print(f"Error processing {note_file}: {e}")
                continue
    
    # Sort by date, newest first
    items.sort(key=lambda x: x['date_published'], reverse=True)
    return items

def build_rss(items):
    """Build RSS 2.0 feed with enhanced SEO elements."""
    rss = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:dc="http://purl.org/dc/elements/1.1/">',
        '<channel>',
        f'<title>{SITE_TITLE}</title>',
        f'<link>{SITE_URL}</link>',
        f'<description>{SITE_DESCRIPTION}</description>',
        f'<atom:link href="{SITE_URL}/feed.xml" rel="self" type="application/rss+xml"/>',
        '<language>zh-CN</language>',
        f'<lastBuildDate>{format_datetime(datetime.now(timezone.utc))}</lastBuildDate>',
        '<generator>Tobacco Notes Feed Generator v2.0</generator>',
        f'<image>',
        f'  <url>{SITE_URL}/assets/og-image.png</url>',
        f'  <title>{SITE_TITLE}</title>',
        f'  <link>{SITE_URL}</link>',
        f'</image>',
        '<copyright>内容采用 CC BY 4.0 授权</copyright>',
        '<managingEditor>Contributors</managingEditor>',
        '<webMaster>Contributors</webMaster>',
        '<ttl>60</ttl>'
    ]
    
    for item in items[:50]:  # Latest 50 items
        # Build enhanced description with structured content
        enhanced_desc = item["summary"]
        if item.get('_product'):
            enhanced_desc = f"产品: {item['_product']} | {enhanced_desc}"
        if item.get('_rating'):
            enhanced_desc = f"评分: {item['_rating']} | {enhanced_desc}"
        
        rss.extend([
            '<item>',
            f'<title><![CDATA[{item["title"]}]]></title>',
            f'<link>{item["url"]}</link>',
            f'<guid isPermaLink="false">{item["id"]}</guid>',
            f'<pubDate>{item["date_published"]}</pubDate>',
            f'<description><![CDATA[{enhanced_desc}]]></description>',
            f'<content:encoded><![CDATA[{item["content_html"]}]]></content:encoded>',
            f'<category>{item["_category"]}</category>',
            f'<dc:creator>{item["author"]["name"]}</dc:creator>'
        ])
        
        # Add tags as categories
        for tag in item.get('tags', []):
            rss.append(f'<category>{tag}</category>')
        
        # Add enclosure for image if available
        if item.get('image'):
            rss.append(f'<enclosure url="{item["image"]}" type="image/png" length="0"/>')
            
        rss.append('</item>')
    
    rss.extend(['</channel>', '</rss>'])
    return '\n'.join(rss)

def build_atom(items):
    """Build Atom feed with enhanced SEO elements."""
    atom = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<feed xmlns="http://www.w3.org/2005/Atom" xmlns:media="http://search.yahoo.com/mrss/">',
        f'<title type="text">{SITE_TITLE}</title>',
        f'<subtitle type="text">{SITE_DESCRIPTION}</subtitle>',
        f'<link href="{SITE_URL}" rel="alternate" type="text/html"/>',
        f'<link href="{SITE_URL}/feed.atom" rel="self" type="application/atom+xml"/>',
        f'<id>{SITE_URL}/feed.atom</id>',
        f'<updated>{format_datetime(datetime.now(timezone.utc))}</updated>',
        f'<generator uri="{SITE_URL}">Tobacco Notes Feed Generator v2.0</generator>',
        f'<logo>{SITE_URL}/assets/og-image.png</logo>',
        f'<icon>{SITE_URL}/assets/favicon-32x32.png</icon>',
        '<rights type="text">内容采用 CC BY 4.0 授权</rights>',
        '<author>',
        '  <name>Contributors</name>',
        f'  <uri>{SITE_URL}/contributors.md</uri>',
        '</author>'
    ]
    
    for item in items[:50]:
        # Build enhanced summary with metadata
        enhanced_summary = item["summary"]
        if item.get('_product'):
            enhanced_summary = f"产品: {item['_product']} | {enhanced_summary}"
        if item.get('_rating'):
            enhanced_summary = f"评分: {item['_rating']} | {enhanced_summary}"
        
        atom.extend([
            '<entry>',
            f'<title type="text"><![CDATA[{item["title"]}]]></title>',
            f'<link href="{item["url"]}" rel="alternate" type="text/html"/>',
            f'<id>{item["id"]}</id>',
            f'<updated>{item["date_modified"]}</updated>',
            f'<published>{item["date_published"]}</published>',
            f'<author><name>{item["author"]["name"]}</name></author>',
            f'<summary type="text"><![CDATA[{enhanced_summary}]]></summary>',
            f'<content type="html"><![CDATA[{item["content_html"]}]]></content>'
        ])
        
        # Add categories for tags and main category
        atom.append(f'<category term="{item["_category"]}" label="{item["_category"]}"/>')
        for tag in item.get('tags', []):
            atom.append(f'<category term="{tag}" label="{tag}"/>')
        
        # Add media element if image available
        if item.get('image'):
            atom.append(f'<media:thumbnail url="{item["image"]}"/>')
            
        atom.append('</entry>')
    
    atom.append('</feed>')
    return '\n'.join(atom)

def build_json_feed(items):
    """Build JSON Feed with enhanced SEO elements."""
    feed = {
        "version": "https://jsonfeed.org/version/1.1",
        "title": SITE_TITLE,
        "description": SITE_DESCRIPTION,
        "home_page_url": SITE_URL,
        "feed_url": f"{SITE_URL}/feed.json",
        "authors": [
            {
                "name": "Contributors",
                "url": f"{SITE_URL}/contributors.md"
            }
        ],
        "language": "zh-CN",
        "icon": f"{SITE_URL}/assets/favicon-32x32.png",
        "favicon": f"{SITE_URL}/assets/favicon-32x32.png",
        "user_comment": "This is a feed of tobacco tasting notes and reviews.",
        "expired": False,
        "items": []
    }
    
    # Enhanced items with richer metadata
    for item in items[:50]:  # Latest 50 items
        enhanced_item = {
            "id": item["id"],
            "url": item["url"],
            "external_url": item.get("external_url", item["url"]),
            "title": item["title"],
            "content_html": item["content_html"],
            "content_text": item["content_text"],
            "summary": item["summary"],
            "image": item.get("image"),
            "date_published": item["date_published"],
            "date_modified": item["date_modified"],
            "authors": [item["author"]],
            "tags": item.get("tags", []),
            "language": "zh-CN"
        }
        
        # Add custom extensions for tobacco-specific metadata
        enhanced_item["_tobacco_notes"] = {
            "category": item["_category"],
            "rating": item["_rating"],
            "product": item.get("_product"),
            "vitola": item.get("_vitola"),
            "origin": item.get("_origin"),
            "price": item.get("_price"),
            "pairing": item.get("_pairing")
        }
        
        # Remove None values
        enhanced_item = {k: v for k, v in enhanced_item.items() if v is not None}
        enhanced_item["_tobacco_notes"] = {k: v for k, v in enhanced_item["_tobacco_notes"].items() if v is not None}
        
        feed["items"].append(enhanced_item)
    
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
