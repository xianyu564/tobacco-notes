#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Asset management and versioning for static resources.
"""
import os
import json
import hashlib
from pathlib import Path
from typing import Dict, List, Optional, Set
import re
from concurrent.futures import ThreadPoolExecutor

from build_logger import setup_logging, BuildError

logger = setup_logging('asset_manager')

class AssetManager:
    """管理静态资源的版本控制和缓存策略"""
    
    def __init__(self, root_dir: Path):
        self.root_dir = root_dir
        self.docs_dir = root_dir / 'docs'
        self.manifest_file = self.docs_dir / 'assets' / 'manifest.json'
        self.manifest: Dict[str, str] = {}
        
        # 加载现有的manifest
        if self.manifest_file.exists():
            try:
                self.manifest = json.loads(self.manifest_file.read_text())
            except Exception as e:
                logger.warning(f"Failed to load manifest: {e}")
        
        # 资源类型配置
        self.asset_types = {
            'js': {'dir': 'js', 'ext': '.js'},
            'css': {'dir': 'styles', 'ext': '.css'},
            'images': {'dir': 'images', 'ext': ('.jpg', '.jpeg', '.png', '.webp')},
            'fonts': {'dir': 'fonts', 'ext': ('.woff2', '.woff', '.ttf')}
        }
        
    def process_assets(self) -> None:
        """处理所有静态资源"""
        try:
            # 处理每种类型的资源
            for asset_type, config in self.asset_types.items():
                asset_dir = self.docs_dir / config['dir']
                if not asset_dir.exists():
                    continue
                
                logger.info(f"Processing {asset_type} assets...")
                
                # 获取所有匹配的文件
                files = []
                exts = config['ext'] if isinstance(config['ext'], tuple) else (config['ext'],)
                for ext in exts:
                    files.extend(asset_dir.rglob(f"*{ext}"))
                
                # 并行处理文件
                with ThreadPoolExecutor() as executor:
                    executor.map(self._process_file, files)
            
            # 保存manifest
            self._save_manifest()
            
            # 更新HTML文件中的资源引用
            self._update_html_references()
            
        except Exception as e:
            logger.error(f"Asset processing failed: {e}")
            raise BuildError("Failed to process assets") from e
    
    def _process_file(self, file_path: Path) -> None:
        """处理单个文件"""
        try:
            # 计算文件哈希
            file_hash = self._compute_file_hash(file_path)
            
            # 生成版本化的文件名
            versioned_name = self._get_versioned_name(file_path, file_hash)
            versioned_path = file_path.parent / versioned_name
            
            # 如果文件已经存在且哈希匹配，跳过
            if versioned_path.exists():
                old_hash = self.manifest.get(str(file_path.relative_to(self.docs_dir)))
                if old_hash == file_hash:
                    return
            
            # 复制文件到新的版本化路径
            import shutil
            shutil.copy2(file_path, versioned_path)
            
            # 更新manifest
            rel_path = str(file_path.relative_to(self.docs_dir))
            self.manifest[rel_path] = file_hash
            
            logger.info(f"Processed asset: {rel_path}")
            
        except Exception as e:
            logger.error(f"Failed to process {file_path}: {e}")
    
    def _compute_file_hash(self, file_path: Path) -> str:
        """计算文件的哈希值"""
        hasher = hashlib.sha1()
        with file_path.open('rb') as f:
            for chunk in iter(lambda: f.read(4096), b''):
                hasher.update(chunk)
        return hasher.hexdigest()[:8]
    
    def _get_versioned_name(self, file_path: Path, file_hash: str) -> str:
        """生成带版本的文件名"""
        return f"{file_path.stem}.{file_hash}{file_path.suffix}"
    
    def _save_manifest(self) -> None:
        """保存资源清单"""
        try:
            self.manifest_file.parent.mkdir(parents=True, exist_ok=True)
            self.manifest_file.write_text(
                json.dumps(self.manifest, indent=2, sort_keys=True)
            )
        except Exception as e:
            logger.error(f"Failed to save manifest: {e}")
            raise
    
    def _update_html_references(self) -> None:
        """更新HTML文件中的资源引用"""
        try:
            html_files = list(self.docs_dir.rglob('*.html'))
            
            for html_file in html_files:
                content = html_file.read_text()
                
                # 更新资源引用
                for rel_path, file_hash in self.manifest.items():
                    # 构建正则表达式
                    path_pattern = re.escape(rel_path)
                    pattern = f'(href|src)=(["\']){path_pattern}(["\'])'
                    
                    # 构建替换字符串
                    versioned_path = str(Path(rel_path).parent / 
                                      self._get_versioned_name(Path(rel_path), file_hash))
                    replacement = f'\\1=\\2{versioned_path}\\3'
                    
                    # 替换引用
                    content = re.sub(pattern, replacement, content)
                
                # 保存更新后的文件
                html_file.write_text(content)
                logger.info(f"Updated asset references in {html_file}")
                
        except Exception as e:
            logger.error(f"Failed to update HTML references: {e}")
            raise
    
    def get_versioned_path(self, rel_path: str) -> Optional[str]:
        """获取资源的版本化路径"""
        file_hash = self.manifest.get(rel_path)
        if file_hash:
            path = Path(rel_path)
            return str(path.parent / self._get_versioned_name(path, file_hash))
        return None

def main():
    """主入口函数"""
    import argparse
    parser = argparse.ArgumentParser(description='Process static assets')
    parser.add_argument('root_dir', type=Path, help='Project root directory')
    args = parser.parse_args()
    
    try:
        manager = AssetManager(args.root_dir)
        manager.process_assets()
        logger.info("Asset processing completed successfully")
    except Exception as e:
        logger.error(f"Asset processing failed: {e}")
        raise SystemExit(1)

if __name__ == '__main__':
    main()
