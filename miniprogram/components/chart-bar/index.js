// components/chart-bar/index.js
// 柱状图组件 - 显示维度对比

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
      type: Array,
      value: ['#4FD1C5', '#F56565', '#48BB78', '#ECC94B', '#9F7AEA']
    }
  },

  data: {
    canvasId: 'barChart_' + Date.now()
  },

  lifetimes: {
    attached () {
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
        bottom: 60,
        left: 50
      };

      const chartWidth = width - padding.left - padding.right;
      const chartHeight = height - padding.top - padding.bottom;

      // 计算数据范围
      const values = chartData.map(d => d.value);
      const maxValue = Math.max(...values, 100);

      // 绘制网格线
      this.drawGrid(ctx, padding, chartWidth, chartHeight, maxValue);

      // 绘制柱状图
      this.drawBars(ctx, chartData, padding, chartWidth, chartHeight, maxValue, colors);

      // 绘制坐标轴
      this.drawAxes(ctx, chartData, padding, chartWidth, chartHeight, maxValue);
    },

    /**
     * 绘制网格线
     */
    drawGrid (ctx, padding, chartWidth, chartHeight, maxValue) {
      const gridLines = 5;

      ctx.strokeStyle = '#E2E8F0';
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
     * 绘制柱状图
     */
    drawBars (ctx, data, padding, chartWidth, chartHeight, maxValue, colors) {
      if (data.length === 0) return;

      const barWidth = chartWidth / data.length * 0.6;
      const barSpacing = chartWidth / data.length * 0.4;
      const barGap = (chartWidth / data.length - barWidth) / 2;

      data.forEach((item, index) => {
        const x = padding.left + barGap + (barWidth + barSpacing) * index;
        const barHeight = (item.value / maxValue) * chartHeight;
        const y = padding.top + chartHeight - barHeight;

        // 柱子颜色
        const color = colors[index % colors.length];

        // 绘制柱子
        ctx.fillStyle = color;
        this.drawRoundedRect(ctx, x, y, barWidth, barHeight, 4);

        // 绘制数值标签
        ctx.fillStyle = '#2D3748';
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(item.value.toString(), x + barWidth / 2, y - 8);
      });
    },

    /**
     * 绘制圆角矩形
     */
    drawRoundedRect (ctx, x, y, width, height, radius) {
      ctx.beginPath();
      ctx.moveTo(x + radius, y);
      ctx.lineTo(x + width - radius, y);
      ctx.arcTo(x + width, y, x + width, y + radius, radius);
      ctx.lineTo(x + width, y + height);
      ctx.lineTo(x, y + height);
      ctx.lineTo(x, y + radius);
      ctx.arcTo(x, y, x + radius, y, radius);
      ctx.closePath();
      ctx.fill();
    },

    /**
     * 绘制坐标轴
     */
    drawAxes (ctx, data, padding, chartWidth, chartHeight, maxValue) {
      ctx.strokeStyle = '#CBD5E0';
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
      ctx.fillStyle = '#718096';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'center';

      const barWidth = chartWidth / data.length * 0.6;
      const barSpacing = chartWidth / data.length * 0.4;
      const barGap = (chartWidth / data.length - barWidth) / 2;

      data.forEach((item, index) => {
        const x = padding.left + barGap + (barWidth + barSpacing) * index + barWidth / 2;
        const label = item.label || '';

        // 如果标签太长，换行显示
        if (label.length > 4) {
          const line1 = label.substring(0, 4);
          const line2 = label.substring(4);
          ctx.fillText(line1, x, padding.top + chartHeight + 20);
          ctx.fillText(line2, x, padding.top + chartHeight + 35);
        } else {
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
    }
  }
});
