# GitHub Actions 工作流

## 当前状态

所有工作流文件已被暂时禁用，存放在 `disabled/` 目录中。

## 禁用的工作流

- `build.yml` - 站点构建和部署
- `lint.yml` - 代码质量检查
- `validate.yml` - 内容验证

## 重新启用

要重新启用工作流，请将文件从 `disabled/` 目录移回 `workflows/` 目录：

```bash
mv .github/workflows/disabled/*.yml .github/workflows/
```

## 禁用原因

- 开发阶段暂时不需要自动构建
- 减少不必要的 CI/CD 资源消耗
- 手动控制构建时机

## 手动构建

如果需要构建站点，可以使用以下命令：

```bash
python tools/build_manager.py --full
```
