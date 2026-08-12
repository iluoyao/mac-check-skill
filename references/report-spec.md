# 报告规范

页面从同一 `reportModel` 渲染概览和 Markdown/PDF/PNG，概览本身就是报告视图，不再提供独立报告页面。至少包含：设备摘要、进度、优先关注、系统检测、硬件检测、未完成/不支持、必要边界和免责声明。

- 默认文件名：中文 `Mac验机报告-YYYYMMDD-HHmm.md`，英文 `Mac-Inspection-Report-YYYYMMDD-HHmm.md`。
- 序列号在本地页面与下载报告中完整显示，便于核对设备身份；页面不得后台上传或把序列号拼入 URL。
- 每项保留状态、关键观测值与普通用户能理解的简短解释；证据类型与技术限制保留在内部数据，不作为每行“备注/证据边界”展示。
- `UNKNOWN/SKIPPED/UNSUPPORTED/NOT_STARTED` 不得丢失。
- 不使用综合评分、寿命预测或“放心购买”。
- Markdown 通过 Blob + `download` 生成；PDF/PNG 在页面内用 Canvas 与本地编码直接生成 Blob 后下载，不调用打印对话框、不加载外部库。
- P0 风险查询未启用时，说明本机检测不能完全证明服务器侧 Activation Lock、ADE、原始配置或维修历史。
