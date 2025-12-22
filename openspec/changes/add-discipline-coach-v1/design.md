# Technical Design Document

## Context

这是一个全新的微信小程序项目 - 自律教练 V1.0，采用微信小程序原生开发框架和微信云开发(CloudBase)作为后端解决方案。项目旨在帮助用户建立日常习惯，涵盖运动、饮食、睡眠、阅读、学习五个维度，并通过会员制实现商业化。

**关键约束条件:**
- 必须使用微信小程序原生框架 (WXML + WXSS + JS)，不使用第三方框架
- 后端采用微信云开发 (CloudBase)，避免自建服务器复杂度
- 首页加载时间必须 ≤ 2 秒
- 遵守微信平台隐私保护和支付规范
- V1 为 MVP 版本，功能设计需简化可行

**利益相关者:**
- 目标用户: 20-40岁希望改善生活习惯的用户
- 开发团队: 前端开发、云函数开发、UI设计
- 运营团队: 负责用户增长和会员转化

## Goals / Non-Goals

**Goals:**
- ✅ 提供简单易用的习惯打卡和计划管理功能
- ✅ 通过数据可视化增强用户成就感和持续动力
- ✅ 实现稳定可靠的会员订阅和微信支付集成
- ✅ 保证核心流程的性能和用户体验
- ✅ 确保数据安全和用户隐私保护

**Non-Goals (V1 不实现):**
- ❌ 社交功能 (好友排行、组队打卡) - 留待 V2
- ❌ 内容系统 (文章/课程) - 留待 V2
- ❌ 硬件设备集成 (智能手环等) - 留待 V2
- ❌ 复杂的徽章勋章系统 - V1 仅预留接口
- ❌ 自定义维度完整版 - V1 仅支持五大固定维度
- ❌ 自动续费 - V1 手动续费即可

## Decisions

### Decision 1: 选择微信云开发作为后端方案

**理由:**
- 无需自建服务器，降低运维成本和复杂度
- 与小程序深度集成，天然支持 openid 认证
- 提供云数据库、云函数、云存储一体化解决方案
- 自动扩容，适合初期用户量不确定的场景

**替代方案考虑:**
- 自建 Node.js/Python 后端 + 数据库: 初期成本高，运维复杂，不适合 MVP
- 第三方 BaaS (如 Leancloud): 需要额外学习成本，且定价可能更高

**影响:**
- 开发效率提升，可快速实现后端逻辑
- 成本可控，按量计费
- 后期如需迁移需要重构，但可接受

### Decision 2: 数据库设计采用文档型结构 (云数据库)

**核心集合 (Collections):**

**users 集合:**
```javascript
{
  _id: "自动生成",
  _openid: "微信 openid (自动)",
  nickname: "用户昵称",
  avatar_url: "头像URL",
  gender: 0, // 0=未知, 1=男, 2=女
  is_member: false,
  member_expire_at: null, // 会员到期时间戳
  level: 1,
  experience: 0,
  created_at: "创建时间",
  last_login_at: "最后登录时间",
  settings: {
    reminder_enabled: true,
    reminder_times: ["08:00", "20:00"],
    theme: "default"
  }
}
```

**plans 集合:**
```javascript
{
  _id: "自动生成",
  _openid: "用户 openid (自动)",
  category: "运动", // 运动/饮食/睡眠/阅读/学习
  title: "每日跑步",
  type: "time", // time/step/count/boolean/custom
  target_value: 30,
  unit: "分钟",
  week_days: [1, 2, 3, 4, 5], // 周一到周五
  remind_time: "20:00",
  is_active: true,
  created_at: "创建时间",
  updated_at: "更新时间"
}
```

**records 集合:**
```javascript
{
  _id: "自动生成",
  _openid: "用户 openid (自动)",
  plan_id: "关联的计划ID",
  date: "2024-01-15", // YYYY-MM-DD 格式
  actual_value: 35, // 实际完成值
  status: "完成", // 完成/未完成/部分
  remark: "今天多跑了5分钟",
  created_at: "打卡时间"
}
```

**orders 集合:**
```javascript
{
  _id: "自动生成",
  _openid: "用户 openid (自动)",
  order_type: "month", // month/quarter/year
  amount: 1800, // 单位: 分
  pay_status: "success", // pending/success/failed
  transaction_id: "微信支付交易号",
  start_at: "会员开始时间",
  end_at: "会员结束时间",
  created_at: "订单创建时间"
}
```

**feedbacks 集合:**
```javascript
{
  _id: "自动生成",
  _openid: "用户 openid (自动)",
  content: "反馈内容",
  contact_info: "可选联系方式",
  status: "pending", // pending/reviewed
  created_at: "提交时间"
}
```

**索引设计:**
- users: _openid (唯一索引)
- plans: _openid + category (复合索引), is_active (索引)
- records: _openid + date (复合索引), plan_id (索引)
- orders: _openid + pay_status (复合索引)

### Decision 3: 云函数架构设计

采用**功能模块化**的云函数组织方式，每个云函数对应一组相关操作:

**核心云函数列表:**

1. **user** - 用户相关
   - login: 获取 openid 并初始化用户
   - getUserInfo: 获取用户信息
   - updateUserInfo: 更新用户信息
   - updateSettings: 更新用户设置

2. **plan** - 计划管理
   - create: 创建计划 (含权限校验)
   - update: 更新计划
   - delete: 删除计划
   - list: 获取用户计划列表
   - toggle: 开启/关闭计划

3. **record** - 打卡记录
   - create: 创建打卡记录
   - update: 修改打卡记录
   - getByDate: 获取指定日期记录
   - getByRange: 获取日期范围记录
   - calculateStreak: 计算连续天数

4. **statistics** - 数据统计
   - getOverview: 获取综合统计
   - getDimensionStats: 获取单维度统计
   - getCompletionRate: 计算完成率
   - generateWeeklySummary: 生成周总结

5. **payment** - 支付相关
   - createOrder: 创建订单
   - unifiedOrder: 生成微信支付参数
   - paymentCallback: 处理支付回调
   - checkMembership: 检查会员状态

6. **feedback** - 反馈
   - submit: 提交反馈

7. **message** - 消息推送
   - sendSubscription: 发送订阅消息

**云函数安全设计:**
- 所有云函数自动获取 event.userInfo._openid 作为用户标识
- 数据查询必须带 _openid 过滤，防止越权访问
- 敏感操作 (支付回调) 需要验证签名

### Decision 4: 前端架构设计

**目录结构:**
```
miniprogram/
├── pages/               # 页面
│   ├── index/           # 首页-今日看板
│   ├── plan/            # 计划设置
│   ├── statistics/      # 数据统计
│   ├── vip/             # 会员中心
│   ├── user/            # 个人中心
│   └── ...
├── components/          # 组件
│   ├── task-card/       # 任务卡片组件
│   ├── coach-avatar/    # 教练头像组件
│   ├── chart/           # 图表组件
│   └── ...
├── utils/               # 工具函数
│   ├── api.js           # 云函数调用封装
│   ├── date.js          # 日期处理
│   ├── storage.js       # 本地存储
│   └── validator.js     # 数据校验
├── lib/                 # 第三方库
│   └── echarts/         # ECharts for WeChat
├── assets/              # 静态资源
│   ├── images/
│   └── icons/
├── styles/              # 全局样式
│   └── common.wxss
└── app.js / app.json / app.wxss
```

**状态管理:**
- 使用 app.js 的 globalData 存储全局状态 (用户信息、会员状态)
- 使用 wx.setStorageSync / wx.getStorageSync 做本地缓存
- 不引入 Redux 等复杂状态管理库，保持简单

**网络请求封装:**
```javascript
// utils/api.js
const callFunction = (name, data = {}) => {
  return wx.cloud.callFunction({
    name,
    data
  }).then(res => {
    if (res.result.code === 0) {
      return res.result.data;
    } else {
      throw new Error(res.result.message);
    }
  });
};
```

### Decision 5: 微信支付集成方案

**支付流程:**
1. 用户选择套餐 → 前端调用 payment.createOrder 云函数
2. 云函数创建订单记录，状态为 "pending"
3. 云函数调用 payment.unifiedOrder 生成支付参数 (需签名)
4. 前端调用 wx.requestPayment 唤起支付
5. 支付成功后，微信服务器回调 payment.paymentCallback 云函数
6. 云函数验证回调签名，更新订单状态和用户会员信息
7. 前端查询订单状态，展示支付结果

**安全措施:**
- 订单金额在后端计算，前端不可篡改
- 支付回调验证微信签名
- 使用商户密钥加密通信

### Decision 6: 图表库选择 ECharts for WeChat

**理由:**
- ECharts 功能强大，图表类型丰富
- 官方提供 WeChat 适配版本 (ec-canvas 组件)
- 支持交互手势，用户体验好

**性能优化:**
- 图表数据量控制在合理范围 (最多 90 个数据点)
- 图表懒加载，仅在统计页面展示时初始化
- 使用 Canvas 2D API (微信小程序新版)

### Decision 7: 连续天数计算算法

**算法逻辑:**
```javascript
// 计算某维度的连续天数
function calculateStreak(category, openid) {
  // 1. 获取该维度所有活跃计划
  const plans = getActivePlans(category, openid);

  // 2. 从今天往前遍历
  let streak = 0;
  let currentDate = today;

  while (true) {
    // 3. 检查 currentDate 是否所有计划都完成
    const allCompleted = checkDayCompleted(currentDate, plans, openid);

    if (!allCompleted) break; // 中断

    streak++;
    currentDate = previousDay(currentDate);
  }

  return streak;
}
```

**复杂度:** O(n × m)，n=连续天数，m=计划数，可接受

### Decision 8: 订阅消息策略

**订阅消息场景:**
- 每日打卡提醒 (用户配置时间)
- 会员到期提醒 (提前3天)
- 里程碑庆祝 (可选)

**授权时机:**
- 用户首次开启提醒时请求授权
- 用户可在设置中重新授权
- 失败降级: 无订阅授权时不发送，不影响核心功能

**模板 ID 配置:**
- 需在微信公众平台配置订阅消息模板
- 模板内容需提前审核通过

## Risks / Trade-offs

### Risk 1: 云开发成本超预期

**风险描述:** 用户量增长后，云函数调用和数据库读写费用可能快速上升

**缓解措施:**
- 设置云开发资源用量告警
- 优化云函数调用次数 (合并请求、本地缓存)
- 数据库查询添加索引，减少扫描量
- 监控成本，必要时升级套餐或迁移

**权衡:** 接受初期可能的成本波动，换取快速上线

### Risk 2: 微信支付回调可靠性

**风险描述:** 网络异常可能导致支付回调失败，用户付款但未开通会员

**缓解措施:**
- 支付回调幂等性设计 (重复回调不重复处理)
- 订单状态查询接口，用户可手动触发状态同步
- 定时任务检查 pending 订单，补偿处理
- 日志记录所有支付操作，便于排查

**权衡:** 增加开发复杂度，但保证支付可靠性

### Risk 3: 首页性能优化难度

**风险描述:** 首页需展示所有维度任务和完成状态，数据量大时可能超过 2 秒加载要求

**缓解措施:**
- 云函数一次返回今日所有数据 (计划 + 记录)，减少请求次数
- 前端使用 setData 分批渲染 (先渲染关键内容)
- 任务列表虚拟滚动 (如任务数量 > 20)
- 静态资源 CDN 加速

**权衡:** 可能需要牺牲部分实时性，使用短期缓存

### Risk 4: 补打卡逻辑复杂性

**风险描述:** 补打卡会影响连续天数计算，逻辑复杂容易出错

**缓解措施:**
- 单元测试覆盖各种补打卡场景
- 连续天数计算独立函数，每次打卡/补打卡都重新计算
- V1 限制补打卡范围 (7天)，降低复杂度

**权衡:** 接受计算开销，换取正确性

## Migration Plan

由于这是全新项目，无需迁移。但需要考虑后续版本的平滑升级:

**数据库 Schema 变更:**
- 使用字段默认值，避免强制字段导致兼容问题
- 新增字段时，兼容旧数据 (null/undefined 处理)
- 不轻易删除字段，可标记为 deprecated

**云函数版本管理:**
- 使用环境变量区分开发/生产环境
- 灰度发布新功能 (云函数支持流量切分)

**小程序版本兼容:**
- 使用 wx.getSystemInfo 检测基础库版本
- 关键 API 做降级处理

## Open Questions

1. **会员首月 9.9 优惠是否实施?**
   - 需要运营决策
   - 如果实施，需要增加优惠券/促销码逻辑

2. **等级经验值是否在 V1 完整实现?**
   - 当前方案: V1 仅展示等级和经验，不提供实质奖励
   - 未来: V2 可增加等级奖励 (解锁皮肤、补签卡等)

3. **是否需要实时数据同步?**
   - 当前方案: 每次进入页面重新拉取数据
   - 未来: 可使用云开发实时数据推送 (WebSocket)，但增加复杂度

4. **多设备登录数据同步?**
   - 当前方案: openid 唯一，自动跨设备同步
   - 需确认: 同一微信账号在不同设备登录小程序，openid 相同

5. **补签卡使用次数存储位置?**
   - 方案A: users 集合增加 retro_cards_remaining 字段
   - 方案B: 独立 member_benefits 集合
   - 建议: 方案A 更简单，先采用

## Summary

本设计文档定义了自律教练小程序 V1.0 的技术架构，采用微信小程序原生框架 + 云开发的技术栈，通过模块化的云函数和清晰的数据库设计，确保系统简单可靠、易于维护。核心决策包括选择云开发降低运维成本、使用文档型数据库适应业务模型、集成 ECharts 提供数据可视化能力。主要风险已识别并制定缓解措施。设计遵循 MVP 原则，为后续迭代预留扩展空间。
