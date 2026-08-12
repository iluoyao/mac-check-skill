# 隐私与安全

- P0 默认零网络请求；HTML CSP 使用 `connect-src 'none'`。
- 不上传完整序列号、系统事实、报告、摄像头画面或麦克风录音。
- `facts.json`、Session HTML 与下载报告会在用户本机展示完整序列号，便于核对设备与保修信息；它不会被页面自动上传或写入 URL。
- 麦克风录音仅存在于页面内存和临时 Object URL；离开项目或页面时释放。
- 摄像头只做实时预览，不截图、不保存、不上传。
- 用户备注用 `textContent` 显示；系统字符串通过 JSON 序列化并对 HTML script 终止序列转义。
- 禁止 `sudo`、`curl|sh`、`wget|sh`、关闭安全能力、修改 profiles、绕过 Activation Lock/MDM、修改 NVRAM 或自动抹除。
- P1 风险查询必须另行获得上传序列号的明确同意，不能通过 GET query 传完整序列号。
