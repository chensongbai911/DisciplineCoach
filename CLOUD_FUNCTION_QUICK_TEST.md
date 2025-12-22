# 云函数快速测试参考卡

## 快速开始

### 方式1：云开发控制台测试（推荐）

1. 打开微信开发者工具 → 云开发
2. 选择函数 → 点击「测试」
3. 复制下面的测试用例，粘贴到「输入」框
4. 点击「运行」

---

## 7个云函数测试用例

### 1️⃣ user 云函数

#### 测试1：用户登录
```json
{
  "action": "login"
}
```

**预期返回：**
```json
{
  "success": true,
  "data": {
    "_id": "用户ID",
    "nickName": "用户昵称",
    "isVip": false,
    "isNewUser": true
  }
}
```

#### 测试2：获取用户信息
```json
{
  "action": "getUserInfo"
}
```

#### 测试3：检查会员状态
```json
{
  "action": "checkMemberStatus"
}
```

---

### 2️⃣ plan 云函数

#### 测试1：创建计划
```json
{
  "action": "create",
  "params": {
    "name": "每日运动",
    "category": "health",
    "target": 10,
    "unit": "km",
    "frequency": "daily"
  }
}
```

**预期返回：**
```json
{
  "success": true,
  "data": {
    "_id": "计划ID",
    "name": "每日运动",
    "createdAt": "时间戳"
  }
}
```

#### 测试2：获取计划列表
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
      "_id": "计划ID",
      "name": "每日运动",
      "status": "active",
      "completionToday": 0,
      "targetToday": 10
    }
  ]
}
```

#### 测试3：获取计划详情
```json
{
  "action": "detail",
  "params": {
    "planId": "计划ID"
  }
}
```

#### 测试4：更新计划
```json
{
  "action": "update",
  "params": {
    "planId": "计划ID",
    "name": "每日运动（更新）",
    "target": 15
  }
}
```

#### 测试5：删除计划
```json
{
  "action": "delete",
  "params": {
    "planId": "计划ID"
  }
}
```

---

### 3️⃣ record 云函数

#### 测试1：创建打卡记录
```json
{
  "action": "create",
  "params": {
    "planId": "计划ID",
    "completion": 8.5,
    "note": "完成了大部分"
  }
}
```

**预期返回：**
```json
{
  "success": true,
  "data": {
    "_id": "记录ID",
    "planId": "计划ID",
    "date": "2024-01-15",
    "completion": 8.5,
    "createdAt": "时间戳"
  }
}
```

#### 测试2：获取今日记录
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
      "_id": "记录ID",
      "planId": "计划ID",
      "completion": 8.5,
      "date": "2024-01-15"
    }
  ]
}
```

#### 测试3：获取历史记录
```json
{
  "action": "getHistory",
  "params": {
    "planId": "计划ID",
    "days": 7
  }
}
```

#### 测试4：删除记录
```json
{
  "action": "delete",
  "params": {
    "recordId": "记录ID"
  }
}
```

---

### 4️⃣ statistics 云函数

#### 测试1：获取统计概览
```json
{
  "action": "getOverview"
}
```

**预期返回：**
```json
{
  "success": true,
  "data": {
    "totalPlans": 3,
    "completedToday": 2,
    "completionRate": 66.7,
    "currentStreak": 5,
    "longestStreak": 12,
    "badges": ["新手上路", "坚持者"]
  }
}
```

#### 测试2：获取趋势数据
```json
{
  "action": "getTrend",
  "params": {
    "planId": "计划ID",
    "days": 30
  }
}
```

#### 测试3：获取热力图
```json
{
  "action": "getHeatmap",
  "params": {
    "year": 2024,
    "month": 1
  }
}
```

---

### 5️⃣ payment 云函数

#### 测试1：创建订单
```json
{
  "action": "createOrder",
  "params": {
    "planId": "计划ID",
    "type": "subscription",
    "period": "month"
  }
}
```

**预期返回：**
```json
{
  "success": true,
  "data": {
    "orderNo": "订单号",
    "amount": 6800,
    "currency": "CNY"
  }
}
```

#### 测试2：获取订单列表
```json
{
  "action": "list",
  "params": {
    "status": "pending"
  }
}
```

#### 测试3：查询订单状态
```json
{
  "action": "queryOrder",
  "params": {
    "orderNo": "订单号"
  }
}
```

---

### 6️⃣ feedback 云函数

#### 测试1：提交反馈
```json
{
  "action": "submit",
  "params": {
    "type": "bug",
    "title": "首页加载缓慢",
    "content": "首页需要5秒才能加载完成",
    "screenshots": []
  }
}
```

**预期返回：**
```json
{
  "success": true,
  "data": {
    "_id": "反馈ID",
    "status": "pending",
    "createdAt": "时间戳"
  }
}
```

#### 测试2：获取反馈列表
```json
{
  "action": "list",
  "params": {
    "status": "pending"
  }
}
```

---

### 7️⃣ message 云函数

#### 测试1：发送提醒
```json
{
  "action": "sendReminder",
  "params": {
    "planId": "计划ID",
    "type": "daily_check_in"
  }
}
```

**预期返回：**
```json
{
  "success": true,
  "data": {
    "messageId": "消息ID",
    "sentAt": "时间戳"
  }
}
```

#### 测试2：获取消息列表
```json
{
  "action": "list",
  "params": {
    "limit": 10
  }
}
```

---

## 快速测试步骤

### 第一轮：基础功能测试（10分钟）

1. **user → 测试1**：测试登录是否成功
2. **plan → 测试1**：创建一个测试计划
3. **record → 测试1**：为该计划创建一条打卡记录
4. **statistics → 测试1**：验证数据统计是否正确

### 第二轮：完整流程测试（15分钟）

1. **plan → 测试2**：获取计划列表（应该看到刚创建的计划）
2. **record → 测试2**：获取今日记录（应该看到刚创建的记录）
3. **plan → 测试4**：修改计划
4. **plan → 测试5**：删除测试计划

### 第三轮：业务逻辑测试（15分钟）

1. **statistics → 测试2 & 3**：获取趋势和热力图数据
2. **payment → 测试1**：尝试创建订单
3. **feedback → 测试1**：提交反馈

---

## 常见测试问题

### Q1: 测试时提示 "Permission denied"

**原因：** 集合权限配置不允许直接访问

**解决方案：**
- ✅ 正常现象！这证明权限配置正确
- 在云开发控制台通过云函数间接访问，而不是直接访问集合

### Q2: 测试返回 "undefined" 或空数据

**原因：** 云函数可能需要先创建数据

**解决方案：**
1. 先运行 `plan.create` 创建测试数据
2. 再运行其他查询函数

### Q3: 测试超时（>10秒）

**原因：** 云函数执行耗时过长，或网络连接问题

**解决方案：**
1. 检查云函数代码是否有死循环
2. 查看云函数日志（控制台 > 云函数 > 日志）
3. 检查网络连接是否正常

---

## 测试成功的标志

✅ 所有 7 个云函数都能成功调用
✅ 返回值包含 `"success": true`
✅ 数据正确保存到数据库
✅ 统计数据计算准确
✅ 没有错误日志输出

---

## 下一步

所有测试通过后：

1. 在小程序中进行端到端测试
2. 测试完整的用户流程：登录 → 创建计划 → 打卡 → 查看数据
3. 测试支付流程
4. 优化性能和用户体验

---

**提示：** 在云开发控制台中保存常用的测试用例，方便重复测试。
