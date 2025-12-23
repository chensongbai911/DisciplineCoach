# 🎯 快速开始指南 - 自律教练 V2.1

**最后更新**: 2025-01-09
**版本**: V2.1 Final
**读者**: 开发者/维护者

---

## 📚 文档导航

### 新手入门
1. **[START_HERE.md](START_HERE.md)** - 项目概览和初始化
2. **[QUICK_REFERENCE_CARD.md](QUICK_REFERENCE_CARD.md)** - 快速参考卡

### 需求和优化
3. **[OPTIMIZATION_REQUIREMENTS_V2.md](OPTIMIZATION_REQUIREMENTS_V2.md)** - 详细需求清单
4. **[OPTIMIZATION_COMPLETE.md](OPTIMIZATION_COMPLETE.md)** - 优化总结

### 部署和维护
5. **[FINAL_OPTIMIZATION_REPORT.md](FINAL_OPTIMIZATION_REPORT.md)** - 最终报告
6. **[DEPLOYMENT_CHECKLIST_V2.md](DEPLOYMENT_CHECKLIST_V2.md)** - 部署清单 ⬅️ 你在这里

### 设计规范
7. **[UI设计规范文档.md](UI设计规范文档.md)** - UI 设计指南
8. **[WECHAT_DEVELOPER_TOOLS_GUIDE.md](WECHAT_DEVELOPER_TOOLS_GUIDE.md)** - 工具使用

---

## 🚀 快速开始 (5 分钟)

### 1️⃣ 环境配置

```bash
# 1. 克隆项目
git clone <repo-url>
cd DisciplineCoach

# 2. 安装微信开发者工具
# 下载: https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html
# 建议版本: 1.05.2308262 或更高

# 3. 打开项目
# 微信开发者工具 > 打开 > 选择 miniprogram 目录

# 4. 配置云环境
# 设置 > 云开发 > 配置
# Cloud Env ID: cloud1-0g29mlsv3d4ca637
```

### 2️⃣ 项目结构

```
miniprogram/
├── app.js                    # 应用入口 + 全局缓存管理
├── app.json                  # 应用配置 + 路由
├── app.wxss                  # 全局样式
├── components/               # 可复用组件
│   ├── custom-loading/       # 自定义加载组件 ⭐ 新增
│   ├── swipe-action/         # 滑动操作组件
│   └── app-image/            # 图片组件 (WebP 支持)
├── pages/                    # 页面文件
│   ├── index/                # 首页 (打卡)
│   ├── plan/                 # 计划管理
│   ├── record/               # 打卡记录
│   ├── statistics/           # 数据统计
│   ├── user/                 # 用户中心
│   ├── about/                # 关于页面
│   ├── feedback/             # 反馈页面
│   ├── vip/                  # VIP 页面
│   └── onboarding/           # 新手引导
├── utils/                    # 工具库 (核心)
│   ├── api.js                # API 层 (缓存集成) ⭐ 更新
│   ├── storage.js            # 存储工具 (CacheManager) ⭐ 新增
│   ├── loading.js            # 加载状态管理 ⭐ 新增
│   ├── error-handler.js      # 错误处理 ⭐ 新增
│   ├── performance.js        # 性能监控 ⭐ 新增
│   ├── statistics.js         # 数据分析 ⭐ 新增
│   ├── export.js             # 数据导出 ⭐ 新增
│   ├── constants.js          # 配置常量 ⭐ 新增
│   ├── vibrate.js            # 振动反馈
│   ├── reminder.js           # 提醒功能
│   ├── common.js             # 通用函数
│   ├── date.js               # 日期处理
│   └── validator.js          # 数据验证
├── assets/                   # 静态资源
│   ├── images/               # 图片 (WebP 格式)
│   └── icons/                # 图标
└── styles/                   # 全局样式
    └── common.wxss           # 通用样式

cloudfunctions/              # 云函数
├── user/                    # 用户相关
├── plan/                    # 计划相关
├── record/                  # 记录相关
├── message/                 # 消息推送
├── statistics/              # 统计相关
├── payment/                 # 支付相关
└── feedback/                # 反馈相关
```

### 3️⃣ 核心流程

#### 📱 应用启动流程
```
app.js onLaunch
  ├─ 云开发初始化 (wx.cloud.init)
  ├─ 网络监听 (initNetworkMonitor)
  ├─ 字体加载 (loadIconFont)
  ├─ 图片预加载 (preloadImages) ⭐
  └─ 登录检查 (checkLogin)
      ├─ 获取 openid
      ├─ 预加载数据 (preloadData) ⭐
      └─ 初始化全局数据
```

#### 🏠 首页数据流
```
pages/index/index.js onLoad
  ├─ 检查缓存 (app.getCachedData) ⭐
  │  └─ 如果有缓存，立即渲染
  │     └─ 后台静默更新 (silentRefreshData)
  │
  └─ 否则，加载数据
     ├─ 并行请求 (Promise.all)
     │  ├─ planAPI.list() → CacheManager 5分钟缓存 ⭐
     │  └─ recordAPI.getTodayRecords() → 30分钟缓存
     │
     ├─ 缓存更新 (app.setCachedData) ⭐
     └─ 数据处理和渲染
```

#### 💾 缓存失效流程
```
API 写操作
  ├─ planAPI.create()
  │  └─ CacheManager.remove('plans_list') ⭐
  │
  ├─ recordAPI.create()
  │  ├─ CacheManager.remove('today_records')
  │  └─ CacheManager.remove('stats_overview')
  │
  └─ 自动失效 → 下次请求新数据
```

#### 🚨 错误处理流程
```
API 调用异常
  ├─ parseError() → 错误类型识别 ⭐
  ├─ handleError() → 用户友好提示 + 振动反馈 ⭐
  ├─ reportError() → 错误上报
  └─ 降级方案
     ├─ 网络错误 → 使用缓存
     ├─ 云函数错误 → 提示重试
     └─ 业务错误 → 中文错误提示
```

---

## 🛠️ 常用开发任务

### 添加新页面

```bash
# 1. 创建页面目录
mkdir miniprogram/pages/new-page

# 2. 创建页面文件
touch miniprogram/pages/new-page/{index.js,index.json,index.wxml,index.wxss}

# 3. 修改 app.json，添加页面路由
{
  "pages": [
    "pages/new-page/index"  // 添加这行
  ]
}

# 4. 编写页面代码
# pages/new-page/index.js
Page({
  data: {},
  onLoad() {
    console.log('New page loaded')
  }
})
```

### 添加新的 API 方法

```javascript
// miniprogram/utils/api.js
const newAPI = {
  // 获取数据
  get(params) {
    return callFunction('newFunction', {
      action: 'get',
      ...params
    }, {
      useCache: true,           // 启用缓存 ⭐
      cacheKey: 'new_data',
      expire: CACHE_EXPIRE.MEDIUM  // 30分钟
    })
  },

  // 创建数据 (写操作，清除缓存)
  create(data) {
    return callFunction('newFunction', {
      action: 'create',
      ...data
    }).then(result => {
      CacheManager.remove('new_data')  // 清除缓存 ⭐
      return result
    })
  }
}

module.exports = { newAPI }
```

### 调用 API with 错误处理

```javascript
// 在页面中使用
const { newAPI } = require('../../utils/api.js')
const { handleError } = require('../../utils/error-handler.js')

async loadData() {
  try {
    const data = await newAPI.get({ id: 123 })
    this.processData(data)
  } catch (error) {
    // 统一错误处理 ⭐
    handleError(error, {
      showToast: true,
      context: 'loadData'
    })
  }
}
```

### 添加性能监控

```javascript
// miniprogram/utils/performance.js
const { startTimer, endTimer, measureAsync } = require('../../utils/performance.js')

// 同步操作计时
startTimer('myOperation')
// ... 执行操作 ...
endTimer('myOperation')

// 异步操作计时
await measureAsync('myAsyncOp', async () => {
  return await someAsyncFunction()
})

// 获取性能数据
const summary = getPerformanceSummary()
console.log(`平均响应时间: ${summary.avg}ms`)
```

### 使用自定义加载组件

```wxml
<!-- pages/my-page/index.wxml -->
<custom-loading
  wx:if="{{isLoading}}"
  text="加载中..."
  show="{{isLoading}}"
/>

<view wx:else>
  <!-- 页面内容 -->
</view>
```

```javascript
// pages/my-page/index.js
import { showLoading, hideLoading } from '../../utils/loading.js'

async loadData() {
  showLoading('loadData', '数据加载中...')
  try {
    const data = await api.get()
    this.setData({ data })
  } finally {
    hideLoading('loadData')
  }
}
```

---

## 📊 缓存管理实战

### 检查缓存状态

```javascript
// 在浏览器控制台 (WeChat DevTools)
const cacheInfo = CacheManager.getInfo()
console.log(`缓存项数: ${cacheInfo.count}`)
console.log(`缓存大小: ${(cacheInfo.totalSize / 1024).toFixed(2)} KB`)
console.log(`缓存键: ${JSON.stringify(cacheInfo.keys)}`)
```

### 手动清除缓存

```javascript
// 清除特定缓存
CacheManager.remove('plans_list')

// 清除所有缓存
CacheManager.clearAll()

// 在用户中心清除缓存
handleClearCache() {
  CacheManager.clearAll()  // ⭐
  app.clearCache()
  wx.showToast({ title: '缓存已清除' })
}
```

### 监控缓存命中率

```javascript
// 在 api.js 中统计
let cacheHits = 0
let cacheMisses = 0

function callFunction(name, data, options) {
  if (options.useCache) {
    const cached = CacheManager.get(options.cacheKey)
    if (cached) {
      cacheHits++  // 缓存命中
    } else {
      cacheMisses++  // 缓存未命中
    }
  }

  // 定期输出指标
  const total = cacheHits + cacheMisses
  if (total % 10 === 0) {
    console.log(`缓存命中率: ${(cacheHits / total * 100).toFixed(2)}%`)
  }
}
```

---

## 🐛 调试技巧

### 启用详细日志

```javascript
// miniprogram/app.js
// 开发环境详细日志
const isDev = !wx.getAccountInfoSync().miniProgram.envVersion === 'release'

if (isDev) {
  // 拦截 console.log
  const originalLog = console.log
  console.log = function(...args) {
    originalLog.apply(console, [`[DEBUG]`, ...args])
  }
}
```

### 检查网络请求

```javascript
// WeChat DevTools > 网络 > 检查云函数调用
// 或使用 wx.request 拦截
const originalRequest = wx.request
wx.request = function(options) {
  console.log(`[Network] ${options.url}`, options.data)
  return originalRequest.call(this, {
    ...options,
    success(res) {
      console.log(`[Response] ${options.url}`, res.data)
      options.success(res)
    }
  })
}
```

### 模拟离线环境

```javascript
// WeChat DevTools > 工具 > 场景模拟 > 网络状态
// 选择"无网络"模拟离线

// 或代码模拟
app.globalData.isOnline = false
loadData()  // 会自动使用缓存
```

### 性能分析

```javascript
// 获取性能数据
const perf = performance.getPerformanceData()
console.table(perf)

// 获取性能汇总
const summary = performance.getPerformanceSummary()
console.log('性能统计:', summary)
// 输出: { count, total, avg, min, max }
```

---

## 📖 重要概念解释

### 🔄 缓存策略

| 级别 | 时间 | 用途 | 何时清除 |
|------|------|------|---------|
| SHORT | 5分钟 | 计划列表 (频繁变更) | 创建/更新/删除计划 |
| MEDIUM | 30分钟 | 打卡记录 (需要时效性) | 创建/更新记录 |
| LONG | 1小时 | 统计数据 (相对稳定) | 手动清除 |
| VERY_LONG | 24小时 | 用户信息 (长期存储) | 手动清除 |

### ⚡ 错误类型

| 类型 | 原因 | 处理 |
|------|------|------|
| NETWORK | 网络连接失败 | 使用缓存，提示重试 |
| AUTH | 登录已过期 | 重新登录 |
| BUSINESS | 业务逻辑错误 | 中文错误提示 |
| VALIDATION | 输入数据错误 | 字段验证提示 |
| PERMISSION | 无权限访问 | 提示权限限制 |

### 📈 性能指标

| 指标 | 目标 | 用途 |
|------|------|------|
| 首屏加载 | < 2s | 用户体验 |
| API 响应 | < 3s | 网络性能 |
| 缓存命中率 | > 70% | 缓存效果 |
| 内存占用 | < 100MB | 设备性能 |

---

## 🎓 学习资源

### 微信官方文档
- [小程序开发文档](https://developers.weixin.qq.com/miniprogram/dev/framework/)
- [云开发文档](https://developers.weixin.qq.com/miniprogram/dev/wxcloud/basis/getting-started.html)
- [组件库](https://developers.weixin.qq.com/miniprogram/dev/component/)

### 外部资源
- [WebP 格式优化](https://developers.google.com/speed/webp)
- [Performance API](https://developer.mozilla.org/en-US/docs/Web/API/Performance)
- [微信开发者工具使用](https://developers.weixin.qq.com/miniprogram/dev/devtools/devtools.html)

### 项目文档
- [OPTIMIZATION_REQUIREMENTS_V2.md](OPTIMIZATION_REQUIREMENTS_V2.md) - 详细需求
- [OPTIMIZATION_COMPLETE.md](OPTIMIZATION_COMPLETE.md) - 完成总结
- [UI设计规范文档.md](UI设计规范文档.md) - 设计规范

---

## 💡 常见问题 (FAQ)

### Q: 缓存为什么没有生效？
A: 检查以下几点：
1. 确保使用了正确的 cacheKey
2. 检查 CACHE_EXPIRE 时间是否合理
3. 查看日志 [Cache] 输出
4. 手动调用 CacheManager.get('key') 验证

### Q: 如何在不清除缓存的情况下获取最新数据？
A: 使用 silentRefreshData() 后台更新：
```javascript
// 使用缓存立即渲染
const cached = CacheManager.get('key')
this.setData({ data: cached })

// 后台静默更新
api.get().then(data => {
  CacheManager.set('key', data)
  this.setData({ data })
})
```

### Q: 云函数响应超时怎么办？
A: 检查以下几点：
1. 云函数冷启动 (首次调用较慢)
2. 网络连接状况
3. 云函数代码性能
4. 建议预留 10s 超时时间

### Q: 如何测试离线场景？
A: 使用 WeChat DevTools 模拟器：
1. 工具 > 场景模拟
2. 选择"无网络"
3. 应用会自动使用缓存数据

### Q: WebP 不支持怎么办？
A: app-image 组件已内置自动降级：
```wxml
<app-image src="/assets/images/logo.webp" />
<!-- 自动尝试 .webp，不支持则降级到 .png 或 .jpg -->
```

---

## 📞 获取帮助

### 遇到问题？
1. 检查 [DEPLOYMENT_CHECKLIST_V2.md](DEPLOYMENT_CHECKLIST_V2.md)
2. 查看相关代码注释
3. 运行性能监控诊断
4. 查看实时日志

### 需要功能？
1. 参考 [OPTIMIZATION_REQUIREMENTS_V2.md](OPTIMIZATION_REQUIREMENTS_V2.md)
2. 查看 P2 计划表
3. 提交功能建议

### 发现 Bug？
1. 收集重现步骤
2. 检查浏览器控制台
3. 查看实时日志
4. 提交 Issue

---

**祝开发愉快！🎉**

**快速导航:**
- [部署清单](DEPLOYMENT_CHECKLIST_V2.md) ← 准备上线
- [优化完成报告](FINAL_OPTIMIZATION_REPORT.md) ← 成果展示
- [快速参考卡](QUICK_REFERENCE_CARD.md) ← 速查表

**下一步:**
1. 理解项目结构 (本文档)
2. 运行开发环境 (WeChat DevTools)
3. 查看需求文档 (OPTIMIZATION_REQUIREMENTS_V2.md)
4. 进行部署检查 (DEPLOYMENT_CHECKLIST_V2.md)
