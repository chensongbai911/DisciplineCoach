// index.js
const app = getApp()
const { recordAPI, planAPI } = require('../../utils/api.js')
const { formatDateChinese, getToday, getWeekday } = require('../../utils/date.js')

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

    // 成功反馈
    showSuccessFeedback: false,
    successMessage: ''
  },

  onLoad () {
    this.initPage()
  },

  onShow () {
    // 每次显示页面都刷新数据
    this.loadData()
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
    wx.showLoading({ title: '加载中...' })

    try {
      // 并行加载计划和记录
      const [plans, records] = await Promise.all([
        planAPI.list().catch(e => {
          console.error('加载计划失败:', e)
          return [] // 返回空数组，继续执行
        }),
        recordAPI.getTodayRecords().catch(e => {
          console.error('加载记录失败:', e)
          return [] // 返回空数组，继续执行
        })
      ])

      console.log('计划数据:', plans)
      console.log('记录数据:', records)

      // 处理数据
      this.processData(plans || [], records || [])

      // 加载连续天数
      this.loadStreakDays()

      // 更新教练消息
      this.updateCoachMessage()

      wx.hideLoading()
    } catch (err) {
      wx.hideLoading()
      console.error('加载数据失败:', err)
      wx.showToast({
        title: '数据加载失败，请先完成云函数和数据库部署',
        icon: 'none',
        duration: 3000
      })
    }
  },

  // 处理计划和记录数据
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
    })
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
    } catch (err) {
      console.error('加载连续天数失败:', err)
    }
  },

  // 更新教练消息
  updateCoachMessage () {
    const { completedTasks, totalTasks } = this.data
    const messages = this.getCoachMessages(completedTasks, totalTasks)
    const randomIndex = Math.floor(Math.random() * messages.length)

    this.setData({
      coachMessage: messages[randomIndex]
    })
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

    this.setData({ dimensions })
  },

  // 打卡
  handleCheckin (e) {
    const { taskId, taskTitle, taskType, taskUnit, taskTargetValue } = e.currentTarget.dataset

    const task = {
      id: taskId,
      title: taskTitle,
      type: taskType,
      unit: taskUnit,
      targetValue: taskTargetValue
    }

    console.log('打卡 - 任务对象:', task)

    this.setData({
      showCheckinModal: true,
      currentTask: task,
      checkinValue: task.type === 'boolean' ? 1 : task.targetValue,
      checkinRemark: ''
    })
  },

  // 关闭打卡弹窗
  closeCheckinModal () {
    this.setData({
      showCheckinModal: false,
      currentTask: null,
      checkinValue: '',
      checkinRemark: ''
    })
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
    const { currentTask, checkinValue, checkinRemark } = this.data

    console.log('确认打卡 - 当前任务:', currentTask)
    console.log('确认打卡 - 输入值:', checkinValue)

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

    wx.showLoading({ title: '打卡中...' })

    try {
      console.log('发送打卡请求，参数:', {
        planId: currentTask.id,
        date: getToday(),
        actualValue: Number(checkinValue),
        remark: checkinRemark
      })

      await recordAPI.create({
        planId: currentTask.id,
        date: getToday(),
        actualValue: Number(checkinValue),
        remark: checkinRemark
      })

      console.log('打卡成功')
      wx.hideLoading()

      // 关闭弹窗
      this.closeCheckinModal()

      // 显示成功反馈
      this.showSuccessAnimation()

      // 延迟刷新数据
      setTimeout(() => {
        this.loadData()
      }, 1500)

    } catch (err) {
      wx.hideLoading()
      console.error('打卡失败:', err)
      wx.showToast({
        title: '打卡失败: ' + (err.message || '未知错误'),
        icon: 'none'
      })
    }
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
    }, 2000)
  },

  // 跳转到计划页面
  goToPlan () {
    wx.navigateTo({
      url: '/pages/plan/index'
    })
  },

  // 跳转到统计页面
  goToStatistics () {
    wx.switchTab({
      url: '/pages/statistics/index'
    })
  }
})
