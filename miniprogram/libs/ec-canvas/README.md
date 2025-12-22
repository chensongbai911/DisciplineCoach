# ECharts for 微信小程序

使用说明请参考：https://github.com/ecomfe/echarts-for-weixin

## 使用方法

1. 下载 `echarts.js` 到此目录
2. 在页面中引入组件
3. 配置图表参数

## 文件结构

```
ec-canvas/
├── ec-canvas.js      # 组件逻辑
├── ec-canvas.json    # 组件配置
├── ec-canvas.wxml    # 组件模板
├── ec-canvas.wxss    # 组件样式
└── echarts.js        # ECharts 核心库
```

## 注意事项

- echarts.js 文件较大，建议使用分包加载
- 首次使用需要下载完整的 echarts-for-weixin 库
