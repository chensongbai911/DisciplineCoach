# 自律教练 (DisciplineCoach)

一个专注于日常习惯养成与个人成长的微信小程序，帮助用户在「运动、饮食、睡眠、阅读、学习」五个核心维度建立计划、坚持打卡，并通过数据反馈与激励机制实现自我提升。

![License](https://img.shields.io/badge/License-MIT-green.svg)
![Platform](https://img.shields.io/badge/Platform-WeChat%20Mini%20Program-blue.svg)
![Version](https://img.shields.io/badge/Version-1.0.0-brightgreen.svg)

## 🎯 核心功能

### 📋 计划管理
- **5大维度**：运动、饮食、睡眠、阅读、学习
- **灵活配置**：支持多种目标类型（时长、次数、布尔值等）
- **周期设置**：可自定义每周执行天数和提醒时间
- **启用/禁用**：可随时开启或关闭维度计划

### ✅ 打卡系统
- **实时反馈**：完成后即时展示成就动画
- **补打卡**：支持过去7天内的补打卡
- **数据记录**：自动保存打卡时间和完成情况
- **连续统计**：实时计算连续天数

### 📊 数据统计
- **趋势分析**：可视化完成度趋势（柱状图）
- **维度分布**：各维度完成情况一览（进度条）
- **时间范围**：支持周/月/年多维度统计
- **性能指标**：完成率、连续天数、平均值等

### 🏆 激励机制
- **成就徽章**：解锁多种成就徽章
- **等级系统**：VIP会员专享权益
- **小教练**：拟人化的激励角色
- **分享功能**：分享成就到社交媒体

### 👤 用户系统
- **微信登录**：一键授权登录
- **个人中心**：修改信息和偏好设置
- **会员系统**：灵活的订阅制付费方案
- **数据隐私**：基于OpenID的数据隔离

## 🛠️ 技术栈

### 前端
- **框架**：原生微信小程序（WXML + WXSS + JS）
- **UI设计**：现代毛玻璃设计风格（Glassmorphism）
- **图标系统**：iconfont + PNG + Emoji 三层兜底
- **动画**：CSS动画 + 微交互效果
- **响应式**：RPX单位适配各种屏幕

### 后端
- **云平台**：腾讯云CloudBase（微信云开发）
- **数据库**：云数据库（NoSQL）
- **云函数**：Node.js云函数
- **认证**：微信登录 + OpenID

### 工具
- **开发工具**：微信开发者工具
- **版本控制**：Git + GitHub
- **包管理**：npm

## 📁 项目结构

```
DisciplineCoach/
├── miniprogram/                    # 小程序源码
│   ├── pages/                      # 页面（首页、计划、统计等）
│   ├── components/                 # 组件（app-icon, app-image）
│   ├── utils/                      # 工具函数（api, validator, date等）
│   ├── styles/                     # 全局样式
│   ├── icons/                      # iconfont映射
│   ├── assets/                     # 资源（图片、图标）
│   ├── app.js                      # 应用入口
│   ├── app.json                    # 应用配置
│   ├── app.wxss                    # 全局样式
│   ├── project.config.json         # 项目配置
│   └── sitemap.json                # SEO配置
├── cloudfunctions/                 # 云函数
│   ├── plan/                       # 计划管理（CRUD）
│   ├── record/                     # 打卡记录
│   ├── statistics/                 # 数据统计
│   ├── user/                       # 用户信息
│   ├── payment/                    # 支付处理
│   ├── feedback/                   # 用户反馈
│   └── message/                    # 消息通知
├── openspec/                       # 规范和设计文档
├── 需求文档.md                      # 产品需求
├── DEPLOYMENT_CHECKLIST.md         # 部署清单
├── FINAL_DELIVERY_REPORT.md        # 交付报告
└── README.md                       # 本文件
```

## 🚀 快速开始

### 前置要求
- 微信开发者工具最新版本
- Node.js 12.0+
- 微信小程序账号

### 本地开发

1. **克隆项目**
```bash
git clone https://github.com/chensongbai911/DisciplineCoach.git
cd DisciplineCoach
```

2. **打开小程序**
- 打开微信开发者工具
- 选择「打开项目」
- 选择 `miniprogram` 目录
- 输入你的小程序AppID

3. **配置云环境**
- 在 `miniprogram/app.js` 中更新云环境ID
- 初始化云数据库和云函数

4. **启动开发**
- 点击「预览」预览小程序
- 或点击「编译」刷新项目

### 云函数部署

```bash
# 进入云函数目录
cd cloudfunctions/plan

# 安装依赖
npm install

# 在微信开发者工具中右键点击函数 > 上传及部署
```

## 📱 页面说明

### 首页 (index)
- 显示今日任务概览
- 展示各维度完成情况
- 快速打卡入口
- 小教练激励提示

### 计划管理 (plan)
- 创建/编辑计划
- 配置目标和频率
- 设置提醒时间
- 维度启用/禁用

### 数据统计 (statistics)
- 趋势分析（可横向滑动）
- 维度分布展示
- 成就徽章展示
- 多时间段对比

### 个人中心 (user)
- 用户信息展示
- 账户设置
- 会员信息
- 数据导出

### VIP中心 (vip)
- 会员套餐展示
- 权益说明
- 订阅管理
- 续费续购

### 反馈 (feedback)
- 问题报告
- 功能建议
- 联系方式
- 反馈历史

### 关于 (about)
- 应用介绍
- 版本信息
- 隐私政策
- 服务条款

## 🎨 设计亮点

### 视觉设计
- **渐变主题**：紫色梦幻渐变（#667eea → #764ba2）
- **毛玻璃效果**：半透明+高斯模糊的现代设计
- **光晕和阴影**：增强立体感和质感
- **圆角设计**：柔和的边角处理

### 微交互
- **浮动动画**：小教练头像轻微浮动
- **水波纹效果**：打卡按钮点击反馈
- **弹入动画**：成功反馈弹跳入场
- **进度条流光**：进度条的光流动画

### 无障碍
- **深色模式**：支持系统深色主题
- **可访问性**：合理的对比度和字体大小
- **响应式**：适配各种屏幕尺寸

## 📊 数据模型

### 数据库集合
- **users** - 用户信息和统计数据
- **plans** - 用户计划
- **records** - 打卡记录
- **feedback** - 用户反馈

### 关键字段
```javascript
// 计划对象
{
  _id: string,
  _openid: string,
  title: string,
  category: 'exercise|diet|sleep|reading|study',
  targetType: 'duration|count|boolean|time',
  targetValue: number,
  unit: string,
  reminderTime: string,
  days: number[],
  status: 'active|inactive',
  createdAt: timestamp,
  updatedAt: timestamp
}

// 打卡记录
{
  _id: string,
  _openid: string,
  planId: string,
  date: string,
  completedValue: number,
  remark: string,
  isCompleted: boolean,
  createdAt: timestamp
}
```

## 🔐 安全与隐私

- ✅ 所有用户数据基于OpenID隔离
- ✅ 云函数中验证用户身份
- ✅ 敏感操作需要用户确认
- ✅ 支持数据导出和删除
- ✅ 符合微信小程序规范

## 📈 性能优化

- ⚡ iconfont字体的3层兜底机制
- 📦 按需加载页面和组件
- 🎯 云函数并行执行
- 🔄 数据缓存和离线支持
- 📉 减少网络请求数量

## 🐛 已知问题与修复

### 近期修复
- ✅ 修复了完成度趋势图表显示
- ✅ 修复了维度分布的数据映射
- ✅ 优化了首页年轻化设计
- ✅ 更新了iconfont字体地址

### 计划改进
- [ ] 添加深色模式支持
- [ ] 实现数据导出功能
- [ ] 添加图表高级功能
- [ ] 支持多设备同步

## 📝 开发规范

### 命名规范
- 页面文件：小写 (index.wxml)
- 组件文件：kebab-case (app-icon)
- 变量/函数：camelCase (getUserInfo)
- 常量：UPPER_SNAKE_CASE (MAX_RETRY_COUNT)
- 样式类：kebab-case (.task-card)

### 代码风格
- 使用ES6+语法
- 严格的错误处理
- 详细的代码注释
- 一致的缩进（2空格）

### Git提交
```
<type>(<scope>): <subject>

<body>

<footer>
```

例如：
```
feat(index): add coach avatar animation

- Add float animation to coach avatar
- Improve visual feedback
- Update styles for better UX

Close #123
```

## 📄 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

## 👨‍💻 作者

**chensongbai911**
- GitHub: [@chensongbai911](https://github.com/chensongbai911)
- 微信: chensongbai911

## 🙏 致谢

感谢所有为这个项目做出贡献的人！

## 📞 联系方式

- 📧 Email: chensongbai911@gmail.com
- 💬 Issue: [GitHub Issues](https://github.com/chensongbai911/DisciplineCoach/issues)
- 💡 讨论: [GitHub Discussions](https://github.com/chensongbai911/DisciplineCoach/discussions)

---

**祝你使用愉快！如有问题或建议，欢迎反馈。** 🚀
