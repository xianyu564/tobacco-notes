#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Build contributors data by aggregating GitHub Issues and PRs authors.

This script creates a contributors.json file with contributor information
including their contributions, join date, and activity metrics.
Can be run with or without GitHub API access for flexible deployment.
"""
import json
import os
import re
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional, Set, Any
from dataclasses import dataclass, asdict
from collections import defaultdict

try:
    import requests
    HAS_REQUESTS = True
except ImportError:
    HAS_REQUESTS = False

REPO_OWNER = "xianyu564"
REPO_NAME = "tobacco-notes"
BASE_URL = f"https://api.github.com/repos/{REPO_OWNER}/{REPO_NAME}"

@dataclass
class Contributor:
    username: str
    display_name: str
    avatar_url: str
    profile_url: str
    join_date: str
    total_contributions: int
    issues_count: int
    prs_count: int
    notes_count: int
    last_active: str
    bio: str = ""
    location: str = ""
    is_maintainer: bool = False
    contributions: List[Dict[str, Any]] = None

    def __post_init__(self):
        if self.contributions is None:
            self.contributions = []

def get_github_token() -> Optional[str]:
    """Get GitHub token from environment variable."""
    return os.environ.get('GITHUB_TOKEN')

def safe_api_request(url: str, token: Optional[str] = None) -> Optional[Dict]:
    """Make a safe API request with error handling."""
    if not HAS_REQUESTS:
        print("⚠️  requests library not available, using static contributor data")
        return None
    
    headers = {'Accept': 'application/vnd.github.v3+json'}
    if token:
        headers['Authorization'] = f'token {token}'
    
    try:
        response = requests.get(url, headers=headers, timeout=10)
        if response.status_code == 200:
            return response.json()
        elif response.status_code == 403:
            print("⚠️  API rate limit exceeded, using cached/static data")
        elif response.status_code == 401:
            print("⚠️  GitHub API authentication failed")
        else:
            print(f"⚠️  GitHub API request failed: {response.status_code}")
    except Exception as e:
        print(f"⚠️  GitHub API request error: {e}")
    
    return None

def get_repository_contributors(token: Optional[str] = None) -> Dict[str, Contributor]:
    """Fetch contributors from GitHub API or return static data."""
    contributors = {}
    
    # Try to get real data from GitHub API
    api_data = safe_api_request(f"{BASE_URL}/contributors", token)
    if api_data:
        for contrib in api_data:
            username = contrib['login']
            contributors[username] = Contributor(
                username=username,
                display_name=contrib.get('name', username),
                avatar_url=contrib['avatar_url'],
                profile_url=contrib['html_url'],
                join_date=datetime.now().isoformat()[:10],
                total_contributions=contrib['contributions'],
                issues_count=0,
                prs_count=0,
                notes_count=0,
                last_active=datetime.now().isoformat()[:10]
            )
    
    # If API data unavailable, use static maintainer data
    if not contributors:
        print("📝 Using static contributor data")
        contributors['xianyu564'] = Contributor(
            username='xianyu564',
            display_name='xianyu564',
            avatar_url='https://github.com/xianyu564.png',
            profile_url='https://github.com/xianyu564',
            join_date=datetime.now().isoformat()[:10],
            total_contributions=1,
            issues_count=0,
            prs_count=0,
            notes_count=0,
            last_active=datetime.now().isoformat()[:10],
            is_maintainer=True,
            bio="Repository maintainer"
        )
    
    return contributors


def update_notes_with_contributors(contributors_data, notes_index_file="notes/index.json"):
    """Update notes index with contributor information"""
    try:
        if not os.path.exists(notes_index_file):
            print(f"Notes index file not found: {notes_index_file}")
            return
            
        with open(notes_index_file, 'r', encoding='utf-8') as f:
            notes = json.load(f)
        
        # For now, assign all notes to the main contributor (repository owner)
        # In the future, this could be enhanced to parse git blame or issue authors
        main_contributor = None
        for contrib_id, contrib_data in contributors_data.items():
            if contrib_data.get('is_maintainer', False):
                main_contributor = contrib_data
                break
        
        if main_contributor:
            updated = False
            for note in notes:
                if not note.get('author') or note['author'] == "":
                    note['author'] = main_contributor['display_name']
                    note['author_id'] = main_contributor['username']
                    note['author_url'] = main_contributor.get('profile_url', '')
                    updated = True
            
            if updated:
                with open(notes_index_file, 'w', encoding='utf-8') as f:
                    json.dump(notes, f, ensure_ascii=False, indent=2)
                print(f"Updated notes index with contributor information")
    except Exception as e:
        print(f"Error updating notes with contributors: {e}")


def extract_author_from_notes(notes_dir: Path) -> Dict[str, int]:
    """Extract author information from existing notes."""
    author_counts = defaultdict(int)
    
    for category_dir in notes_dir.iterdir():
        if not category_dir.is_dir() or category_dir.name.startswith('.'):
            continue
        
        for note_file in category_dir.glob('*.md'):
            if note_file.name.startswith('TEMPLATE'):
                continue
            
            try:
                content = note_file.read_text(encoding='utf-8', errors='ignore')
                # Look for author in frontmatter or content
                author_match = re.search(r'author:\s*([^\n]+)', content, re.IGNORECASE)
                if author_match:
                    author = author_match.group(1).strip().strip('"\'')
                    if author and author != '':
                        author_counts[author] += 1
            except Exception:
                continue
    
    return dict(author_counts)

def build_contributors_data(repo_root: Path) -> Dict[str, Any]:
    """Build comprehensive contributors data."""
    token = get_github_token()
    contributors = get_repository_contributors(token)
    
    # Get note authors
    notes_dir = repo_root / "notes"
    if notes_dir.exists():
        note_authors = extract_author_from_notes(notes_dir)
        
        # Update contributor note counts
        for author, count in note_authors.items():
            if author in contributors:
                contributors[author].notes_count = count
            else:
                # Create contributor entry for note authors not in GitHub data
                contributors[author] = Contributor(
                    username=author,
                    display_name=author,
                    avatar_url=f"https://github.com/{author}.png" if author.replace('-', '').replace('_', '').isalnum() else "",
                    profile_url=f"https://github.com/{author}" if author.replace('-', '').replace('_', '').isalnum() else "",
                    join_date=datetime.now().isoformat()[:10],
                    total_contributions=count,
                    issues_count=0,
                    prs_count=0,
                    notes_count=count,
                    last_active=datetime.now().isoformat()[:10]
                )
    
    # Convert to serializable format
    contributors_list = []
    for contributor in contributors.values():
        contributor_dict = asdict(contributor)
        contributors_list.append(contributor_dict)
    
    # Sort by total contributions
    contributors_list.sort(key=lambda x: x['total_contributions'], reverse=True)
    
    return {
        "last_updated": datetime.now().isoformat(),
        "total_contributors": len(contributors_list),
        "contributors": contributors_list,
        "stats": {
            "total_notes": sum(c['notes_count'] for c in contributors_list),
            "active_contributors": len([c for c in contributors_list if c['total_contributions'] > 0])
        }
    }

def main():
    """Main function to build contributors data."""
    repo_root = Path(__file__).parent.parent
    docs_dir = repo_root / "docs"
    data_dir = docs_dir / "data"
    
    # Ensure data directory exists
    data_dir.mkdir(exist_ok=True)
    
    print("🔨 Building contributors data...")
    
    # Build contributors data
    contributors_data = build_contributors_data(repo_root)
    
    # Write contributors.json
    contributors_file = data_dir / "contributors.json"
    with open(contributors_file, 'w', encoding='utf-8') as f:
        json.dump(contributors_data, f, ensure_ascii=False, indent=2)
    
    print(f"✅ Contributors data written to {contributors_file}")
    print(f"📊 Found {contributors_data['total_contributors']} contributors")
    print(f"📝 Total notes: {contributors_data['stats']['total_notes']}")
    
    # Update notes with contributor data
    contributors_dict = {contrib['username']: contrib for contrib in contributors_data['contributors']}
    update_notes_with_contributors(contributors_dict)
    
    # Update contributors.md with dynamic content
    update_contributors_md(docs_dir, contributors_data)
    
    print("🎉 Contributors build complete!")

def update_contributors_md(docs_dir: Path, contributors_data: Dict[str, Any]):
    """Update contributors.md with dynamic content."""
    contributors_md = docs_dir / "contributors.md"
    
    content = [
        "# Contributors | 贡献者",
        "",
        f"> 最后更新：{contributors_data['last_updated'][:10]} | 共 {contributors_data['total_contributors']} 位贡献者",
        "",
        "感谢所有为本项目做出贡献的朋友们！",
        "",
        "## 维护者 | Maintainers",
        ""
    ]
    
    # Add maintainers
    maintainers = [c for c in contributors_data['contributors'] if c.get('is_maintainer')]
    if maintainers:
        for maintainer in maintainers:
            content.append(f"- [@{maintainer['username']}]({maintainer['profile_url']}) - {maintainer.get('bio', 'Maintainer')}")
    else:
        content.append("- @xianyu564 - Repository maintainer")
    
    content.extend([
        "",
        "## 贡献者 | Contributors",
        "",
        "按贡献数量排序：",
        ""
    ])
    
    # Add all contributors
    for contributor in contributors_data['contributors']:
        if not contributor.get('is_maintainer'):
            username = contributor['username']
            total = contributor['total_contributions']
            notes = contributor['notes_count']
            
            profile_link = f"[@{username}]({contributor['profile_url']})" if contributor['profile_url'] else f"@{username}"
            
            if notes > 0:
                content.append(f"- {profile_link} — {notes} 篇笔记")
            else:
                content.append(f"- {profile_link} — {total} 次贡献")
    
    content.extend([
        "",
        "## 统计 | Statistics",
        "",
        f"- 总贡献者：{contributors_data['total_contributors']} 人",
        f"- 总笔记数：{contributors_data['stats']['total_notes']} 篇",
        f"- 活跃贡献者：{contributors_data['stats']['active_contributors']} 人",
        "",
        "---",
        "",
        "备注：如需署名方式变更或匿名展示，可在 Issue 中说明。",
        "",
        "想要参与贡献？查看 [参与指南](./contribute.md) 了解如何开始。"
    ])
    
    with open(contributors_md, 'w', encoding='utf-8') as f:
        f.write('\n'.join(content))
    
    print(f"✅ Updated {contributors_md}")

if __name__ == "__main__":
    main()