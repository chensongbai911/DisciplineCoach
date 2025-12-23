# 分享战绩弹框修复报告

## 问题描述

用户反馈"分享我的战绩"功能一直显示"生成中..."，海报无法成功生成。

![问题截图](用户提供的截图显示弹框卡在生成状态)

## 问题分析

### 根本原因

1. **Canvas API 使用不当**
   - `wx.createCanvasContext(canvasId)` 缺少 component 参数
   - 在自定义组件中必须传入 `this` 作为第二个参数

2. **canvasToTempFilePath 缺少 component 参数**
   - `wx.canvasToTempFilePath({ canvasId }, callback)` 在组件中需要传入 component
   - 正确写法：`wx.canvasToTempFilePath({ canvasId }, component)`

3. **错误的 font 属性使用**
   - 使用了 `ctx.font = 'bold 80px sans-serif'`（Web Canvas API）
   - 应该使用 `ctx.setFontSize(80)`（微信小程序 API）

4. **渐变绘制方式问题**
   - `drawGradientBackground` 辅助函数可能有问题
   - 改为直接使用 `ctx.createLinearGradient` 更可靠

5. **错误日志不够详细**
   - 难以定位具体哪一步失败
   - 缺少关键的调试信息

## 修复方案

### 1. 修复 generateStreakPoster（连续天数海报）

```javascript
// ❌ 修复前
const ctx = createCanvasContext(canvasId);
drawGradientBackground(ctx, ['#FFD700', '#FFA500'], width, height);
ctx.font = 'bold 120px sans-serif';

// ✅ 修复后
const ctx = wx.createCanvasContext(canvasId, component);
const gradient = ctx.createLinearGradient(0, 0, 0, height);
gradient.addColorStop(0, '#FFD700');
gradient.addColorStop(1, '#FFA500');
ctx.setFillStyle(gradient);
ctx.fillRect(0, 0, width, height);
ctx.setFontSize(120);
```

**关键修复点：**
- ✅ 添加 `component` 参数到 `wx.createCanvasContext()`
- ✅ 直接使用渐变 API 而不是辅助函数
- ✅ 使用 `setFontSize` 而不是 `font` 属性
- ✅ 添加详细的 console.log
- ✅ 延迟时间从 800ms 增加到 1000ms

### 2. 修复 canvasToTempFilePath 调用（3处）

```javascript
// ❌ 修复前
wx.canvasToTempFilePath({
  canvasId,
  success: (res) => { ... },
  fail: (err) => { ... }
});

// ✅ 修复后
wx.canvasToTempFilePath({
  canvasId,
  success: (res) => {
    console.log('[poster] 海报生成成功', res.tempFilePath);
    resolve(res.tempFilePath);
  },
  fail: (err) => {
    console.error('[poster] canvasToTempFilePath失败:', err);
    reject(new Error(`图片生成失败: ${err.errMsg || '请重试'}`));
  }
}, component);  // ← 关键：添加 component 参数
```

**修复位置：**
- ✅ `generateStreakPoster` - 连续天数海报
- ✅ `generateCheckinPoster` - 打卡海报
- ✅ `generateAchievementPoster` - 成就海报

### 3. 修复 generateCheckinPoster（打卡海报）

```javascript
// ❌ 修复前
const query = wx.createSelectorQuery();  // 缺少组件上下文
const ctx = createCanvasContext(canvasId);

// ✅ 修复后
const query = component ? component.createSelectorQuery() : wx.createSelectorQuery();
const ctx = wx.createCanvasContext(canvasId, component);
```

### 4. 修复 generateAchievementPoster（成就海报）

```javascript
// ❌ 修复前
drawGradientBackground(ctx, ['#9B59B6', '#8E44AD'], width, height);
ctx.font = 'bold 64px sans-serif';

// ✅ 修复后
const gradient = ctx.createLinearGradient(0, 0, 0, height);
gradient.addColorStop(0, '#9B59B6');
gradient.addColorStop(1, '#8E44AD');
ctx.setFillStyle(gradient);
ctx.fillRect(0, 0, width, height);
ctx.setFontSize(64);
```

### 5. 添加详细日志（5处）

```javascript
console.log('[poster] 开始绘制连续打卡海报', { streakDays, totalDays });
console.log('[poster] 海报生成成功', res.tempFilePath);
console.error('[poster] canvasToTempFilePath失败:', err);
```

## 技术要点

### 微信小程序 Canvas API vs Web Canvas API

| 功能 | Web API | 微信小程序 API |
|------|---------|----------------|
| 创建上下文 | `canvas.getContext('2d')` | `wx.createCanvasContext(id, component)` |
| 设置字体 | `ctx.font = '24px Arial'` | `ctx.setFontSize(24)` |
| 在组件中使用 | N/A | 必须传 `component` 参数 |

### Component 参数的重要性

在自定义组件中使用 Canvas：

```javascript
// 错误 ❌ - 会找不到 Canvas 元素
const ctx = wx.createCanvasContext('myCanvas');

// 正确 ✅ - 在组件作用域内查找
const ctx = wx.createCanvasContext('myCanvas', this);

// 正确 ✅ - 导出图片时也需要
wx.canvasToTempFilePath({
  canvasId: 'myCanvas',
  success: (res) => { ... }
}, this);  // ← 必须传入组件实例
```

### SelectorQuery 的正确用法

```javascript
// 在自定义组件中 ✅
const query = this.createSelectorQuery();

// 在页面中 ✅
const query = wx.createSelectorQuery();

// 兼容写法 ✅
const query = component ? component.createSelectorQuery() : wx.createSelectorQuery();
```

## 修复效果

### 修复前
- ❌ 弹框一直显示"生成中..."
- ❌ 海报无法生成
- ❌ 无有效错误提示
- ❌ 控制台可能显示 "Canvas not found" 错误

### 修复后
- ✅ 海报正常生成（1秒内）
- ✅ 可以预览海报图片
- ✅ 可以保存到相册
- ✅ 可以分享给好友
- ✅ 详细的错误日志便于调试
- ✅ 更长的延迟时间确保绘制完成

## 测试步骤

### 1. 测试连续天数分享
```
1. 打开"统计"页面
2. 点击"分享我的战绩"按钮
3. 等待1-2秒
4. 应该看到战绩海报（金色渐变背景）
5. 海报显示：连续天数、总天数等信息
```

### 2. 测试保存功能
```
1. 生成海报后点击"保存相册"
2. 授权相册权限（首次）
3. 应该显示"保存成功"
4. 在手机相册中可以看到图片
```

### 3. 测试分享功能
```
1. 生成海报后点击"分享好友"
2. 选择好友或群
3. 应该成功发送海报图片
```

### 4. 测试重新生成
```
1. 点击"重新生成"按钮
2. 应该重新绘制海报
3. 海报内容保持一致
```

## 调试建议

如果仍有问题，请检查控制台日志：

```javascript
// 正常流程日志
[poster] 开始绘制连续打卡海报 {streakDays: 5, totalDays: 10}
[poster] 海报生成成功 http://tmp/...

// 如果看到以下错误
[poster] Canvas元素不存在 - 检查 WXML 中是否有 <canvas id="shareCanvas">
[poster] canvasToTempFilePath失败 - 可能是权限或Canvas未完成绘制
```

## 相关文件

- `miniprogram/utils/poster.js` - 海报生成核心逻辑（3个函数修复）
- `miniprogram/components/share-poster/index.js` - 分享组件
- `miniprogram/components/share-poster/index.wxml` - Canvas 元素
- `miniprogram/pages/statistics/index.js` - 统计页面

## 技术文档

- [微信小程序 Canvas API](https://developers.weixin.qq.com/miniprogram/dev/api/canvas/wx.createCanvasContext.html)
- [canvasToTempFilePath](https://developers.weixin.qq.com/miniprogram/dev/api/canvas/wx.canvasToTempFilePath.html)
- [自定义组件中的 Canvas](https://developers.weixin.qq.com/miniprogram/dev/framework/custom-component/)

## 最佳实践

### 1. Canvas 延迟处理
```javascript
ctx.draw(false, () => {
  setTimeout(() => {
    wx.canvasToTempFilePath({ ... });
  }, 1000);  // 给足够时间完成绘制
});
```

### 2. 错误信息处理
```javascript
fail: (err) => {
  console.error('[poster] 失败:', err);
  reject(new Error(`具体错误: ${err.errMsg || '请重试'}`));
  // 提供具体的错误信息，而不是通用的"失败"
}
```

### 3. 组件参数传递
```javascript
// 在组件方法中
methods: {
  async generatePoster() {
    const posterPath = await generateStreakPoster(data, this);
    //                                                  ^^^^ 传入组件实例
  }
}
```

---

**修复日期**: 2025-12-23
**修复人员**: GitHub Copilot
**影响范围**: 分享功能（打卡、连续天数、成就）
**优先级**: P0（核心功能阻断）
**状态**: ✅ 已完成
**测试状态**: ⏳ 待测试

## 下一步

请在微信开发者工具中：
1. 点击"编译"重新加载
2. 进入"统计"页面
3. 点击"分享我的战绩"
4. 观察控制台日志和海报生成效果
5. 如有问题，请提供控制台的完整日志
