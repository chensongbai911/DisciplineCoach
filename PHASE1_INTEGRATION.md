# 第一阶段：云函数测试与前后端集成 - 详细步骤

## 项目信息

- **环境名称：** cloud1
- **环境ID：** cloud1-0g29mlsv3d4ca637
- **AppID：** wxd7b17df348c02834

---

## 一、部署前准备清单

### 1.1 检查项目配置

- [x] `project.config.json` 已配置：
  - `appid`: wxd7b17df348c02834
  - `cloudfunctionRoot`: cloudfunctions/
  - `envId`: cloud1-0g29mlsv3d4ca637

- [x] `miniprogram/app.js` 已配置：
  - 云环境ID：cloud1-0g29mlsv3d4ca637

### 1.2 检查文件结构

```
DisciplineCoach/
├── project.config.json ✓
├── miniprogram/
│   ├── app.js ✓
│   ├── app.json ✓
│   ├── pages/
│   │   ├── index/index.{wxml,js,wxss,json} ✓
│   │   ├── plan/ ✓
│   │   ├── statistics/ ✓
│   │   ├── user/ ✓
│   │   ├── vip/ ✓
│   │   ├── feedback/ ✓
│   │   ├── about/ ✓
│   │   └── record/day-detail/ ✓
│   └── utils/
│       ├── api.js ✓
│       ├── date.js ✓
│       └── ...
└── cloudfunctions/
    ├── user/ ✓
    ├── plan/ ✓
    ├── record/ ✓
    ├── statistics/ ✓
    ├── payment/ ✓
    ├── feedback/ ✓
    └── message/ ✓
```

---

## 二、在云开发控制台创建数据库集合

### 步骤：

1. **打开微信开发者工具**
   - 点击下方「云开发」按钮
   - 进入云开发控制台

2. **创建数据库集合**

#### 集合 1: users

```
集合名称: users

创建后的索引配置:
- _id (自动)
- _openid (唯一索引)
```

#### 集合 2: plans

```
集合名称: plans

索引配置:
- _id (自动)
- _openid (单字段索引)
- status (单字段索引)
- _openid + status (复合索引)
```

#### 集合 3: records

```
集合名称: records

索引配置:
- _id (自动)
- _openid (单字段索引)
- date (单字段索引)
- planId (单字段索引)
- _openid + date (复合索引)
```

#### 集合 4: orders

```
集合名称: orders

索引配置:
- _id (自动)
- _openid (单字段索引)
- orderNo (唯一索引)
- status (单字段索引)
```

#### 集合 5: feedbacks

```
集合名称: feedbacks

索引配置:
- _id (自动)
- _openid (单字段索引)
- status (单字段索引)
- createTime (单字段索引)
```

### 集合权限配置

对所有集合设置权限：

```json
{
  "read": false,
  "write": false
}
```

这样确保所有数据操作都必须通过云函数进行，提高安全性。

---

## 三、部署云函数

### 步骤：

1. **打开微信开发者工具**

2. **右键点击 `cloudfunctions` 文件夹**
   - 选择「同步云函数列表」
   - 等待同步完成

3. **逐个部署云函数**

对以下每个文件夹依次执行：

```
user → plan → record → statistics → payment → feedback → message
```

**每个函数的部署步骤：**

1. 右键点击函数文件夹（如 `user`）
2. 选择「上传并部署：云端安装依赖（不上传 node_modules）」
3. 等待上传完成（提示 ✓）
4. 在云开发控制台验证部署状态

### 部署完成验证

在云开发控制台检查：
- 云函数列表中应该显示 7 个函数
- 每个函数显示「已部署」状态

---

## 四、测试云函数

### 方法一：在云开发控制台测试（推荐）

#### 4.1 测试 user.login

1. 进入云开发控制台 > 云函数
2. 点击 `user` 函数
3. 点击「测试」按钮
4. 在弹出的测试窗口中，输入：

```json
{
  "action": "login"
}
```

5. 点击「运行」
6. 查看返回结果，应该显示 `success: true`

**预期返回：**

```json
{
  "success": true,
  "data": {
    "_id": "xxx...",
    "nickName": "用户",
    "isVip": false,
    "isNewUser": true
  }
}
```

#### 4.2 测试 plan.list

1. 点击 `plan` 函数
2. 点击「测试」按钮
3. 输入：

```json
{
  "action": "list",
  "params": {
    "status": "active"
  }
}
```

4. 点击「运行」
5. 返回结果应为空数组 `[]`（因为还没有创建计划）

#### 4.3 测试 record.getTodayRecords

1. 点击 `record` 函数
2. 点击「测试」按钮
3. 输入：

```json
{
  "action": "getTodayRecords"
}
```

4. 点击「运行」
5. 返回结果应为空数组 `[]`

---

### 方法二：在小程序中测试

#### 步骤：

1. **在微信开发者工具中打开小程序**

2. **打开开发者工具的控制台**
   - 点击底部「调试」按钮
   - 选择「Console」标签

3. **加载测试脚本**
   - 在小程序中访问任意页面
   - 在 Console 中执行：

```javascript
// 方式1：直接引入并运行
const app = getApp()

// 或者在任意页面的 onLoad 中调用：
// 测试登录
wx.cloud.callFunction({
  name: 'user',
  data: { action: 'login' }
}).then(res => console.log('登录结果:', res.result))
```

4. **查看返回结果**
   - Console 中应显示成功结果

---

## 五、前端集成验证

### 5.1 首页数据加载测试

**操作步骤：**

1. 打开小程序（首页 index）
2. 打开开发者工具的 Console
3. 观察是否有以下日志：

```
[login] 登录成功
[loadData] 加载数据中...
[processData] 处理数据完成
```

4. 验证首页是否显示：
   - 今日日期和问候语
   - 任务完成进度
   - 任务列表（若有计划的话）

### 5.2 打卡流程测试

**前提：** 需要先在云开发控制台中创建测试数据（或通过小程序创建）

**操作步骤：**

1. 在首页中找到一个任务
2. 点击「去打卡」按钮
3. 弹出打卡弹窗，填写实际完成值
4. 点击「确认打卡」
5. 验证：
   - 弹窗关闭
   - 显示成功提示
   - 任务状态更新为已完成

**Console 中应显示：**

```
[record.create] 创建打卡记录...
[record.create] 创建成功: r1234567
[updatePlanStats] 更新计划统计
```

---

## 六、常见错误排查

### 错误 1: "env: cloud1-0g29mlsv3d4ca637 undefined"

**原因：** 云环境ID配置错误

**解决：**
1. 检查 `app.js` 中的 `env` 配置
2. 确保 ID 与云开发控制台一致
3. 重新编译小程序

### 错误 2: "Cannot find module 'wx-server-sdk'"

**原因：** 云函数依赖未安装

**解决：**
1. 在云开发控制台删除该函数
2. 重新上传：右键 > 「上传并部署：云端安装依赖」
3. 等待安装完成

### 错误 3: "Permission denied" 或 "Database not found"

**原因：** 数据库集合不存在或权限不足

**解决：**
1. 检查是否创建了所有 5 个集合
2. 检查集合权限是否正确设置
3. 确保函数部署后再进行操作

### 错误 4: "Cloud function call timeout"

**原因：** 数据库查询耗时过长

**解决：**
1. 检查是否创建了必要的索引
2. 优化数据库查询
3. 在云开发控制台增加函数超时时间

---

## 七、完整的测试清单

### 后端测试

- [ ] user.login 云函数可成功调用
- [ ] user.getUserInfo 云函数可成功调用
- [ ] plan.list 云函数可成功调用
- [ ] plan.create 云函数可成功创建计划
- [ ] record.getTodayRecords 云函数可成功调用
- [ ] record.create 云函数可成功创建记录
- [ ] statistics.getOverview 云函数可成功调用
- [ ] feedback.submit 云函数可成功调用

### 前端测试

- [ ] 小程序启动时自动登录成功
- [ ] 首页加载显示用户信息
- [ ] 首页显示计划列表（如果有的话）
- [ ] 打卡弹窗正常显示
- [ ] 打卡提交后页面更新成功
- [ ] 数据统计页面可以加载数据
- [ ] 会员中心可以显示会员状态
- [ ] 个人中心显示正确的用户信息

### 数据库测试

- [ ] users 集合可以正常读写
- [ ] plans 集合可以正常读写
- [ ] records 集合可以正常读写
- [ ] orders 集合可以正常读写
- [ ] feedbacks 集合可以正常读写
- [ ] 所有索引已创建

---

## 八、后续步骤

完成以上测试后，继续进行：

### 第二阶段（下一周）：完善核心功能

1. **支付流程完整测试**
   - 配置微信支付参数
   - 测试订单创建和支付
   - 验证支付回调

2. **数据统计和展示优化**
   - 测试统计数据准确性
   - 优化图表显示
   - 完善周/月报表

3. **推送通知测试**
   - 配置订阅消息模板
   - 测试提醒消息发送
   - 验证消息接收

### 第三阶段（之后）：UI 美化和优化

1. 添加图标资源
2. 优化动画和交互
3. 完善协议文本

---

## 联系与支持

如遇到问题，请：

1. 查看云函数日志（云开发控制台 > 云函数 > 日志）
2. 查看小程序 Console 输出
3. 对照本文档的错误排查部分

---

**预计完成时间：** 4-6 小时

**成功标志：** 所有测试清单项都打勾 ✓
