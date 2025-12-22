# 数据库索引优化文档

## 概述

本文档定义了 DisciplineCoach 小程序数据库的推荐索引配置，用于优化查询性能。所有索引均需在微信云开发控制台的数据库管理界面中手动创建。

---

## 1. users 集合

**用途**: 存储用户信息和会员状态

### 索引列表

| 索引名称 | 字段 | 类型 | 排序 | 说明 |
|---------|------|------|------|------|
| idx_openid | _openid | 单字段 | ASC | 用于用户登录和信息查询 |
| idx_member_expire | member_expire_at | 单字段 | DESC | 用于会员过期检查 |

### 创建命令

```javascript
// 在云开发控制台执行
db.collection('users').createIndex({
  name: 'idx_openid',
  unique: true,
  keys: [
    { field: '_openid', order: 'asc' }
  ]
});

db.collection('users').createIndex({
  name: 'idx_member_expire',
  keys: [
    { field: 'member_expire_at', order: 'desc' }
  ]
});
```

---

## 2. plans 集合

**用途**: 存储用户创建的计划任务

### 索引列表

| 索引名称 | 字段 | 类型 | 排序 | 说明 |
|---------|------|------|------|------|
| idx_user_status | _openid, status | 复合索引 | ASC, ASC | 查询用户的激活/暂停计划 |
| idx_user_category | _openid, category | 复合索引 | ASC, ASC | 按维度查询用户计划 |
| idx_user_active_category | _openid, status, category | 复合索引 | ASC, ASC, ASC | 查询用户某维度的激活计划 |

### 创建命令

```javascript
// 用户状态查询索引
db.collection('plans').createIndex({
  name: 'idx_user_status',
  keys: [
    { field: '_openid', order: 'asc' },
    { field: 'status', order: 'asc' }
  ]
});

// 用户维度查询索引
db.collection('plans').createIndex({
  name: 'idx_user_category',
  keys: [
    { field: '_openid', order: 'asc' },
    { field: 'category', order: 'asc' }
  ]
});

// 用户激活计划维度查询索引
db.collection('plans').createIndex({
  name: 'idx_user_active_category',
  keys: [
    { field: '_openid', order: 'asc' },
    { field: 'status', order: 'asc' },
    { field: 'category', order: 'asc' }
  ]
});
```

### 查询优化说明

- **idx_user_status**: 优化首页加载激活计划的查询 (`status: 'active'`)
- **idx_user_category**: 优化按维度筛选计划的查询
- **idx_user_active_category**: 优化计划详情页按维度加载激活任务的查询

---

## 3. records 集合

**用途**: 存储用户打卡记录

### 索引列表

| 索引名称 | 字段 | 类型 | 排序 | 说明 |
|---------|------|------|------|------|
| idx_user_date | _openid, check_date | 复合索引 | ASC, DESC | 按日期查询用户打卡记录 |
| idx_user_date_range | _openid, check_date | 复合索引 | ASC, DESC | 日期范围查询（统计/日历） |
| idx_plan_date | plan_id, check_date | 复合索引 | ASC, DESC | 查询某计划的打卡历史 |

### 创建命令

```javascript
// 用户日期查询索引
db.collection('records').createIndex({
  name: 'idx_user_date',
  keys: [
    { field: '_openid', order: 'asc' },
    { field: 'check_date', order: 'desc' }
  ]
});

// 用户日期范围查询索引（与上面相同，但语义不同）
db.collection('records').createIndex({
  name: 'idx_user_date_range',
  keys: [
    { field: '_openid', order: 'asc' },
    { field: 'check_date', order: 'desc' }
  ]
});

// 计划日期查询索引
db.collection('records').createIndex({
  name: 'idx_plan_date',
  keys: [
    { field: 'plan_id', order: 'asc' },
    { field: 'check_date', order: 'desc' }
  ]
});
```

### 查询优化说明

- **idx_user_date**: 优化首页今日打卡记录查询 (`getTodayRecords`)
- **idx_user_date_range**: 优化统计页面的日期范围查询 (`getByRange`)
- **idx_plan_date**: 优化计划详情页的历史记录查询

---

## 4. orders 集合

**用途**: 存储会员订单记录

### 索引列表

| 索引名称 | 字段 | 类型 | 排序 | 说明 |
|---------|------|------|------|------|
| idx_user_time | _openid, create_time | 复合索引 | ASC, DESC | 查询用户订单历史 |
| idx_order_no | order_no | 单字段 | ASC | 通过订单号查询 |
| idx_transaction_id | transaction_id | 单字段 | ASC | 微信支付回调查询 |

### 创建命令

```javascript
// 用户订单时间索引
db.collection('orders').createIndex({
  name: 'idx_user_time',
  keys: [
    { field: '_openid', order: 'asc' },
    { field: 'create_time', order: 'desc' }
  ]
});

// 订单号唯一索引
db.collection('orders').createIndex({
  name: 'idx_order_no',
  unique: true,
  keys: [
    { field: 'order_no', order: 'asc' }
  ]
});

// 微信交易号索引
db.collection('orders').createIndex({
  name: 'idx_transaction_id',
  keys: [
    { field: 'transaction_id', order: 'asc' }
  ]
});
```

---

## 5. feedback 集合

**用途**: 存储用户反馈建议

### 索引列表

| 索引名称 | 字段 | 类型 | 排序 | 说明 |
|---------|------|------|------|------|
| idx_user_time | _openid, create_time | 复合索引 | ASC, DESC | 查询用户反馈历史 |
| idx_status_time | status, create_time | 复合索引 | ASC, DESC | 管理端按状态查询 |

### 创建命令

```javascript
// 用户反馈时间索引
db.collection('feedback').createIndex({
  name: 'idx_user_time',
  keys: [
    { field: '_openid', order: 'asc' },
    { field: 'create_time', order: 'desc' }
  ]
});

// 状态时间索引（管理端使用）
db.collection('feedback').createIndex({
  name: 'idx_status_time',
  keys: [
    { field: 'status', order: 'asc' },
    { field: 'create_time', order: 'desc' }
  ]
});
```

---

## 索引创建优先级

### 高优先级（P0 - 立即创建）

这些索引直接影响核心功能性能，应优先创建：

1. **plans.idx_user_status** - 优化首页加载
2. **records.idx_user_date** - 优化今日打卡查询
3. **users.idx_openid** - 优化用户登录

### 中优先级（P1 - 尽快创建）

这些索引优化常用功能，数据量增长后效果明显：

4. **records.idx_user_date_range** - 优化统计页面
5. **plans.idx_user_active_category** - 优化计划详情页
6. **orders.idx_user_time** - 优化会员中心

### 低优先级（P2 - 按需创建）

这些索引在数据量小时可选，数据量大后建议创建：

7. **plans.idx_user_category** - 维度筛选优化
8. **records.idx_plan_date** - 计划历史记录
9. **feedback.idx_user_time** - 反馈历史查询
10. **users.idx_member_expire** - 会员过期检查

---

## 索引监控

### 查询慢日志

在云开发控制台的"数据库"→"慢查询日志"中查看耗时超过 100ms 的查询，重点关注：

- 查询次数最多的 SQL
- 平均耗时最长的 SQL
- 未使用索引的查询（type: 'COLLSCAN'）

### 索引效果验证

创建索引后，使用 `explain()` 验证索引是否生效：

```javascript
// 在云开发控制台执行
db.collection('plans')
  .where({ _openid: 'xxx', status: 'active' })
  .explain()
  .then(res => {
    console.log(res);
    // 查看 executionStats.stage 应为 'IXSCAN' (使用索引)
    // 而非 'COLLSCAN' (全表扫描)
  });
```

---

## 索引维护建议

### 定期检查

- **每周**: 查看慢查询日志，识别性能瓶颈
- **每月**: 检查索引命中率，删除未使用的索引
- **每季度**: 根据业务变化调整索引策略

### 索引大小监控

使用以下命令查看集合和索引大小：

```javascript
db.collection('records').stats().then(console.log);
```

关注 `indexSizes` 字段，索引大小不应超过数据大小的 50%。

### 索引更新策略

- **新增索引**: 在低峰期创建，避免影响线上服务
- **删除索引**: 先观察一周性能变化再决定是否永久删除
- **重建索引**: 数据量翻倍时考虑重建以优化 B-Tree 结构

---

## 注意事项

### 索引限制

1. **数量限制**: 每个集合最多 64 个索引（微信云开发限制）
2. **大小限制**: 单个索引键最大 1024 字节
3. **唯一索引**: 插入前确保字段值唯一，否则会失败

### 性能影响

- **查询优化**: 索引可提升查询速度 10-100 倍
- **写入开销**: 每个索引增加 10%-20% 的写入时间
- **存储成本**: 索引占用额外存储空间（约数据量的 20%-40%）

### 最佳实践

1. **选择性原则**: 优先为高选择性字段（值多样）创建索引
2. **覆盖索引**: 查询字段包含在索引中可避免回表
3. **前缀原则**: 复合索引中最常查询的字段放前面
4. **避免过度索引**: 写多读少的集合不宜创建过多索引

---

## 更新日志

| 日期 | 版本 | 说明 |
|------|------|------|
| 2024-01-XX | v1.0 | 初始版本，定义核心索引 |

---

## 相关文档

- [微信云开发数据库索引文档](https://developers.weixin.qq.com/miniprogram/dev/wxcloud/guide/database/index.html)
- [数据库性能优化指南](https://developers.weixin.qq.com/miniprogram/dev/wxcloud/guide/database/performance.html)
