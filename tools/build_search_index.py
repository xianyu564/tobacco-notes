#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Build search index for the website.
"""
import json
from pathlib import Path
from typing import List, Dict, Any
import re
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime

from build_logger import setup_logging, BuildError

logger = setup_logging('build_search_index')

class SearchIndexBuilder:
    """构建网站搜索索引"""
    
    def __init__(self, root_dir: Path):
        self.root_dir = root_dir
        self.notes_dir = root_dir / 'notes'
        self.docs_dir = root_dir / 'docs'
        self.data_dir = self.docs_dir / 'data'
        self.data_dir.mkdir(parents=True, exist_ok=True)
        
    def build_index(self) -> None:
        """构建搜索索引"""
        try:
            logger.info("Building search index...")
            
            # 收集所有笔记
            notes = self._collect_notes()
            
            # 处理笔记内容
            with ThreadPoolExecutor() as executor:
                index_entries = list(executor.map(self._process_note, notes))
            
            # 过滤无效条目
            index_entries = [entry for entry in index_entries if entry]
            
            # 按日期排序
            index_entries.sort(
                key=lambda x: datetime.strptime(x['date'], '%Y-%m-%d'),
                reverse=True
            )
            
            # 保存索引
            index_file = self.data_dir / 'search-index.json'
            index_file.write_text(
                json.dumps(index_entries, ensure_ascii=False, indent=2)
            )
            
            logger.info(f"Built search index with {len(index_entries)} entries")
            
        except Exception as e:
            logger.error(f"Failed to build search index: {e}")
            raise BuildError("Search index generation failed") from e
    
    def _collect_notes(self) -> List[Path]:
        """收集所有笔记文件"""
        notes = []
        for category in self.notes_dir.iterdir():
            if category.is_dir() and not category.name.startswith('.'):
                notes.extend(category.glob('*.md'))
        return notes
    
    def _process_note(self, note_path: Path) -> Dict[str, Any]:
        """处理单个笔记文件"""
        try:
            content = note_path.read_text(encoding='utf-8')
            
            # 解析frontmatter
            if not content.startswith('---\n'):
                return None
                
            end = content.find('\n---', 4)
            if end == -1:
                return None
                
            # 提取metadata
            try:
                import yaml
                metadata = yaml.safe_load(content[4:end])
                body = content[end + 4:].strip()
            except:
                return None
            
            # 提取日期
            date_match = re.match(r'(\d{4}-\d{2}-\d{2})', note_path.stem)
            if not date_match:
                return None
                
            # 构建索引条目
            entry = {
                'title': metadata.get('title', note_path.stem),
                'author': metadata.get('author', 'Anonymous'),
                'category': note_path.parent.name,
                'tags': metadata.get('tags', []),
                'date': date_match.group(1),
                'url': f"./notes/{note_path.parent.name}/{note_path.name}",
                'excerpt': self._extract_excerpt(body)
            }
            
            # 添加额外的搜索字段
            entry['search_text'] = ' '.join([
                entry['title'],
                entry['author'],
                entry['category'],
                ' '.join(entry['tags']),
                entry['excerpt']
            ]).lower()
            
            return entry
            
        except Exception as e:
            logger.error(f"Failed to process note {note_path}: {e}")
            return None
    
    def _extract_excerpt(self, content: str, max_length: int = 200) -> str:
        """提取内容摘要"""
        # 移除Markdown语法
        text = re.sub(r'[#*`_\[\]()]', '', content)
        text = re.sub(r'\n+', ' ', text)
        text = re.sub(r'\s+', ' ', text).strip()
        
        # 截取摘要
        if len(text) > max_length:
            text = text[:max_length].rsplit(' ', 1)[0] + '...'
            
        return text

def main():
    """主入口函数"""
    import argparse
    parser = argparse.ArgumentParser(description='Build search index')
    parser.add_argument('root_dir', type=Path, help='Project root directory')
    args = parser.parse_args()
    
    try:
        builder = SearchIndexBuilder(args.root_dir)
        builder.build_index()
    except Exception as e:
        logger.error(f"Search index build failed: {e}")
        raise SystemExit(1)

if __name__ == '__main__':
    main()
