# GitHub Actions 工作流

## 当前状态

活跃工作流：
- `update-contributors.yml` - 每日更新贡献者数据 ✅

大部分工作流文件已被暂时禁用，存放在 `disabled/` 目录中。

## 禁用的工作流

- `build.yml` - 站点构建和部署
- `lint.yml` - 代码质量检查
- `validate.yml` - 内容验证
- `comprehensive-validation.yml` - 综合内容验证 (由于内容格式问题暂时禁用)
- `build-feeds.yml` - RSS/Atom 订阅构建
- `build-notes-index.yml` - 笔记索引构建
- `deploy-pages.yml` - GitHub Pages 部署
- `generate-assets.yml` - 静态资源生成
- `ingest-issues.yml` - Issue 转换为笔记
- `test.yml` - 测试工作流

## 重新启用

要重新启用工作流，请将文件从 `disabled/` 目录移回 `workflows/` 目录：

```bash
mv .github/workflows/disabled/WORKFLOW_NAME.yml .github/workflows/
```

注意：`comprehensive-validation.yml` 工作流在重新启用前需要先修复内容格式问题。

## 禁用原因

- **2025-09: 修复CI/CD错误通知** - 修复了 `update-contributors.yml` 的路径问题，禁用了因内容格式问题失败的 `comprehensive-validation.yml`
- 开发阶段暂时不需要自动构建
- 减少不必要的 CI/CD 资源消耗  
- 手动控制构建时机

## 手动构建

如果需要构建站点，可以使用以下命令：

```bash
python tools/build_manager.py --full
```
