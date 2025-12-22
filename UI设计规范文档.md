# 「自律教练」小程序 UI 设计规范文档

> **文档版本：** V1.0
> **更新日期：** 2025-12-22
> **适用平台：** 微信小程序
> **设计工具推荐：** Figma / Sketch / 即时设计

---

## 目录

1. [设计原则](#1-设计原则)
2. [色彩系统](#2-色彩系统)
3. [字体规范](#3-字体规范)
4. [图标规范](#4-图标规范)
5. [间距与布局](#5-间距与布局)
6. [组件规范](#6-组件规范)
7. [页面布局规范](#7-页面布局规范)
8. [动画与反馈](#8-动画与反馈)
9. [小教练形象设计](#9-小教练形象设计)
10. [适配与响应式](#10-适配与响应式)

---

## 1. 设计原则

### 1.1 核心理念

**友好（Friendly）**
用温暖、鼓励的视觉语言和文案，减少用户的心理压力，让监督变成陪伴。

**简洁（Simple）**
减少不必要的视觉元素，让用户专注于核心任务——打卡和坚持。

**生动（Vivid）**
通过小教练角色、动画反馈、色彩搭配，让产品有生命力，增加趣味性。

**高效（Efficient）**
快速完成打卡，清晰展示数据，减少操作步骤。

### 1.2 设计目标

- 让用户在 3 秒内理解首页的任务状态
- 让用户在 1 次点击内完成一次打卡
- 让用户感受到「温柔监督」而非「严厉批评」
- 通过数据可视化让用户获得成就感

---

## 2. 色彩系统

### 2.1 主色（Primary Color）

#### 主色 - 绿色

```
色值：#07C160
RGB：(7, 193, 96)
```

**使用场景：**
- 主按钮背景色
- Tab 选中态
- 重要操作（如"去打卡"）
- 进度条填充色
- 成功状态提示

**设计意义：**
绿色象征生机、成长、健康，传递积极向上的能量，与产品「自律成长」的定位高度契合。

**色彩示例：**

```
█████████ #07C160 主色
```

---

### 2.2 辅助色（Secondary Color）

#### 辅色 - 蓝灰色

```
色值：#576B95
RGB：(87, 107, 149)
```

**使用场景：**
- 次要信息文字
- 非选中态图标
- 辅助按钮边框
- 说明性文字

**色彩示例：**

```
█████████ #576B95 辅色
```

---

### 2.3 背景色（Background Color）

#### 页面背景

```
色值：#F7F8FA
RGB：(247, 248, 250)
```

**使用场景：**
- 页面底色
- 分隔区域

#### 卡片背景

```
色值：#FFFFFF
RGB：(255, 255, 255)
```

**使用场景：**
- 卡片背景
- 弹窗背景
- 输入框背景

---

### 2.4 文字色（Text Color）

| 层级 | 色值 | RGB | 使用场景 |
|-----|------|-----|---------|
| 主要文字 | `#333333` | (51, 51, 51) | 标题、重要信息、正文 |
| 次要文字 | `#666666` | (102, 102, 102) | 副标题、说明文字 |
| 辅助文字 | `#999999` | (153, 153, 153) | 提示信息、时间戳 |
| 占位文字 | `#CCCCCC` | (204, 204, 204) | 输入框 placeholder |
| 反白文字 | `#FFFFFF` | (255, 255, 255) | 按钮文字、深色背景上的文字 |

**色彩示例：**

```
█████████ #333333 主要文字
█████████ #666666 次要文字
█████████ #999999 辅助文字
█████████ #CCCCCC 占位文字
```

---

### 2.5 功能色（Functional Color）

| 功能 | 色值 | RGB | 使用场景 |
|-----|------|-----|---------|
| 成功 | `#07C160` | (7, 193, 96) | 完成状态、成功提示 |
| 警告 | `#FF9500` | (255, 149, 0) | 警告提示、即将到期 |
| 错误 | `#FA5151` | (250, 81, 81) | 错误提示、删除操作 |
| 信息 | `#10AEFF` | (16, 174, 255) | 普通提示、信息展示 |

**色彩示例：**

```
█████████ #07C160 成功
█████████ #FF9500 警告
█████████ #FA5151 错误
█████████ #10AEFF 信息
```

---

### 2.6 维度配色（Category Color）

为五大维度分配专属颜色，增强识别度：

| 维度 | 色值 | RGB | 图标色 |
|-----|------|-----|--------|
| 运动 | `#FF6B6B` | (255, 107, 107) | 🏃 红色系 |
| 饮食 | `#4ECDC4` | (78, 205, 196) | 🍎 青色系 |
| 睡眠 | `#9B59B6` | (155, 89, 182) | 😴 紫色系 |
| 阅读 | `#F39C12` | (243, 156, 18) | 📖 橙色系 |
| 学习 | `#3498DB` | (52, 152, 219) | 📚 蓝色系 |

**色彩示例：**

```
█████████ #FF6B6B 运动
█████████ #4ECDC4 饮食
█████████ #9B59B6 睡眠
█████████ #F39C12 阅读
█████████ #3498DB 学习
```

**使用场景：**
- 维度图标背景色（浅色版，透明度 10-20%）
- 数据统计图表配色
- 卡片左侧色条

---

### 2.7 渐变色（Gradient Color）

#### 主色渐变（用于特殊场景）

```
渐变：linear-gradient(135deg, #07C160 0%, #00D68F 100%)
```

**使用场景：**
- 会员卡片背景
- 重要数据展示卡片
- 特殊按钮（如「立即开通会员」）

---

### 2.8 边框与分割线

| 类型 | 色值 | 使用场景 |
|-----|------|---------|
| 分割线 | `#EEEEEE` | 列表分割线 |
| 边框-浅 | `#E5E5E5` | 输入框、卡片边框 |
| 边框-深 | `#CCCCCC` | 需要强调的边框 |

---

## 3. 字体规范

### 3.1 字体家族

**中文字体：**
- 默认：系统默认字体（微信小程序默认）
- iOS：`PingFang SC`（苹方）
- Android：`Noto Sans SC`

**英文 & 数字：**
- `SF Pro Display`（iOS）
- `Roboto`（Android）

**代码示例（WXSS）：**

```css
/* 全局字体 */
page {
  font-family: -apple-system, BlinkMacSystemFont, "PingFang SC", "Helvetica Neue",
               "Hiragino Sans GB", "Microsoft YaHei", sans-serif;
}

/* 数字字体（更清晰） */
.number {
  font-family: "SF Pro Display", "Roboto", -apple-system, sans-serif;
}
```

---

### 3.2 字体层级

| 层级 | 字号 | 行高 | 字重 | 使用场景 | WXSS 类名 |
|-----|------|------|------|---------|-----------|
| H1 | 20px | 28px | Bold (700) | 页面标题 | `.text-h1` |
| H2 | 18px | 26px | Bold (700) | 卡片标题、模块标题 | `.text-h2` |
| H3 | 16px | 24px | Medium (500) | 小标题、强调文字 | `.text-h3` |
| Body 1 | 16px | 24px | Regular (400) | 正文、按钮文字 | `.text-body1` |
| Body 2 | 14px | 22px | Regular (400) | 列表项、次要信息 | `.text-body2` |
| Caption | 12px | 20px | Regular (400) | 说明文字、提示文字 | `.text-caption` |
| Number Large | 32px | 40px | Bold (700) | 大数据展示（如完成率） | `.text-number-lg` |
| Number Medium | 24px | 32px | Medium (500) | 中等数据展示 | `.text-number-md` |

---

### 3.3 字体样式示例

**代码示例（WXSS）：**

```css
/* H1 - 页面标题 */
.text-h1 {
  font-size: 20px;
  line-height: 28px;
  font-weight: 700;
  color: #333333;
}

/* H2 - 卡片标题 */
.text-h2 {
  font-size:  18px;
  line-height: 26px;
  font-weight: 700;
  color: #333333;
}

/* H3 - 小标题 */
.text-h3 {
  font-size: 16px;
  line-height: 24px;
  font-weight: 500;
  color: #333333;
}

/* Body 1 - 正文 */
.text-body1 {
  font-size: 16px;
  line-height:  24px;
  font-weight: 400;
  color: #333333;
}

/* Body 2 - 次要信息 */
.text-body2 {
  font-size: 14px;
  line-height: 22px;
  font-weight: 400;
  color: #666666;
}

/* Caption - 说明文字 */
.text-caption {
  font-size: 12px;
  line-height: 20px;
  font-weight: 400;
  color: #999999;
}

/* Number Large - 大数字 */
.text-number-lg {
  font-size:  32px;
  line-height: 40px;
  font-weight: 700;
  font-family: "SF Pro Display", "Roboto", sans-serif;
  color: #333333;
}

/* Number Medium - 中数字 */
.text-number-md {
  font-size: 24px;
  line-height: 32px;
  font-weight: 500;
  font-family: "SF Pro Display", "Roboto", sans-serif;
  color:  #333333;
}
```

---

## 4. 图标规范

### 4.1 图标风格

**设计风格：** 线性图标（Line Icon）

**设计原则：**
- 线条粗细统一：2px
- 圆角统一：2px
- 视觉大小统一（光学对齐）
- 简洁、识别度高

### 4.2 图标尺寸

| 尺寸 | 使用场景 |
|-----|---------|
| 48px × 48px | 大图标（引导页、空状态） |
| 32px × 32px | 卡片头部图标 |
| 24px × 24px | 常规图标（列表、按钮） |
| 20px × 20px | 小图标（Tab、标签） |
| 16px × 16px | 极小图标（文字旁提示） |

### 4.3 图标颜色

| 状态 | 色值 | 使用场景 |
|-----|------|---------|
| 默认 | `#333333` | 常规展示 |
| 次要 | `#999999` | 未选中、禁用 |
| 激活 | `#07C160` | 选中、高亮 |
| 警告 | `#FF9500` | 警告图标 |
| 错误 | `#FA5151` | 错误、删除图标 |

### 4.4 核心图标列表

| 图标名称 | 用途 | 建议样式 |
|---------|------|---------|
| 运动图标 | 运动维度 | 🏃‍♂️ 跑步人形 |
| 饮食图标 | 饮食维度 | 🍎 苹果 |
| 睡眠图标 | 睡眠维度 | 🌙 月亮 |
| 阅读图标 | 阅读维度 | 📖 打开的书 |
| 学习图标 | 学习维度 | 📝 笔记本 |
| 打卡图标 | 打卡按钮 | ✓ 对勾 |
| 编辑图标 | 编辑操作 | ✏️ 铅笔 |
| 删除图标 | 删除操作 | 🗑️ 垃圾桶 |
| 统计图标 | 数据页 Tab | 📊 柱状图 |
| 用户图标 | 个人中心 Tab | 👤 人形 |
| 设置图标 | 设置入口 | ⚙️ 齿轮 |
| 会员图标 | 会员标识 | 👑 皇冠 |
| 提醒图标 | 提醒设置 | 🔔 铃铛 |
| 日历图标 | 日期选择 | 📅 日历 |
| 时间图标 | 时间选择 | 🕐 时钟 |

### 4.5 Tab 图标

**设计要求：**
- 尺寸：40px × 40px（提供 @2x 和 @3x）
- 两种状态：未选中（灰色 `#999999`）、选中（主色 `#07C160`）

**Tab 列表：**

| Tab 名称 | 图标 | 文字 |
|---------|------|------|
| 首页 | 🏠 房子 | 今日 |
| 数据 | 📊 图表 | 数据 |
| 我的 | 👤 人形 | 我的 |

---

## 5. 间距与布局

### 5.1 间距规范

**设计原则：** 采用 8px 栅格系统（8 的倍数）

| 间距名称 | 数值 | 使用场景 |
|---------|------|---------|
| xs | 4px | 极小间距（图标与文字、行内元素） |
| sm | 8px | 小间距（标签内边距、密集列表） |
| md | 16px | 中等间距（卡片内边距、列表项间距） |
| lg | 24px | 大间距（模块间距、卡片外边距） |
| xl | 32px | 超大间距（页面顶部/底部、大模块） |

**代码示例（WXSS）：**

```css
/* 间距工具类 */
.m-xs { margin: 4px; }
.m-sm { margin: 8px; }
.m-md { margin: 16px; }
.m-lg { margin: 24px; }
. m-xl { margin: 32px; }

. mt-xs { margin-top: 4px; }
.mt-sm { margin-top: 8px; }
.mt-md { margin-top: 16px; }
.mt-lg { margin-top: 24px; }
.mt-xl { margin-top: 32px; }

.p-xs { padding: 4px; }
.p-sm { padding: 8px; }
.p-md { padding: 16px; }
.p-lg { padding: 24px; }
.p-xl { padding: 32px; }
```

---

### 5.2 页面边距

| 位置 | 数值 | 说明 |
|-----|------|------|
| 页面左右边距 | 16px | 内容区域距离屏幕边缘 |
| 页面顶部安全区 | 12px | 距离导航栏底部 |
| 页面底部安全区 | 12px | 距离 Tab 栏顶部 |
| 卡片间距 | 12px | 卡片与卡片之间 |

---

### 5.3 布局网格

**屏幕宽度：** 750rpx（微信小程序设计稿标准）

**换算关系：**
- 设计稿 750rpx = 设备宽度
- iPhone 6/7/8：375px 物理像素 = 750rpx
- 1rpx = 0.5px（在 iPhone 6/7/8 上）

**布局建议：**
- 内容区宽度：750rpx - 32rpx（左右各 16rpx）= 718rpx
- 卡片宽度：718rpx
- 双列布局：每列 (718rpx - 间距) / 2

---

## 6. 组件规范

### 6.1 按钮（Button）

#### 主按钮（Primary Button）

**样式：**
- 高度：44px（88rpx）
- 圆角：8px（16rpx）
- 背景色：`#07C160`
- 文字色：`#FFFFFF`
- 字号：16px（32rpx）
- 字重：Medium (500)

**状态：**
- 默认：背景 `#07C160`
- 按下（Active）：背景 `#06AD56`（主色加深）
- 禁用（Disabled）：背景 `#EEEEEE`，文字 `#CCCCCC`

**代码示例（WXML + WXSS）：**

```xml
<!-- WXML -->
<button class="btn-primary">确认打卡</button>
<button class="btn-primary" disabled>已禁用</button>
```

```css
/* WXSS */
.btn-primary {
  width: 100%;
  height:  88rpx;
  background:  #07C160;
  color: #FFFFFF;
  font-size: 32rpx;
  font-weight: 500;
  border-radius: 16rpx;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-primary:active {
  background: #06AD56;
}

.btn-primary[disabled] {
  background: #EEEEEE;
  color: #CCCCCC;
}
```

---

#### 次要按钮（Secondary Button）

**样式：**
- 高度：44px（88rpx）
- 圆角：8px（16rpx）
- 背景色：`#FFFFFF`
- 边框：1px `#07C160`
- 文字色：`#07C160`
- 字号：16px（32rpx）

**代码示例：**

```xml
<button class="btn-secondary">取消</button>
```

```css
.btn-secondary {
  width:  100%;
  height: 88rpx;
  background:  #FFFFFF;
  color:  #07C160;
  font-size: 32rpx;
  border-radius: 16rpx;
  border: 2rpx solid #07C160;
}

.btn-secondary:active {
  background: #F0FFF4;
}
```

---

#### 文字按钮（Text Button）

**样式：**
- 高度：auto
- 背景：透明
- 文字色：`#576B95`
- 字号：14px（28rpx）
- 无边框、无背景

**代码示例：**

```xml
<button class="btn-text">查看详情</button>
```

```css
.btn-text {
  background: transparent;
  color: #576B95;
  font-size: 28rpx;
  border: none;
  padding: 0;
}

.btn-text:active {
  color: #07C160;
}
```

---

#### 小按钮（Small Button）

**样式：**
- 高度：32px（64rpx）
- 圆角：6px（12rpx）
- 内边距：8px 16px（16rpx 32rpx）
- 字号：14px（28rpx）

**代码示例：**

```xml
<button class="btn-small">去打卡</button>
```

```css
.btn-small {
  height: 64rpx;
  padding: 0 32rpx;
  background: #07C160;
  color: #FFFFFF;
  font-size: 28rpx;
  border-radius: 12rpx;
  border: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
```

---

### 6.2 输入框（Input）

#### 基础输入框

**样式：**
- 高度：44px（88rpx）
- 圆角：8px（16rpx）
- 边框：1px `#E5E5E5`
- 内边距：12px 16px（24rpx 32rpx）
- 字号：16px（32rpx）
- placeholder 颜色：`#CCCCCC`

**状态：**
- 默认：边框 `#E5E5E5`
- 聚焦（Focus）：边框 `#07C160`
- 错误：边框 `#FA5151`

**代码示例：**

```xml
<input class="input-base" placeholder="请输入内容" />
<input class="input-base input-error" placeholder="错误状态" />
```

```css
.input-base {
  width: 100%;
  height: 88rpx;
  padding: 0 32rpx;
  background: #FFFFFF;
  border: 2rpx solid #E5E5E5;
  border-radius: 16rpx;
  font-size: 32rpx;
  color: #333333;
}

.input-base:focus {
  border-color: #07C160;
}

.input-error {
  border-color: #FA5151;
}

/* placeholder 样式 */
.input-base::placeholder {
  color: #CCCCCC;
}
```

---

#### 带标签输入框

**布局：**
- 标签宽度：80px（160rpx）
- 标签与输入框间距：8px（16rpx）

**代码示例：**

```xml
<view class="input-group">
  <text class="input-label">计划名称</text>
  <input class="input-base" placeholder="请输入计划名称" />
</view>
```

```css
.input-group {
  display: flex;
  align-items: center;
  margin-bottom: 32rpx;
}

.input-label {
  width: 160rpx;
  font-size: 28rpx;
  color: #333333;
  margin-right: 16rpx;
}
```

---

### 6.3 卡片（Card）

#### 基础卡片

**样式：**
- 背景色：`#FFFFFF`
- 圆角：12px（24rpx）
- 内边距：16px（32rpx）
- 阴影：`0 2px 8px rgba(0,0,0,0.08)`

**代码示例：**

```xml
<view class="card">
  <text class="card-title">卡片标题</text>
  <text class="card-content">卡片内容</text>
</view>
```

```css
.card {
  background: #FFFFFF;
  border-radius: 24rpx;
  padding: 32rpx;
  box-shadow: 0 4rpx 16rpx rgba(0,0,0,0.08);
  margin-bottom: 24rpx;
}

.card-title {
  font-size: 32rpx;
  font-weight: 700;
  color: #333333;
  margin-bottom: 16rpx;
}

. card-content {
  font-size: 28rpx;
  color: #666666;
  line-height: 1.6;
}
```

---

#### 任务卡片（Task Card）

**特点：**
- 左侧色条（4px 宽，维度配色）
- 可展开/收起
- 显示完成状态

**代码示例：**

```xml
<view class="task-card" data-category="sport">
  <view class="task-card-header">
    <view class="task-card-left">
      <view class="task-icon">🏃</view>
      <text class="task-title">运动</text>
    </view>
    <text class="task-status">1/2 已完成</text>
  </view>
  <!-- 展开内容 -->
  <view class="task-card-body">
    <!-- 任务列表 -->
  </view>
</view>
```

```css
.task-card {
  background: #FFFFFF;
  border-radius:  24rpx;
  padding: 32rpx;
  margin-bottom: 24rpx;
  border-left: 8rpx solid #FF6B6B; /* 运动维度色 */
}

.task-card[data-category="diet"] {
  border-left-color: #4ECDC4;
}

.task-card-header {
  display: flex;
  justify-content: space-between;
  align-items:  center;
}

.task-card-left {
  display: flex;
  align-items: center;
}

.task-icon {
  width: 64rpx;
  height: 64rpx;
  font-size: 48rpx;
  margin-right: 16rpx;
}

.task-title {
  font-size: 32rpx;
  font-weight: 700;
  color: #333333;
}

.task-status {
  font-size:  24rpx;
  color: #999999;
}
```

---

### 6.4 进度条（Progress Bar）

**样式：**
- 高度：8px（16rpx）
- 圆角：4px（8rpx）
- 背景色（轨道）：`#E5E5E5`
- 填充色：`#07C160`

**代码示例：**

```xml
<view class="progress-bar">
  <view class="progress-fill" style="width: 60%;"></view>
</view>
```

```css
.progress-bar {
  width: 100%;
  height:  16rpx;
  background: #E5E5E5;
  border-radius: 8rpx;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: #07C160;
  border-radius: 8rpx;
  transition: width 0.3s ease;
}
```

---

### 6.5 开关（Switch）

**样式：**
- 使用微信原生 `<switch>` 组件
- 选中色：`#07C160`

**代码示例：**

```xml
<switch checked color="#07C160" />
```

---

### 6.6 标签（Tag）

**样式：**
- 高度：24px（48rpx）
- 圆角：4px（8rpx）
- 内边距：4px 8px（8rpx 16rpx）
- 字号：12px（24rpx）

**类型：**

| 类型 | 背景色 | 文字色 | 使用场景 |
|-----|--------|--------|---------|
| 默认 | `#F0F0F0` | `#666666` | 普通标签 |
| 主要 | `#E6F7ED` | `#07C160` | 强调标签 |
| 警告 | `#FFF7E6` | `#FF9500` | 警告标签 |
| 错误 | `#FFEDED` | `#FA5151` | 错误标签 |

**代码示例：**

```xml
<view class="tag">默认</view>
<view class="tag tag-primary">主要</view>
<view class="tag tag-warning">警告</view>
```

```css
.tag {
  display: inline-flex;
  height: 48rpx;
  padding: 0 16rpx;
  background: #F0F0F0;
  color: #666666;
  font-size: 24rpx;
  border-radius: 8rpx;
  align-items: center;
  justify-content: center;
}

.tag-primary {
  background: #E6F7ED;
  color: #07C160;
}

.tag-warning {
  background: #FFF7E6;
  color: #FF9500;
}
```

---

### 6.7 弹窗（Modal）

#### 底部弹窗（Bottom Sheet）

**样式：**
- 从底部弹出
- 圆角：顶部 16px（32rpx）
- 背景：`#FFFFFF`
- 遮罩：`rgba(0,0,0,0.5)`

**代码示例：**

```xml
<!-- 遮罩 -->
<view class="modal-mask" wx:if="{{showModal}}" bindtap="hideModal"></view>

<!-- 弹窗内容 -->
<view class="modal-bottom" wx:if="{{showModal}}">
  <view class="modal-header">
    <text class="modal-title">打卡：运动30分钟</text>
  </view>
  <view class="modal-body">
    <!-- 表单内容 -->
  </view>
  <view class="modal-footer">
    <button class="btn-primary">确认打卡</button>
  </view>
</view>
```

```css
.modal-mask {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height:  100%;
  background: rgba(0,0,0,0.5);
  z-index: 999;
}

. modal-bottom {
  position:  fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  background:  #FFFFFF;
  border-radius: 32rpx 32rpx 0 0;
  padding: 32rpx;
  z-index: 1000;
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
}

.modal-header {
  margin-bottom: 32rpx;
}

.modal-title {
  font-size: 36rpx;
  font-weight: 700;
  color:  #333333;
}

. modal-body {
  margin-bottom: 32rpx;
}

.modal-footer {
  padding-top: 32rpx;
  border-top: 2rpx solid #EEEEEE;
}
```

---

#### 居中弹窗（Alert）

**样式：**
- 宽度：80%（最大 600rpx）
- 圆角：16px（32rpx）
- 背景：`#FFFFFF`

**代码示例：**

```xml
<view class="modal-mask" wx:if="{{showAlert}}"></view>
<view class="modal-center" wx:if="{{showAlert}}">
  <view class="modal-content">
    <text class="modal-title">提示</text>
    <text class="modal-message">确定要删除这个计划吗？</text>
  </view>
  <view class="modal-actions">
    <button class="btn-text">取消</button>
    <button class="btn-text text-error">删除</button>
  </view>
</view>
```

```css
.modal-center {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 80%;
  max-width: 600rpx;
  background: #FFFFFF;
  border-radius: 32rpx;
  padding: 48rpx 32rpx 32rpx;
  z-index: 1000;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform:  translate(-50%, -50%) scale(0.9);
  }
  to {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }
}

.modal-content {
  text-align: center;
  margin-bottom: 32rpx;
}

.modal-message {
  font-size: 28rpx;
  color: #666666;
  line-height:  1.6;
  margin-top: 16rpx;
}

.modal-actions {
  display: flex;
  justify-content: space-around;
  padding-top: 32rpx;
  border-top: 2rpx solid #EEEEEE;
}

.text-error {
  color: #FA5151;
}
```

---

### 6.8 Toast 提示

**使用微信原生 `wx.showToast`，配置统一样式：**

```javascript
// 成功提示
wx.showToast({
  title: '打卡成功',
  icon: 'success',
  duration: 2000
});

// 错误提示
wx.showToast({
  title: '打卡失败',
  icon:  'error',
  duration:  2000
});

// 自定义提示（无图标）
wx.showToast({
  title: '今天已经完成所有任务啦',
  icon: 'none',
  duration: 2000
});
```

---

## 7. 页面布局规范

### 7.1 通用页面结构

```
┌─────────────────────────────────────┐
│  导航栏（微信原生）                  │
├─────────────────────────────────────┤
│  页面内容区                          │
│  - 顶部边距：12px（24rpx）          │
│  - 左右边距：16px（32rpx）          │
│  - 底部边距：12px（24rpx）          │
│                                      │
│  [卡片1]                             │
│  [卡片2]                             │
│  [卡片3]                             │
│                                      │
├─────────────────────────────────────┤
│  Tab 栏（如有）                      │
└─────────────────────────────────────┘
```

### 7.2 首页布局

```
┌─────────────────────────────────────┐
│  [小教练区域]                        │
│  - 头像 + 今日一句话                 │
│  - 高度：120px（240rpx）            │
├─────────────────────────────────────┤
│  [今日概览卡片]                      │
│  - 完成进度 + 连续天数               │
├─────────────────────────────────────┤
│  [任务卡片1 - 运动]                  │
│  [任务卡片2 - 饮食]                  │
│  [任务卡片3 - 睡眠]                  │
│  ...                                  │
├─────────────────────────────────────┤
│  [查看数据按钮]                      │
└─────────────────────────────────────┘
```

### 7.3 列表页布局

**场景：** 计划总览页、历史记录页

```css
/* 列表项样式 */
.list-item {
  background: #FFFFFF;
  padding: 32rpx;
  margin-bottom: 2rpx; /* 分割线效果 */
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.list-item:active {
  background: #F7F8FA;
}
```

---

## 8. 动画与反馈

### 8.1 动画原则

- **流畅：** 所有动画时长控制在 200-400ms
- **自然：** 使用缓动函数 `ease-in-out` 或 `cubic-bezier`
- **有意义：** 动画服务于用户理解，而非炫技

### 8.2 常用动画

#### 淡入（Fade In）

```css
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.fade-in {
  animation: fadeIn 0.3s ease;
}
```

#### 滑入（Slide In）

```css
@keyframes slideInUp {
  from {
    transform: translateY(20rpx);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.slide-in-up {
  animation: slideInUp 0.3s ease;
}
```

#### 缩放（Scale）

```css
@keyframes scaleIn {
  from {
    transform: scale(0.9);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

.scale-in {
  animation: scaleIn 0.3s ease;
}
```

### 8.3 按钮点击反馈

**微信小程序提供 `hover-class`：**

```xml
<button class="btn-primary" hover-class="btn-hover">
  确认打卡
</button>
```

```css
.btn-hover {
  opacity: 0.8;
  transform: scale(0.98);
}
```

### 8.4 打卡成功动画

**小教练表情 + 气泡文字：**

```xml
<view class="success-feedback" wx:if="{{showSuccess}}">
  <image class="coach-avatar" src="/assets/coach-happy.png"></image>
  <view class="bubble">
    <text>太棒了！又战胜了一次懒惰~</text>
  </view>
</view>
```

```css
.success-feedback {
  position: fixed;
  top: 40%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 9999;
  animation: bounceIn 0.5s ease;
}

@keyframes bounceIn {
  0% {
    transform: translate(-50%, -50%) scale(0);
  }
  50% {
    transform: translate(-50%, -50%) scale(1.1);
  }
  100% {
    transform: translate(-50%, -50%) scale(1);
  }
}

.coach-avatar {
  width: 120rpx;
  height: 120rpx;
  display: block;
  margin: 0 auto 16rpx;
}

. bubble {
  background: #FFFFFF;
  padding: 24rpx 32rpx;
  border-radius: 16rpx;
  box-shadow: 0 8rpx 24rpx rgba(0,0,0,0.15);
  font-size: 28rpx;
  color: #333333;
  text-align: center;
}
```

---

## 9. 小教练形象设计

### 9.1 形象定位

**角色：** 一个友善、积极、可爱的拟人化陪伴者

**性格：**
- 鼓励型（而非批评型）
- 温暖、有耐心
- 幽默、不说教

### 9.2 视觉设计

**头像样式：**
- 圆形头像，直径 60–80px（120–160rpx）
- 简单卡通风格（扁平化或轻微立体）
- 配色与主色调协调

**表情设计（建议 5 种）：**

| 表情 | 使用场景 | 表情描述 |
|-----|---------|---------|
| 开心 | 打卡成功、全部完成 | 笑脸、竖大拇指 |
| 加油 | 部分完成、鼓励继续 | 握拳、坚定眼神 |
| 安慰 | 未完成、连续中断 | 温柔微笑、拍肩 |
| 惊喜 | 连续打卡 7 天、30 天 | 睁大眼睛、惊叹 |
| 思考 | 引导设置计划 | 托腮、灯泡 |

### 9.3 文案风格

**原则：**
- 简短（15 字以内）
- 积极正向
- 口语化
- 第二人称（你）

**示例文案：**

| 场景 | 文案 |
|-----|------|
| 早上首次打开 | 早安！今天也要元气满满哦~ |
| 完成所有任务 | 太棒了！今天完美收官！ |
| 完成部分任务 | 已经很不错了，再坚持一下！ |
| 未完成任务 | 今天有点累吗？休息一下也没关系 |
| 连续打卡 7 天 | 哇！连续 7 天，你真的很厉害！ |
| 会员到期提醒 | 会员快到期啦，记得续费哦~ |

### 9.4 形象文件规范

**文件命名：**
- `coach-happy.png`（开心）
- `coach-cheer.png`（加油）
- `coach-comfort.png`（安慰）
- `coach-surprise.png`（惊喜）
- `coach-think.png`（思考）

**文件尺寸：**
- 设计稿：256px × 256px
- 提供 @2x（512px）和 @3x（768px）

---

## 10. 适配与响应式

### 10.1 屏幕尺寸适配

**微信小程序使用 rpx 单位自动适配：**

- 1rpx = 屏幕宽度 / 750
- 设计稿按 750rpx 宽度设计
- 物理像素与 rpx 自动换算

### 10.2 安全区域适配

**适配刘海屏、全面屏：**

```css
/* 顶部安全区域 */
page {
  padding-top: constant(safe-area-inset-top); /* iOS 11. 2 */
  padding-top: env(safe-area-inset-top); /* iOS 11.2+ */
}

/* 底部安全区域 */
. page-bottom {
  padding-bottom: constant(safe-area-inset-bottom);
  padding-bottom: env(safe-area-inset-bottom);
}
```

### 10.3 字体大小适配

**不建议字体使用 rpx，避免在大屏设备上字体过大：**

```css
/* 推荐 */
. text {
  font-size: 16px; /* 固定像素 */
}

/* 不推荐 */
.text {
  font-size: 32rpx; /* 会随屏幕变大 */
}
```

---

## 附录：WXSS 工具类库

```css
/* ========== 颜色工具类 ========== */
.text-primary { color: #333333; }
.text-secondary { color: #666666; }
.text-tertiary { color: #999999; }
.text-placeholder { color: #CCCCCC; }
.text-white { color: #FFFFFF; }
.text-success { color: #07C160; }
.text-warning { color: #FF9500; }
.text-error { color: #FA5151; }

. bg-primary { background: #07C160; }
.bg-white { background: #FFFFFF; }
.bg-gray { background: #F7F8FA; }

/* ========== 字体工具类 ========== */
. text-h1 { font-size: 20px; font-weight: 700; }
.text-h2 { font-size: 18px; font-weight: 700; }
.text-h3 { font-size: 16px; font-weight: 500; }
.text-body1 { font-size: 16px; font-weight: 400; }
.text-body2 { font-size: 14px; font-weight: 400; }
.text-caption { font-size: 12px; font-weight: 400; }

. text-bold { font-weight: 700; }
.text-medium { font-weight: 500; }

.text-center { text-align: center; }
.text-left { text-align: left; }
.text-right { text-align: right; }

/* ========== 间距工具类 ========== */
.m-0 { margin: 0; }
.m-xs { margin: 4px; }
.m-sm { margin: 8px; }
.m-md { margin: 16px; }
.m-lg { margin: 24px; }
.m-xl { margin: 32px; }

.mt-0 { margin-top:  0; }
.mt-xs { margin-top: 4px; }
.mt-sm { margin-top: 8px; }
.mt-md { margin-top: 16px; }
.mt-lg { margin-top: 24px; }
.mt-xl { margin-top: 32px; }

.mb-0 { margin-bottom: 0; }
. mb-xs { margin-bottom:  4px; }
.mb-sm { margin-bottom: 8px; }
.mb-md { margin-bottom: 16px; }
.mb-lg { margin-bottom: 24px; }
.mb-xl { margin-bottom: 32px; }

.p-0 { padding: 0; }
.p-xs { padding: 4px; }
.p-sm { padding: 8px; }
.p-md { padding: 16px; }
.p-lg { padding: 24px; }
. p-xl { padding: 32px; }

/* ========== 布局工具类 ========== */
.flex { display: flex; }
.flex-column { flex-direction: column; }
.flex-center { justify-content: center; align-items: center; }
. flex-between { justify-content: space-between; }
.flex-around { justify-content: space-around; }
.flex-align-center { align-items: center; }
.flex-1 { flex: 1; }

/* ========== 圆角工具类 ========== */
.radius-sm { border-radius: 4px; }
.radius-md { border-radius: 8px; }
.radius-lg { border-radius: 12px; }
.radius-xl { border-radius: 16px; }
.radius-round { border-radius: 50%; }

/* ========== 阴影工具类 ========== */
.shadow-sm { box-shadow: 0 1px 4px rgba(0,0,0,0.08); }
.shadow-md { box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
.shadow-lg { box-shadow: 0 4px 16px rgba(0,0,0,0.12); }
```

---

## 结语

本 UI 设计规范文档旨在为「自律教练」小程序提供统一、清晰、可执行的设计标准。

**使用建议：**

1. **设计师：** 使用本规范创建高保真设计稿，确保所有组件、颜色、字体符合规范
2. **前端开发：** 直接使用文档中的 WXSS 代码，复制粘贴即可快速搭建页面
3. **产品经理：** 在验收时对照本规范，确保实现效果符合设计要求

**后续迭代：**

- V2.0 可加入深色模式（Dark Mode）
- 可根据实际开发反馈调整部分数值
- 可扩展更多组件（如日历选择器、图表组件等）

---

**如有任何疑问或建议，欢迎反馈！**
