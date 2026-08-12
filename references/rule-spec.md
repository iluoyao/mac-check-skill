# 确定性规则

## 状态优先级

`BLOCKER` > `WARNING` > `NOTICE` > `UNKNOWN` > `PASS`；`UNSUPPORTED` 不进入适用项目分母。

## P0 规则

- 设备身份不可读 → `UNKNOWN`；序列号双路径冲突 → `BLOCKER`；单路径 → `NOTICE`。
- 桌面 Mac 电池 → `UNSUPPORTED`；Condition 含 Service/Replace → `WARNING`；容量比低于 80% → `WARNING`；缺少容量 → `UNKNOWN`。
- 当前 MDM/ADE 为 true → `BLOCKER`；命令不可用 → `UNKNOWN`；false 只表示当前本机未发现，并附服务器侧限制。
- `system_profiler` 明确返回 Activation Lock enabled → `BLOCKER`；disabled → `PASS`；字段缺失 → `UNKNOWN` 并提供“查找我的 Mac”人工自查步骤。
- FileVault 关闭 → `NOTICE`；SIP 关闭 → `WARNING`；不可读 → `UNKNOWN`。
- SMART/NVMe 明确非 Verified/OK → `WARNING`；未取得 → `UNKNOWN`。
- Wi-Fi/蓝牙控制器明确存在且开启 → `PASS`；关闭 → `NOTICE`；不可读 → `UNKNOWN`。
- 外设枚举成功 → `PASS`，但始终附“不能证明所有物理接口”的限制。

读取失败、权限拒绝、浏览器能力缺失不得转换为 `PASS`。
