/**
 * 首页数据加载 Behavior
 * 负责数据获取、缓存管理、性能监控
 */

const app = getApp()
const { recordAPI, planAPI } = require('../utils/api.js')
const { getToday } = require('../utils/date.js')

module.exports = Behavior({
  data: {
    // 加载状态
    isLoading: true,
    lastRefreshTime: 0,
    cacheTimeout: 30000, // 30秒缓存

    // 性能监控
    performanceMetrics: {
      loadStartTime: 0,
      loadEndTime: 0,
      dataLoadTime: 0,
      renderTime: 0,
      totalTime: 0
    }
  },

  methods: {
    /**
     * 智能预加载数据 - 增强版
     */
    preloadDataIfNeeded () {
      const app = getApp();
      const now = Date.now();

      // 预加载计划数据
      const cachedPlans = app.getCachedData('plans');
      const plansTime = app.getCachedDataTime('plans');

      if (!cachedPlans || (plansTime && now - plansTime > 10000)) {
        console.log('[预加载] 开始预加载计划数据');
        this.preloadPlans();
      }

      // 预加载统计数据
      const cachedStats = app.getCachedData('statistics');
      const statsTime = app.getCachedDataTime('statistics');

      if (!cachedStats || (statsTime && now - statsTime > 30000)) {
        console.log('[预加载] 开始预加载统计数据');
        this.preloadStatistics();
      }

      // 预加载用户信息
      if (!app.globalData.userInfo) {
        console.log('[预加载] 开始预加载用户信息');
        this.preloadUserInfo();
      }
    },

    /**
     * 预加载计划数据
     */
    async preloadPlans () {
      try {
        const plans = await planAPI.list();
        if (plans && plans.length > 0) {
          getApp().setCachedData('plans', plans);
          console.log(`[预加载] 计划数据加载完成: ${plans.length}条`);
        }
      } catch (error) {
        console.warn('[预加载] 计划数据加载失败:', error);
      }
    },

    /**
     * 预加载统计数据
     */
    async preloadStatistics () {
      try {
        const { recordAPI } = require('../utils/api.js');
        const stats = await recordAPI.getStatistics({
          type: 'weekly',
          limit: 7
        });
        if (stats) {
          getApp().setCachedData('statistics', stats);
          console.log('[预加载] 统计数据加载完成');
        }
      } catch (error) {
        console.warn('[预加载] 统计数据加载失败:', error);
      }
    },

    /**
     * 预加载用户信息
     */
    async preloadUserInfo () {
      try {
        const { userAPI } = require('../utils/api.js');
        const userInfo = await userAPI.getInfo();
        if (userInfo) {
          const app = getApp();
          app.globalData.userInfo = userInfo;
          console.log('[预加载] 用户信息加载完成');
        }
      } catch (error) {
        console.warn('[预加载] 用户信息加载失败:', error);
      }
    },

    /**
     * 加载数据
     */
    async loadData () {
      // 检查网络状态
      const app = getApp();
      if (!app.globalData.isOnline) {
        wx.showToast({
          title: '当前离线，显示缓存',
          icon: 'none',
          duration: 2000
        });
        this.loadFromCache();
        return;
      }

      // 尝试使用预加载的缓存数据
      const cachedPlans = app.getCachedData('plans');
      if (cachedPlans) {
        console.log('[index] 使用预加载的计划数据');
        try {
          const records = await recordAPI.getTodayRecords().catch(() => []);
          this.processData(cachedPlans, records || []);
          await this.loadStreakDays().catch(e => console.warn('加载连续天数失败:', e));
          this.updateCoachMessage();

          if (this.loadingTimeout) {
            clearTimeout(this.loadingTimeout);
            this.loadingTimeout = null;
          }

          this.setData({ isLoading: false });
          this.silentRefreshData();
        } catch (err) {
          console.error('使用缓存数据失败:', err);
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

        if (this.loadingTimeout) {
          clearTimeout(this.loadingTimeout);
          this.loadingTimeout = null;
        }

        this.setData({
          isLoading: false,
          lastRefreshTime: Date.now(),
          'performanceMetrics.loadEndTime': Date.now(),
          'performanceMetrics.dataLoadTime': dataLoadTime,
          'performanceMetrics.renderTime': renderTime,
          'performanceMetrics.totalTime': totalTime
        });

        this.logPerformanceMetrics(dataLoadTime, renderTime, totalTime);

        if (totalTime > 1000) {
          console.warn(`[性能警告] 首屏加载时间 ${totalTime}ms 超过1秒目标`);
        }
      } catch (err) {
        wx.hideLoading()
        console.error('加载数据失败:', err)

        if (this.loadingTimeout) {
          clearTimeout(this.loadingTimeout);
          this.loadingTimeout = null;
        }

        this.setData({ isLoading: false })

        wx.showToast({
          title: '数据加载失败，请先完成云函数和数据库部署',
          icon: 'none',
          duration: 3000
        })
      }
    },

    /**
     * 静默刷新数据
     */
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
          this.setData({
            dimensions: [],
            totalTasks: 0,
            completedTasks: 0,
            progressPercent: 0,
            isLoading: false
          });
          console.log('[离线模式] 无缓存数据');
        }
      } catch (e) {
        console.error('加载缓存失败:', e);
        this.setData({ isLoading: false });
      }
    },

    /**
     * 缓存数据
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
     * 输出性能监控指标
     */
    logPerformanceMetrics (dataLoadTime, renderTime, totalTime) {
      console.log('\n========== 性能监控报告 ==========');
      console.log(`📊 数据加载: ${dataLoadTime}ms`);
      console.log(`🎨 页面渲染: ${renderTime}ms`);
      console.log(`⏱️  总耗时: ${totalTime}ms`);
      console.log(`🎯 性能评级: ${this.getPerformanceGrade(totalTime)}`);
      console.log('===================================\n');

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
    }
  }
})
