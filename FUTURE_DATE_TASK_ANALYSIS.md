# 📅 未来日期任务需求分析与实现方案

## 一、需求分析

### 当前问题
目前系统只支持为**今天**添加任务打卡记录，存在以下限制：
1. 打卡记录固定使用 `date: getToday()`，只能记录今天的任务
2. 无法提前规划未来的任务安排
3. 无法补录过去遗漏的任务记录

### 用户需求
用户希望能够：
1. **选择日期**：在添加任务/打卡时可以选择具体日期
2. **未来任务**：可以为明天、后天等未来日期添加任务安排
3. **灵活性**：不局限于只能记录今天的任务

### 使用场景
- 场景1：今天规划明天的运动计划
- 场景2：提前安排下周的学习任务
- 场景3：补录昨天忘记打卡的任务
- 场景4：查看本周/本月的任务安排日历

---

## 二、现状分析

### 2.1 当前实现方式

#### 打卡流程（首页）
```javascript
// miniprogram/pages/index/index.js
async confirmCheckin () {
  await recordAPI.create({
    planId: currentTask.id,
    date: getToday(),  // ❌ 固定今天
    actualValue: Number(checkinValue),
    remark: checkinRemark
  })
}
```

#### 云函数记录创建
```javascript
// cloudfunctions/record/index.js
async function createRecord (event, wxContext) {
  const { planId, date, actualValue, remark } = event
  const today = getToday() // 格式: 2023-12-22

  // 检查今天是否已打卡
  const existRecord = await db.collection('records').where({
    _openid: openid,
    planId: planId,
    date: today  // ❌ 固定校验今天
  }).get()

  // 创建记录
  const newRecord = {
    date: today,  // ❌ 固定今天
    // ... 其他字段
  }
}
```

### 2.2 数据库设计
```javascript
// records 集合结构
{
  _id: String,
  _openid: String,
  planId: String,
  planTitle: String,
  category: String,
  targetType: String,
  targetValue: Number,
  actualValue: Number,
  isCompleted: Boolean,
  remark: String,
  date: String,  // ✅ 已有日期字段，格式 YYYY-MM-DD
  createTime: Number,
  updateTime: Number
}
```

**好消息**：数据库设计已经支持 `date` 字段，只需修改前端逻辑！

---

## 三、解决方案设计

### 3.1 核心改动点

#### 改动1：打卡流程添加日期选择器
- 在首页打卡弹窗中添加日期选择组件
- 默认值为今天，可选择未来/过去日期
- 日期范围限制：过去7天 ~ 未来30天（可配置）

#### 改动2：云函数支持自定义日期
- 云函数接收前端传入的 `date` 参数
- 保留默认值 `getToday()`，向后兼容
- 重复打卡校验基于传入的 `date`

#### 改动3：日历视图展示（可选）
- 在统计页面添加月历视图
- 显示每天的任务完成情况
- 支持点击日期查看当天详情

---

## 四、详细实现方案

### 4.1 前端改动

#### 步骤1：修改打卡弹窗UI（首页）

**文件**：`miniprogram/pages/index/index.wxml`

在打卡弹窗中添加日期选择器：
```xml
<!-- 打卡弹窗 -->
<van-popup show="{{showCheckinModal}}" position="bottom" bind:close="closeCheckinModal">
  <view class="checkin-modal">
    <view class="modal-header">
      <text>打卡：{{currentTask.title}}</text>
    </view>

    <!-- ✅ 新增：日期选择 -->
    <view class="form-item">
      <view class="label">选择日期</view>
      <picker mode="date"
              value="{{checkinDate}}"
              start="{{dateRangeStart}}"
              end="{{dateRangeEnd}}"
              bindchange="onCheckinDateChange">
        <view class="date-picker">
          {{checkinDateDisplay}} 📅
        </view>
      </picker>
    </view>

    <!-- 原有的数值输入 -->
    <view class="form-item" wx:if="{{currentTask.type !== 'boolean'}}">
      <view class="label">完成情况</view>
      <input type="digit"
             value="{{checkinValue}}"
             placeholder="输入{{currentTask.unit}}"
             bindinput="onCheckinValueInput"/>
    </view>

    <!-- 备注输入 -->
    <view class="form-item">
      <view class="label">备注</view>
      <textarea value="{{checkinRemark}}"
                placeholder="记录心情或感想（选填）"
                bindinput="onCheckinRemarkInput"/>
    </view>

    <view class="modal-actions">
      <button bindtap="closeCheckinModal">取消</button>
      <button type="primary" bindtap="confirmCheckin">确认打卡</button>
    </view>
  </view>
</van-popup>
```

#### 步骤2：修改打卡逻辑（首页JS）

**文件**：`miniprogram/pages/index/index.js`

```javascript
const { formatDate, getDateRange } = require('../../utils/date');

Page({
  data: {
    // ... 现有数据
    checkinDate: '',          // 选中的日期 YYYY-MM-DD
    checkinDateDisplay: '',   // 显示文本 "今天 12-22"
    dateRangeStart: '',       // 可选开始日期
    dateRangeEnd: '',         // 可选结束日期
  },

  onLoad() {
    // 初始化日期范围
    const today = formatDate(new Date());
    const startDate = formatDate(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)); // 7天前
    const endDate = formatDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)); // 30天后

    this.setData({
      checkinDate: today,
      checkinDateDisplay: this.formatDateDisplay(today),
      dateRangeStart: startDate,
      dateRangeEnd: endDate
    });
  },

  // 打卡按钮 - 打开弹窗时设置默认日期为今天
  handleCheckin(e) {
    const { taskId, taskTitle, taskType, taskUnit, taskTargetValue } = e.currentTarget.dataset;

    const today = formatDate(new Date());

    this.setData({
      showCheckinModal: true,
      currentTask: {
        id: taskId,
        title: taskTitle,
        type: taskType,
        unit: taskUnit,
        targetValue: taskTargetValue
      },
      checkinValue: taskType === 'boolean' ? 1 : taskTargetValue,
      checkinRemark: '',
      checkinDate: today,  // ✅ 默认今天
      checkinDateDisplay: this.formatDateDisplay(today)
    });
  },

  // ✅ 新增：日期选择器变化
  onCheckinDateChange(e) {
    const selectedDate = e.detail.value;
    this.setData({
      checkinDate: selectedDate,
      checkinDateDisplay: this.formatDateDisplay(selectedDate)
    });
  },

  // ✅ 新增：格式化日期显示
  formatDateDisplay(dateStr) {
    const today = formatDate(new Date());
    const tomorrow = formatDate(new Date(Date.now() + 24 * 60 * 60 * 1000));
    const yesterday = formatDate(new Date(Date.now() - 24 * 60 * 60 * 1000));

    const [year, month, day] = dateStr.split('-');
    const displayDate = `${month}-${day}`;

    if (dateStr === today) return `今天 ${displayDate}`;
    if (dateStr === tomorrow) return `明天 ${displayDate}`;
    if (dateStr === yesterday) return `昨天 ${displayDate}`;
    return displayDate;
  },

  // 确认打卡 - 使用选择的日期
  async confirmCheckin() {
    const { currentTask, checkinValue, checkinRemark, checkinDate, isOnline } = this.data;

    // ... 原有校验逻辑

    try {
      await recordAPI.create({
        planId: currentTask.id,
        date: checkinDate,  // ✅ 使用选中的日期
        actualValue: Number(checkinValue),
        remark: checkinRemark
      });

      // 成功提示
      const dateDisplay = this.formatDateDisplay(checkinDate);
      wx.showToast({
        title: `${dateDisplay} 打卡成功`,
        icon: 'success'
      });

      this.closeCheckinModal();
      this.loadData();
    } catch (err) {
      console.error('打卡失败:', err);
      wx.showToast({
        title: '打卡失败',
        icon: 'none'
      });
    }
  }
});
```

---

### 4.2 云函数改动

#### 修改 record.create 云函数

**文件**：`cloudfunctions/record/index.js`

```javascript
/**
 * 创建打卡记录
 * @param {String} event.planId - 计划ID
 * @param {String} event.date - 打卡日期 YYYY-MM-DD（可选，默认今天）
 * @param {Number} event.actualValue - 实际完成值
 * @param {String} event.remark - 备注
 */
async function createRecord (event, wxContext) {
  const { planId, date, actualValue, remark } = event;
  const openid = wxContext.OPENID;

  // ✅ 支持自定义日期，默认今天
  const recordDate = date || getToday();

  // 参数校验
  if (!planId) {
    return {
      success: false,
      errMsg: '缺少计划ID'
    };
  }

  try {
    // 检查该日期是否已打卡（防止重复）
    const existRecord = await db.collection('records').where({
      _openid: openid,
      planId: planId,
      date: recordDate  // ✅ 使用传入的日期
    }).get();

    if (existRecord.data.length > 0) {
      return {
        success: false,
        errMsg: `${recordDate} 已打卡，请勿重复`
      };
    }

    // 获取计划信息
    const plan = await getPlanById(planId, openid);
    if (!plan) {
      return {
        success: false,
        errMsg: '计划不存在'
      };
    }

    // 判断是否完成
    const isCompleted = checkCompleted(plan.targetType, actualValue, plan.targetValue);
    const now = Date.now();

    // 创建记录
    const newRecord = {
      _openid: openid,
      planId: planId,
      planTitle: plan.title,
      category: plan.category,
      targetType: plan.targetType,
      targetValue: plan.targetValue,
      targetUnit: plan.targetUnit,
      actualValue: actualValue,
      isCompleted: isCompleted,
      remark: remark || '',
      date: recordDate,  // ✅ 使用传入的日期
      createTime: now,
      updateTime: now
    };

    const addRes = await db.collection('records').add({
      data: newRecord
    });

    // 更新计划统计
    await updatePlanStats(planId, openid);

    // 更新用户统计
    await updateUserStats(openid);

    return {
      success: true,
      data: {
        _id: addRes._id,
        ...newRecord
      },
      message: `${recordDate} 打卡成功`
    };
  } catch (err) {
    console.error('[createRecord] 创建记录失败', err);
    throw new Error('创建记录失败');
  }
}
```

---

### 4.3 样式改动

**文件**：`miniprogram/pages/index/index.wxss`

```css
/* 日期选择器样式 */
.date-picker {
  padding: 24rpx;
  background: #f5f5f5;
  border-radius: 12rpx;
  font-size: 28rpx;
  color: #333;
  text-align: center;
}

.date-picker::after {
  content: ' ▼';
  font-size: 20rpx;
  color: #999;
}

/* 高亮今天 */
.date-today {
  color: #1890ff;
  font-weight: bold;
}

/* 高亮未来日期 */
.date-future {
  color: #52c41a;
}

/* 高亮过去日期 */
.date-past {
  color: #faad14;
}
```

---

## 五、实现优先级

### P0 - 核心功能（本次实现）
1. ✅ 打卡弹窗添加日期选择器
2. ✅ 云函数支持自定义日期参数
3. ✅ 日期显示优化（今天/明天/昨天）
4. ✅ 重复打卡校验基于日期

### P1 - 体验优化（后续迭代）
1. ⏳ 日历视图展示任务（统计页）
2. ⏳ 快捷日期选择（今天/明天/后天按钮）
3. ⏳ 日期范围配置化（系统设置）
4. ⏳ 补卡提醒功能

### P2 - 高级功能（按需开发）
1. ⏳ 批量添加多日任务
2. ⏳ 周期性任务模板
3. ⏳ 任务拖拽调整日期
4. ⏳ 日历订阅/导出

---

## 六、技术细节

### 6.1 日期工具函数

**文件**：`miniprogram/utils/date.js`

需要确保有以下函数：
```javascript
/**
 * 格式化日期为 YYYY-MM-DD
 */
function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * 获取今天日期
 */
function getToday() {
  return formatDate(new Date());
}

/**
 * 获取日期范围
 */
function getDateRange(startDaysAgo, endDaysAhead) {
  const today = new Date();
  const start = new Date(today.getTime() - startDaysAgo * 24 * 60 * 60 * 1000);
  const end = new Date(today.getTime() + endDaysAhead * 24 * 60 * 60 * 1000);
  return {
    start: formatDate(start),
    end: formatDate(end)
  };
}

module.exports = {
  formatDate,
  getToday,
  getDateRange
};
```

### 6.2 日期校验

```javascript
/**
 * 校验日期是否在允许范围内
 */
function validateDateRange(dateStr, startDate, endDate) {
  const date = new Date(dateStr);
  const start = new Date(startDate);
  const end = new Date(endDate);
  return date >= start && date <= end;
}
```

---

## 七、测试用例

### 7.1 功能测试

| 测试项 | 操作步骤 | 预期结果 |
|--------|----------|----------|
| 默认今天 | 打开打卡弹窗 | 日期默认显示"今天 MM-DD" |
| 选择明天 | 点击日期选择器，选择明天 | 显示"明天 MM-DD" |
| 选择过去 | 选择昨天日期 | 显示"昨天 MM-DD"，可补卡 |
| 选择未来 | 选择下周日期 | 显示"MM-DD"，可提前安排 |
| 重复打卡 | 同一日期打卡两次 | 提示"该日期已打卡" |
| 日期范围 | 选择超出范围日期 | 选择器不可选 |

### 7.2 边界测试

| 测试项 | 输入 | 预期结果 |
|--------|------|----------|
| 空日期 | date=undefined | 使用今天日期 |
| 无效日期 | date="2023-13-32" | 返回错误提示 |
| 超前日期 | 50天后 | 超出范围提示 |
| 超后日期 | 10天前 | 超出范围提示 |

---

## 八、向后兼容

### 8.1 旧版本客户端
- 未传 `date` 参数时，云函数使用 `getToday()`
- 保证旧版本 APP 正常打卡今天任务

### 8.2 数据迁移
- 数据库已有 `date` 字段，无需迁移
- 现有记录保持不变

---

## 九、风险评估

### 9.1 技术风险
- **低风险**：改动点明确，影响范围可控
- 主要修改前端UI和云函数参数接收
- 数据库结构无需变更

### 9.2 业务风险
- **中风险**：用户可能误操作选错日期
- **缓解措施**：
  - 默认今天，减少误操作
  - 日期显示清晰（今天/明天标识）
  - 确认按钮二次确认

### 9.3 性能风险
- **低风险**：不涉及复杂查询
- 日期选择器为原生组件，性能良好

---

## 十、实施计划

### 阶段一：核心功能（1-2天）
1. ✅ 修改打卡弹窗UI（添加日期选择器）
2. ✅ 修改打卡逻辑（传递日期参数）
3. ✅ 修改云函数（接收和处理日期）
4. ✅ 完善日期工具函数
5. ✅ 测试功能正常运行

### 阶段二：体验优化（1天）
1. ⏳ 添加快捷日期按钮
2. ⏳ 优化日期显示样式
3. ⏳ 添加日期选择引导

### 阶段三：高级功能（按需）
1. ⏳ 日历视图集成
2. ⏳ 批量任务功能
3. ⏳ 数据统计增强

---

## 十一、总结

### 核心改动
1. **前端**：打卡弹窗添加日期选择器，传递日期参数
2. **云函数**：支持自定义日期，默认今天向后兼容
3. **体验**：日期显示友好（今天/明天/昨天）

### 优势
- ✅ 支持未来任务规划
- ✅ 支持补录过去任务
- ✅ 灵活的日期选择
- ✅ 向后兼容旧版本
- ✅ 数据库无需改动

### 下一步
立即开始实现阶段一核心功能！
