# 基础检测目录

| 分组 | 事实来源 | 核心结论 |
|---|---|---|
| 设备 | `system_profiler SPHardwareDataType`、`ioreg IOPlatformExpertDevice`、`sw_vers` | 型号、芯片、内存、系统、序列号一致性 |
| 电池 | `system_profiler SPPowerDataType`、`ioreg AppleSmartBattery` | 支持状态、循环、容量、Condition、充电 |
| 安全与锁定 | `SPHardwareDataType`、`profiles status`、`fdesetup status`、`csrutil status` | 当前 Activation Lock、MDM/ADE、FileVault、SIP；不证明服务器侧未来状态 |
| 存储 | `diskutil info -plist /`、`SPStorageDataType`、`SPNVMeDataType` | 容量、可用空间、文件系统、SMART/NVMe 可见健康 |
| 网络与蓝牙 | `SPAirPortDataType`、`SPBluetoothDataType` | 控制器存在、启用和连接状态；不保存 SSID/设备名 |
| 接口与外设 | USB、Thunderbolt、Display、Audio profiler | 当前枚举摘要；没有外设不代表所有物理接口通过 |

每个 Probe 独立超时并产生机器可读 meta。无输出、超时、非零退出和解析失败都必须保留原因。
