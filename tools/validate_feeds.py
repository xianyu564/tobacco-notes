#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Feed validation and testing utility for enhanced SEO feeds.
"""
import json
import xml.etree.ElementTree as ET
from pathlib import Path
import re
from urllib.parse import urlparse


def validate_rss_feed(feed_path):
    """Validate RSS feed structure and content."""
    print(f"\n🔍 Validating RSS feed: {feed_path}")
    
    try:
        tree = ET.parse(feed_path)
        root = tree.getroot()
        
        # Check RSS structure
        if root.tag != 'rss':
            print("❌ Invalid RSS root element")
            return False
            
        channel = root.find('channel')
        if channel is None:
            print("❌ Missing channel element")
            return False
            
        # Check required elements
        required = ['title', 'description', 'link']
        for req in required:
            if channel.find(req) is None:
                print(f"❌ Missing required element: {req}")
                return False
                
        # Check items
        items = channel.findall('item')
        print(f"✅ Found {len(items)} feed items")
        
        # Validate first item
        if items:
            item = items[0]
            item_title = item.find('title')
            item_link = item.find('link')
            item_desc = item.find('description')
            
            if item_title is not None and item_link is not None and item_desc is not None:
                print(f"✅ Sample item: {item_title.text}")
                print(f"   URL: {item_link.text}")
            else:
                print("❌ Invalid item structure")
                return False
                
        # Check enhanced elements
        enhanced_elements = ['generator', 'image', 'copyright', 'ttl']
        for elem in enhanced_elements:
            if channel.find(elem) is not None:
                print(f"✅ Enhanced element present: {elem}")
                
        print("✅ RSS feed validation passed")
        return True
        
    except Exception as e:
        print(f"❌ RSS validation error: {e}")
        return False


def validate_atom_feed(feed_path):
    """Validate Atom feed structure and content."""
    print(f"\n🔍 Validating Atom feed: {feed_path}")
    
    try:
        tree = ET.parse(feed_path)
        root = tree.getroot()
        
        # Check Atom structure
        if not root.tag.endswith('feed'):
            print("❌ Invalid Atom root element")
            return False
            
        # Define namespace
        ns = {'atom': 'http://www.w3.org/2005/Atom'}
        
        # Check required elements
        required = ['title', 'id', 'updated']
        for req in required:
            if root.find(f'atom:{req}', ns) is None:
                print(f"❌ Missing required element: {req}")
                return False
                
        # Check entries
        entries = root.findall('atom:entry', ns)
        print(f"✅ Found {len(entries)} feed entries")
        
        # Validate first entry
        if entries:
            entry = entries[0]
            entry_title = entry.find('atom:title', ns)
            entry_link = entry.find('atom:link', ns)
            
            if entry_title is not None and entry_link is not None:
                print(f"✅ Sample entry: {entry_title.text}")
                print(f"   URL: {entry_link.get('href', 'N/A')}")
            else:
                print("❌ Invalid entry structure")
                return False
        
        # Check enhanced elements
        enhanced_elements = ['generator', 'logo', 'icon', 'rights', 'author']
        for elem in enhanced_elements:
            if root.find(f'atom:{elem}', ns) is not None:
                print(f"✅ Enhanced element present: {elem}")
                
        print("✅ Atom feed validation passed")
        return True
        
    except Exception as e:
        print(f"❌ Atom validation error: {e}")
        return False


def validate_json_feed(feed_path):
    """Validate JSON feed structure and content."""
    print(f"\n🔍 Validating JSON feed: {feed_path}")
    
    try:
        with open(feed_path, 'r', encoding='utf-8') as f:
            feed = json.load(f)
            
        # Check required fields
        required = ['version', 'title', 'items']
        for req in required:
            if req not in feed:
                print(f"❌ Missing required field: {req}")
                return False
                
        # Check version
        if not feed['version'].startswith('https://jsonfeed.org/version/'):
            print("❌ Invalid JSON Feed version")
            return False
            
        # Check items
        items = feed.get('items', [])
        print(f"✅ Found {len(items)} feed items")
        
        # Validate first item
        if items:
            item = items[0]
            if 'id' in item and 'title' in item:
                print(f"✅ Sample item: {item['title']}")
                print(f"   URL: {item.get('url', 'N/A')}")
            else:
                print("❌ Invalid item structure")
                return False
                
        # Check enhanced elements
        enhanced_elements = ['description', 'icon', 'favicon', 'language', 'authors']
        for elem in enhanced_elements:
            if elem in feed:
                print(f"✅ Enhanced element present: {elem}")
                
        # Check tobacco-specific metadata
        if items and '_tobacco_notes' in items[0]:
            print("✅ Tobacco-specific metadata present")
            
        print("✅ JSON feed validation passed")
        return True
        
    except Exception as e:
        print(f"❌ JSON validation error: {e}")
        return False


def validate_url_structure(feed_path):
    """Validate URL structure in feeds."""
    print(f"\n🔗 Validating URL structure in: {feed_path}")
    
    try:
        if feed_path.suffix == '.json':
            with open(feed_path, 'r', encoding='utf-8') as f:
                feed = json.load(f)
                items = feed.get('items', [])
                if items:
                    url = items[0].get('url', '')
                    if url and '#' in url:
                        print(f"✅ SPA-friendly URL structure: {url}")
                        return True
        else:
            # For XML feeds, parse manually
            with open(feed_path, 'r', encoding='utf-8') as f:
                content = f.read()
                if '<link>' in content:
                    # Extract first item link
                    import re
                    # Look for item links specifically
                    item_pattern = r'<item>.*?<link[^>]*>([^<]+)</link>.*?</item>'
                    match = re.search(item_pattern, content, re.DOTALL)
                    if match:
                        url = match.group(1)
                        if '#' in url:
                            print(f"✅ SPA-friendly URL structure: {url}")
                            return True
                    
                    # For Atom feeds
                    link_pattern = r'<link[^>]+href="([^"]+)"[^>]*/?>'
                    match = re.search(link_pattern, content)
                    if match:
                        url = match.group(1)
                        if '#' in url:
                            print(f"✅ SPA-friendly URL structure: {url}")
                            return True
                    
        print("❌ URLs may not be optimized for SPA")
        return False
        
    except Exception as e:
        print(f"❌ URL validation error: {e}")
        return False


def main():
    """Run comprehensive feed validation."""
    print("🚀 Starting Feed SEO Validation")
    print("=" * 50)
    
    repo_root = Path(__file__).resolve().parents[1]
    docs_dir = repo_root / 'docs'
    
    feeds = {
        'RSS': docs_dir / 'feed.xml',
        'Atom': docs_dir / 'feed.atom', 
        'JSON': docs_dir / 'feed.json'
    }
    
    results = {}
    
    for feed_type, feed_path in feeds.items():
        if not feed_path.exists():
            print(f"❌ {feed_type} feed not found: {feed_path}")
            results[feed_type] = False
            continue
            
        # Validate based on type
        if feed_type == 'RSS':
            results[feed_type] = validate_rss_feed(feed_path)
        elif feed_type == 'Atom':
            results[feed_type] = validate_atom_feed(feed_path)
        elif feed_type == 'JSON':
            results[feed_type] = validate_json_feed(feed_path)
            
        # Validate URLs
        validate_url_structure(feed_path)
    
    # Summary
    print("\n" + "=" * 50)
    print("📊 Validation Summary:")
    for feed_type, passed in results.items():
        status = "✅ PASSED" if passed else "❌ FAILED"
        print(f"   {feed_type}: {status}")
        
    total_passed = sum(results.values())
    print(f"\n🎯 Overall: {total_passed}/{len(results)} feeds passed validation")
    
    if total_passed == len(results):
        print("🎉 All feeds are optimized for SEO!")
        return True
    else:
        print("⚠️  Some feeds need attention")
        return False


if __name__ == '__main__':
    main()