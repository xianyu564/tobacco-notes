#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
增强内容验证工具
Comprehensive content validation for tobacco notes repository
"""

import json
import yaml
import re
import os
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Tuple, Optional
import hashlib
from urllib.parse import urlparse


class ContentValidator:
    """综合内容验证器"""
    
    def __init__(self, repo_root: Path = None):
        self.repo_root = repo_root or Path(__file__).resolve().parents[1]
        self.notes_dir = self.repo_root / 'notes'
        self.docs_dir = self.repo_root / 'docs'
        self.errors = []
        self.warnings = []
        self.stats = {
            'total_notes': 0,
            'valid_notes': 0,
            'categories': {},
            'validation_score': 0
        }
        
        # 验证规则配置
        self.validation_rules = {
            'required_fields': ['title', 'category', 'date'],
            'optional_fields': ['brand', 'rating', 'description', 'tags', 'price'],
            'categories': ['cigars', 'cigarettes', 'pipe', 'ryo', 'snus', 'ecig'],
            'date_format': r'^\d{4}-\d{2}-\d{2}$',
            'filename_format': r'^\d{4}-\d{2}-\d{2}-[a-z0-9\-]+\.md$',
            'rating_range': (0, 10),
            'max_title_length': 100,
            'max_description_length': 5000,
            'min_description_length': 50
        }
    
    def validate_all_content(self) -> Dict:
        """验证所有内容"""
        print("🚀 开始综合内容验证...")
        print("=" * 50)
        
        # 验证笔记内容
        self._validate_notes()
        
        # 验证图片资源
        self._validate_images()
        
        # 验证数据文件
        self._validate_data_files()
        
        # 验证配置文件
        self._validate_config_files()
        
        # 计算验证得分
        self._calculate_validation_score()
        
        # 生成报告
        return self._generate_report()
    
    def _validate_notes(self):
        """验证笔记内容"""
        print("\n📝 验证笔记内容...")
        
        if not self.notes_dir.exists():
            self.errors.append("笔记目录不存在")
            return
        
        for category_dir in self.notes_dir.iterdir():
            if not category_dir.is_dir() or category_dir.name.startswith('.'):
                continue
                
            if category_dir.name not in self.validation_rules['categories']:
                self.warnings.append(f"未知的分类目录: {category_dir.name}")
                continue
            
            self.stats['categories'][category_dir.name] = 0
            self._validate_category_notes(category_dir)
    
    def _validate_category_notes(self, category_dir: Path):
        """验证分类目录下的笔记"""
        category = category_dir.name
        
        for note_file in category_dir.glob('*.md'):
            if note_file.name.startswith('TEMPLATE_'):
                continue
                
            self.stats['total_notes'] += 1
            
            # 验证文件名格式
            if not re.match(self.validation_rules['filename_format'], note_file.name):
                self.errors.append(f"文件名格式错误: {note_file}")
                continue
            
            # 验证笔记内容
            if self._validate_note_content(note_file, category):
                self.stats['valid_notes'] += 1
                self.stats['categories'][category] += 1
    
    def _validate_note_content(self, note_file: Path, category: str) -> bool:
        """验证单个笔记内容"""
        try:
            with open(note_file, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # 解析前端matter
            frontmatter, body = self._parse_frontmatter(content)
            
            if not frontmatter:
                self.errors.append(f"缺少frontmatter: {note_file}")
                return False
            
            # 验证必需字段
            for field in self.validation_rules['required_fields']:
                if field not in frontmatter:
                    self.errors.append(f"缺少必需字段 {field}: {note_file}")
                    return False
            
            # 验证分类匹配
            if frontmatter.get('category') != category:
                self.errors.append(f"分类不匹配: {note_file}")
                return False
            
            # 验证日期格式
            date_str = frontmatter.get('date', '')
            if not re.match(self.validation_rules['date_format'], str(date_str)):
                self.errors.append(f"日期格式错误: {note_file}")
                return False
            
            # 验证日期与文件名匹配
            file_date = note_file.name[:10]
            if str(date_str) != file_date:
                self.errors.append(f"日期与文件名不匹配: {note_file}")
                return False
            
            # 验证标题长度
            title = frontmatter.get('title', '')
            if len(title) > self.validation_rules['max_title_length']:
                self.warnings.append(f"标题过长: {note_file}")
            
            # 验证评分
            rating = frontmatter.get('rating')
            if rating is not None:
                try:
                    rating_val = float(rating)
                    min_rating, max_rating = self.validation_rules['rating_range']
                    if not (min_rating <= rating_val <= max_rating):
                        self.errors.append(f"评分超出范围: {note_file}")
                        return False
                except (ValueError, TypeError):
                    self.errors.append(f"评分格式错误: {note_file}")
                    return False
            
            # 验证内容长度
            if body:
                body_length = len(body.strip())
                if body_length > self.validation_rules['max_description_length']:
                    self.warnings.append(f"内容过长: {note_file}")
                elif body_length < self.validation_rules['min_description_length']:
                    self.warnings.append(f"内容过短: {note_file}")
            
            # 验证特定分类的字段
            self._validate_category_specific_fields(frontmatter, category, note_file)
            
            return True
            
        except Exception as e:
            self.errors.append(f"读取文件失败 {note_file}: {str(e)}")
            return False
    
    def _parse_frontmatter(self, content: str) -> Tuple[Optional[Dict], str]:
        """解析frontmatter"""
        if not content.startswith('---'):
            return None, content
        
        try:
            parts = content.split('---', 2)
            if len(parts) >= 3:
                frontmatter = yaml.safe_load(parts[1])
                body = parts[2].strip()
                return frontmatter, body
        except yaml.YAMLError as e:
            self.errors.append(f"YAML解析错误: {str(e)}")
        
        return None, content
    
    def _validate_category_specific_fields(self, frontmatter: Dict, category: str, note_file: Path):
        """验证分类特定字段"""
        # 雪茄特定验证
        if category == 'cigars':
            size = frontmatter.get('size')
            if size and not re.match(r'^\d+x\d+$', str(size)):
                self.warnings.append(f"雪茄尺寸格式建议使用 '长度x环径': {note_file}")
        
        # 香烟特定验证
        elif category == 'cigarettes':
            pack_type = frontmatter.get('pack_type')
            if pack_type and pack_type not in ['soft', 'hard', 'box']:
                self.warnings.append(f"包装类型建议使用标准值: {note_file}")
        
        # 烟斗特定验证
        elif category == 'pipe':
            tobacco_type = frontmatter.get('tobacco_type')
            if tobacco_type and tobacco_type not in ['virginia', 'burley', 'oriental', 'latakia', 'perique', 'aromatic']:
                self.warnings.append(f"烟草类型建议使用标准值: {note_file}")
    
    def _validate_images(self):
        """验证图片资源"""
        print("\n🖼️  验证图片资源...")
        
        images_dir = self.docs_dir / 'images'
        if not images_dir.exists():
            self.warnings.append("图片目录不存在")
            return
        
        for img_file in images_dir.rglob('*'):
            if img_file.is_file():
                self._validate_single_image(img_file)
    
    def _validate_single_image(self, img_file: Path):
        """验证单个图片文件"""
        # 检查文件扩展名
        valid_extensions = {'.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg'}
        if img_file.suffix.lower() not in valid_extensions:
            self.warnings.append(f"不推荐的图片格式: {img_file}")
        
        # 检查文件大小
        try:
            file_size = img_file.stat().st_size
            if file_size > 2 * 1024 * 1024:  # 2MB
                self.warnings.append(f"图片文件过大 (>2MB): {img_file}")
        except OSError:
            self.errors.append(f"无法读取图片文件: {img_file}")
    
    def _validate_data_files(self):
        """验证数据文件"""
        print("\n📊 验证数据文件...")
        
        data_dir = self.docs_dir / 'data'
        if not data_dir.exists():
            self.warnings.append("数据目录不存在")
            return
        
        # 验证JSON数据文件
        for json_file in data_dir.glob('*.json'):
            self._validate_json_file(json_file)
    
    def _validate_json_file(self, json_file: Path):
        """验证JSON文件"""
        try:
            with open(json_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            # 验证特定的数据文件
            if json_file.name == 'contributors.json':
                self._validate_contributors_data(data, json_file)
            elif json_file.name == 'latest.json':
                self._validate_latest_data(data, json_file)
                
        except json.JSONDecodeError as e:
            self.errors.append(f"JSON格式错误 {json_file}: {str(e)}")
        except Exception as e:
            self.errors.append(f"读取JSON文件失败 {json_file}: {str(e)}")
    
    def _validate_contributors_data(self, data: Dict, file_path: Path):
        """验证贡献者数据"""
        required_fields = ['last_updated', 'total_contributors', 'contributors']
        for field in required_fields:
            if field not in data:
                self.errors.append(f"贡献者数据缺少字段 {field}: {file_path}")
        
        contributors = data.get('contributors', [])
        for i, contributor in enumerate(contributors):
            if not isinstance(contributor, dict):
                self.errors.append(f"贡献者数据格式错误 [索引{i}]: {file_path}")
                continue
            
            required_contributor_fields = ['username', 'display_name', 'total_contributions']
            for field in required_contributor_fields:
                if field not in contributor:
                    self.errors.append(f"贡献者缺少字段 {field} [索引{i}]: {file_path}")
    
    def _validate_latest_data(self, data: Dict, file_path: Path):
        """验证最新笔记数据"""
        if not isinstance(data, list):
            self.errors.append(f"最新笔记数据应为数组: {file_path}")
            return
        
        for i, note in enumerate(data):
            if not isinstance(note, dict):
                self.errors.append(f"笔记数据格式错误 [索引{i}]: {file_path}")
                continue
            
            required_note_fields = ['title', 'category', 'date', 'slug']
            for field in required_note_fields:
                if field not in note:
                    self.errors.append(f"笔记缺少字段 {field} [索引{i}]: {file_path}")
    
    def _validate_config_files(self):
        """验证配置文件"""
        print("\n⚙️  验证配置文件...")
        
        # 验证.htaccess
        htaccess_file = self.docs_dir / '.htaccess'
        if htaccess_file.exists():
            self._validate_htaccess(htaccess_file)
        
        # 验证robots.txt
        robots_file = self.docs_dir / 'robots.txt'
        if robots_file.exists():
            self._validate_robots_txt(robots_file)
        
        # 验证sitemap.xml
        sitemap_file = self.docs_dir / 'sitemap.xml'
        if sitemap_file.exists():
            self._validate_sitemap(sitemap_file)
    
    def _validate_htaccess(self, htaccess_file: Path):
        """验证.htaccess配置"""
        try:
            with open(htaccess_file, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # 检查是否包含基本的重写规则
            if 'RewriteEngine' not in content:
                self.warnings.append(".htaccess缺少RewriteEngine配置")
            
            # 检查缓存配置
            if 'ExpiresByType' not in content and 'mod_expires' not in content:
                self.warnings.append(".htaccess缺少缓存配置")
                
        except Exception as e:
            self.errors.append(f"读取.htaccess失败: {str(e)}")
    
    def _validate_robots_txt(self, robots_file: Path):
        """验证robots.txt"""
        try:
            with open(robots_file, 'r', encoding='utf-8') as f:
                content = f.read()
            
            if 'User-agent:' not in content:
                self.warnings.append("robots.txt缺少User-agent声明")
            
            if 'Sitemap:' not in content:
                self.warnings.append("robots.txt缺少Sitemap指向")
                
        except Exception as e:
            self.errors.append(f"读取robots.txt失败: {str(e)}")
    
    def _validate_sitemap(self, sitemap_file: Path):
        """验证sitemap.xml"""
        try:
            import xml.etree.ElementTree as ET
            tree = ET.parse(sitemap_file)
            root = tree.getroot()
            
            # 检查是否有URL条目
            urls = root.findall('.//{http://www.sitemaps.org/schemas/sitemap/0.9}url')
            if len(urls) == 0:
                self.warnings.append("sitemap.xml没有URL条目")
            
            # 检查URL格式
            for url in urls[:5]:  # 检查前5个URL
                loc = url.find('.//{http://www.sitemaps.org/schemas/sitemap/0.9}loc')
                if loc is not None:
                    url_text = loc.text
                    if not url_text or not url_text.startswith(('http://', 'https://')):
                        self.errors.append(f"sitemap.xml包含无效URL: {url_text}")
                        
        except Exception as e:
            self.errors.append(f"验证sitemap.xml失败: {str(e)}")
    
    def _calculate_validation_score(self):
        """计算验证得分"""
        total_issues = len(self.errors) + len(self.warnings)
        max_score = 100
        
        if total_issues == 0:
            self.stats['validation_score'] = max_score
        else:
            # 错误权重更高
            error_weight = 10
            warning_weight = 2
            
            penalty = (len(self.errors) * error_weight) + (len(self.warnings) * warning_weight)
            self.stats['validation_score'] = max(0, max_score - penalty)
    
    def _generate_report(self) -> Dict:
        """生成验证报告"""
        print("\n" + "=" * 50)
        print("📊 验证报告")
        print("=" * 50)
        
        # 基本统计
        print(f"📝 总笔记数: {self.stats['total_notes']}")
        print(f"✅ 有效笔记数: {self.stats['valid_notes']}")
        print(f"🎯 验证得分: {self.stats['validation_score']}/100")
        
        # 分类统计
        if self.stats['categories']:
            print("\n📁 分类统计:")
            for category, count in self.stats['categories'].items():
                print(f"   {category}: {count} 篇")
        
        # 错误和警告
        if self.errors:
            print(f"\n❌ 错误 ({len(self.errors)}):")
            for error in self.errors[:10]:  # 只显示前10个错误
                print(f"   • {error}")
            if len(self.errors) > 10:
                print(f"   ... 还有 {len(self.errors) - 10} 个错误")
        
        if self.warnings:
            print(f"\n⚠️  警告 ({len(self.warnings)}):")
            for warning in self.warnings[:10]:  # 只显示前10个警告
                print(f"   • {warning}")
            if len(self.warnings) > 10:
                print(f"   ... 还有 {len(self.warnings) - 10} 个警告")
        
        # 总结
        if len(self.errors) == 0:
            if len(self.warnings) == 0:
                print("\n🎉 所有内容验证通过！")
            else:
                print("\n✅ 验证通过，但有一些建议改进的地方")
        else:
            print("\n❌ 验证失败，请修正错误后重试")
        
        return {
            'success': len(self.errors) == 0,
            'stats': self.stats,
            'errors': self.errors,
            'warnings': self.warnings,
            'timestamp': datetime.now().isoformat()
        }


def main():
    """主函数"""
    validator = ContentValidator()
    result = validator.validate_all_content()
    
    # 保存验证报告
    report_file = validator.repo_root / 'docs' / 'data' / 'validation-report.json'
    report_file.parent.mkdir(exist_ok=True)
    
    with open(report_file, 'w', encoding='utf-8') as f:
        json.dump(result, f, indent=2, ensure_ascii=False)
    
    print(f"\n📄 验证报告已保存到: {report_file}")
    
    return result['success']


if __name__ == '__main__':
    import sys
    success = main()
    sys.exit(0 if success else 1)