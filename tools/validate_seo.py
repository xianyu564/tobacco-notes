#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
SEO和结构化数据验证工具
SEO and Structured Data Validation Tool
"""

import json
import re
import requests
from pathlib import Path
from urllib.parse import urljoin, urlparse
import xml.etree.ElementTree as ET
from datetime import datetime
from typing import Dict, List, Optional


class SEOValidator:
    """SEO验证器"""
    
    def __init__(self, base_url: str = "https://xianyu564.github.io/tobacco-notes", repo_root: Path = None):
        self.base_url = base_url.rstrip('/')
        self.repo_root = repo_root or Path(__file__).resolve().parents[1]
        self.docs_dir = self.repo_root / 'docs'
        self.errors = []
        self.warnings = []
        self.suggestions = []
        
        # SEO验证规则
        self.seo_rules = {
            'title_length': (30, 60),
            'description_length': (120, 160),
            'h1_count': (1, 1),
            'alt_text_length': (5, 125),
            'url_length': (0, 100),
            'keyword_density': (0.01, 0.03)
        }
    
    def validate_all_seo(self) -> Dict:
        """验证所有SEO要素"""
        print("🚀 开始SEO综合验证...")
        print("=" * 50)
        
        # 验证页面SEO
        self._validate_page_seo()
        
        # 验证结构化数据
        self._validate_structured_data()
        
        # 验证站点地图
        self._validate_sitemap()
        
        # 验证robots.txt
        self._validate_robots()
        
        # 验证社交媒体元数据
        self._validate_social_meta()
        
        # 验证技术SEO
        self._validate_technical_seo()
        
        # 生成报告
        return self._generate_seo_report()
    
    def _validate_page_seo(self):
        """验证页面SEO元素"""
        print("\n📄 验证页面SEO...")
        
        index_file = self.docs_dir / 'index.html'
        if not index_file.exists():
            self.errors.append("主页文件不存在")
            return
        
        try:
            with open(index_file, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # 验证title标签
            title_match = re.search(r'<title[^>]*>(.*?)</title>', content, re.IGNORECASE | re.DOTALL)
            if title_match:
                title = title_match.group(1).strip()
                title_length = len(title)
                min_len, max_len = self.seo_rules['title_length']
                
                if title_length < min_len:
                    self.warnings.append(f"页面标题过短 ({title_length}字符，建议{min_len}-{max_len}字符)")
                elif title_length > max_len:
                    self.warnings.append(f"页面标题过长 ({title_length}字符，建议{min_len}-{max_len}字符)")
                else:
                    print(f"✅ 页面标题长度合适 ({title_length}字符)")
            else:
                self.errors.append("缺少页面标题")
            
            # 验证meta description
            desc_match = re.search(r'<meta[^>]*name=["\']description["\'][^>]*content=["\']([^"\']*)["\']', content, re.IGNORECASE)
            if desc_match:
                description = desc_match.group(1).strip()
                desc_length = len(description)
                min_len, max_len = self.seo_rules['description_length']
                
                if desc_length < min_len:
                    self.warnings.append(f"页面描述过短 ({desc_length}字符，建议{min_len}-{max_len}字符)")
                elif desc_length > max_len:
                    self.warnings.append(f"页面描述过长 ({desc_length}字符，建议{min_len}-{max_len}字符)")
                else:
                    print(f"✅ 页面描述长度合适 ({desc_length}字符)")
            else:
                self.errors.append("缺少meta description")
            
            # 验证H1标签
            h1_matches = re.findall(r'<h1[^>]*>(.*?)</h1>', content, re.IGNORECASE | re.DOTALL)
            h1_count = len(h1_matches)
            
            if h1_count == 0:
                self.errors.append("缺少H1标签")
            elif h1_count > 1:
                self.warnings.append(f"存在多个H1标签 ({h1_count}个，建议只有1个)")
            else:
                print("✅ H1标签数量合适")
            
            # 验证语言声明
            if 'lang=' not in content:
                self.warnings.append("缺少页面语言声明")
            
            # 验证viewport元标签
            if 'viewport' not in content:
                self.warnings.append("缺少viewport元标签")
            
            # 验证字符编码
            if 'charset=' not in content:
                self.warnings.append("缺少字符编码声明")
                
        except Exception as e:
            self.errors.append(f"读取主页文件失败: {str(e)}")
    
    def _validate_structured_data(self):
        """验证结构化数据"""
        print("\n🏗️  验证结构化数据...")
        
        index_file = self.docs_dir / 'index.html'
        if not index_file.exists():
            return
        
        try:
            with open(index_file, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # 检查JSON-LD结构化数据
            jsonld_pattern = r'<script[^>]*type=["\']application/ld\+json["\'][^>]*>(.*?)</script>'
            jsonld_matches = re.findall(jsonld_pattern, content, re.IGNORECASE | re.DOTALL)
            
            if jsonld_matches:
                for i, jsonld_content in enumerate(jsonld_matches):
                    try:
                        data = json.loads(jsonld_content.strip())
                        self._validate_jsonld_schema(data, i)
                    except json.JSONDecodeError as e:
                        self.errors.append(f"JSON-LD格式错误 [{i}]: {str(e)}")
            else:
                self.suggestions.append("建议添加JSON-LD结构化数据以改善SEO")
            
            # 检查微数据
            if 'itemscope' in content:
                print("✅ 检测到微数据标记")
            
            # 检查Open Graph数据
            og_patterns = [
                r'<meta[^>]*property=["\']og:title["\']',
                r'<meta[^>]*property=["\']og:description["\']',
                r'<meta[^>]*property=["\']og:image["\']',
                r'<meta[^>]*property=["\']og:url["\']'
            ]
            
            og_count = sum(1 for pattern in og_patterns if re.search(pattern, content, re.IGNORECASE))
            if og_count == len(og_patterns):
                print("✅ Open Graph元数据完整")
            elif og_count > 0:
                self.warnings.append(f"Open Graph元数据不完整 ({og_count}/{len(og_patterns)}个)")
            else:
                self.suggestions.append("建议添加Open Graph元数据")
            
            # 检查Twitter Card数据
            twitter_patterns = [
                r'<meta[^>]*name=["\']twitter:card["\']',
                r'<meta[^>]*name=["\']twitter:title["\']',
                r'<meta[^>]*name=["\']twitter:description["\']'
            ]
            
            twitter_count = sum(1 for pattern in twitter_patterns if re.search(pattern, content, re.IGNORECASE))
            if twitter_count == len(twitter_patterns):
                print("✅ Twitter Card元数据完整")
            elif twitter_count > 0:
                self.warnings.append(f"Twitter Card元数据不完整 ({twitter_count}/{len(twitter_patterns)}个)")
            else:
                self.suggestions.append("建议添加Twitter Card元数据")
                
        except Exception as e:
            self.errors.append(f"验证结构化数据失败: {str(e)}")
    
    def _validate_jsonld_schema(self, data: Dict, index: int):
        """验证JSON-LD模式"""
        if isinstance(data, dict):
            # 验证@context
            if '@context' not in data:
                self.warnings.append(f"JSON-LD缺少@context [{index}]")
            
            # 验证@type
            if '@type' not in data:
                self.warnings.append(f"JSON-LD缺少@type [{index}]")
            else:
                schema_type = data['@type']
                print(f"✅ 检测到Schema.org类型: {schema_type}")
            
            # 针对不同类型的特定验证
            if data.get('@type') == 'WebSite':
                self._validate_website_schema(data, index)
            elif data.get('@type') == 'Article':
                self._validate_article_schema(data, index)
            elif data.get('@type') == 'Review':
                self._validate_review_schema(data, index)
    
    def _validate_website_schema(self, data: Dict, index: int):
        """验证Website模式"""
        required_fields = ['name', 'url']
        for field in required_fields:
            if field not in data:
                self.warnings.append(f"Website模式缺少{field}字段 [{index}]")
        
        # 验证searchAction
        if 'potentialAction' in data:
            action = data['potentialAction']
            if isinstance(action, dict) and action.get('@type') == 'SearchAction':
                if 'target' not in action:
                    self.warnings.append(f"SearchAction缺少target字段 [{index}]")
                if 'query-input' not in action:
                    self.warnings.append(f"SearchAction缺少query-input字段 [{index}]")
    
    def _validate_article_schema(self, data: Dict, index: int):
        """验证Article模式"""
        required_fields = ['headline', 'author', 'datePublished']
        for field in required_fields:
            if field not in data:
                self.warnings.append(f"Article模式缺少{field}字段 [{index}]")
        
        # 验证图片
        if 'image' not in data:
            self.suggestions.append(f"Article模式建议添加image字段 [{index}]")
    
    def _validate_review_schema(self, data: Dict, index: int):
        """验证Review模式"""
        required_fields = ['itemReviewed', 'reviewRating', 'author']
        for field in required_fields:
            if field not in data:
                self.warnings.append(f"Review模式缺少{field}字段 [{index}]")
        
        # 验证评分
        if 'reviewRating' in data:
            rating = data['reviewRating']
            if isinstance(rating, dict):
                if 'ratingValue' not in rating:
                    self.warnings.append(f"评分缺少ratingValue [{index}]")
                if 'bestRating' not in rating:
                    self.suggestions.append(f"评分建议添加bestRating [{index}]")
    
    def _validate_sitemap(self):
        """验证站点地图"""
        print("\n🗺️  验证站点地图...")
        
        sitemap_file = self.docs_dir / 'sitemap.xml'
        if not sitemap_file.exists():
            self.warnings.append("站点地图不存在")
            return
        
        try:
            tree = ET.parse(sitemap_file)
            root = tree.getroot()
            
            # 检查命名空间
            if 'http://www.sitemaps.org/schemas/sitemap/0.9' not in root.tag:
                self.warnings.append("站点地图命名空间不正确")
            
            # 检查URL数量
            urls = root.findall('.//{http://www.sitemaps.org/schemas/sitemap/0.9}url')
            url_count = len(urls)
            
            if url_count == 0:
                self.errors.append("站点地图中没有URL")
            elif url_count > 50000:
                self.warnings.append(f"站点地图URL过多 ({url_count})，建议分割")
            else:
                print(f"✅ 站点地图包含{url_count}个URL")
            
            # 验证URL格式
            for i, url in enumerate(urls[:10]):  # 只检查前10个
                loc = url.find('.//{http://www.sitemaps.org/schemas/sitemap/0.9}loc')
                if loc is not None:
                    url_text = loc.text
                    if not url_text.startswith(('http://', 'https://')):
                        self.errors.append(f"站点地图包含无效URL: {url_text}")
                    
                    # 检查lastmod格式
                    lastmod = url.find('.//{http://www.sitemaps.org/schemas/sitemap/0.9}lastmod')
                    if lastmod is not None:
                        lastmod_text = lastmod.text
                        try:
                            datetime.fromisoformat(lastmod_text.replace('Z', '+00:00'))
                        except ValueError:
                            self.warnings.append(f"lastmod日期格式不正确: {lastmod_text}")
                            
        except Exception as e:
            self.errors.append(f"验证站点地图失败: {str(e)}")
    
    def _validate_robots(self):
        """验证robots.txt"""
        print("\n🤖 验证robots.txt...")
        
        robots_file = self.docs_dir / 'robots.txt'
        if not robots_file.exists():
            self.warnings.append("robots.txt文件不存在")
            return
        
        try:
            with open(robots_file, 'r', encoding='utf-8') as f:
                content = f.read()
            
            lines = content.strip().split('\n')
            
            # 检查User-agent声明
            if not any(line.strip().startswith('User-agent:') for line in lines):
                self.errors.append("robots.txt缺少User-agent声明")
            
            # 检查Sitemap指向
            sitemap_lines = [line for line in lines if line.strip().startswith('Sitemap:')]
            if not sitemap_lines:
                self.warnings.append("robots.txt缺少Sitemap指向")
            else:
                for line in sitemap_lines:
                    sitemap_url = line.split(':', 1)[1].strip()
                    if not sitemap_url.startswith(('http://', 'https://')):
                        self.warnings.append(f"Sitemap URL格式不正确: {sitemap_url}")
            
            # 检查是否有过度限制
            disallow_all = any(line.strip() == 'Disallow: /' for line in lines)
            if disallow_all:
                self.warnings.append("robots.txt禁止了所有爬虫访问")
            
            print("✅ robots.txt基本格式正确")
            
        except Exception as e:
            self.errors.append(f"验证robots.txt失败: {str(e)}")
    
    def _validate_social_meta(self):
        """验证社交媒体元数据"""
        print("\n📱 验证社交媒体元数据...")
        
        index_file = self.docs_dir / 'index.html'
        if not index_file.exists():
            return
        
        try:
            with open(index_file, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # 检查favicon
            favicon_patterns = [
                r'<link[^>]*rel=["\']icon["\']',
                r'<link[^>]*rel=["\']shortcut icon["\']',
                r'<link[^>]*rel=["\']apple-touch-icon["\']'
            ]
            
            favicon_count = sum(1 for pattern in favicon_patterns if re.search(pattern, content, re.IGNORECASE))
            if favicon_count > 0:
                print(f"✅ 检测到favicon ({favicon_count}个)")
            else:
                self.warnings.append("缺少favicon")
            
            # 检查主题色
            theme_color_pattern = r'<meta[^>]*name=["\']theme-color["\']'
            if re.search(theme_color_pattern, content, re.IGNORECASE):
                print("✅ 设置了主题色")
            else:
                self.suggestions.append("建议设置theme-color")
            
            # 检查manifest
            manifest_pattern = r'<link[^>]*rel=["\']manifest["\']'
            if re.search(manifest_pattern, content, re.IGNORECASE):
                print("✅ 检测到Web App Manifest")
            else:
                self.suggestions.append("建议添加Web App Manifest")
                
        except Exception as e:
            self.errors.append(f"验证社交媒体元数据失败: {str(e)}")
    
    def _validate_technical_seo(self):
        """验证技术SEO"""
        print("\n⚙️  验证技术SEO...")
        
        # 检查HTTPS重定向配置
        htaccess_file = self.docs_dir / '.htaccess'
        if htaccess_file.exists():
            try:
                with open(htaccess_file, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                # 检查HTTPS重定向
                if 'https' in content.lower() or 'ssl' in content.lower():
                    print("✅ 检测到HTTPS相关配置")
                else:
                    self.suggestions.append("建议配置HTTPS重定向")
                
                # 检查压缩配置
                if 'gzip' in content.lower() or 'deflate' in content.lower():
                    print("✅ 检测到压缩配置")
                else:
                    self.suggestions.append("建议启用Gzip压缩")
                
                # 检查缓存配置
                if 'expires' in content.lower() or 'cache-control' in content.lower():
                    print("✅ 检测到缓存配置")
                else:
                    self.suggestions.append("建议配置浏览器缓存")
                    
            except Exception as e:
                self.warnings.append(f"读取.htaccess失败: {str(e)}")
        
        # 检查页面加载速度相关文件
        critical_files = ['styles.css', 'index.html']
        for filename in critical_files:
            file_path = self.docs_dir / filename
            if file_path.exists():
                file_size = file_path.stat().st_size
                if filename.endswith('.css') and file_size > 50 * 1024:
                    self.warnings.append(f"CSS文件较大: {filename} ({file_size // 1024}KB)")
                elif filename.endswith('.js') and file_size > 100 * 1024:
                    self.warnings.append(f"JavaScript文件较大: {filename} ({file_size // 1024}KB)")
    
    def _generate_seo_report(self) -> Dict:
        """生成SEO报告"""
        total_issues = len(self.errors) + len(self.warnings)
        max_score = 100
        
        if total_issues == 0:
            seo_score = max_score
        else:
            # 错误权重更高
            error_weight = 15
            warning_weight = 5
            
            penalty = (len(self.errors) * error_weight) + (len(self.warnings) * warning_weight)
            seo_score = max(0, max_score - penalty)
        
        report = {
            'timestamp': datetime.now().isoformat(),
            'score': seo_score,
            'summary': {
                'errors': len(self.errors),
                'warnings': len(self.warnings),
                'suggestions': len(self.suggestions)
            },
            'details': {
                'errors': self.errors,
                'warnings': self.warnings,
                'suggestions': self.suggestions
            },
            'recommendations': self._generate_seo_recommendations()
        }
        
        self._log_seo_report(report)
        return report
    
    def _generate_seo_recommendations(self) -> List[Dict]:
        """生成SEO建议"""
        recommendations = []
        
        if any('标题' in error for error in self.errors + self.warnings):
            recommendations.append({
                'priority': 'high',
                'category': '页面标题',
                'suggestion': '优化页面标题：确保长度适中(30-60字符)，包含关键词，描述准确'
            })
        
        if any('description' in error.lower() for error in self.errors + self.warnings):
            recommendations.append({
                'priority': 'high',
                'category': 'Meta描述',
                'suggestion': '优化Meta描述：长度120-160字符，包含关键词，吸引点击'
            })
        
        if any('结构化数据' in suggestion for suggestion in self.suggestions):
            recommendations.append({
                'priority': 'medium',
                'category': '结构化数据',
                'suggestion': '添加JSON-LD结构化数据：提升搜索引擎理解，获得富摘要'
            })
        
        if any('Open Graph' in warning for warning in self.warnings):
            recommendations.append({
                'priority': 'medium',
                'category': '社交媒体',
                'suggestion': '完善Open Graph和Twitter Card元数据：改善社交分享效果'
            })
        
        if any('压缩' in suggestion for suggestion in self.suggestions):
            recommendations.append({
                'priority': 'low',
                'category': '性能优化',
                'suggestion': '启用压缩和缓存：提升页面加载速度，改善用户体验'
            })
        
        return recommendations
    
    def _log_seo_report(self, report: Dict):
        """输出SEO报告"""
        print("\n" + "=" * 50)
        print("📊 SEO验证报告")
        print("=" * 50)
        
        print(f"🎯 SEO得分: {report['score']}/100")
        print(f"❌ 错误: {report['summary']['errors']}")
        print(f"⚠️ 警告: {report['summary']['warnings']}")
        print(f"💡 建议: {report['summary']['suggestions']}")
        
        if self.errors:
            print(f"\n❌ 错误 ({len(self.errors)}):")
            for error in self.errors[:10]:
                print(f"   • {error}")
            if len(self.errors) > 10:
                print(f"   ... 还有 {len(self.errors) - 10} 个错误")
        
        if self.warnings:
            print(f"\n⚠️ 警告 ({len(self.warnings)}):")
            for warning in self.warnings[:10]:
                print(f"   • {warning}")
            if len(self.warnings) > 10:
                print(f"   ... 还有 {len(self.warnings) - 10} 个警告")
        
        if self.suggestions:
            print(f"\n💡 建议 ({len(self.suggestions)}):")
            for suggestion in self.suggestions[:10]:
                print(f"   • {suggestion}")
            if len(self.suggestions) > 10:
                print(f"   ... 还有 {len(self.suggestions) - 10} 个建议")
        
        if report['recommendations']:
            print("\n🎯 优化建议:")
            for rec in report['recommendations']:
                priority_icon = {'high': '🔴', 'medium': '🟡', 'low': '🟢'}.get(rec['priority'], '⚪')
                print(f"   {priority_icon} {rec['category']}: {rec['suggestion']}")
        
        if report['score'] >= 90:
            print("\n🎉 SEO优化优秀！")
        elif report['score'] >= 70:
            print("\n✅ SEO优化良好，还有改进空间")
        else:
            print("\n⚠️ SEO需要显著改进")


def main():
    """主函数"""
    seo_validator = SEOValidator()
    result = seo_validator.validate_all_seo()
    
    # 保存SEO报告
    report_file = seo_validator.repo_root / 'docs' / 'data' / 'seo-report.json'
    report_file.parent.mkdir(exist_ok=True)
    
    with open(report_file, 'w', encoding='utf-8') as f:
        json.dump(result, f, indent=2, ensure_ascii=False)
    
    print(f"\n📄 SEO报告已保存到: {report_file}")
    
    return result['score'] >= 70


if __name__ == '__main__':
    import sys
    success = main()
    sys.exit(0 if success else 1)