# 首页（index）前后端集成指南

## 概述

首页是用户进入小程序后看到的第一个页面，也是使用频率最高的页面。它整合了：
- 用户登录和身份验证
- 计划数据加载和显示
- 今日打卡记录
- 数据统计（完成度、连续天数、徽章）
- 打卡流程

---

## 数据流架构

```
小程序启动
    ↓
app.js: 检查登录状态 → 自动登录
    ↓
首页 onLoad: 初始化日期显示
    ↓
首页 onShow: 并行加载 → 计划列表 + 今日记录
    ↓
云函数 plan.list: 获取所有活跃计划
云函数 record.getTodayRecords: 获取今日打卡记录
    ↓
前端处理数据: 合并、分类、计算统计
    ↓
渲染UI: 显示维度和任务列表
    ↓
用户交互: 点击"去打卡"
    ↓
打卡弹窗: 输入完成度和备注
    ↓
云函数 record.create: 创建打卡记录
    ↓
更新UI: 刷新计划完成度和数据统计
```

---

## 核心代码分析

### 1. 页面生命周期

#### onLoad（页面加载）

```javascript
onLoad() {
  this.initPage()
}
```

**作用：**
- 初始化页面显示（日期、欢迎语等）
- 加载静态数据
- 不需要等待云函数调用

#### onShow（页面显示）

```javascript
onShow() {
  this.loadData()
}
```

**作用：**
- 每次页面显示时都加载数据（重要！）
- 确保用户看到最新数据
- 用户从其他页面返回时会自动刷新

**为什么用 onShow 而不是 onLoad？**
- onLoad 只调用一次（第一次进入页面）
- onShow 每次显示都调用（用户返回页面时）
- 这样用户在其他页面操作后，回到首页会自动刷新

### 2. 数据加载流程

#### loadData 函数（核心）

```javascript
async loadData() {
  wx.showLoading({ title: '加载中...' })

  try {
    // 🔑 关键：并行加载两个云函数
    const [plans, records] = await Promise.all([
      planAPI.list(),                    // 获取所有计划
      recordAPI.getTodayRecords()        // 获取今日打卡记录
    ])

    this.processData(plans, records)     // 处理数据
    this.loadStreakDays()                // 加载连续天数
    this.updateCoachMessage()            // 更新教练消息

    wx.hideLoading()
  } catch (err) {
    wx.hideLoading()
    console.error('加载数据失败:', err)
    wx.showToast({ title: '加载失败', icon: 'none' })
  }
}
```

**要点：**
1. ✅ 使用 `Promise.all()` 并行加载，提高性能
2. ✅ 始终使用 try/catch 处理错误
3. ✅ 显示和隐藏加载动画
4. ✅ 显示错误提示

#### planAPI.list() 应该返回什么

```javascript
// 期望的返回数据结构
{
  success: true,
  data: [
    {
      "_id": "plan123",
      "name": "每日运动",
      "category": "health",        // 或 "study", "reading" 等
      "target": 10,
      "unit": "km",
      "frequency": "daily",
      "status": "active",

      // 今天的统计（如果云函数计算）
      "todayCompletion": 5,        // 今天已完成值
      "todayRecord": null          // 今天的打卡记录（如果有）
    },
    // ... 更多计划
  ]
}
```

**需要修改云函数的地方：**

如果 `plan.list()` 没有返回 `todayCompletion`，需要在 `processData` 中手动计算：

```javascript
processData(plans, records) {
  // 创建记录映射：planId → record
  const recordMap = {}
  records.forEach(record => {
    recordMap[record.planId] = record
  })

  // 为每个计划添加今日数据
  const processedPlans = plans.map(plan => ({
    ...plan,
    todayRecord: recordMap[plan._id] || null,
    todayCompletion: recordMap[plan._id]?.completion || 0
  }))

  // 分组和排序
  this.groupByDimension(processedPlans)
}
```

#### recordAPI.getTodayRecords() 应该返回什么

```javascript
// 期望的返回数据结构
{
  success: true,
  data: [
    {
      "_id": "record456",
      "planId": "plan123",
      "date": "2024-01-15",
      "completion": 5,             // 完成数值
      "note": "跑步了5km",
      "createdAt": 1705276800000
    },
    // ... 更多今日记录
  ]
}
```

### 3. 数据处理

#### processData 函数

```javascript
processData(plans, records) {
  // 步骤1：构建记录映射
  const recordMap = {}
  records.forEach(record => {
    recordMap[record.planId] = record
  })

  // 步骤2：为计划添加记录信息
  const enrichedPlans = plans.map(plan => {
    const record = recordMap[plan._id]
    return {
      ...plan,
      todayRecord: record,
      // 根据记录计算完成度
      progress: record ? (record.completion / plan.target * 100) : 0,
      isCompleted: record && record.completion >= plan.target
    }
  })

  // 步骤3：分类
  const dimensions = this.groupByDimension(enrichedPlans)

  // 步骤4：计算总数
  const completedTasks = enrichedPlans.filter(p => p.isCompleted).length
  const totalTasks = enrichedPlans.length

  // 步骤5：更新页面数据
  this.setData({
    dimensions,
    completedTasks,
    totalTasks,
    progressPercent: Math.round((completedTasks / totalTasks) * 100) || 0
  })
}
```

#### groupByDimension 函数

```javascript
groupByDimension(plans) {
  // 定义维度映射
  const categoryMap = {
    'health': { name: '运动', icon: '🏃', color: '#FF6B6B' },
    'diet': { name: '饮食', icon: '🍎', color: '#4ECDC4' },
    'sleep': { name: '睡眠', icon: '🌙', color: '#95E1D3' },
    'reading': { name: '阅读', icon: '📖', color: '#FFD93D' },
    'study': { name: '学习', icon: '📝', color: '#A8E6CF' }
  }

  // 按维度分组
  const grouped = {}
  plans.forEach(plan => {
    const categoryKey = plan.category || 'other'
    const categoryInfo = categoryMap[categoryKey] || {
      name: plan.category,
      icon: '📌'
    }

    if (!grouped[categoryKey]) {
      grouped[categoryKey] = { ...categoryInfo, tasks: [] }
    }

    grouped[categoryKey].tasks.push(plan)
  })

  // 返回维度数组
  return Object.values(grouped)
}
```

### 4. 打卡流程

#### 打开打卡弹窗

```javascript
openCheckin(e) {
  const task = e.currentTarget.dataset.task

  this.setData({
    showCheckinModal: true,
    currentTask: task,
    checkinValue: task.todayRecord?.completion || '',
    checkinRemark: task.todayRecord?.note || ''
  })
}
```

#### 提交打卡

```javascript
async submitCheckin() {
  const { currentTask, checkinValue, checkinRemark } = this.data

  // 验证
  if (!checkinValue) {
    wx.showToast({ title: '请输入完成值', icon: 'none' })
    return
  }

  const value = parseFloat(checkinValue)
  if (isNaN(value) || value < 0) {
    wx.showToast({ title: '请输入有效数值', icon: 'none' })
    return
  }

  wx.showLoading({ title: '提交中...' })

  try {
    // 调用云函数创建记录
    const result = await recordAPI.create({
      planId: currentTask._id,
      completion: value,
      note: checkinRemark
    })

    wx.hideLoading()

    if (result.success) {
      // 关闭弹窗
      this.setData({ showCheckinModal: false })

      // 显示成功反馈
      wx.showToast({
        title: '打卡成功！',
        icon: 'success',
        duration: 1500
      })

      // 延时刷新数据（等待云函数完全执行）
      setTimeout(() => {
        this.loadData()
      }, 500)
    } else {
      wx.showToast({ title: result.msg || '提交失败', icon: 'none' })
    }
  } catch (err) {
    wx.hideLoading()
    console.error('提交打卡失败:', err)
    wx.showToast({ title: '提交失败', icon: 'none' })
  }
}
```

---

## 页面 WXML（视图）

### 基本结构

```wxml
<!-- 顶部日期和欢迎语 -->
<view class="header">
  <text class="date">{{ currentDate }}</text>
  <text class="coach-message">{{ coachMessage }}</text>
</view>

<!-- 统计卡片 -->
<view class="stats-card">
  <view class="stat-item">
    <text class="label">今日完成</text>
    <text class="value">{{ completedTasks }}/{{ totalTasks }}</text>
  </view>
  <view class="stat-item">
    <text class="label">完成度</text>
    <text class="value">{{ progressPercent }}%</text>
  </view>
  <view class="stat-item">
    <text class="label">连续天数</text>
    <text class="value">{{ streakDays }}</text>
  </view>
</view>

<!-- 进度条 -->
<view class="progress-bar">
  <view
    class="progress-fill"
    style="width: {{ progressPercent }}%"
  ></view>
</view>

<!-- 维度列表 -->
<view class="dimensions">
  <view
    class="dimension-card"
    wx:for="{{ dimensions }}"
    wx:key="_id"
  >
    <view class="dimension-header">
      <text class="icon">{{ item.icon }}</text>
      <text class="name">{{ item.name }}</text>
    </view>

    <!-- 任务列表 -->
    <view class="tasks">
      <view
        class="task-item"
        wx:for="{{ item.tasks }}"
        wx:key="_id"
        data-task="{{ item }}"
        bindtap="openCheckin"
      >
        <view class="task-left">
          <text class="task-name">{{ item.name }}</text>
          <text class="task-target">目标：{{ item.target }}{{ item.unit }}</text>
        </view>

        <view class="task-right">
          <text class="task-status">
            {{ item.todayRecord ? item.todayRecord.completion + item.unit : '未打卡' }}
          </text>
          <view class="task-progress">
            <view
              class="task-fill"
              style="width: {{ item.progress || 0 }}%"
            ></view>
          </view>
        </view>
      </view>
    </view>
  </view>
</view>

<!-- 打卡弹窗 -->
<view class="modal" wx:if="{{ showCheckinModal }}" bindtap="closeCheckin">
  <view class="modal-content" catchtap>
    <text class="modal-title">{{ currentTask.name }}</text>

    <input
      class="modal-input"
      type="number"
      placeholder="请输入完成值"
      value="{{ checkinValue }}"
      bindinput="onCheckinValueChange"
      bindfocus="onInputFocus"
    />

    <textarea
      class="modal-textarea"
      placeholder="备注（可选）"
      value="{{ checkinRemark }}"
      bindinput="onCheckinRemarkChange"
    ></textarea>

    <view class="modal-buttons">
      <button class="btn-cancel" bindtap="closeCheckin">取消</button>
      <button class="btn-confirm" bindtap="submitCheckin">确认打卡</button>
    </view>
  </view>
</view>
```

---

## 测试清单

### 环境准备

- [ ] 云函数已部署：user, plan, record, statistics
- [ ] 数据库集合已创建：users, plans, records
- [ ] 小程序 AppID 和云环境 ID 已配置
- [ ] WeChat 开发者工具已打开云开发控制台

### 单步测试

#### 步骤1：测试登录（app.js）
```
操作：关闭小程序，重新打开
预期：无错误，自动登录成功
验证：console 中看到 "[login] 登录成功" 日志
```

#### 步骤2：测试计划加载（plan.list）
```
操作：在首页打开开发者工具 Console
预期：显示计划列表（可能为空）
验证：
  - Console 中看到计划数据
  - 如果有计划，应该显示在页面上
  - 如果没有计划，显示"暂无计划"
```

#### 步骤3：测试今日记录加载（record.getTodayRecords）
```
操作：同步骤2
预期：显示今日打卡记录
验证：
  - 如果有打卡，应该显示完成数值
  - 进度条应该根据完成数值计算
```

#### 步骤4：测试打卡流程
```
操作：点击一个任务 → 输入完成值 → 点击"确认打卡"
预期：
  1. 打卡弹窗打开
  2. 输入数值和备注
  3. 点击确认后，弹窗关闭
  4. 页面刷新
  5. 该任务显示已打卡的数值
  6. 进度条更新
```

#### 步骤5：测试编辑打卡
```
操作：再次点击已打卡的任务 → 修改数值 → 确认
预期：
  1. 弹窗打开时，显示之前的数值
  2. 修改后，该任务的完成值更新
```

### 完整流程测试

```
1. 清空所有测试数据
   - 在云开发控制台删除 plans 和 records 集合中的测试数据

2. 创建测试计划
   - 在云开发控制台或通过计划页面创建 2-3 个测试计划
   - 分别在不同维度（运动、阅读、学习）

3. 回到首页，验证：
   - 计划列表正确显示
   - 计划按维度分类
   - 显示"未打卡"状态

4. 打卡测试
   - 打卡第一个计划（完整目标值）
   - 打卡第二个计划（目标的50%）
   - 不打卡第三个计划

5. 验证首页数据
   - 完成度：2/3 (66%)
   - 完成数：2
   - 进度条：66%

6. 编辑打卡
   - 点击已打卡的计划，修改完成值
   - 验证页面自动更新
```

---

## 常见问题排查

### Q1: 首页加载后没有显示计划列表

**可能原因：**
1. 云函数 `plan.list` 没有部署或返回错误
2. 数据库中没有计划数据
3. 前端没有正确处理云函数返回值

**排查步骤：**
1. 在云开发控制台测试 `plan.list` 云函数
2. 在数据库查看是否有 plans 集合和数据
3. 在 Console 查看 API 调用返回值：
   ```javascript
   planAPI.list().then(res => console.log('计划:', res))
   ```

### Q2: 打卡后页面没有更新

**可能原因：**
1. 云函数 `record.create` 执行失败
2. 前端没有刷新数据
3. 缓存问题

**排查步骤：**
1. 检查 Console 中是否有错误
2. 查看云开发控制台中的 `record.create` 日志
3. 强制刷新：在提交打卡后手动调用 `this.loadData()`

### Q3: 完成度显示为 NaN 或 undefined

**可能原因：**
1. 计划目标值为空或 0
2. 完成值数据类型不对（string vs number）

**排查步骤：**
1. 检查 plan 对象的 `target` 字段
2. 在计算进度前进行类型转换：
   ```javascript
   const completion = parseFloat(record.completion) || 0
   const target = parseFloat(plan.target) || 1
   const progress = (completion / target * 100)
   ```

---

## 性能优化建议

### 1. 使用 Promise.all() 并行加载

✅ **推荐：**
```javascript
const [plans, records] = await Promise.all([
  planAPI.list(),
  recordAPI.getTodayRecords()
])
```

❌ **不推荐：**
```javascript
const plans = await planAPI.list()
const records = await recordAPI.getTodayRecords()  // 等待上面完成后才开始
```

### 2. 缓存计划列表

```javascript
// 在 app.js 中缓存
app.planCache = null

// 在首页中使用
async loadData() {
  let plans = app.planCache
  if (!plans) {
    plans = await planAPI.list()
    app.planCache = plans  // 缓存
  }
  // ... 继续处理
}
```

### 3. 分页加载

对于用户可能拥有很多计划的情况，实现分页：

```javascript
loadData(page = 1, limit = 10) {
  planAPI.list({ page, limit })
}
```

### 4. 避免频繁刷新

在 onShow 中添加时间检查，避免频繁刷新：

```javascript
onShow() {
  const now = Date.now()
  const lastRefresh = this.lastRefreshTime || 0

  // 5秒内不重复刷新
  if (now - lastRefresh > 5000) {
    this.loadData()
    this.lastRefreshTime = now
  }
}
```

---

## 下一步工作

1. **完成计划管理页面** (plan/index)
   - 创建、编辑、删除计划
   - 与首页集成

2. **完成统计页面** (statistics/index)
   - 显示周/月统计数据
   - 连续天数计算

3. **支付流程集成** (vip/index)
   - 会员订阅
   - 订单管理

---

**文档版本：** 1.0
**最后更新：** 2024年
**维护者：** DisciplineCoach 开发团队
