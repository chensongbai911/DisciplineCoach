// components/trend-chart/index.js
Component({
  properties: {
    title: {
      type: String,
      value: '完成趋势'
    },
    data: {
      type: Array,
      value: [],
      observer: 'processData'
    },
    primaryColor: {
      type: String,
      value: '#4FD1C5'
    }
  },

  data: {
    yLabels: [100, 75, 50, 25, 0],
    xLabels: [],
    lineSegments: [],
    tooltip: {
      show: false,
      x: 0,
      y: 0,
      date: '',
      value: 0
    }
  },

  methods: {
    /**
     * 处理数据
     */
    processData (newData) {
      if (!newData || newData.length === 0) {
        this.setData({
          xLabels: [],
          lineSegments: []
        });
        return;
      }

      const dataLength = newData.length;
      const xStep = 100 / (dataLength - 1 || 1);

      // 处理数据点位置
      const processedData = newData.map((item, index) => ({
        ...item,
        x: index * xStep,
        y: item.value || 0,
        showValue: false
      }));

      // 生成X轴标签（只显示首、中、尾）
      const xLabels = [];
      if (dataLength > 0) {
        xLabels.push({ text: this.formatDate(newData[0].date), position: 0 });

        if (dataLength > 2) {
          const midIndex = Math.floor(dataLength / 2);
          xLabels.push({
            text: this.formatDate(newData[midIndex].date),
            position: midIndex * xStep
          });
        }

        if (dataLength > 1) {
          xLabels.push({
            text: this.formatDate(newData[dataLength - 1].date),
            position: 100
          });
        }
      }

      // 生成折线段
      const lineSegments = [];
      for (let i = 0; i < dataLength - 1; i++) {
        const current = processedData[i];
        const next = processedData[i + 1];

        const x1 = current.x;
        const y1 = current.y;
        const x2 = next.x;
        const y2 = next.y;

        const length = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
        const angle = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;

        lineSegments.push({
          style: `left: ${x1}%; bottom: ${y1}%; width: ${length}%; transform: rotate(${angle}deg); background: ${this.data.primaryColor}`
        });
      }

      this.setData({
        data: processedData,
        xLabels,
        lineSegments
      });
    },

    /**
     * 格式化日期
     */
    formatDate (dateStr) {
      if (!dateStr) return '';
      const date = new Date(dateStr);
      return `${date.getMonth() + 1}/${date.getDate()}`;
    },

    /**
     * 点击数据点
     */
    handlePointTap (e) {
      const { index } = e.currentTarget.dataset;
      const point = this.properties.data[index];

      if (!point) return;

      // 显示提示
      const query = this.createSelectorQuery();
      query.select('.data-point').boundingClientRect();
      query.exec(res => {
        if (res && res[0]) {
          this.setData({
            tooltip: {
              show: true,
              x: res[0].left,
              y: res[0].top - 80,
              date: this.formatDate(point.date),
              value: point.value
            }
          });

          // 3秒后隐藏
          setTimeout(() => {
            this.setData({ 'tooltip.show': false });
          }, 3000);
        }
      });

      // 震动反馈
      wx.vibrateShort({ type: 'light' });
    }
  }
});
