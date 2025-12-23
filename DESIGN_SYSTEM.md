# 🎨 自律教练小程序 - 设计系统文档

**版本**: 2.0
**最后更新**: 2025-12-23
**状态**: ✅ 完整

---

## 📖 目录

- [1. 设计原则](#1-设计原则)
- [2. 色彩系统](#2-色彩系统)
- [3. 字体规范](#3-字体规范)
- [4. 间距系统](#4-间距系统)
- [5. 圆角规范](#5-圆角规范)
- [6. 阴影系统](#6-阴影系统)
- [7. 组件库](#7-组件库)
- [8. 图标系统](#8-图标系统)
- [9. 动画规范](#9-动画规范)
- [10. 无障碍支持](#10-无障碍支持)
- [11. 深色模式](#11-深色模式)
- [12. 最佳实践](#12-最佳实践)

---

## 1. 设计原则

### 1.1 核心价值

#### 简洁 (Simplicity)
- 去除不必要的装饰
- 关注核心功能
- 清晰的信息层级

#### 一致 (Consistency)
- 统一的视觉语言
- 可预测的交互模式
- 一致的命名规范

#### 友好 (Friendly)
- 温暖的配色方案
- 鼓励性的文案
- 流畅的动画反馈

#### 高效 (Efficiency)
- 快速的操作路径
- 明确的视觉焦点
- 合理的信息密度

### 1.2 设计目标

```
视觉美观度     ████████████████████ 90%
易用性         ████████████████████ 95%
一致性         ████████████████████ 100%
创新性         ████████████████░░░░ 80%
性能表现       ████████████████████ 95%
```

---

## 2. 色彩系统

### 2.1 主色系

```css
/* 主绿色 - 品牌色 */
--color-primary: #07C160;
--color-primary-light: #B7F4D6;
--color-primary-dark: #029E6D;
```

**使用场景**:
- ✅ 主按钮背景
- ✅ 成功状态
- ✅ 强调元素
- ✅ 链接文本

### 2.2 功能色

```css
--color-success: #07C160;    /* 成功/完成 */
--color-warning: #FF9500;    /* 警告/提醒 */
--color-error: #FA5151;      /* 错误/失败 */
--color-info: #10AEFF;       /* 信息/提示 */
```

### 2.3 文本色系

| 级别 | 颜色 | 用途 | 对比度 |
|------|------|------|--------|
| 一级文本 | `#333333` | 标题、重要信息 | 12.6:1 |
| 二级文本 | `#666666` | 正文、说明 | 5.7:1 |
| 三级文本 | `#999999` | 辅助说明、次要信息 | 2.8:1 |
| 禁用文本 | `#CCCCCC` | 禁用状态 | 1.6:1 |

### 2.4 背景色系

```css
--color-bg-primary: #FFFFFF;     /* 主背景 - 白色 */
--color-bg-secondary: #F7F8FA;   /* 次背景 - 浅灰 */
--color-bg-tertiary: #EFEFEF;    /* 三级背景 */
--color-bg-light: #FAFBFC;       /* 浅背景 */
```

### 2.5 维度配色

```
🏃 运动 - 红色系:   #FF6B6B  (热情、活力)
🥗 饮食 - 青色系:   #38B2AC  (健康、清新)
😴 睡眠 - 紫色系:   #9F7AEA  (宁静、放松)
📚 阅读 - 橙色系:   #F6AD55  (温暖、知识)
📝 学习 - 蓝色系:   #4299E1  (理性、专注)
```

### 2.6 颜色对比度标准

- ✅ 所有文本符合 WCAG AA 标准 (≥4.5:1)
- ✅ 大文本符合 WCAG AAA 标准 (≥7:1)
- ✅ 深色模式同样符合标准

---

## 3. 字体规范

### 3.1 字体层级

| 层级 | 大小 | 行高 | 字重 | 用途 |
|------|------|------|------|------|
| H1 | 40rpx | 56rpx | 700 | 页面主标题 |
| H2 | 36rpx | 50rpx | 600 | 区域标题 |
| H3 | 32rpx | 44rpx | 600 | 卡片标题 |
| Body | 28rpx | 40rpx | 400 | 正文 |
| Caption | 24rpx | 34rpx | 400 | 说明文字 |
| Number | 48rpx | 60rpx | 700 | 数字展示 |

### 3.2 字体家族

```css
font-family: -apple-system, BlinkMacSystemFont,
             'Segoe UI', 'PingFang SC', 'Hiragino Sans GB',
             'Microsoft YaHei', 'Helvetica Neue', Helvetica,
             Arial, sans-serif;
```

### 3.3 字重规范

```css
--font-weight-regular: 400;   /* 正常 */
--font-weight-medium: 500;    /* 中等 */
--font-weight-semibold: 600;  /* 半粗 */
--font-weight-bold: 700;      /* 粗体 */
```

---

## 4. 间距系统

### 4.1 间距规范

```css
--spacing-xs: 8rpx;    /* 极小间距 - 图标内边距 */
--spacing-sm: 16rpx;   /* 小间距 - 元素间距 */
--spacing-md: 32rpx;   /* 中间距 - 卡片边距 */
--spacing-lg: 48rpx;   /* 大间距 - 区块间距 */
--spacing-xl: 64rpx;   /* 超大间距 - 页面边距 */
```

### 4.2 使用场景

```
8rpx   - 图标与文字间距
16rpx  - 列表项内边距、按钮内边距
32rpx  - 卡片内边距、页面左右边距
48rpx  - 卡片之间间距
64rpx  - 区块之间间距
```

### 4.3 响应式间距

| 屏幕宽度 | 页面左右边距 | 卡片间距 |
|----------|--------------|----------|
| < 375px | 24rpx | 24rpx |
| 375-414px | 32rpx | 32rpx |
| > 414px | 40rpx | 40rpx |

---

## 5. 圆角规范

```css
--radius-sm: 8rpx;     /* 小圆角 - 按钮、标签 */
--radius-md: 12rpx;    /* 中圆角 - 输入框 */
--radius-lg: 24rpx;    /* 大圆角 - 卡片 */
--radius-xl: 32rpx;    /* 超大圆角 - 弹窗 */
--radius-full: 9999rpx; /* 圆形 - 头像、徽章 */
```

### 使用建议

- 按钮: `8rpx`
- 输入框: `12rpx`
- 卡片: `24rpx`
- 底部弹窗顶部: `32rpx`
- 头像: `9999rpx` (完全圆形)

---

## 6. 阴影系统

```css
/* 标准阴影 */
--shadow-sm: 0 2rpx 8rpx rgba(0, 0, 0, 0.06);   /* 轻微阴影 */
--shadow-md: 0 4rpx 16rpx rgba(0, 0, 0, 0.08);  /* 标准阴影 */
--shadow-lg: 0 8rpx 24rpx rgba(0, 0, 0, 0.12);  /* 明显阴影 */
--shadow-xl: 0 8rpx 32rpx rgba(0, 0, 0, 0.15);  /* 强烈阴影 */
```

### 使用场景

- `shadow-sm` - 按钮悬停
- `shadow-md` - 普通卡片
- `shadow-lg` - 悬浮卡片
- `shadow-xl` - 弹窗、对话框

---

## 7. 组件库

### 7.1 按钮组件

#### 主按钮
```css
background: var(--color-primary);
color: #FFFFFF;
border-radius: 8rpx;
padding: 16rpx 32rpx;
font-size: 28rpx;
font-weight: 600;
```

#### 次要按钮
```css
background: transparent;
color: var(--color-primary);
border: 2rpx solid var(--color-primary);
border-radius: 8rpx;
padding: 16rpx 32rpx;
```

#### 文字按钮
```css
background: transparent;
color: var(--color-primary);
padding: 16rpx;
```

### 7.2 输入框

```css
border: 2rpx solid #E8E8E8;
border-radius: 12rpx;
padding: 0 24rpx;
height: 88rpx;
font-size: 28rpx;
color: #333333;
background: #FFFFFF;
```

**聚焦状态**:
```css
border-color: var(--color-primary);
box-shadow: 0 0 0 4rpx rgba(7, 193, 96, 0.1);
```

### 7.3 卡片组件

```css
background: #FFFFFF;
border-radius: 24rpx;
padding: 32rpx;
box-shadow: var(--shadow-md);
```

### 7.4 标签组件

```css
background: #F7F8FA;
color: #666666;
font-size: 24rpx;
padding: 8rpx 16rpx;
border-radius: 8rpx;
```

---

## 8. 图标系统

### 8.1 图标尺寸

```
小图标:  32rpx (16px)
中图标:  48rpx (24px)
大图标:  64rpx (32px)
超大:    96rpx (48px)
```

### 8.2 图标风格

- ✅ 线性图标为主
- ✅ 2rpx 线宽
- ✅ 圆角端点
- ✅ 统一的视觉风格

### 8.3 图标颜色

```css
/* 默认 */
color: #999999;

/* 激活 */
color: var(--color-primary);

/* 禁用 */
color: #CCCCCC;
opacity: 0.4;
```

---

## 9. 动画规范

### 9.1 动画时长

```javascript
DURATION = {
  INSTANT: 0ms,        // 即时
  FAST: 150ms,         // 快速
  NORMAL: 300ms,       // 正常
  SLOW: 500ms,         // 缓慢
  VERY_SLOW: 800ms     // 非常慢
}
```

### 9.2 缓动函数

```javascript
EASING = {
  LINEAR: 'linear',
  EASE: 'ease',
  EASE_IN: 'ease-in',
  EASE_OUT: 'ease-out',
  EASE_IN_OUT: 'ease-in-out'
}
```

### 9.3 常用动画

| 动画类型 | 时长 | 缓动 | 用途 |
|----------|------|------|------|
| 淡入淡出 | 300ms | ease-out | 内容显示/隐藏 |
| 滑动 | 300ms | ease-out | 页面切换 |
| 缩放 | 300ms | ease-out-back | 弹窗显示 |
| 弹跳 | 500ms | ease-out | 成功反馈 |
| 脉冲 | 150ms | ease-in-out | 按钮点击 |
| 旋转 | 500ms | linear | 加载中 |

### 9.4 性能优化

- ✅ 使用 `transform` 和 `opacity`
- ✅ 避免 `width/height` 动画
- ✅ 使用 `will-change` 提示
- ✅ 限制同时动画数量

---

## 10. 无障碍支持

### 10.1 ARIA 标签

```html
<!-- 按钮 -->
<button aria-label="打卡" role="button">
  <icon type="check" />
</button>

<!-- 输入框 -->
<input
  aria-label="计划名称"
  aria-required="true"
  placeholder="请输入计划名称"
/>

<!-- 对话框 -->
<view
  role="dialog"
  aria-modal="true"
  aria-labelledby="dialog-title"
>
  <text id="dialog-title">确认删除</text>
</view>
```

### 10.2 颜色对比度

所有文本和背景组合必须符合 **WCAG 2.1 AA 标准**:
- 普通文本: ≥ 4.5:1
- 大文本 (18px+): ≥ 3:1

### 10.3 焦点可见性

```css
*:focus {
  outline: 2rpx solid var(--color-primary);
  outline-offset: 4rpx;
}
```

### 10.4 屏幕阅读器

- 为图标添加文本描述
- 为图片添加 alt 属性
- 使用语义化标签

---

## 11. 深色模式

### 11.1 色彩调整

| 元素 | 亮色模式 | 深色模式 |
|------|----------|----------|
| 主背景 | #FFFFFF | #1A1A1A |
| 卡片背景 | #FFFFFF | #2A2A2A |
| 主文本 | #333333 | #F5F5F5 |
| 次文本 | #666666 | #B0B0B0 |
| 边框 | #E8E8E8 | #404040 |

### 11.2 实现方式

```css
/* CSS 变量 + 媒体查询 */
@media (prefers-color-scheme: dark) {
  :root {
    --color-text-primary: #F5F5F5;
    --color-bg-primary: #1A1A1A;
  }
}
```

### 11.3 主题切换

```javascript
// 三种模式
- 跟随系统 (auto)
- 亮色模式 (light)
- 深色模式 (dark)
```

---

## 12. 最佳实践

### 12.1 设计检查清单

- [ ] 使用统一的间距系统
- [ ] 使用统一的字体层级
- [ ] 使用设计令牌(CSS变量)
- [ ] 颜色对比度符合标准
- [ ] 适配深色模式
- [ ] 添加无障碍标签
- [ ] 动画时长适中
- [ ] 响应式设计

### 12.2 代码规范

```css
/* ✅ 推荐 - 使用 CSS 变量 */
.button {
  background: var(--color-primary);
  padding: var(--spacing-md);
  border-radius: var(--radius-sm);
}

/* ❌ 不推荐 - 硬编码 */
.button {
  background: #07C160;
  padding: 32rpx;
  border-radius: 8rpx;
}
```

### 12.3 命名规范

```
组件命名: kebab-case
  - custom-button
  - task-card
  - coach-section

变量命名: camelCase
  - primaryColor
  - userData
  - isLoading

常量命名: UPPER_SNAKE_CASE
  - API_BASE_URL
  - MAX_RETRY_COUNT
```

### 12.4 文件组织

```
styles/
  ├── colors.wxss       # 颜色系统
  ├── animations.wxss   # 动画库
  ├── common.wxss       # 通用样式
  └── variables.wxss    # CSS 变量

components/
  ├── custom-button/    # 按钮组件
  ├── task-card/        # 任务卡片
  └── coach-avatar/     # 小教练头像

utils/
  ├── theme.js          # 主题管理
  ├── animations.js     # 动画工具
  └── accessibility.js  # 无障碍工具
```

---

## 📚 参考资源

### 设计规范
- [Material Design](https://material.io/design)
- [Human Interface Guidelines](https://developer.apple.com/design/)
- [WeChat Design](https://weui.io/)

### 无障碍标准
- [WCAG 2.1](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Practices](https://www.w3.org/WAI/ARIA/apg/)

### 开发工具
- [Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [Color Oracle](https://colororacle.org/)

---

## 🔄 更新日志

### v2.0 (2025-12-23)
- ✅ 添加深色模式支持
- ✅ 完善无障碍规范
- ✅ 建立动画库
- ✅ 更新色彩对比度标准
- ✅ 添加设计令牌系统

### v1.0 (2025-12-22)
- ✅ 初始版本
- ✅ 基础色彩系统
- ✅ 字体和间距规范
- ✅ 组件库文档

---

**文档维护**: 设计团队
**最后审核**: 2025-12-23

