# 图标资源放置说明（统一图标）

统一图标组件：`/components/app-icon`

- 使用方式：`<app-icon type="calendar" size="28" />`
- 加载逻辑：优先加载本地 PNG `/assets/icons/<type>.png`；若不存在，自动使用内置 emoji 兜底。

## 常用类型（当前已用）

- arrow-down, check, add, edit, trash
- vip, bell, calendar, chart, trophy, info, phone, wechat, email
- timer, number, clock, circle

## 规范建议

- 尺寸：一般 20rpx~32rpx；按页面视觉调整
- 命名：全小写、中划线、`.png`（如：`arrow-down.png`）
- 风格：线性简洁，透明底 PNG

## 放置后效果

将对应 PNG 放入本目录后，页面会自动显示真实图标，无需改代码。

---

附：TabBar 图标（如启用）

- `tab-home(.png/.active.png)`、`tab-stat(.png/.active.png)`、`tab-user(.png/.active.png)` 尺寸建议 81x81px
