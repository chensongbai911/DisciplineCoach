// components/calendar/index.js
const { formatDateChinese, getToday, parseDate } = require('../../utils/date.js');

Component({
  properties: {
    // 记录数据 { '2024-01-01': { status: 'completed', tasks: [...] } }
    records: {
      type: Object,
      value: {}
    },
    // 最多可补打卡天数
    maxRetroactiveDays: {
      type: Number,
      value: 7
    }
  },

  data: {
    year: 2024,
    month: 1,
    days: [],
    selectedDate: null,
    selectedDateInfo: null,
    today: ''
  },

  lifetimes: {
    attached () {
      const today = getToday();
      const [year, month] = today.split('-').map(Number);

      this.setData({
        year,
        month,
        today
      });

      this.generateCalendar();
    }
  },

  observers: {
    'records': function (records) {
      this.generateCalendar();
    }
  },

  methods: {
    /**
     * 生成日历数据
     */
    generateCalendar () {
      const { year, month, records, today } = this.data;
      const firstDay = new Date(year, month - 1, 1);
      const lastDay = new Date(year, month, 0);
      const firstWeekday = firstDay.getDay();
      const daysInMonth = lastDay.getDate();

      const days = [];

      // 上月补齐
      if (firstWeekday > 0) {
        const prevMonthLastDay = new Date(year, month - 1, 0).getDate();
        for (let i = firstWeekday - 1; i >= 0; i--) {
          const day = prevMonthLastDay - i;
          const date = this.formatDate(year, month - 1, day);
          days.push({
            day,
            date,
            isOtherMonth: true,
            isToday: date === today,
            hasRecord: false,
            isFuture: false
          });
        }
      }

      // 当月日期
      for (let day = 1; day <= daysInMonth; day++) {
        const date = this.formatDate(year, month, day);
        const record = records[date];
        const isFuture = date > today;

        days.push({
          day,
          date,
          isOtherMonth: false,
          isToday: date === today,
          hasRecord: !!record,
          status: record ? record.status : null,
          isFuture,
          isSelected: date === this.data.selectedDate
        });
      }

      // 下月补齐
      const remainingCells = 42 - days.length; // 6行7列
      for (let day = 1; day <= remainingCells; day++) {
        const date = this.formatDate(year, month + 1, day);
        days.push({
          day,
          date,
          isOtherMonth: true,
          isToday: date === today,
          hasRecord: false,
          isFuture: true
        });
      }

      this.setData({ days });
    },

    /**
     * 格式化日期
     */
    formatDate (year, month, day) {
      if (month < 1) {
        month = 12;
        year--;
      } else if (month > 12) {
        month = 1;
        year++;
      }

      return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    },

    /**
     * 选择日期
     */
    selectDate (e) {
      const { date, canSelect } = e.currentTarget.dataset;

      if (!canSelect) {
        return;
      }

      // 震动反馈
      wx.vibrateShort({
        type: 'light'
      });

      const { records, today, maxRetroactiveDays } = this.data;
      const record = records[date];

      // 计算日期差
      const diffDays = this.getDaysDiff(date, today);
      const canCheckin = diffDays >= 0 && diffDays <= maxRetroactiveDays;

      const info = {
        dateText: formatDateChinese(date),
        date,
        hasRecord: !!record,
        canCheckin,
        statusClass: record ? record.status : 'no-record',
        statusText: this.getStatusText(record, diffDays),
        tipText: this.getTipText(record, diffDays, canCheckin),
        buttonText: record ? '修改打卡' : (diffDays === 0 ? '立即打卡' : '补打卡'),
        tasks: record ? record.tasks : [] // 添加任务详情
      };

      this.setData({
        selectedDate: date,
        selectedDateInfo: info
      });

      // 更新日历显示选中状态（优化动画）
      const days = this.data.days.map(day => ({
        ...day,
        isSelected: day.date === date
      }));
      this.setData({ days });

      // 触发日期选择事件，传递详情
      this.triggerEvent('dateSelected', {
        date,
        info
      });
    },

    /**
     * 获取状态文本
     */
    getStatusText (record, diffDays) {
      if (record) {
        if (record.status === 'completed') return '已完成';
        if (record.status === 'partial') return '部分完成';
        if (record.status === 'missed') return '未完成';
      }

      if (diffDays === 0) return '今日';
      if (diffDays > 0) return `${diffDays}天前`;
      return '未来';
    },

    /**
     * 获取提示文本
     */
    getTipText (record, diffDays, canCheckin) {
      if (!canCheckin) {
        if (diffDays < 0) return '未来的日期无法打卡';
        return `超过${this.data.maxRetroactiveDays}天无法补打卡`;
      }

      if (record) {
        return '点击下方按钮可以修改打卡记录';
      }

      if (diffDays === 0) {
        return '今天还没有打卡，快来完成任务吧！';
      }

      return `这天还没有打卡记录，可以补打卡（${this.data.maxRetroactiveDays}天内有效）`;
    },

    /**
     * 计算日期差（天数）
     */
    getDaysDiff (date1, date2) {
      const d1 = new Date(date1);
      const d2 = new Date(date2);
      const diff = d2.getTime() - d1.getTime();
      return Math.floor(diff / (1000 * 60 * 60 * 24));
    },

    /**
     * 处理打卡
     */
    handleCheckin () {
      const { selectedDate, selectedDateInfo } = this.data;

      this.triggerEvent('checkin', {
        date: selectedDate,
        isRetroactive: selectedDate !== this.data.today,
        hasRecord: selectedDateInfo.hasRecord
      });
    },

    /**
     * 上一月
     */
    prevMonth () {
      // 震动反馈
      wx.vibrateShort({ type: 'light' });

      let { year, month } = this.data;
      month--;
      if (month < 1) {
        month = 12;
        year--;
      }

      this.setData({ year, month });
      this.generateCalendar();
    },

    /**
     * 下一月
     */
    nextMonth () {
      // 震动反馈
      wx.vibrateShort({ type: 'light' });

      let { year, month } = this.data;
      month++;
      if (month > 12) {
        month = 1;
        year++;
      }

      this.setData({ year, month });
      this.generateCalendar();
    },

    /**
     * 回到今天
     */
    goToday () {
      // 震动反馈
      wx.vibrateShort({ type: 'medium' });

      const today = getToday();
      const [year, month] = today.split('-').map(Number);

      this.setData({
        year,
        month,
        selectedDate: today
      });

      this.generateCalendar();

      // 自动选中今天
      setTimeout(() => {
        const todayCell = this.data.days.find(d => d.date === today);
        if (todayCell) {
          this.selectDate({
            currentTarget: {
              dataset: {
                date: today,
                canSelect: true
              }
            }
          });
        }
      }, 100);
    }
  }
});
