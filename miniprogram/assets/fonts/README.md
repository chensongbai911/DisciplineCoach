# 字体文件

## iconfont.woff2

阿里巴巴图标字体文件，用于显示应用中的图标。

- **来源**: https://at.alicdn.com/t/c/font_5094872_60e7nx4r6mr.woff2
- **更新时间**: 2025-12-22
- **文件大小**: ~20KB
- **字体族**: iconfont

## 使用说明

字体在 `app.js` 中全局加载：

```javascript
wx.loadFontFace({
  family: 'iconfont',
  source: 'url("/assets/fonts/iconfont.woff2")',
  global: true
})
```

## 更新字体

当图标库更新后，重新下载最新版本：

```bash
# PowerShell
Invoke-WebRequest -Uri "https://at.alicdn.com/t/c/font_5094872_xxxxxxx.woff2?t=xxxxxxxxxx" -OutFile "miniprogram/assets/fonts/iconfont.woff2"
```

## 兜底方案

字体加载失败时，`app-icon` 组件会自动降级使用：
1. PNG 图标 (`/assets/icons/*.png`)
2. Emoji 字符
