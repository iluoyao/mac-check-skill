# Agent 桌面运行环境

P0 将真实 `Darwin` 主机视为可检查环境。运行 `scripts/runtime-check.sh <runtime.json>`，验证 `/usr/sbin/system_profiler`、`/usr/bin/osascript`、`/usr/bin/open` 等本地能力是否存在。

兼容宿主可能从压缩包、缓存目录或沙箱工作区安装 Skill，因此不能假设文件保留 Unix 可执行位。所有对项目内 shell 文件的调用都必须显式使用 `/bin/zsh <script>`；入口本身也必须由 Agent 以 `/bin/zsh scripts/run-full-check.sh ...` 启动。不得用 `chmod` 作为正常运行步骤。

文件系统沙箱本身并不等于系统信息不可读。每个只读 Probe 独立执行并记录 `OK / EMPTY / ERROR / TIMEOUT / SKIPPED`；一个命令受限时继续其他命令，并将相应事实标为 `UNKNOWN`。仅当设备身份完全不可用时才终止。

`/usr/bin/open` 不可用或 GUI 被宿主阻止时，仍生成完整 Session App，并把 `SESSION_HTML` 绝对路径交给用户手动打开。页面打开后不依赖 Agent 会话、宿主品牌或任何回传协议。
