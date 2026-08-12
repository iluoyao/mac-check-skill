# MacCheck Skill

[简体中文](README.md) | [English](README.en.md)

一款用于 Mac 检查的 Agent Skill。运行后会自动检测系统与设备信息，并打开本地页面，引导你完成键盘、屏幕、声音等硬件检查，最后生成可下载的验机报告。

## 能做什么

- 自动检查机型、系统、电池、存储、安全状态、网络和外设等信息。
- 引导检查键盘、屏幕、声音、麦克风、摄像头、Touch ID、触控板和接口。
- 自动识别不同 Mac 机型的硬件能力，并为未知新机型提供安全回退。
- 下载 Markdown、PDF 或 PNG 格式的验机报告。
- 支持简体中文和英文。

## 使用方法

下载或克隆本仓库，或在 Releases 中下载 `mac-check-skill.zip` 并解压，然后选择以下任一方式启动。

### 通过 Agent 使用

1. 在你使用的 Agent 桌面端（例如 WorkBuddy、Claude、Codex、Cursor 等），将本仓库作为 Skill 安装或导入。
2. 对 AI 说：

   > 帮我检查这台 Mac。

AI 会创建本次验机任务、自动完成系统检测，并打开硬件检测页面。按照页面引导完成检查后，即可直接下载报告。

### 通过终端使用

不使用 Agent 时，打开“终端”，进入解压后的项目根目录并运行：

```bash
cd /path/to/mac-check-skill
/bin/zsh ./scripts/run-full-check.sh --output-root ./mac-check-output --locale zh-CN
```

请将 `/path/to/mac-check-skill` 替换为实际项目路径。系统检测完成后会自动打开本地硬件检测页面；如果未能自动打开，请在终端输出中找到 `SESSION_HTML` 路径并手动打开。检测数据保存在项目根目录的 `mac-check-output` 中。

## 隐私说明

- 默认在本机离线运行，不主动上传检测数据。
- 系统检测均为只读操作，不会修改系统设置。
- 检测结果与报告保存在本地；公开分享前请留意序列号等设备信息。

## 使用提示

受浏览器和 macOS 权限限制，Touch ID、屏幕坏点、声音质量、触控板手感和接口物理状态等项目仍需用户配合确认。检测结果仅供参考，不替代 Apple 官方诊断。

## 致谢

本项目的部分产品思路与设计灵感来源于 [MacCheck](https://github.com/andyhuo520/MacCheck)，感谢原作者及贡献者的优秀工作。
