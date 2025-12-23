/**
 * 首页数据处理 Behavior
 * 负责数据转换、统计计算、状态更新
 */

const { getToday } = require('../utils/date.js')

module.exports = Behavior({
  methods: {
    /**
     * 处理计划和记录数据
     */
    processData (plans, records) {
      console.log('processData 开始处理数据');

      // 今天的日期
      const today = getToday();

      // 分类统计
      const categoryMap = {
        health: { name: '运动健身', icon: '💪', category: 'health', categoryClass: 'category-health', tasks: [], completedCount: 0, totalCount: 0, expanded: true },
        study: { name: '学习阅读', icon: '📚', category: 'study', categoryClass: 'category-study', tasks: [], completedCount: 0, totalCount: 0, expanded: true },
        work: { name: '工作效率', icon: '💼', category: 'work', categoryClass: 'category-work', tasks: [], completedCount: 0, totalCount: 0, expanded: true },
        life: { name: '生活习惯', icon: '🏠', category: 'life', categoryClass: 'category-life', tasks: [], completedCount: 0, totalCount: 0, expanded: true },
        hobby: { name: '兴趣爱好', icon: '🎨', category: 'hobby', categoryClass: 'category-hobby', tasks: [], completedCount: 0, totalCount: 0, expanded: true }
      };

      // 创建记录Map以便快速查找
      const recordMap = {};
      records.forEach(record => {
        recordMap[record.planId] = record;
      });

      // 统计总任务数和已完成数
      let totalTasks = 0;
      let completedTasks = 0;

      // 遍历计划，按分类分组
      plans.forEach(plan => {
        // 检查今天是否是计划日
        const isToday = this.isPlanActiveToday(plan, today);
        if (!isToday) {
          console.log(`跳过非今日计划: ${plan.title}`);
          return;
        }

        const category = plan.category || 'life';
        const record = recordMap[plan._id];
        const completed = !!record;

        // 构造任务对象
        const task = {
          id: plan._id,
          title: plan.title,
          type: plan.type,
          targetValue: plan.targetValue,
          unit: plan.unit || '',
          targetText: this.getTargetText(plan),
          completed: completed,
          actualValue: record ? record.actualValue : 0,
          remark: record ? record.remark : ''
        };

        // 添加到对应分类
        if (categoryMap[category]) {
          categoryMap[category].tasks.push(task);
          categoryMap[category].totalCount++;
          if (completed) {
            categoryMap[category].completedCount++;
            completedTasks++;
          }
          totalTasks++;
        }
      });

      // 转换为数组，过滤掉空分类
      const dimensions = Object.values(categoryMap).filter(cat => cat.tasks.length > 0);

      // 计算完成百分比
      const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

      console.log('数据处理完成:', {
        totalTasks,
        completedTasks,
        progressPercent,
        dimensionsCount: dimensions.length
      });

      // 更新页面数据
      this.setData({
        dimensions,
        totalTasks,
        completedTasks,
        progressPercent
      });

      // 缓存数据
      this.cacheData(dimensions, totalTasks, completedTasks, progressPercent);

      // 检查成就
      this.checkAchievements();
    },

    /**
     * 判断计划今天是否激活
     */
    isPlanActiveToday (plan, today) {
      // 检查日期范围
      if (plan.startDate && today < plan.startDate) {
        return false;
      }
      if (plan.endDate && today > plan.endDate) {
        return false;
      }

      // 检查重复类型
      if (plan.repeatType === 'daily') {
        return true;
      }

      if (plan.repeatType === 'weekly') {
        const todayWeekday = new Date(today).getDay();
        return plan.repeatDays && plan.repeatDays.includes(todayWeekday);
      }

      if (plan.repeatType === 'monthly') {
        const todayDate = new Date(today).getDate();
        return plan.repeatDates && plan.repeatDates.includes(todayDate);
      }

      // 默认返回true
      return true;
    },

    /**
     * 获取目标文本
     */
    getTargetText (plan) {
      if (plan.type === 'boolean') {
        return '完成一次';
      } else if (plan.type === 'count') {
        return `${plan.targetValue || 1}${plan.unit || '次'}`;
      } else if (plan.type === 'duration') {
        return `${plan.targetValue || 30}${plan.unit || '分钟'}`;
      } else {
        return `${plan.targetValue || 1}${plan.unit || ''}`;
      }
    },

    /**
     * 本地更新任务状态（乐观更新）
     */
    updateTaskStatusLocally (taskId, recordData) {
      const { dimensions } = this.data;
      let updated = false;

      // 遍历所有分类和任务
      const newDimensions = dimensions.map(dim => {
        const newTasks = dim.tasks.map(task => {
          if (task.id === taskId) {
            updated = true;
            return {
              ...task,
              completed: recordData.completed,
              actualValue: recordData.actualValue || 0,
              remark: recordData.remark || ''
            };
          }
          return task;
        });

        // 重新计算该分类的完成数
        const completedCount = newTasks.filter(t => t.completed).length;

        return {
          ...dim,
          tasks: newTasks,
          completedCount
        };
      });

      if (updated) {
        // 重新计算总完成数
        const completedTasks = newDimensions.reduce((sum, dim) => sum + dim.completedCount, 0);
        const totalTasks = newDimensions.reduce((sum, dim) => sum + dim.totalCount, 0);
        const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

        this.setData({
          dimensions: newDimensions,
          completedTasks,
          progressPercent
        });

        // 更新教练消息
        this.updateCoachMessage();

        // 缓存数据
        this.cacheData(newDimensions, totalTasks, completedTasks, progressPercent);
      }
    },

    /**
     * 回滚任务状态
     */
    rollbackTaskStatus (taskId) {
      console.log('回滚任务状态:', taskId);
      this.updateTaskStatusLocally(taskId, {
        completed: false,
        actualValue: 0,
        remark: ''
      });
    }
  }
})
