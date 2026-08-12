---
name: mac-check-skill
description: 用于 Mac 验机。在当前 Mac 上进行一次完整的本地检测任务，可检测设备、系统、电池、安全、存储、网络等系统信息，以及内置页面工具可检测键盘、屏幕、声音、麦克风、摄像头、触控板和接口等信息。权限只读、数据本地、不联网，检测结果支持下载为 MD、PDF、PNG 报告。适用于 Mac 日常健康检查、新机或整备机验收、维修后复检、购买或出售前检查及故障排查。检测结果仅反映可观察到的状态，不构成 Apple 官方诊断、质量保证或交易承诺。
version: 2.0.1
author: Eddy
---

# Mac 验机助手

为用户启动一次完整、只读、默认离线的 Mac 检测。自动检测完成后，以本地 Session App 作为唯一操作界面；用户可在页面完成硬件检查、查看结论并直接下载报告。

## 使用边界

- 用户表达“验机”“Mac检测”“全面检查”“设备体检”“收货/维修验收”“购买或出售前检查”等完整检查意图时使用。
- 当前版本固定创建完整 Session；若用户只想了解某个单项，应直接回答或说明该项能力，不要悄悄启动整套流程。
- 支持能够在目标 Mac 上运行本地脚本并打开本地 HTML 的兼容 Agent 桌面宿主，不依赖特定产品、回调协议或对话持续运行。
- 根据当前对话选择 `zh-CN` 或 `en-US`；无法判断时使用 `zh-CN`。

## 无 Agent 终端运行

本项目也可以在没有 Agent 桌面端的情况下直接运行。下载或解压项目后，用户可打开“终端”，进入项目根目录并执行：

```bash
cd /path/to/mac-check-skill
/bin/zsh ./scripts/run-full-check.sh --output-root ./mac-check-output --locale zh-CN
```

英文界面将 `zh-CN` 改为 `en-US`。系统检测完成后会自动打开本地硬件检测页面；如果页面未能自动打开，可使用终端输出中的 `SESSION_HTML` 路径手动打开。此方式与 Skill 执行流程复用同一入口，不需要 `chmod`、`sudo`、清除隔离属性或安装额外依赖。

当 Agent 正在执行验机任务时，仍按下方“执行流程”直接调用入口，不要额外要求用户改用终端；仅在用户询问无 Agent 使用方法时提供上述说明。

## 执行流程

1. 简短告知用户：将运行只读系统检测，不使用管理员权限、不修改系统设置；默认不联网，也不上传序列号或结果。
2. 用户同意后，读取 [architecture.md](references/architecture.md)、[privacy.md](references/privacy.md) 和 [agent-runtime.md](references/agent-runtime.md)。
3. 必须显式使用 zsh 执行入口；不要依赖压缩包保留可执行权限，也不要要求用户 `chmod`：

```bash
/bin/zsh scripts/run-full-check.sh --output-root ./mac-check-output --locale <LOCALE>
```

4. 入口依次执行环境检查、Session 创建、系统采集、事实规范化、确定性规则判断、单文件 Session App 构建与打开。
5. 成功后只需说明：系统自动检测已完成，检查页面已经打开；请用户在页面继续硬件检测并下载报告。
6. 若系统不允许自动打开页面，向用户提供脚本输出的 `SESSION_HTML` 绝对路径。不要等待或要求用户把结果复制回聊天。

测试或用户明确不希望打开页面时：

```bash
/bin/zsh scripts/run-full-check.sh --output-root <DIR> --locale <LOCALE> --no-open
```

## 正确性与安全

- 只运行 [detection-catalog.md](references/detection-catalog.md) 中的只读命令；不使用 `sudo`、下载脚本、绕过锁定或修改系统的命令。
- Collector 只记录事实；Normalizer 只规范化；只有 [rule-spec.md](references/rule-spec.md) 的确定性规则可以生成结论。读取失败必须标为 `UNKNOWN`，不能伪装成通过。
- Session App 不执行 Shell、不读取相邻文件、不依赖 CDN、localhost、MCP、AI 回调或外部服务。Apple 保修入口只能由用户主动点击，页面不能后台提交序列号。
- 浏览器无法可靠观察的 Touch ID、物理接口、Force Touch 和感官质量必须采用清晰的引导验证，不得冒充自动检测。
- 不生成缺乏依据的综合评分，不写“放心购买”，不声称 Apple 官方检测或保证不存在任何管理与锁定风险。
- 系统数据必须序列化和转义后注入 HTML。完整序列号只保存在本地 Session 与报告中，页面不得把它发往网络；用户主动前往 Apple 官网查询保修时自行决定是否提交。

## 页面与报告

- 状态以页面当前内存为准，`localStorage` 仅作尽力恢复；页面不写回 `session.json`。
- 报告遵循 [report-spec.md](references/report-spec.md)。在线风险查询、支付、性能测试、硬盘测速和 AI 评估不属于当前阶段，相关 feature flag 保持关闭。

## 失败处理

- 单项命令失败：继续其他检测，将对应结果标为“无法读取/需要确认”。
- 设备身份完全无法读取：停止构建页面，保留诊断文件并说明原因。
- 页面构建失败：保留 `facts.json` 与 `system-results.json`，不要由 AI 临时拼接替代页面或报告。
- 麦克风或摄像头权限失败：页面标为“无法确认”并允许重试，不能直接判断硬件损坏。
