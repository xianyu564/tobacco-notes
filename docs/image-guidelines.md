# 图片上传与管理指南 | Image Guidelines

> 本指南说明如何在品鉴笔记中添加和管理图片，以确保图片资源的统一性和可维护性。

## 1) 图片存储结构 | Directory Structure

图片文件应存储在 `images/` 目录下，按品类分类：

```
images/
  ├── cigars/
  ├── cigarettes/
  ├── pipe/
  ├── ryo/
  ├── snus/
  └── ecig/
```

## 2) 文件命名规范 | File Naming

- 使用小写字母、数字和连字符
- 格式：`品牌名-产品名-类型.jpg`
- 示例：
  - `partagas-d4-wrapper.jpg`
  - `dunhill-switch-pack.jpg`
  - `mac-baren-vanilla-tin.jpg`

## 3) 图片要求 | Image Requirements

- 格式：优先使用 JPG（照片）或 PNG（包装、细节）
- 分辨率：
  - 最小：800px（较短边）
  - 最大：2000px（较长边）
- 文件大小：单张不超过 2MB
- 图片质量：
  - 光线充足，对焦清晰
  - 避免使用滤镜
  - 保持适当对比度

## 4) 前言区使用方法 | Front Matter Usage

在笔记的前言区使用 `images` 字段：

```yaml
images:
  - path: images/cigars/partagas-d4-wrapper.jpg
    caption: 包装细节
  - path: images/cigars/partagas-d4-lighting.jpg
    caption: 点燃瞬间
```

## 5) 图片说明 | Image Captions

- 使用简短但具体的说明文字
- 双语说明格式：`英文 | 中文`
- 示例：
  - `Wrapper detail | 包装细节`
  - `First light | 点燃瞬间`
  - `Ash at halfway | 中段烟灰`

## 6) 最佳实践 | Best Practices

- 每篇笔记建议 2-4 张图片
- 关键图片类型：
  - 包装/外观
  - 点燃过程
  - 特殊细节
  - 燃烧/烟灰
- 避免：
  - 模糊或曝光不当的照片
  - 与品鉴无关的环境图片
  - 过度修图或艺术处理

## 7) 图片版权 | Copyright

- 只使用自己拍摄的图片
- 如需使用他人图片，必须：
  - 获得明确授权
  - 在 `caption` 中注明来源
  - 确保符合项目的 CC BY 4.0 许可

## 8) 技术说明 | Technical Notes

- 图片会在构建时自动优化
- 支持的图片格式：jpg、jpeg、png、webp
- 移动端会自动加载较小的图片版本
- 建议使用图片压缩工具进行预处理

## 9) 常见问题 | FAQ

Q: 如何处理大尺寸图片？  
A: 使用图片编辑工具调整尺寸，或使用在线压缩服务。

Q: 是否支持 GIF 动图？  
A: 不建议使用，除非展示特定的动态效果。

Q: 如何处理 EXIF 数据？  
A: 上传前建议清除 EXIF 数据以保护隐私。
