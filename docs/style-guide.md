# Style Guide | 写作格式指引

> 目标：让笔记结构清晰、可搜索、可复用；保持个人风格同时便于他人阅读与索引。
> 参考：Tobacco Appreciation 101 — 烟草赏析入门（Wiki）[链接](https://github.com/xianyu564/tobacco-notes/wiki/Tobacco-Appreciation-101-%E2%80%94-%E7%83%9F%E8%8D%89%E8%B5%8F%E6%9E%90%E5%85%A5%E9%97%A8#%E7%83%9F%E8%8D%89%E5%93%81%E7%B1%BB%E5%AF%BC%E8%A7%88)

## 1) 元数据（前言区）| Front matter
- 必填：
  - `date`：品鉴日期（YYYY-MM-DD格式）
  - `category`：品类
  - 标题字段（随品类不同，如 cigars 用 `product`，cigarettes 用 `brand` 等）
- 建议：
  - `rating`：评分
  - `pairing`：搭配建议
  - `tags`：标签
  - `origin/price`：产地/价格（如适用）
  - `images`：图片（可多张，需包含路径和说明）
  - `references`：参考链接（标题和URL）
- 作者与来源：系统会自动加入 `author` 与 `source_issue`（无需手填）

示例（cigars）：
```yaml
---
date: 2024-03-21
product: Partagas Serie D No.4
vitola: Robusto
origin: Cuba
price: 15 USD
rating: 88/100
pairing: Espresso
images:
  - path: images/cigars/partagas-d4-wrapper.jpg
    caption: Wrapper detail | 包装细节
  - path: images/cigars/partagas-d4-lighting.jpg
    caption: First light | 点燃瞬间
  - path: images/cigars/partagas-d4-ash.jpg
    caption: Ash at halfway | 中段烟灰
references:
  - title: Official Site | 官网
    url: https://www.habanos.com/en/productos/partagas/
  - title: Review | 评测
    url: https://halfwheel.com/partagas-serie-d-no-4-2/
tags: [cigar, woody, spicy, medium-full]
---
```

## 2) 正文结构 | Body structure
- 标题层级：不必再写 `#` 大标题，直接用二级/粗体小节或要点
- 优先使用要点（短句），一行一个信息点：
  - 1/3｜2/3｜3/3（雪茄）
  - 前段｜中段｜尾段（纸烟/烟斗/手卷）
- 推荐的常用小节：
  - Appearance/Draw｜外观/通风
  - Aroma｜香气（冷香/点燃后/转折）
  - Flavor｜风味（甜/酸/苦/咸/鲜；木质/香料/坚果/果香/奶油等）
  - Strength & Body｜力度与厚度
  - Burn/Ash｜燃烧与灰
  - Construction｜做工（通风、燃线均匀、复燃）
  - Retrohale（如适用）
  - Verdict｜结论（1–3 句）

## 3) 双语风格 | Bilingual style
- 行内双语，先英后中或先中后英，保持一致（任选其一）：
  - 示例：`Appearance/Draw｜外观/通风：开头略紧，中段顺畅`
- 避免机器直译；如不好双语，可仅中文或英文，但术语尽量参考术语表

## 4) 各品类关键清单 | Category checklists
- cigars（雪茄）
  - vitola、抽阻力、燃线/灰、1/3–2/3–3/3、retrohale、温度控制
- cigarettes（纸烟）
  - 开包/前段/中段/尾段、烟气密度、燃速、余味
- pipe（烟斗草）
  - 叶种/切型、上/中/下段、温度/舌刺/湿度、余味
- ryo（手卷）
  - 烟丝/纸/过滤嘴、切丝/含水、击喉、燃速、余味
- snus（唇烟）
  - 1–10/20–40 分钟、滴漏、满足度、冷凉感/盐度
- ecig（电子烟）
  - 设备/线圈/烟油、入口/稳定期风味、喉感与余味

> 更多入门框架与对照思路，见 Wiki 入门指南与“品类导览”章节：[链接](https://github.com/xianyu564/tobacco-notes/wiki/Tobacco-Appreciation-101-%E2%80%94-%E7%83%9F%E8%8D%89%E8%B5%8F%E6%9E%90%E5%85%A5%E9%97%A8#%E7%83%9F%E8%8D%89%E5%93%81%E7%B1%BB%E5%AF%BC%E8%A7%88)

## 5) 评分与标签 | Ratings & tags
- 评分：
  - 雪茄：100 分制（80 = 合格，90 = 优秀，95+ = 尖峰）
  - 其他：1–5（半分可用）
- 标签：用 3–6 个关键词，建议从术语表挑选，便于聚合与搜索

## 6) 示例片段 | Examples
- 雪茄：
```md
**Appearance/Draw**：油润，开口略紧；点燃后通风稳定。
**1/3**：木质、坚果，微甜；
**2/3**：香料感增强，轻微可可；
**3/3**：力度上扬，余味干净。
**Burn/Ash**：燃线基本笔直，灰紧致。
**Retrohale**：胡椒与雪松。
**Verdict**：稳健均衡，适合 Espresso 搭配。
```

## 7) 不建议 | Avoid
- 大段散文式长段落；
- 过度主观但无信息量的词（如“不错”“还行”而无细节）；
- 生僻自造词影响他人理解（可在术语表补充定义后再用）。

## 8) 相关文档 | Related
- 模板：`notes/*/TEMPLATE_*.md`
- 术语表：`docs/glossary.md`
- 参与指南：`docs/contribute.md`
- 入门与方法论（Wiki）：[Tobacco Appreciation 101](https://github.com/xianyu564/tobacco-notes/wiki/Tobacco-Appreciation-101-%E2%80%94-%E7%83%9F%E8%8D%89%E8%B5%8F%E6%9E%90%E5%85%A5%E9%97%A8#%E7%83%9F%E8%8D%89%E5%93%81%E7%B1%BB%E5%AF%BC%E8%A7%88)
