// index.js
const app = getApp()
const { recordAPI, planAPI } = require('../../utils/api.js')
const { formatDateChinese, getToday, getWeekday, getDateByOffset, formatDateDisplay } = require('../../utils/date.js')
const { handleAPIError, wrapAPICall } = require('../../utils/errorHandler.js')
const vibrate = require('../../utils/vibrate.js')
const reminder = require('../../utils/reminder.js')

Page({
  data: {
    // 日期显示
    currentDate: '',

    // 小教练消息
    coachMessage: '今天也要元气满满哦~',

    // 统计数据
    completedTasks: 0,
    totalTasks: 0,
    streakDays: 0,
    progressPercent: 0,

    // 任务维度列表
    dimensions: [],

    // 打卡弹窗
    showCheckinModal: false,
    currentTask: null,
    checkinValue: '',
    checkinRemark: '',
    checkinDate: '',          // 选中的日期 YYYY-MM-DD
    checkinDateDisplay: '',   // 显示文本 "今天 12-22"
    dateRangeStart: '',       // 可选开始日期
    dateRangeEnd: '',         // 可选结束日期
    todayDate: '',            // 今天的日期（用于对比）

    // 成功反馈
    showSuccessFeedback: false,
    successMessage: '',

    // 分享海报
    showSharePoster: false,
    shareData: null,

    // 成就系统
    showAchievementUnlock: false,
    currentAchievement: null,

    // FAB菜单
    showFabMenu: false,

    // 加载状态
    isLoading: true,
    lastRefreshTime: 0,
    cacheTimeout: 30000, // 30秒缓存

    // 网络状态
    isOnline: true,
    networkType: 'unknown',

    // 提醒设置
    reminderSettings: {
      enabled: false,
      time: '21:00',
      period: 'night'
    },
    reminderPermission: false,

    // 滑动操作配置
    swipeActions: [
      { text: '编辑', type: 'primary', icon: '✏️' },
      { text: '删除', type: 'danger', icon: '🗑️' }
    ],

    // 性能监控
    performanceMetrics: {
      loadStartTime: 0,
      loadEndTime: 0,
      dataLoadTime: 0,
      renderTime: 0,
      totalTime: 0
    }
  },

  onLoad () {
    // 记录页面开始加载时间
    const loadStartTime = Date.now();
    this.setData({ 'performanceMetrics.loadStartTime': loadStartTime });

    this.initDateRange()
    this.initPage()
    this.updateNetworkStatus()

    // 智能预加载：检查缓存时效
    this.preloadDataIfNeeded();

    // 首次加载数据
    this.loadData()

    // 安全保护：5秒后如果还在加载，强制关闭骨架屏
    this.loadingTimeout = setTimeout(() => {
      if (this.data.isLoading) {
        console.warn('[index] 加载超时，强制关闭骨架屏');
        this.setData({ isLoading: false });
        wx.showToast({
          title: '加载超时，请检查网络或云函数部署',
          icon: 'none',
          duration: 3000
        });
      }
    }, 5000);

    // 加载提醒设置
    this.loadReminderSettings()
  },

  onUnload () {
    // 清理加载超时定时器
    if (this.loadingTimeout) {
      clearTimeout(this.loadingTimeout);
      this.loadingTimeout = null;
    }
  },

  // 加载提醒设置
  async loadReminderSettings () {
    try {
      // 本地设置
      const local = reminder.getReminderSettings()
      let enabled = !!local.enabled
      let time = local.time || '21:00'
      let period = local.period || 'night'

      // 云端设置
      const cloudRes = await wx.cloud.callFunction({
        name: 'user',
        data: { action: 'getUserInfo' }
      })
      if (cloudRes?.result?.success) {
        const settings = cloudRes.result.data.settings || {}
        if (typeof settings.dailyReminder === 'boolean') enabled = settings.dailyReminder
        if (typeof settings.reminderTime === 'string') time = settings.reminderTime
        period = reminder.getRecommendedPeriod([])
      }

      const hasPerm = await reminder.checkReminderPermission()

      this.setData({
        reminderSettings: { enabled, time, period },
        reminderPermission: hasPerm
      })
    } catch (e) {
      console.warn('加载提醒设置失败', e)
    }
  },

  // 订阅打卡提醒
  async requestDailyReminderSubscription () {
    vibrate.light()
    try {
      // 获取近30天记录推荐时间
      let suggestTime = this.data.reminderSettings.time || '21:00'
      try {
        const since = getDateByOffset(getToday(), -30)
        const rangeRes = await recordAPI.getByRange(since, getToday())
        suggestTime = reminder.analyzeReminderTime(rangeRes || [])
      } catch (_) { }

      const result = await reminder.requestSubscribe(['CHECKIN_REMINDER'])
      if (result.success && result.authorized?.CHECKIN_REMINDER) {
        // 更新云端设置
        await wx.cloud.callFunction({
          name: 'user',
          data: { action: 'updateSettings', dailyReminder: true, reminderTime: suggestTime }
        })

        // 更新本地
        reminder.saveReminderSettings({ enabled: true, time: suggestTime, period: reminder.getRecommendedPeriod([]) })
        this.setData({ reminderSettings: { enabled: true, time: suggestTime, period: reminder.getRecommendedPeriod([]) } })
        wx.showToast({ title: '订阅成功', icon: 'success' })
      } else {
        wx.showToast({ title: '未授权订阅', icon: 'none' })
      }
    } catch (err) {
      wx.showToast({ title: '订阅失败，请稍后重试', icon: 'none' })
      console.warn('订阅失败', err)
    }
  },

  // 关闭每日提醒
  async disableDailyReminder () {
    vibrate.light()
    try {
      await wx.cloud.callFunction({ name: 'user', data: { action: 'updateSettings', dailyReminder: false } })
      reminder.saveReminderSettings({ enabled: false, time: this.data.reminderSettings.time, period: this.data.reminderSettings.period })
      this.setData({ 'reminderSettings.enabled': false })
      wx.showToast({ title: '已关闭每日提醒', icon: 'none' })
    } catch (e) {
      wx.showToast({ title: '操作失败', icon: 'none' })
    }
  },

  // 发送提醒测试
  async sendReminderTest () {
    vibrate.light()
    try {
      const res = await wx.cloud.callFunction({ name: 'message', data: { action: 'sendDailyReminder' } })
      if (res?.result?.success) {
        wx.showToast({ title: '已发送提醒', icon: 'success' })
      } else {
        wx.showToast({ title: res?.result?.errMsg || '发送失败', icon: 'none' })
      }
    } catch (e) {
      wx.showToast({ title: '云函数调用失败', icon: 'none' })
      console.warn('提醒测试失败', e)
    }
  },
  /**
   * 初始化日期范围
   */
  initDateRange () {
    const today = getToday()
    const startDate = getDateByOffset(-7) // 7天前
    const endDate = getDateByOffset(30)   // 30天后

    this.setData({
      todayDate: today,
      checkinDate: today,
      checkinDateDisplay: formatDateDisplay(today),
      dateRangeStart: startDate,
      dateRangeEnd: endDate
    })
  },

  onShow () {
    // 更新网络状态
    this.updateNetworkStatus();

    // 智能刷新：30秒内不重复加载(跳过首次加载)
    if (this.data.lastRefreshTime === 0) {
      return; // 首次加载已在 onLoad 中完成
    }

    const now = Date.now();
    const shouldRefresh = now - this.data.lastRefreshTime > this.data.cacheTimeout;

    if (shouldRefresh) {
      this.loadData();
      this.setData({ lastRefreshTime: now });
    }
  },

  // 初始化页面
  initPage () {
    const today = getToday()
    const weekday = getWeekday(today)
    this.setData({
      currentDate: `${formatDateChinese(today)} ${weekday}`
    })
  },

  // 加载数据
  async loadData () {
    // 检查网络状态
    const app = getApp();
    if (!app.globalData.isOnline) {
      wx.showToast({
        title: '当前离线，显示缓存',
        icon: 'none',
        duration: 2000
      });
      // 尝试从缓存加载
      this.loadFromCache();
      return;
    }

    // 尝试使用预加载的缓存数据
    const cachedPlans = app.getCachedData('plans');
    if (cachedPlans) {
      console.log('[index] 使用预加载的计划数据');
      try {
        // 立即使用缓存数据渲染页面
        const records = await recordAPI.getTodayRecords().catch(() => []);
        this.processData(cachedPlans, records || []);
        await this.loadStreakDays().catch(e => console.warn('加载连续天数失败:', e));
        this.updateCoachMessage();

        // 清除加载超时定时器
        if (this.loadingTimeout) {
          clearTimeout(this.loadingTimeout);
          this.loadingTimeout = null;
        }

        // 关闭骨架屏
        this.setData({ isLoading: false });

        // 后台静默更新数据
        this.silentRefreshData();
      } catch (err) {
        console.error('使用缓存数据失败:', err);

        // 清除加载超时定时器
        if (this.loadingTimeout) {
          clearTimeout(this.loadingTimeout);
          this.loadingTimeout = null;
        }

        this.setData({ isLoading: false });
      }
      return;
    }

    wx.showLoading({ title: '加载中...' })

    try {
      const dataLoadStartTime = Date.now();

      // 使用 Promise.allSettled 实现容错并行加载
      const results = await Promise.allSettled([
        planAPI.list(),
        recordAPI.getTodayRecords(),
        this.loadStreakDays()
      ]);

      const dataLoadEndTime = Date.now();
      const dataLoadTime = dataLoadEndTime - dataLoadStartTime;

      // 提取结果，失败的使用默认值
      const plans = results[0].status === 'fulfilled' ? results[0].value : [];
      const records = results[1].status === 'fulfilled' ? results[1].value : [];
      const streakSuccess = results[2].status === 'fulfilled';

      // 记录失败的请求
      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          const names = ['计划数据', '打卡记录', '连续天数'];
          console.error(`${names[index]}加载失败:`, result.reason);
        }
      });

      console.log('计划数据:', plans)
      console.log('记录数据:', records)
      console.log(`数据加载耗时: ${dataLoadTime}ms`);

      // 更新缓存
      if (plans && plans.length > 0) {
        app.setCachedData('plans', plans);
      }

      const renderStartTime = Date.now();

      // 处理数据
      this.processData(plans || [], records || [])

      // 更新教练消息
      this.updateCoachMessage()

      const renderEndTime = Date.now();
      const renderTime = renderEndTime - renderStartTime;
      const totalTime = renderEndTime - this.data.performanceMetrics.loadStartTime;

      wx.hideLoading()

      // 清除加载超时定时器
      if (this.loadingTimeout) {
        clearTimeout(this.loadingTimeout);
        this.loadingTimeout = null;
      }

      // 关闭骨架屏并记录刷新时间和性能指标
      this.setData({
        isLoading: false,
        lastRefreshTime: Date.now(),
        'performanceMetrics.loadEndTime': Date.now(),
        'performanceMetrics.dataLoadTime': dataLoadTime,
        'performanceMetrics.renderTime': renderTime,
        'performanceMetrics.totalTime': totalTime
      });

      // 输出性能报告
      this.logPerformanceMetrics(dataLoadTime, renderTime, totalTime);

      // 如果总加载时间超过1秒，发出警告
      if (totalTime > 1000) {
        console.warn(`[性能警告] 首屏加载时间 ${totalTime}ms 超过1秒目标`);
      }
    } catch (err) {
      wx.hideLoading()
      console.error('加载数据失败:', err)

      // 清除加载超时定时器
      if (this.loadingTimeout) {
        clearTimeout(this.loadingTimeout);
        this.loadingTimeout = null;
      }

      // 关闭骨架屏
      this.setData({ isLoading: false })

      wx.showToast({
        title: '数据加载失败，请先完成云函数和数据库部署',
        icon: 'none',
        duration: 3000
      })
    }
  },  // 处理计划和记录数据
  processData (plans, records) {
    // 后端分类代码映射
    const categoryCodeMap = {
      'exercise': '运动',
      'diet': '饮食',
      'sleep': '睡眠',
      'reading': '阅读',
      'study': '学习'
    };

    // 按维度分组（优化后的图标）
    const dimensionMap = {
      '运动': { icon: '💪', categoryClass: 'bg-sport', tasks: [] },
      '饮食': { icon: '🥗', categoryClass: 'bg-diet', tasks: [] },
      '睡眠': { icon: '😴', categoryClass: 'bg-sleep', tasks: [] },
      '阅读': { icon: '📚', categoryClass: 'bg-reading', tasks: [] },
      '学习': { icon: '✏️', categoryClass: 'bg-study', tasks: [] }
    }

    // 记录ID映射
    const recordMap = {}
    records.forEach(record => {
      recordMap[record.planId || record.plan_id] = record
    })

    // 组织任务数据
    let totalTasks = 0
    let completedTasks = 0

    // 筛选激活状态的计划
    const activePlans = plans.filter(plan =>
      plan.status === 'active' || plan.isEnabled === true
    )

    console.log('[processData] 激活的计划数:', activePlans.length)

    activePlans.forEach(plan => {
      const record = recordMap[plan._id]
      const completed = !!record

      // 转换分类代码为中文
      const categoryName = categoryCodeMap[plan.category] || plan.category

      const task = {
        id: plan._id,
        title: plan.title,
        targetText: this.getTargetText(plan),
        type: plan.targetType || plan.type,
        targetValue: plan.targetValue || plan.target_value,
        unit: plan.targetUnit || plan.unit,
        completed,
        record
      }

      if (dimensionMap[categoryName]) {
        dimensionMap[categoryName].tasks.push(task)
        totalTasks++
        if (completed) {
          completedTasks++
        }
      }
    })

    // 转换为数组
    const dimensions = Object.keys(dimensionMap).map(category => {
      const dim = dimensionMap[category]
      return {
        category,
        name: category,
        icon: dim.icon,
        categoryClass: dim.categoryClass,
        tasks: dim.tasks,
        totalCount: dim.tasks.length,
        completedCount: dim.tasks.filter(t => t.completed).length,
        expanded: dim.tasks.length > 0 // 有任务就默认展开
      }
    }).filter(dim => dim.totalCount > 0) // 只显示有任务的维度

    // 计算完成度
    const progressPercent = totalTasks > 0
      ? Math.round((completedTasks / totalTasks) * 100)
      : 0

    this.setData({
      dimensions,
      totalTasks,
      completedTasks,
      progressPercent
    });

    // 缓存数据到本地
    this.cacheData(dimensions, totalTasks, completedTasks, progressPercent);
  },

  /**
   * 缓存数据到本地存储
   */
  cacheData (dimensions, totalTasks, completedTasks, progressPercent) {
    try {
      wx.setStorageSync('cache_home_data', {
        dimensions,
        totalTasks,
        completedTasks,
        progressPercent,
        timestamp: Date.now()
      });
    } catch (e) {
      console.error('缓存数据失败:', e);
    }
  },

  /**
   * 从缓存加载数据
   */
  loadFromCache () {
    try {
      const cachedData = wx.getStorageSync('cache_home_data');
      if (cachedData) {
        this.setData({
          dimensions: cachedData.dimensions || [],
          totalTasks: cachedData.totalTasks || 0,
          completedTasks: cachedData.completedTasks || 0,
          progressPercent: cachedData.progressPercent || 0,
          isLoading: false
        });
        console.log('[离线模式] 从缓存加载数据');
      } else {
        // 没有缓存数据
        this.setData({
          dimensions: [],
          totalTasks: 0,
          completedTasks: 0,
          progressPercent: 0,
          isLoading: false
        });
      }
    } catch (e) {
      console.error('从缓存加载失败:', e);
      this.setData({ isLoading: false });
    }
  },

  // 获取目标文本
  getTargetText (plan) {
    const type = plan.targetType || plan.type
    const value = plan.targetValue || plan.target_value
    const unit = plan.targetUnit || plan.unit

    if (type === 'duration') {
      return `${value}${unit === 'minute' ? '分钟' : '小时'}`
    } else if (type === 'time') {
      // 时间类型，value 格式为 "HH:MM-HH:MM"
      return value || '时间段'
    } else if (type === 'count') {
      return `${value}${unit || '次'}`
    } else if (type === 'boolean') {
      return '完成即可'
    }
    return value + (unit || '')
  },

  // 加载连续天数
  async loadStreakDays () {
    try {
      const result = await recordAPI.calculateStreak()
      this.setData({
        streakDays: result.streak || 0
      })
      // 检查并发送里程碑祝贺
      this.checkAndSendStreakCongrats()
    } catch (err) {
      console.error('加载连续天数失败:', err)
    }
  },

  // 连续打卡里程碑祝贺
  async checkAndSendStreakCongrats () {
    try {
      const { streakDays } = this.data
      const milestones = [7, 14, 21, 30, 50, 100, 365]
      if (!milestones.includes(streakDays)) return

      // 避免重复发送，同一天只发送一次
      const key = `streak_congrats_${streakDays}`
      const today = getToday()
      const lastSent = wx.getStorageSync(key)
      if (lastSent === today) return

      // 请求订阅（如果尚未授权）
      try {
        await reminder.requestSubscribe(['STREAK_CONGRATS'])
      } catch (_) { }

      const res = await wx.cloud.callFunction({
        name: 'message',
        data: { action: 'sendStreakCongrats', streak: streakDays }
      })

      if (res?.result?.success) {
        wx.setStorageSync(key, today)
        wx.showToast({ title: `连续${streakDays}天，已发送祝贺！`, icon: 'success' })
      }
    } catch (e) {
      console.warn('发送里程碑祝贺失败', e)
    }
  },

  // 更新教练消息
  updateCoachMessage () {
    const { completedTasks, totalTasks, isOnline } = this.data;

    // 离线状态提示
    if (!isOnline) {
      this.setData({
        coachMessage: '当前离线，显示为缓存数据'
      });
      return;
    }

    const messages = this.getCoachMessages(completedTasks, totalTasks)
    const randomIndex = Math.floor(Math.random() * messages.length)

    this.setData({
      coachMessage: messages[randomIndex]
    })
  },

  /**
   * 更新网络状态
   */
  updateNetworkStatus () {
    const app = getApp();
    const isOnline = app.globalData.isOnline;
    const networkType = app.globalData.networkType;

    this.setData({
      isOnline,
      networkType
    });

    // 如果刚恢复在线，刷新数据
    if (isOnline && !this.data.isOnline && this.data.dimensions.length > 0) {
      this.loadData();
    }
  },

  /**
   * 网络状态变化回调（由app.js调用）
   */
  onNetworkChange (isOnline, networkType) {
    this.setData({
      isOnline,
      networkType
    });

    this.updateCoachMessage();

    // 恢复在线时刷新数据
    if (isOnline) {
      this.loadData();
    }
  },

  /**
   * 静默刷新数据
   * 在后台更新数据，不显示loading，不影响用户操作
   */
  /**
   * 智能预加载数据
   * 在页面加载时检查缓存，提前准备数据
   */
  preloadDataIfNeeded () {
    const app = getApp();
    const cachedPlans = app.getCachedData('plans');
    const cacheTime = app.getCachedDataTime('plans');
    const now = Date.now();

    // 如果缓存超过10秒，触发预加载
    if (!cachedPlans || (cacheTime && now - cacheTime > 10000)) {
      console.log('[预加载] 缓存过期或不存在，触发预加载');

      // 异步预加载，不阻塞页面初始化
      planAPI.list().then(plans => {
        if (plans && plans.length > 0) {
          app.setCachedData('plans', plans);
          console.log('[预加载] 计划数据预加载完成');
        }
      }).catch(e => {
        console.warn('[预加载] 预加载失败:', e);
      });
    } else {
      console.log('[预加载] 使用有效缓存，跳过预加载');
    }
  },

  /**
   * 输出性能监控指标
   */
  logPerformanceMetrics (dataLoadTime, renderTime, totalTime) {
    console.log('\n========== 性能监控报告 ==========');
    console.log(`📊 数据加载: ${dataLoadTime}ms`);
    console.log(`🎨 页面渲染: ${renderTime}ms`);
    console.log(`⏱️  总耗时: ${totalTime}ms`);
    console.log(`🎯 性能评级: ${this.getPerformanceGrade(totalTime)}`);
    console.log('===================================\n');

    // 在开发环境下显示性能提示
    if (totalTime > 1500) {
      wx.showToast({
        title: `加载较慢 ${(totalTime / 1000).toFixed(1)}s`,
        icon: 'none',
        duration: 2000
      });
    }
  },

  /**
   * 获取性能评级
   */
  getPerformanceGrade (totalTime) {
    if (totalTime < 800) return '优秀 ⭐⭐⭐';
    if (totalTime < 1200) return '良好 ⭐⭐';
    if (totalTime < 1800) return '一般 ⭐';
    return '需优化 ⚠️';
  },

  async silentRefreshData () {
    console.log('[index] 静默刷新数据');
    try {
      const app = getApp();
      const [plans, records] = await Promise.all([
        planAPI.list().catch(() => null),
        recordAPI.getTodayRecords().catch(() => null)
      ]);

      if (plans) {
        app.setCachedData('plans', plans);
        console.log('[index] 静默更新计划数据完成');
      }

      if (plans || records) {
        this.processData(plans || [], records || []);
        await this.loadStreakDays().catch(e => console.warn('静默加载连续天数失败:', e));
        this.updateCoachMessage();
      }
    } catch (err) {
      console.warn('[index] 静默刷新失败', err);
    }
  },

  // 获取教练消息列表
  getCoachMessages (completed, total) {
    const hour = new Date().getHours()

    // 早上问候
    if (hour < 12) {
      return ['早上好！今天也要元气满满哦~', '新的一天开始了，加油！', '早安！准备好迎接挑战了吗？']
    }

    // 全部完成
    if (completed === total && total > 0) {
      return ['太棒了！今天所有目标都完成了！', '你真是自律之星！', '完美收官！继续保持~']
    }

    // 部分完成
    if (completed > 0 && completed < total) {
      const remaining = total - completed
      return [
        `不错哦！还剩${remaining}个任务，继续加油！`,
        '已经很努力了，坚持完成剩下的吧！',
        `今天已经完成${completed}个任务了，再接再厉！`
      ]
    }

    // 未完成
    if (completed === 0 && total > 0) {
      if (hour >= 18) {
        return ['今天还没开始打卡呢，从一个小目标开始吧！', '别忘了今天的计划哦~', '还来得及，现在开始也不晚！']
      } else {
        return ['今天也要元气满满哦~', '准备好开始了吗？', '加油！你可以的！']
      }
    }

    return ['今天也要元气满满哦~']
  },

  // 展开/收起卡片
  toggleCard (e) {
    const { index } = e.currentTarget.dataset
    const { dimensions } = this.data

    dimensions[index].expanded = !dimensions[index].expanded

    // 轻微震动反馈
    vibrate.light();

    this.setData({ dimensions })
  },

  // 打卡
  handleCheckin (e) {
    const { taskId, taskTitle, taskType, taskUnit, taskTargetValue } = e.currentTarget.dataset

    // 轻微震动反馈
    vibrate.light();

    const task = {
      id: taskId,
      title: taskTitle,
      type: taskType,
      unit: taskUnit,
      targetValue: taskTargetValue
    }

    console.log('打卡 - 任务对象:', task)

    // 重置日期为今天
    const today = getToday()

    this.setData({
      showCheckinModal: true,
      currentTask: task,
      checkinValue: task.type === 'boolean' ? 1 : task.targetValue,
      checkinRemark: '',
      checkinDate: today,
      checkinDateDisplay: formatDateDisplay(today)
    })
  },

  // 关闭打卡弹窗
  closeCheckinModal () {
    this.setData({
      showCheckinModal: false,
      currentTask: null,
      checkinValue: '',
      checkinRemark: '',
      checkinDate: getToday(),
      checkinDateDisplay: formatDateDisplay(getToday())
    })
  },

  /**
   * 日期选择器变化
   */
  onCheckinDateChange (e) {
    const selectedDate = e.detail.value
    this.setData({
      checkinDate: selectedDate,
      checkinDateDisplay: formatDateDisplay(selectedDate)
    })

    // 轻微震动反馈
    vibrate.light()
  },

  /**
   * 长按任务项快捷打卡
   */
  /**
   * 处理滑动操作
   */
  handleSwipeAction (e) {
    const { action, index } = e.detail;
    const { task } = e.currentTarget.dataset;

    console.log('滑动操作:', action, task);

    if (action.text === '编辑') {
      this.editTask(task);
    } else if (action.text === '删除') {
      this.deleteTask(task);
    }
  },

  /**
   * 编辑任务
   */
  editTask (task) {
    // 震动反馈
    vibrate.medium();

    wx.showModal({
      title: '编辑任务',
      content: `确认编辑「${task.title}」？`,
      confirmText: '去编辑',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          // 跳转到计划详情页进行编辑
          wx.navigateTo({
            url: `/pages/plan/plan-detail?id=${task.id}`
          });
        }
      }
    });
  },

  /**
   * 删除任务
   */
  deleteTask (task) {
    // 强震动反馈
    vibrate.heavy();

    wx.showModal({
      title: '确认删除',
      content: `删除后无法恢复「${task.title}」，确认删除？`,
      confirmText: '删除',
      confirmColor: '#FF4444',
      cancelText: '取消',
      success: async (res) => {
        if (res.confirm) {
          try {
            wx.showLoading({ title: '删除中...' });

            // 调用删除 API
            await planAPI.delete(task.id);

            wx.hideLoading();
            wx.showToast({
              title: '删除成功',
              icon: 'success',
              duration: 2000
            });

            // 刷新数据
            this.loadData();
          } catch (err) {
            wx.hideLoading();
            console.error('删除任务失败:', err);
            wx.showToast({
              title: '删除失败',
              icon: 'error',
              duration: 2000
            });
          }
        }
      }
    });
  },

  handleLongPress (e) {
    const { taskId, taskTitle, taskType, taskUnit, taskTargetValue, taskCompleted } = e.currentTarget.dataset;

    // 已完成的任务不处理
    if (taskCompleted) {
      return;
    }

    // 检查网络状态
    if (!this.data.isOnline) {
      wx.showToast({
        title: '当前离线，无法打卡',
        icon: 'none',
        duration: 2000
      });
      return;
    }

    // 中等震动反馈
    vibrate.medium();

    // 布尔型任务直接快速打卡
    if (taskType === 'boolean') {
      wx.showModal({
        title: '快速打卡',
        content: `确认完成「${taskTitle}」？`,
        confirmText: '确认',
        cancelText: '取消',
        success: (res) => {
          if (res.confirm) {
            this.quickCheckin(taskId, taskTitle, 1, '');
          }
        }
      });
    } else {
      // 数值型任务显示快捷输入
      this.showQuickInput(taskId, taskTitle, taskType, taskUnit, taskTargetValue);
    }
  },

  /**
   * 快速打卡（无弹窗）
   */
  async quickCheckin (taskId, taskTitle, actualValue, remark) {
    vibrate.light();

    // 乐观更新UI
    this.updateTaskStatusLocally(taskId, {
      completed: true,
      actualValue: Number(actualValue),
      remark: remark || ''
    });

    // 显示成功动画
    this.showSuccessAnimation();

    // 异步保存到云端
    try {
      await recordAPI.create({
        planId: taskId,
        date: getToday(),
        actualValue: Number(actualValue),
        remark: remark || ''
      });

      console.log('快速打卡成功');

      // 延迟刷新数据
      setTimeout(() => {
        this.loadData();
      }, 1000);

    } catch (err) {
      console.error('快速打卡失败:', err);
      this.rollbackTaskStatus(taskId);
      vibrate.error();

      wx.showToast({
        title: '打卡失败',
        icon: 'none',
        duration: 2000
      });
    }
  },

  /**
   * 显示快捷输入框
   */
  showQuickInput (taskId, taskTitle, taskType, taskUnit, taskTargetValue) {
    wx.showModal({
      title: `快速打卡：${taskTitle}`,
      content: `请输入完成情况（目标${taskTargetValue}${taskUnit}）`,
      editable: true,
      placeholderText: `输入${taskUnit}`,
      success: (res) => {
        if (res.confirm && res.content) {
          const value = parseFloat(res.content);
          if (isNaN(value) || value <= 0) {
            wx.showToast({
              title: '请输入有效数值',
              icon: 'none'
            });
            return;
          }
          this.quickCheckin(taskId, taskTitle, value, '快速打卡');
        }
      }
    });
  },

  // 输入打卡数值
  onCheckinValueInput (e) {
    this.setData({
      checkinValue: e.detail.value
    })
  },

  // 输入备注
  onCheckinRemarkInput (e) {
    this.setData({
      checkinRemark: e.detail.value
    })
  },

  // 确认打卡
  async confirmCheckin () {
    const { currentTask, checkinValue, checkinRemark, checkinDate, isOnline, todayDate } = this.data

    // 检查网络状态
    if (!isOnline) {
      wx.showToast({
        title: '当前离线，无法打卡',
        icon: 'none',
        duration: 2000
      });
      return;
    }

    console.log('确认打卡 - 当前任务:', currentTask)
    console.log('确认打卡 - 输入值:', checkinValue)
    console.log('确认打卡 - 选择日期:', checkinDate)

    // 校验
    if (currentTask.type !== 'boolean' && !checkinValue) {
      wx.showToast({
        title: '请输入完成情况',
        icon: 'none'
      })
      return
    }

    if (!currentTask.id) {
      console.error('错误：任务ID不存在', currentTask)
      wx.showToast({
        title: '任务信息错误',
        icon: 'none'
      })
      return
    }

    // 1️⃣ 乐观更新：立即更新本地UI（仅当打卡今天时）
    if (checkinDate === todayDate) {
      this.updateTaskStatusLocally(currentTask.id, {
        completed: true,
        actualValue: Number(checkinValue),
        remark: checkinRemark
      });
    }

    // 关闭弹窗并显示成功动画（立即响应）
    this.closeCheckinModal();
    vibrate.success(); // 成功震动反馈

    // 仅在打卡今天时显示成功动画
    if (checkinDate === todayDate) {
      this.showSuccessAnimation();
    }

    // 2️⃣ 异步保存到云端
    try {
      console.log('发送打卡请求，参数:', {
        planId: currentTask.id,
        date: checkinDate,
        actualValue: Number(checkinValue),
        remark: checkinRemark
      })

      const result = await recordAPI.create({
        planId: currentTask.id,
        date: checkinDate,
        actualValue: Number(checkinValue),
        remark: checkinRemark
      })

      console.log('打卡成功，已同步到云端:', result)

      // 显示成功提示
      const dateDisplay = formatDateDisplay(checkinDate)
      wx.showToast({
        title: `${dateDisplay} 打卡成功`,
        icon: 'success',
        duration: 2000
      })

      // 检测成就解锁（仅今天的打卡）
      if (checkinDate === todayDate) {
        this.checkAchievements();
      }

      // 延迟刷新数据以获取最新的连续天数等统计
      setTimeout(() => {
        this.loadData()
      }, 1000)

    } catch (err) {
      console.error('打卡失败:', err)

      // 3️⃣ 失败回滚：恢复原状态（仅今天的打卡）
      if (checkinDate === todayDate) {
        this.rollbackTaskStatus(currentTask.id);
      }
      vibrate.error(); // 错误震动反馈

      wx.showToast({
        title: '打卡失败: ' + (err.message || '未知错误'),
        icon: 'none',
        duration: 2000
      })
    }
  },

  /**
   * 本地更新任务状态（乐观更新）
   */
  updateTaskStatusLocally (taskId, recordData) {
    const { dimensions } = this.data;
    let updated = false;

    // 查找并更新任务状态
    const newDimensions = dimensions.map(dim => {
      const tasks = dim.tasks.map(task => {
        if (task.id === taskId) {
          updated = true;
          return {
            ...task,
            completed: true,
            record: recordData
          };
        }
        return task;
      });
      return { ...dim, tasks };
    });

    if (!updated) {
      console.warn('未找到要更新的任务:', taskId);
      return;
    }

    // 重新计算统计数据
    let completedTasks = 0;
    let totalTasks = 0;

    newDimensions.forEach(dim => {
      totalTasks += dim.tasks.length;
      completedTasks += dim.tasks.filter(t => t.completed).length;
    });

    const progressPercent = totalTasks > 0
      ? Math.round((completedTasks / totalTasks) * 100)
      : 0;

    // 更新状态
    this.setData({
      dimensions: newDimensions,
      completedTasks,
      totalTasks,
      progressPercent
    });

    // 更新小教练消息
    this.updateCoachMessage();
  },

  /**
   * 回滚任务状态（失败时恢复）
   */
  rollbackTaskStatus (taskId) {
    // 重新加载数据
    this.loadData();
  },

  // 显示成功动画
  showSuccessAnimation () {
    const messages = [
      '太棒了！又战胜了一次懒惰~',
      '坚持就是胜利！',
      '你真棒！继续保持~',
      '又完成了一个小目标！'
    ]
    const randomIndex = Math.floor(Math.random() * messages.length)

    this.setData({
      showSuccessFeedback: true,
      successMessage: messages[randomIndex]
    })

    setTimeout(() => {
      this.setData({
        showSuccessFeedback: false
      })
      // 成功动画结束后,询问是否分享
      this.askForShare()
    }, 2000)
  },

  // 询问是否分享
  askForShare () {
    const { completedTasks, totalTasks, streakDays } = this.data;

    // 只有全部完成或连续天数是特殊数字时才询问
    const shouldAsk = (completedTasks === totalTasks && totalTasks > 0) ||
      [7, 14, 21, 30, 50, 100].includes(streakDays);

    if (!shouldAsk) {
      return;
    }

    wx.showModal({
      title: '分享成就',
      content: completedTasks === totalTasks
        ? '今日目标全部完成！要不要分享一下你的自律成果？'
        : `恭喜坚持${streakDays}天！要不要分享一下你的坚持？`,
      confirmText: '分享',
      cancelText: '下次',
      success: (res) => {
        if (res.confirm) {
          this.showShare();
        }
      }
    });
  },

  // 显示分享海报
  showShare () {
    const { completedTasks, totalTasks, streakDays } = this.data;
    const app = getApp();
    const userInfo = app.globalData.userInfo || {};

    this.setData({
      showSharePoster: true,
      shareData: {
        userName: userInfo.nickName || '自律达人',
        avatarUrl: userInfo.avatarUrl || '',
        completedCount: completedTasks,
        totalCount: totalTasks,
        streakDays,
        date: this.data.currentDate
      }
    });
  },

  // 关闭分享海报
  closeSharePoster () {
    vibrate.light();
    this.setData({
      showSharePoster: false,
      shareData: null
    });
  },

  // 分享海报保存回调
  onSharePosterSave (e) {
    console.log('海报已保存:', e.detail);
  },

  // 分享海报分享回调
  onSharePosterShare (e) {
    console.log('海报已分享:', e.detail);
  },

  /**
   * 切换FAB菜单
   */
  toggleFabMenu () {
    vibrate.light();
    this.setData({
      showFabMenu: !this.data.showFabMenu
    });
  },

  /**
   * 快速全部打卡（仅布尔型任务）
   */
  handleQuickCheckAll () {
    vibrate.light();
    this.setData({ showFabMenu: false });

    const { dimensions } = this.data;

    // 收集所有未完成的布尔型任务
    const booleanTasks = [];
    dimensions.forEach(dim => {
      dim.tasks.forEach(task => {
        if (!task.completed && task.type === 'boolean') {
          booleanTasks.push(task);
        }
      });
    });

    if (booleanTasks.length === 0) {
      wx.showToast({
        title: '没有可快速打卡的任务',
        icon: 'none'
      });
      return;
    }

    wx.showModal({
      title: '快速打卡',
      content: `确认完成所有${booleanTasks.length}个任务吗？`,
      confirmText: '确认',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          this.batchQuickCheckin(booleanTasks);
        }
      }
    });
  },

  /**
   * 批量快速打卡
   */
  async batchQuickCheckin (tasks) {
    wx.showLoading({ title: '打卡中...' });
    vibrate.success();

    let successCount = 0;
    let failCount = 0;

    for (const task of tasks) {
      try {
        // 更新本地UI
        this.updateTaskStatusLocally(task.id, {
          completed: true,
          actualValue: 1,
          remark: '快速批量打卡'
        });

        // 保存到云端
        await recordAPI.create({
          planId: task.id,
          date: getToday(),
          actualValue: 1,
          remark: '快速批量打卡'
        });

        successCount++;
      } catch (err) {
        console.error(`任务${task.id}打卡失败:`, err);
        failCount++;
      }
    }

    wx.hideLoading();

    if (successCount > 0) {
      this.showSuccessAnimation();
      this.askForShare();
    }

    wx.showToast({
      title: `成功${successCount}个${failCount > 0 ? '，失败' + failCount + '个' : ''}`,
      icon: successCount > 0 ? 'success' : 'none'
    });

    // 刷新数据
    setTimeout(() => {
      this.loadData();
    }, 1000);
  },

  // 跳转到计划页面
  goToPlan () {
    this.setData({ showFabMenu: false });
    wx.navigateTo({
      url: '/pages/plan/index'
    })
  },

  // 跳转到统计页面
  goToStatistics () {
    wx.switchTab({
      url: '/pages/statistics/index'
    })
  },

  /**
   * 检测成就解锁
   */
  async checkAchievements () {
    try {
      const { streakDays, completedTasks } = this.data;
      let unlockedAchievement = null;

      // 成就规则检测
      const achievementRules = [
        {
          id: 'first_checkin',
          name: '初来乍到',
          description: '完成第一次打卡',
          icon: '🎯',
          condition: completedTasks >= 1
        },
        {
          id: 'streak_3',
          name: '坚持3天',
          description: '连续打卡3天',
          icon: '🔥',
          condition: streakDays >= 3
        },
        {
          id: 'streak_7',
          name: '一周达成',
          description: '连续打卡7天',
          icon: '⭐',
          condition: streakDays >= 7
        },
        {
          id: 'streak_30',
          name: '月度冠军',
          description: '连续打卡30天',
          icon: '👑',
          condition: streakDays >= 30
        },
        {
          id: 'streak_100',
          name: '百日筑基',
          description: '连续打卡100天',
          icon: '💯',
          condition: streakDays >= 100
        },
        {
          id: 'tasks_10',
          name: '小试牛刀',
          description: '累计完成10个任务',
          icon: '🏅',
          condition: completedTasks >= 10
        },
        {
          id: 'tasks_50',
          name: '渐入佳境',
          description: '累计完成50个任务',
          icon: '🎖️',
          condition: completedTasks >= 50
        },
        {
          id: 'tasks_100',
          name: '百炼成钢',
          description: '累计完成100个任务',
          icon: '🏆',
          condition: completedTasks >= 100
        }
      ];

      // 获取已解锁的成就列表
      const unlockedIds = wx.getStorageSync('unlockedAchievements') || [];

      // 检查是否有新成就解锁
      for (const rule of achievementRules) {
        if (rule.condition && !unlockedIds.includes(rule.id)) {
          unlockedAchievement = rule;
          break;
        }
      }

      // 如果有新成就解锁
      if (unlockedAchievement) {
        // 保存到本地存储
        unlockedIds.push(unlockedAchievement.id);
        wx.setStorageSync('unlockedAchievements', unlockedIds);

        // 延迟显示成就动画（等待打卡成功动画结束）
        setTimeout(() => {
          this.showAchievementUnlock(unlockedAchievement);
        }, 1500);
      }

    } catch (err) {
      console.error('检测成就失败:', err);
    }
  },

  /**
   * 显示成就解锁动画
   */
  showAchievementUnlock (achievement) {
    this.setData({
      showAchievementUnlock: true,
      currentAchievement: achievement
    });
  },

  /**
   * 关闭成就动画
   */
  handleAchievementClose () {
    this.setData({
      showAchievementUnlock: false,
      currentAchievement: null
    });
  },

  /**
   * 分享成就
   */
  handleAchievementShare (e) {
    const { achievement } = e.detail;

    // 生成分享海报数据
    this.setData({
      showAchievementUnlock: false,
      showSharePoster: true,
      shareData: {
        type: 'achievement',
        achievement,
        streakDays: this.data.streakDays
      }
    });
  }
})
