# 云函数部署与测试指南

## 一、数据库初始化

### 1.1 创建集合

在微信开发者工具的「云开发」控制台中，创建以下 5 个集合：

#### 1. users（用户表）

```javascript
集合名称：users
索引配置：
- _id（自动）
- _openid（唯一）
```

**样本数据：**

```json
{
  "_openid": "oABC123DEF456...",
  "nickName": "张三",
  "avatarUrl": "https://...",
  "gender": 1,
  "isVip": false,
  "vipExpireDate": null,
  "createTime": new Date("2025-12-22"),
  "lastLoginTime": new Date("2025-12-22"),
  "settings": {
    "dailyReminder": true,
    "reminderTime": "21:00",
    "enableVibrate": true,
    "enableSound": true
  },
  "stats": {
    "totalDays": 0,
    "currentStreak": 0,
    "maxStreak": 0,
    "completionRate": 0
  }
}
```

#### 2. plans（计划表）

```javascript
集合名称：plans
索引配置：
- _id（自动）
- _openid
- category
- status（复合索引：_openid + status）
```

**样本数据：**

```json
{
  "_openid": "oABC123DEF456...",
  "title": "运动30分钟",
  "category": "exercise",
  "targetType": "duration",
  "targetValue": 30,
  "targetUnit": "分钟",
  "reminderTime": "20:00",
  "days": [1, 2, 3, 4, 5, 6, 0],
  "isEnabled": true,
  "status": "active",
  "createTime": new Date("2025-12-22"),
  "updateTime": new Date("2025-12-22"),
  "stats": {
    "totalDays": 0,
    "completedDays": 0,
    "currentStreak": 0,
    "maxStreak": 0,
    "completionRate": 0
  }
}
```

#### 3. records（打卡记录表）

```javascript
集合名称：records
索引配置：
- _id（自动）
- _openid
- date
- planId
- 复合索引：_openid + date
```

**样本数据：**

```json
{
  "_openid": "oABC123DEF456...",
  "planId": "plan_id_123",
  "planTitle": "运动30分钟",
  "category": "exercise",
  "targetType": "duration",
  "targetValue": 30,
  "targetUnit": "分钟",
  "actualValue": 35,
  "isCompleted": true,
  "remark": "跑步+拉伸",
  "date": "2025-12-22",
  "createTime": new Date("2025-12-22T20:30:00"),
  "updateTime": new Date("2025-12-22T20:30:00")
}
```

#### 4. orders（订单表）

```javascript
集合名称：orders
索引配置：
- _id（自动）
- _openid
- orderNo（唯一）
- status
```

**样本数据：**

```json
{
  "_openid": "oABC123DEF456...",
  "orderNo": "ORD20251222001234",
  "orderType": "monthly",
  "price": 18,
  "duration": 1,
  "status": "paid",
  "paymentMethod": "wechat",
  "transactionId": "wx_trade_no_123",
  "createTime": new Date("2025-12-22T10:00:00"),
  "updateTime": new Date("2025-12-22T10:05:00"),
  "expireTime": new Date("2025-12-22T10:30:00")
}
```

#### 5. feedbacks（反馈表）

```javascript
集合名称：feedbacks
索引配置：
- _id（自动）
- _openid
- status
- createTime
```

**样本数据：**

```json
{
  "_openid": "oABC123DEF456...",
  "userNickName": "张三",
  "userAvatarUrl": "https://...",
  "type": "bug",
  "content": "打卡时偶尔会崩溃",
  "contactInfo": "wx_account",
  "images": [],
  "status": "pending",
  "reply": "",
  "replyTime": null,
  "createTime": new Date("2025-12-22T15:00:00"),
  "updateTime": new Date("2025-12-22T15:00:00")
}
```

### 1.2 设置集合权限

在每个集合的「权限」标签页，设置以下规则：

**推荐权限配置（在云函数中统一处理数据访问）：**

```json
{
  "read": false,
  "write": false
}
```

这样所有数据操作都必须通过云函数进行，提高安全性。

---

## 二、云函数部署

### 2.1 部署前检查

1. **验证云函数目录结构：**

```
cloudfunctions/
├── user/
│   ├── index.js
│   ├── package.json
│   └── config.json
├── plan/
│   ├── index.js
│   ├── package.json
│   └── config.json
├── record/
│   ├── index.js
│   ├── package.json
│   └── config.json
├── statistics/
│   ├── index.js
│   ├── package.json
│   └── config.json
├── payment/
│   ├── index.js
│   ├── package.json
│   └── config.json
├── feedback/
│   ├── index.js
│   ├── package.json
│   └── config.json
└── message/
    ├── index.js
    ├── package.json
    └── config.json
```

2. **确认 project.config.json 中的云函数根目录配置：**

```json
{
  "cloudfunctionRoot": "cloudfunctions/"
}
```

### 2.2 上传部署步骤

**在微信开发者工具中：**

1. **右键点击 `cloudfunctions` 目录**
   - 选择「同步云函数列表」

2. **逐个部署云函数：**
   - 右键点击 `user` 文件夹
   - 选择「上传并部署：云端安装依赖（不上传 node_modules）」
   - 等待部署完成，出现 ✓ 提示

3. **重复步骤 2，依次部署：**
   - `plan`
   - `record`
   - `statistics`
   - `payment`
   - `feedback`
   - `message`

4. **验证部署成功：**
   - 云开发控制台 > 云函数
   - 查看所有 7 个函数都显示"已部署"状态

---

## 三、测试云函数

### 3.1 在云开发控制台测试

#### 测试流程：

1. **打开云开发控制台**
   - 点击「云函数」标签
   - 选择 `user` 函数
   - 点击「测试」按钮

2. **测试 user.login**

```json
{
  "action": "login",
  "userInfo": {
    "nickName": "测试用户",
    "avatarUrl": "https://example.com/avatar.png",
    "gender": 1
  }
}
```

**预期返回：**

```json
{
  "success": true,
  "data": {
    "_id": "...",
    "_openid": "...",
    "nickName": "测试用户",
    "isNewUser": true
  }
}
```

#### 测试 plan.list

```json
{
  "action": "list",
  "params": {
    "status": "active"
  }
}
```

**预期返回：**

```json
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "title": "运动30分钟",
      "category": "exercise",
      ...
    }
  ]
}
```

#### 测试 record.getTodayRecords

```json
{
  "action": "getTodayRecords"
}
```

**预期返回：**

```json
{
  "success": true,
  "data": [
    {
      "record_id": "...",
      "planTitle": "运动30分钟",
      "isCompleted": false,
      ...
    }
  ]
}
```

### 3.2 常见错误排查

| 错误 | 原因 | 解决方案 |
|-----|------|--------|
| `env: cloud.DYNAMIC_CURRENT_ENV undefined` | 云环境未初始化 | 检查 `project.config.json` 中的 `cloudfunctionRoot` 配置 |
| `Cannot find module 'wx-server-sdk'` | 依赖未安装 | 右键函数，选择「上传并部署：云端安装依赖」 |
| `Permission denied` | 数据库权限不足 | 检查集合权限配置，确保云函数有读写权限 |
| `Collection not found` | 集合不存在 | 在云开发控制台创建集合 |

---

## 四、前端集成测试

### 4.1 修改 miniprogram/app.js

确保在应用启动时进行登录：

```javascript
// app.js
App({
  async onLaunch() {
    // 初始化云开发环境
    wx.cloud.init({
      env: 'your-env-id', // 替换为实际的云环境ID
      traceUser: true
    })

    // 自动登录
    await this.login()
  },

  async login() {
    try {
      const res = await wx.cloud.callFunction({
        name: 'user',
        data: {
          action: 'login'
        }
      })

      if (res.result.success) {
        this.globalData.userInfo = res.result.data
        wx.setStorageSync('userInfo', res.result.data)
      }
    } catch (err) {
      console.error('[login] 登录失败', err)
    }
  },

  globalData: {
    userInfo: null
  }
})
```

### 4.2 前端调用云函数示例

在任何页面中调用云函数：

```javascript
// pages/index/index.js
Page({
  async onLoad() {
    // 获取今日记录
    try {
      const res = await wx.cloud.callFunction({
        name: 'record',
        data: {
          action: 'getTodayRecords'
        }
      })

      if (res.result.success) {
        this.setData({
          records: res.result.data
        })
      } else {
        wx.showToast({
          title: res.result.errMsg,
          icon: 'error'
        })
      }
    } catch (err) {
      console.error('[getTodayRecords] 获取今日记录失败', err)
      wx.showToast({
        title: '加载失败，请重试',
        icon: 'error'
      })
    }
  }
})
```

### 4.3 完整的打卡流程测试

**步骤：**

1. **首页加载**
   - 调用 `record.getTodayRecords` 获取今日任务
   - 调用 `statistics.getOverview` 获取统计数据

2. **用户点击打卡**
   - 弹出打卡弹窗
   - 用户填写实际完成值

3. **确认打卡**
   - 调用 `record.create` 创建打卡记录
   - 提示用户"打卡成功"

4. **更新页面**
   - 重新加载任务列表
   - 更新完成进度

---

## 五、本地测试检查清单

- [ ] 所有 7 个云函数已上传部署
- [ ] 数据库 5 个集合已创建
- [ ] 集合权限已正确配置
- [ ] 云开发控制台测试通过
- [ ] 前端能成功调用云函数
- [ ] 登录流程正常工作
- [ ] 创建计划功能正常
- [ ] 打卡流程正常
- [ ] 数据统计正常加载
- [ ] 错误处理和用户提示合理

---

## 六、常见问题 FAQ

### Q1: 如何查看云函数日志？

**A:** 在云开发控制台：
1. 点击「云函数」
2. 选择函数
3. 点击「日志」标签
4. 查看实时或历史日志

### Q2: 云函数超时怎么办？

**A:**
- 检查数据库查询是否有索引
- 优化查询条件
- 考虑在云开发控制台增加函数超时时间（最多 60 秒）

### Q3: 支付功能如何测试？

**A:**
- 使用微信支付沙箱环境
- 在 `payment` 云函数中配置支付参数
- 使用测试账户进行支付测试

### Q4: 如何在本地调试云函数？

**A:**
- 微信开发者工具「云调试」功能
- 或在本地使用 `cloud-base/cli` 工具

---

**部署完成后，请运行第一阶段测试，然后开始前后端集成工作。**
