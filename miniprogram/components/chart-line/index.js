// components/chart-line/index.js
// 折线图组件 - 显示完成趋势

Component({
  properties: {
    // 图表数据
    chartData: {
      type: Array,
      value: [],
      observer: 'updateChart'
    },
    // 图表高度
    height: {
      type: Number,
      value: 400
    },
    // 颜色配置
    colors: {
      type: Object,
      value: {
        line: '#4FD1C5',
        area: 'rgba(79, 209, 197, 0.2)',
        grid: '#E2E8F0',
        text: '#718096'
      }
    }
  },

  data: {
    canvasId: 'lineChart_' + Date.now(),
    showTooltip: false,
    tooltipData: {},
    tooltipPosition: { x: 0, y: 0 }
  },

  lifetimes: {
    attached () {
      // 延迟初始化，确保DOM已渲染
      setTimeout(() => {
        this.initChart();
      }, 100);
    }
  },

  methods: {
    /**
     * 初始化图表
     */
    initChart () {
      const { chartData } = this.properties;
      if (!chartData || chartData.length === 0) {
        console.warn('图表数据为空');
        return;
      }
      this.drawChart();
    },

    /**
     * 更新图表
     */
    updateChart (newData) {
      if (newData && newData.length > 0) {
        this.drawChart();
      }
    },

    /**
     * 绘制图表
     */
    drawChart () {
      const query = wx.createSelectorQuery().in(this);
      query.select('#' + this.data.canvasId)
        .fields({ node: true, size: true })
        .exec((res) => {
          if (!res || !res[0]) {
            console.error('Canvas节点获取失败');
            return;
          }

          const canvas = res[0].node;
          const ctx = canvas.getContext('2d');
          const dpr = wx.getSystemInfoSync().pixelRatio;

          const width = res[0].width;
          const height = res[0].height;

          canvas.width = width * dpr;
          canvas.height = height * dpr;
          ctx.scale(dpr, dpr);

          // 绘制图表
          this.renderChart(ctx, width, height);
        });
    },

    /**
     * 渲染图表
     */
    renderChart (ctx, width, height) {
      const { chartData, colors } = this.properties;

      // 清空画布
      ctx.clearRect(0, 0, width, height);

      // 边距
      const padding = {
        top: 20,
        right: 20,
        bottom: 40,
        left: 50
      };

      const chartWidth = width - padding.left - padding.right;
      const chartHeight = height - padding.top - padding.bottom;

      // 计算数据范围
      const values = chartData.map(d => d.value);
      const maxValue = Math.max(...values, 100);
      const minValue = Math.min(...values, 0);

      // 绘制网格线
      this.drawGrid(ctx, padding, chartWidth, chartHeight, maxValue);

      // 绘制折线和面积
      this.drawLine(ctx, chartData, padding, chartWidth, chartHeight, maxValue, minValue);

      // 绘制坐标轴
      this.drawAxes(ctx, chartData, padding, chartWidth, chartHeight, maxValue);

      // 绘制数据点
      this.drawPoints(ctx, chartData, padding, chartWidth, chartHeight, maxValue, minValue);
    },

    /**
     * 绘制网格线
     */
    drawGrid (ctx, padding, chartWidth, chartHeight, maxValue) {
      const { colors } = this.properties;
      const gridLines = 5;

      ctx.strokeStyle = colors.grid;
      ctx.lineWidth = 1;
      ctx.setLineDash([5, 5]);

      for (let i = 0; i <= gridLines; i++) {
        const y = padding.top + (chartHeight / gridLines) * i;
        ctx.beginPath();
        ctx.moveTo(padding.left, y);
        ctx.lineTo(padding.left + chartWidth, y);
        ctx.stroke();
      }

      ctx.setLineDash([]);
    },

    /**
     * 绘制折线和面积
     */
    drawLine (ctx, data, padding, chartWidth, chartHeight, maxValue, minValue) {
      const { colors } = this.properties;

      if (data.length === 0) return;

      const stepX = chartWidth / (data.length - 1 || 1);

      // 绘制面积
      ctx.fillStyle = colors.area;
      ctx.beginPath();
      ctx.moveTo(padding.left, padding.top + chartHeight);

      data.forEach((item, index) => {
        const x = padding.left + stepX * index;
        const y = padding.top + chartHeight - ((item.value - minValue) / (maxValue - minValue)) * chartHeight;
        if (index === 0) {
          ctx.lineTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });

      ctx.lineTo(padding.left + chartWidth, padding.top + chartHeight);
      ctx.closePath();
      ctx.fill();

      // 绘制折线
      ctx.strokeStyle = colors.line;
      ctx.lineWidth = 3;
      ctx.beginPath();

      data.forEach((item, index) => {
        const x = padding.left + stepX * index;
        const y = padding.top + chartHeight - ((item.value - minValue) / (maxValue - minValue)) * chartHeight;

        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });

      ctx.stroke();
    },

    /**
     * 绘制坐标轴
     */
    drawAxes (ctx, data, padding, chartWidth, chartHeight, maxValue) {
      const { colors } = this.properties;

      ctx.strokeStyle = colors.grid;
      ctx.lineWidth = 2;

      // X轴
      ctx.beginPath();
      ctx.moveTo(padding.left, padding.top + chartHeight);
      ctx.lineTo(padding.left + chartWidth, padding.top + chartHeight);
      ctx.stroke();

      // Y轴
      ctx.beginPath();
      ctx.moveTo(padding.left, padding.top);
      ctx.lineTo(padding.left, padding.top + chartHeight);
      ctx.stroke();

      // X轴标签
      ctx.fillStyle = colors.text;
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'center';

      const stepX = chartWidth / (data.length - 1 || 1);
      data.forEach((item, index) => {
        if (index % Math.ceil(data.length / 5) === 0 || index === data.length - 1) {
          const x = padding.left + stepX * index;
          const label = item.label || '';
          ctx.fillText(label, x, padding.top + chartHeight + 20);
        }
      });

      // Y轴标签
      ctx.textAlign = 'right';
      const gridLines = 5;
      for (let i = 0; i <= gridLines; i++) {
        const y = padding.top + (chartHeight / gridLines) * i;
        const value = Math.round(maxValue * (1 - i / gridLines));
        ctx.fillText(value.toString(), padding.left - 10, y + 4);
      }
    },

    /**
     * 绘制数据点
     */
    drawPoints (ctx, data, padding, chartWidth, chartHeight, maxValue, minValue) {
      const { colors } = this.properties;
      const stepX = chartWidth / (data.length - 1 || 1);

      data.forEach((item, index) => {
        const x = padding.left + stepX * index;
        const y = padding.top + chartHeight - ((item.value - minValue) / (maxValue - minValue)) * chartHeight;

        // 绘制圆点
        ctx.fillStyle = '#fff';
        ctx.strokeStyle = colors.line;
        ctx.lineWidth = 2;

        ctx.beginPath();
        ctx.arc(x, y, 4, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();
      });
    },

    /**
     * 处理触摸事件
     */
    handleChartTap (e) {
      const { chartData } = this.properties;
      if (!chartData || chartData.length === 0) return;

      const { x, y } = e.detail;

      // 获取Canvas尺寸
      const query = wx.createSelectorQuery().in(this);
      query.select('#' + this.data.canvasId)
        .fields({ size: true })
        .exec((res) => {
          if (!res || !res[0]) return;

          const width = res[0].width;
          const height = res[0].height;

          const padding = {
            top: 20,
            right: 20,
            bottom: 40,
            left: 50
          };

          const chartWidth = width - padding.left - padding.right;
          const stepX = chartWidth / (chartData.length - 1 || 1);

          // 查找最近的数据点
          let nearestIndex = -1;
          let minDistance = Infinity;

          chartData.forEach((item, index) => {
            const pointX = padding.left + stepX * index;
            const distance = Math.abs(x - pointX);

            if (distance < minDistance && distance < 50) {
              minDistance = distance;
              nearestIndex = index;
            }
          });

          // 显示tooltip
          if (nearestIndex >= 0) {
            const item = chartData[nearestIndex];
            const pointX = padding.left + stepX * nearestIndex;

            this.setData({
              showTooltip: true,
              tooltipData: {
                label: item.label,
                value: item.value
              },
              tooltipPosition: {
                x: pointX,
                y: y - 80
              }
            });

            // 3秒后自动隐藏
            setTimeout(() => {
              this.setData({ showTooltip: false });
            }, 3000);
          }
        });
    }
  }
});
