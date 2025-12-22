# 图片资源放置说明

⚠️ **重要提示**：当前项目使用 Emoji 表情符号作为兜底方案，所有图片均为**可选**。
但为了更好的视觉效果，建议提供以下图片资源。

## 📥 快速生成占位图片

如果暂时没有设计资源，可以使用以下在线工具快速生成占位图片：

- **Placeholder.com**: https://placeholder.com/
- **DummyImage**: https://dummyimage.com/
- **Lorem Picsum**: https://picsum.photos/

## 必需图片（建议尺寸/格式）

请将以下图片放置到本目录（`miniprogram/assets/images/`）：

### 核心图标
- **coach-happy.png** - 教练头像/表情
  - 尺寸：128x128 PNG
  - 用途：首页小教练、成功反馈动画
  - 兜底：🤖 emoji
  - 建议：可爱的机器人或教练形象

- **logo.png** - 应用 Logo
  - 尺寸：256x256 PNG（透明底）
  - 用途：关于页面、分享图标
  - 兜底：📱 emoji
  - 建议：简洁的品牌标识

### 空状态插图
- **empty.png** - 通用空状态插图
  - 尺寸：240x240 PNG
  - 用途：首页无任务时展示
  - 兜底：📝 emoji
  - 建议：轻松愉快的插画风格

- **empty-task.png** - 任务配置空状态
  - 尺寸：240x240 PNG
  - 用途：计划详情页无任务时展示
  - 兜底：🗒️ emoji
  - 建议：待办清单相关图标

### 用户头像
- **default-avatar.png** - 默认头像
  - 尺寸：128x128 PNG（圆形）
  - 用途：未授权用户的默认头像
  - 兜底：👤 emoji
  - 建议：简约的人物剪影

## 可选图片（用于分享）

### 分享封面
- **share-cover.png** - 通用分享图
  - 尺寸：750x600 PNG
  - 用途：分享给好友时的封面图
  - 示例内容：App名称 + Slogan

- **share-vip.png** - 会员页分享图
  - 尺寸：750x600 PNG
  - 用途：分享会员权益时的封面图
  - 示例内容：会员特权展示

## 可选图片（分类/维度图标）

如需为五大维度提供专属图标（替代 Emoji），可添加：

- **category-exercise.png** - 运动维度 (96x96 PNG)
- **category-diet.png** - 饮食维度 (96x96 PNG)
- **category-sleep.png** - 睡眠维度 (96x96 PNG)
- **category-reading.png** - 阅读维度 (96x96 PNG)
- **category-study.png** - 学习维度 (96x96 PNG)

## 📝 命名规范

- ✅ 全小写、连字符分隔：`coach-happy.png`
- ✅ 语义化命名：`empty-task.png`
- ❌ 避免中文文件名：~~`教练头像.png`~~
- ❌ 避免空格：~~`coach happy.png`~~

## 🎨 设计建议

### 风格统一
- 采用扁平化/插画风格
- 色彩与品牌色保持一致（薄荷绿 #4FD1C5、天蓝色 #3182CE）
- 圆角风格，现代清新

### 尺寸说明
- 所有尺寸均为 **2倍图**（@2x）
- 小程序会自动适配不同设备
- 建议使用 PNG 格式保证清晰度

### 优化建议
- 压缩图片大小（推荐使用 TinyPNG）
- 保持图片总大小 < 2MB
- 透明底使用 PNG，其他可用 JPG

## 🔧 使用方式

代码中已使用 `<app-image>` 组件自动兜底：

```xml
<app-image
  src="/assets/images/coach-happy.png"
  size="120"
  radius="9999"
  fallbackText="🤖"
/>
```

- **有图片**：显示真实图片
- **无图片**：显示 Emoji 表情
- **不会报错**：开发和测试不受影响

## ✨ 当前状态

| 图片 | 状态 | 兜底方案 |
|-----|------|---------|
| coach-happy.png | ⚠️ 待添加 | 🤖 |
| empty.png | ⚠️ 待添加 | 📝 |
| empty-task.png | ⚠️ 待添加 | 🗒️ |
| default-avatar.png | ⚠️ 待添加 | 👤 |
| logo.png | ⚠️ 待添加 | 📱 |

**一旦将对应文件放入本目录，页面将自动显示真实图片。**

## 📞 技术支持

如需设计资源或有疑问，可以：
1. 使用在线占位图工具快速生成
2. 联系设计师提供专业设计
3. 暂时使用 Emoji 兜底方案继续开发
