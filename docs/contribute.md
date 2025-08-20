# Contribute | 参与指南（中英）

> 健康提示：本项目仅用于记录与交流，不鼓励使用烟草。

## 最快上手｜Quick Start
- 一句话投稿（推荐新手）
  - 打开 One-liner 表单，选择分类，写一句话即可提交。
- 标准表单投稿（结构化更完整）
  - 使用 Tasting 表单，按字段填写：品牌/产品/香气/风味/评分等。

不访问网站首页也能投稿（直达链接）：
- 一句话投稿（One-liner）：`issues/new?template=quick.yml`
- 标准表单（Tasting）：`issues/new?template=tasting.yml`
把以上两个链接替换成仓库地址前缀即可，例如：
`https://github.com/<owner>/<repo>/issues/new?template=quick.yml`

提交后，机器人会：
- 自动把 Issue 转成 `notes/<category>/YYYY-MM-DD-*.md`；
- 更新索引与网站数据；
- 在 Issue 回帖附上笔记链接，并自动关闭。

## 模板｜Templates
- cigars: `notes/cigars/TEMPLATE_cigars_bilingual.md`
- cigarettes: `notes/cigarettes/TEMPLATE_cigarettes_bilingual.md`
- pipe: `notes/pipe/TEMPLATE_pipe_bilingual.md`
- ryo: `notes/ryo/TEMPLATE_ryo_bilingual.md`
- snus: `notes/snus/TEMPLATE_snus_bilingual.md`
- ecig: `notes/ecig/TEMPLATE_ecig_bilingual.md`

## 命令行脚本｜CLI Script
可用脚本快速生成笔记骨架（文件名含日期和 slug）：

```bash
python tools/new_note.py <category> "<title>" --date YYYY-MM-DD
# 例：
python tools/new_note.py cigarettes "Marlboro Red" --date 2025-08-21
```

## 写作建议｜Writing Tips
- 以要点为主，短句更清晰；
- 写明前段/中段/尾段（或 1/3、2/3、3/3）风味变化；
- 记录影响变量：存储、环境、器具、抽吸节奏；
- 可加配饮、评分与价格，便于参考。

## 行为与健康｜Conduct & Health
- 友善、尊重事实，避免夸张与引战；
- 本项目不鼓励使用烟草，仅用于记录与交流；
- 详见 `CODE_OF_CONDUCT.md`。

## 可持续｜Sustainability
- 这是一个“为爱发电”的项目，当前预算有限；
- 先做个人长期记录，其后再共享给朋友与路人；
- 赞助会用于脚本/站点维护与基础成本；
- 详见 `docs/sustainability.md`。
