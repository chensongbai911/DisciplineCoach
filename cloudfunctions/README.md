# 云函数部署说明

## 云函数列表

本项目包含7个云函数模块，分别负责不同的业务功能：

### 1. user - 用户管理
**功能**：用户登录、信息管理、会员状态检查
- `login` - 用户登录（首次登录创建用户）
- `getUserInfo` - 获取用户信息
- `updateUserInfo` - 更新用户信息
- `updateSettings` - 更新用户设置
- `checkMemberStatus` - 检查会员状态

### 2. plan - 计划管理
**功能**：任务计划的CRUD操作
- `create` - 创建计划
- `update` - 更新计划
- `delete` - 删除计划（软删除）
- `list` - 获取计划列表
- `detail` - 获取计划详情
- `toggle` - 启用/禁用计划
- `batchUpdate` - 批量更新计划

### 3. record - 打卡记录
**功能**：打卡记录的CRUD及统计
- `create` - 创建打卡记录
- `update` - 更新打卡记录
- `delete` - 删除打卡记录
- `getTodayRecords` - 获取今日记录
- `getByDate` - 获取指定日期记录
- `getByRange` - 获取日期范围内记录
- `calculateStreak` - 计算连续打卡天数

### 4. statistics - 数据统计
**功能**：数据分析和统计
- `getOverview` - 获取总览数据
- `getDimensionStats` - 获取维度统计
- `getTrend` - 获取趋势数据
- `getBadges` - 获取成就徽章
- `getHeatmap` - 获取热力图数据
- `exportData` - 导出数据

### 5. payment - 支付管理
**功能**：订单和支付处理
- `createOrder` - 创建订单
- `getOrderList` - 获取订单列表
- `getOrderDetail` - 获取订单详情
- `unifiedOrder` - 微信统一下单
- `queryOrder` - 查询订单状态
- `handlePaymentNotify` - 处理支付回调

### 6. feedback - 反馈管理
**功能**：用户反馈的提交和管理
- `submit` - 提交反馈
- `list` - 获取反馈列表
- `detail` - 获取反馈详情
- `reply` - 回复反馈（管理员）
- `updateStatus` - 更新反馈状态（管理员）

### 7. message - 消息通知
**功能**：订阅消息推送和教练消息
- `sendDailyReminder` - 发送每日打卡提醒
- `sendStreakCongrats` - 发送连续打卡祝贺
- `sendVipExpireNotice` - 发送会员到期提醒
- `getCoachMessage` - 获取教练消息
- `batchSendReminder` - 批量发送提醒（定时任务）

## 部署步骤

### 1. 安装依赖

在每个云函数目录下执行：

```bash
cd cloudfunctions/user
npm install

cd ../plan
npm install

cd ../record
npm install

cd ../statistics
npm install

cd ../payment
npm install

cd ../feedback
npm install

cd ../message
npm install
```

### 2. 上传云函数

在微信开发者工具中：
1. 右键点击 `cloudfunctions` 目录
2. 选择"同步云函数列表"
3. 右键点击每个云函数目录
4. 选择"上传并部署：云端安装依赖"

或使用命令行工具：

```bash
# 安装微信开发者工具命令行
npm install -g @cloudbase/cli

# 登录
tcb login

# 部署所有云函数
tcb functions:deploy user
tcb functions:deploy plan
tcb functions:deploy record
tcb functions:deploy statistics
tcb functions:deploy payment
tcb functions:deploy feedback
tcb functions:deploy message
```

### 3. 配置云函数

#### payment 云函数配置
需要在微信支付商户平台配置：
- 商户号
- API密钥
- 支付回调地址

#### feedback 和 message 云函数配置
需要在小程序后台配置订阅消息模板：
- `FEEDBACK_REPLY_TEMPLATE_ID` - 反馈回复通知
- `DAILY_REMINDER_TEMPLATE_ID` - 每日打卡提醒
- `STREAK_CONGRATS_TEMPLATE_ID` - 连续打卡祝贺
- `VIP_EXPIRE_TEMPLATE_ID` - 会员到期提醒

### 4. 设置定时触发器

为 `message` 云函数设置定时触发器：

在云开发控制台：
1. 进入云函数 > message
2. 点击"定时触发器"
3. 添加触发器：
   - 触发周期：每天
   - 触发时间：根据需要设置（如每小时检查一次）
   - 触发方法：`batchSendReminder`

或使用配置文件（在 message 目录下创建 `config.json`）：

```json
{
  "triggers": [
    {
      "name": "dailyReminder",
      "type": "timer",
      "config": "0 0 */1 * * * *"
    }
  ]
}
```

## 数据库配置

在云开发控制台创建以下集合：

### 1. users - 用户集合
索引：
- `_openid`（唯一）

### 2. plans - 计划集合
索引：
- `_openid`
- `category`
- `status`

### 3. records - 记录集合
索引：
- `_openid`
- `date`
- `planId`
- 复合索引：`_openid + date`

### 4. orders - 订单集合
索引：
- `_openid`
- `orderNo`（唯一）
- `status`

### 5. feedbacks - 反馈集合
索引：
- `_openid`
- `status`
- `createTime`

## 权限配置

建议为每个集合设置以下权限：

```json
{
  "read": false,
  "write": false
}
```

所有数据操作通过云函数进行，确保数据安全。

## 测试云函数

在微信开发者工具的云函数控制台，可以测试各个函数：

```javascript
// 测试 user.login
{
  "action": "login",
  "userInfo": {
    "nickName": "测试用户",
    "avatarUrl": "https://example.com/avatar.png"
  }
}

// 测试 plan.list
{
  "action": "list",
  "params": {
    "status": "active"
  }
}

// 测试 record.getTodayRecords
{
  "action": "getTodayRecords"
}
```

## 注意事项

1. **环境变量**：云函数使用 `cloud.DYNAMIC_CURRENT_ENV` 自动匹配当前环境
2. **错误处理**：所有云函数都包含完整的错误处理和日志记录
3. **性能优化**：
   - 记录集合使用复合索引提升查询性能
   - 统计数据进行缓存处理
   - 批量操作使用 Promise.all 并发执行
4. **安全性**：
   - 使用 `wxContext.OPENID` 确保用户数据隔离
   - 所有数据操作都验证用户权限
   - 敏感操作（如支付）添加额外验证

## 监控和日志

在云开发控制台可以查看：
- 云函数调用统计
- 错误日志
- 性能指标

建议定期检查日志，及时发现和解决问题。
