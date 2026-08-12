# 架构与会话

## 运行链路

```text
完整验机意图 → Runtime Guard → Session → Collector → Facts → System Rules
→ Self-contained HTML → Guided Hardware Flow → 页面报告
```

AI/Skill 只负责页面打开前的工作。页面打开后不需要 Result Token、AI 回调、localhost、MCP 或相邻文件读取。

## 目录

```text
<session>/
├── raw/
│   ├── <probe>.out
│   ├── <probe>.err
│   └── <probe>.meta.json
├── runtime.json
├── facts.json
├── system-results.json
├── session.json
└── MacCheck-<session-id>.html
```

## 状态

`SYSTEM_COLLECTING` → `SYSTEM_READY` → 页面内 `INTERACTIVE_IN_PROGRESS` → `READY_TO_REPORT` → `COMPLETED`。后四个页面阶段不写回磁盘 Session；浏览器状态只在内存和 best-effort `localStorage` 中维护。

## 设备能力匹配

`assets/data/device-capabilities.json` 将 `metadataOverrides` 与硬件能力规则分开：少量精确 Model Identifier 仅补充已验证的营销名称和年份，产品族、架构、芯片与代际规则才决定内建设备和接口能力。规则覆盖 MacBook Air、MacBook Pro、MacBook、Mac mini、iMac/iMac Pro、Mac Studio 与 Mac Pro；未来或无法识别的型号进入 notebook/desktop 保守回退。

macOS 没有稳定公开接口可读取所有空闲物理端口及机身位置。只有高置信规则可以声明完整接口布局；其余型号只列出有把握的接口，并增加“其他物理接口”人工检查项。未知值不得按 `true` 处理，也不得为了填满页面虚构 HDMI、SD、MagSafe 或接口数量。

## 控制权红线

- Shell 不判断健康状态。
- 页面不执行 Shell。
- LLM 不判断 `PASS/WARNING/BLOCKER`。
- 系统结果与交互结果使用同一 CheckResult 语义。
- P0 的 `featureFlags.riskChecks` 固定为 `false`。
