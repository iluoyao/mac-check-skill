# 测试矩阵

## 自动夹具

- 所有提交到仓库的 Probe 输入必须是人工构造的合成数据，并保存在 `synthetic-probes/`；真实运行产生的任何 `raw/` 目录不得作为测试夹具提交。
- 正常 Apple Silicon MacBook：6 个基础分组有结果，Session HTML 可构建。
- 部分 Probe 失败：其他分组继续，失败项为 `UNKNOWN`。
- 桌面 Mac：电池、内建键盘、Touch ID/触控板按能力显示 `UNSUPPORTED`。
- 能力规则：覆盖 Apple Silicon/Intel 笔记本、Mac mini、iMac、Mac Studio、Mac Pro，以及未来未知便携型号的保守回退。
- 未完整匹配接口布局：不得把未知能力当作存在，页面必须提供“其他物理接口”补充检查项。
- 序列号冲突：设备身份产生 `BLOCKER`。
- 非 Darwin Runtime、关键工具缺失、关键身份失败。
- HTML 注入字符串包含 `</script>` 时不能逃逸数据块。

## 页面

- 单文件、无 CDN、无 `fetch`、无 Result Token、`connect-src 'none'`。
- Sidebar/Overview、6 个基础页面、8 个硬件页面、Guided Flow、重测。
- 键盘事件、屏幕全屏、音频、媒体权限拒绝、Touch ID 引导、触控板、接口跳过。
- `localStorage` 可用/不可用、刷新恢复、Markdown/PDF/PNG 直接下载。
- 960×680、1440×900、浅色/深色和 reduced motion。

## 真机

兼容 Agent 桌面宿主至少验证一次：完整检查触发 → 权限 → 采集 → 自动打开 → 完成硬件 → 下载 Markdown/PDF/PNG。打包后脚本即使没有可执行位也必须可以通过显式 zsh 正常运行。自动测试不能替代实际声画、Touch ID、接口和不同机型能力验证。
