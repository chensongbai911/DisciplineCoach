# 📱 订阅消息模板配置指南

## 📋 概述
自律教练小程序需要配置5个订阅消息模板,用于智能提醒功能。

---

## 🔧 配置步骤

### 第一步: 登录微信公众平台
1. 访问 https://mp.weixin.qq.com
2. 使用小程序管理员微信扫码登录
3. 进入对应的小程序账号

### 第二步: 进入订阅消息管理
1. 左侧菜单 → 功能 → 订阅消息
2. 点击"公共模板库"
3. 搜索并添加以下模板

---

## 📝 需要的5个模板

### 1. 打卡提醒模板
**关键词**: 任务提醒 / 待办提醒 / 打卡提醒

**搜索示例**: "任务提醒"
**模板内容示例**:
```
{{thing1.DATA}}
提醒时间: {{time2.DATA}}
任务内容: {{thing3.DATA}}
温馨提示: {{thing4.DATA}}
```

**用途**: 每日定时提醒用户打卡

---

### 2. 连续中断警告模板
**关键词**: 中断提醒 / 警告提醒

**搜索示例**: "中断提醒"
**模板内容示例**:
```
任务名称: {{thing1.DATA}}
中断天数: {{number2.DATA}}
提醒内容: {{thing3.DATA}}
温馨提示: {{thing4.DATA}}
```

**用途**: 用户连续多天未打卡时发送警告

---

### 3. 连续打卡祝贺模板
**关键词**: 打卡成功 / 完成提醒

**搜索示例**: "打卡成功"
**模板内容示例**:
```
任务名称: {{thing1.DATA}}
连续天数: {{number2.DATA}}
打卡时间: {{time3.DATA}}
鼓励语: {{thing4.DATA}}
```

**用途**: 达成连续打卡里程碑时发送祝贺

---

### 4. 周总结模板
**关键词**: 周报 / 数据统计

**搜索示例**: "数据统计"
**模板内容示例**:
```
统计周期: {{date1.DATA}}
完成任务: {{number2.DATA}}
完成率: {{character_string3.DATA}}
总结内容: {{thing4.DATA}}
```

**用途**: 每周发送打卡数据总结

---

### 5. 成就解锁模板
**关键词**: 成就解锁 / 等级提升

**搜索示例**: "成就解锁"
**模板内容示例**:
```
成就名称: {{thing1.DATA}}
解锁时间: {{time2.DATA}}
成就描述: {{thing3.DATA}}
奖励内容: {{thing4.DATA}}
```

**用途**: 用户解锁成就时发送通知

---

## 🔑 获取模板ID

### 添加模板后
1. 在"我的模板"列表中找到刚添加的模板
2. 每个模板都有一个**模板ID**(格式类似: `aBcDeFgHiJkLmNoPqRsTuVwXyZ`)
3. 复制这些模板ID

### 模板ID示例
```javascript
CHECKIN_REMINDER: 'aBcDeFgHiJkLmNoPqRsTuVwXyZ'      // 打卡提醒
STREAK_WARNING: 'bCdEfGhIjKlMnOpQrStUvWxYzAb'       // 连续中断警告
STREAK_CONGRATS: 'cDeFgHiJkLmNoPqRsTuVwXyZaBc'      // 连续打卡祝贺
WEEKLY_SUMMARY: 'dEfGhIjKlMnOpQrStUvWxYzAbCd'       // 周总结
ACHIEVEMENT_UNLOCK: 'eFgHiJkLmNoPqRsTuVwXyZaBcD'    // 成就解锁
```

---

## 💻 配置到代码

### 方式一: 使用配置文件 (推荐)
创建 `miniprogram/config/subscription.js`:

```javascript
/**
 * 订阅消息模板ID配置
 * 从微信公众平台获取
 */
module.exports = {
  // 打卡提醒
  CHECKIN_REMINDER: 'YOUR_CHECKIN_REMINDER_TEMPLATE_ID',

  // 连续中断警告
  STREAK_WARNING: 'YOUR_STREAK_WARNING_TEMPLATE_ID',

  // 连续打卡祝贺
  STREAK_CONGRATS: 'YOUR_STREAK_CONGRATS_TEMPLATE_ID',

  // 周总结
  WEEKLY_SUMMARY: 'YOUR_WEEKLY_SUMMARY_TEMPLATE_ID',

  // 成就解锁
  ACHIEVEMENT_UNLOCK: 'YOUR_ACHIEVEMENT_UNLOCK_TEMPLATE_ID'
};
```

### 方式二: 临时测试配置
如果暂时无法配置,可以先注释掉订阅消息功能:

```javascript
// 临时禁用订阅消息
const ENABLE_SUBSCRIPTION = false;

function requestSubscribe(types) {
  if (!ENABLE_SUBSCRIPTION) {
    console.log('订阅消息功能已禁用,跳过');
    return Promise.resolve({ success: true, message: '已跳过' });
  }
  // 原有逻辑...
}
```

---

## ⚠️ 重要提示

### 1. 审核注意事项
- 订阅消息需要在小程序审核时说明用途
- 不能频繁发送,建议每天最多1-2次
- 内容必须与用户操作相关

### 2. 用户体验
- 首次使用时引导用户订阅
- 提供"不再提醒"选项
- 在设置页面可以重新开启

### 3. 测试建议
- 先用测试号测试
- 确认模板格式正确
- 检查发送时机合理

---

## 📊 配置后的效果

### 用户流程
1. 创建任务时,询问是否开启提醒
2. 用户同意后,弹出订阅消息授权
3. 用户勾选允许的消息类型
4. 到达提醒时间时,自动发送订阅消息

### 消息示例
```
【自律教练】打卡提醒

任务名称: 每日运动30分钟
提醒时间: 2025-12-23 18:00
任务内容: 今天还没打卡哦,继续加油!
温馨提示: 已连续坚持7天,再接再厉!
```

---

## 🔍 常见问题

### Q1: 找不到合适的模板怎么办?
**A**: 可以选择类似的模板,或申请自定义模板(需要更长审核时间)

### Q2: 模板ID配置错误会怎样?
**A**: 订阅消息授权会失败,但不影响其他功能

### Q3: 可以不配置订阅消息吗?
**A**: 可以,提醒功能会自动降级为本地通知(仅在小程序内)

### Q4: 如何测试订阅消息?
**A**:
1. 在开发工具中使用"测试号"
2. 在真机上使用"体验版"
3. 查看"开发管理→消息推送"中的发送记录

---

## 📞 需要帮助?

如果配置过程中遇到问题:
1. 查看微信官方文档: https://developers.weixin.qq.com/miniprogram/dev/framework/open-ability/subscribe-message.html
2. 在微信开放社区提问: https://developers.weixin.qq.com/community/
3. 联系技术支持

---

**配置完成后,请更新代码中的模板ID,并测试订阅消息功能!**
