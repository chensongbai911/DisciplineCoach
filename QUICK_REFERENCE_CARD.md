# DisciplineCoach 部署快速参考卡

> 打印此页或收藏，部署时查阅

---

## 📌 项目基本信息（必记）

```
项目名称：DisciplineCoach（自律教练）
AppID：   wxd7b17df348c02834
环境名：   cloud1
环境ID：   cloud1-0g29mlsv3d4ca637
项目路径： d:\DisciplineCoach
```

---

## ⚡ 5分钟快速检查清单

**部署前必做：**

- [ ] 项目文件夹 `d:\DisciplineCoach` 完整存在
- [ ] `project.config.json` 包含 `envId: "cloud1-0g29mlsv3d4ca637"`
- [ ] `miniprogram/app.js` 中 `env: "cloud1-0g29mlsv3d4ca637"`
- [ ] 微信开发者工具已打开
- [ ] 已导入项目，输入正确的 AppID

---

## 🚀 部署核心步骤

### 第一步：检查和编译（5分钟）
```
1. 打开项目 → project.config.json 确认 AppID 和 envId
2. 按 Ctrl + B 编译
3. 右侧预览窗口显示首页 ✓
```

### 第二步：部署 7 个云函数（15分钟）
```
对每个函数执行：
右键 → "上传并部署：云端安装依赖（不上传 node_modules）"

顺序：
user → plan → record → statistics → payment → feedback → message
```

### 第三步：创建 5 个数据库集合（10分钟）
```
点击「云开发」→ 「数据库」

创建：users, plans, records, orders, feedbacks
（详细索引配置见 PHASE1_INTEGRATION.md）
```

### 第四步：快速测试（10分钟）
```
在云开发控制台 → 云函数 → 选择函数 → 测试

使用 CLOUD_FUNCTION_QUICK_TEST.md 中的测试用例
所有函数都应该返回 success: true
```

### 第五步：前端验证（5分钟）
```
1. 小程序首页应显示计划和统计数据
2. 点击任务可打卡
3. 页面自动刷新更新数据
```

---

## 🐛 出现问题快速救援

| 症状 | 快速解决 |
|------|---------|
| 云开发按钮消失 | 检查 `project.config.json` 的 `envId` 字段 |
| 云函数上传失败 | 确保选择「云端安装依赖」，检查 package.json |
| 权限被拒错误 | 确保集合创建成功，权限为 `read:false, write:false` |
| 首页显示空白 | 查看 Console (F12)，检查云函数是否部署成功 |
| 打卡后没反应 | 查看云函数日志，可能云函数执行失败 |

---

## 📱 云函数测试用例速查

### user.login
```json
{"action": "login"}
```
**预期：** `success: true` + 用户信息

### plan.create（创建计划，记下ID）
```json
{"action": "create", "params": {"name": "每日运动", "category": "health", "target": 10, "unit": "km", "frequency": "daily"}}
```

### plan.list
```json
{"action": "list", "params": {"status": "active"}}
```

### record.create（用上面的planId）
```json
{"action": "create", "params": {"planId": "xxx", "completion": 8.5, "note": "已完成"}}
```

### record.getTodayRecords
```json
{"action": "getTodayRecords"}
```

### statistics.getOverview
```json
{"action": "getOverview"}
```

### feedback.submit
```json
{"action": "submit", "params": {"type": "bug", "title": "测试", "content": "测试反馈"}}
```

### message.list
```json
{"action": "list", "params": {"limit": 10}}
```

---

## 📚 完整文档导航

```
DOCUMENTATION_INDEX.md          ← 你在这里，完整索引
DEPLOYMENT_CHECKLIST.md         ← 逐项部署指南 ⭐⭐⭐
WECHAT_DEVELOPER_TOOLS_GUIDE.md ← 工具详细教程
CLOUD_FUNCTION_QUICK_TEST.md    ← 所有测试用例
FRONTEND_INTEGRATION_GUIDE.md   ← 首页集成详解
PHASE1_INTEGRATION.md           ← 完整系统指南
```

---

## ⏱️ 预计时间表

| 步骤 | 时间 | 说明 |
|------|------|------|
| 检查项目配置 | 5分钟 | 最重要，不能跳过 |
| 部署 7 个云函数 | 15分钟 | 逐个右键上传 |
| 创建 5 个数据库集合 | 10分钟 | 点击确认即可 |
| 云函数功能测试 | 15分钟 | 用测试用例快速验证 |
| 前端集成测试 | 10分钟 | 在小程序中验证 |
| **总计** | **55分钟** | 最快完成时间 |

---

## ✅ 成功标志

```
✓ 7 个云函数显示「已部署」
✓ 5 个数据库集合创建成功
✓ 所有测试用例返回 success: true
✓ 小程序首页显示计划列表
✓ 可以完整打卡和查看数据
```

---

## 🎯 常用命令速查

### 微信开发者工具

```
Ctrl + B            # 编译
Ctrl + P            # 预览
F12                 # 打开调试工具
F5                  # 刷新
Ctrl + L            # 清空缓存
```

### 云函数部署（右键菜单）

```
同步云函数列表
    ↓
逐个上传并部署：云端安装依赖（不上传 node_modules）
```

### 数据库集合创建（云开发控制台）

```
新建集合 → 输入名称 → 确定 → 添加索引 → 完成
```

---

## 🔧 应急操作

### 如果无法打开云开发控制台
1. 检查 `project.config.json` 中 `envId` 是否正确
2. 重启微信开发者工具
3. 重新导入项目

### 如果云函数部署失败
1. 检查 `package.json` 是否存在
2. 选择「云端安装依赖」选项（不是「不安装依赖」）
3. 删除函数后重新部署

### 如果数据库操作报错
1. 确保所有 5 个集合都已创建
2. 确保权限设置为 `read:false, write:false`
3. 在云开发控制台的「日志」中查看错误详情

### 如果首页显示错误
1. 打开 Console (F12) 查看错误信息
2. 在云开发控制台查看云函数日志
3. 检查网络连接是否正常

---

## 📞 需要帮助？

查看对应的文档：

- **部署步骤不清楚？** → `DEPLOYMENT_CHECKLIST.md`
- **开发工具操作问题？** → `WECHAT_DEVELOPER_TOOLS_GUIDE.md`
- **云函数测试？** → `CLOUD_FUNCTION_QUICK_TEST.md`
- **前端如何集成？** → `FRONTEND_INTEGRATION_GUIDE.md`
- **完整的系统说明？** → `PHASE1_INTEGRATION.md`

---

## 📋 验收清单（部署完成后检查）

**后端验证：**
- [ ] user 函数已部署且测试通过
- [ ] plan 函数已部署且测试通过
- [ ] record 函数已部署且测试通过
- [ ] statistics 函数已部署且测试通过
- [ ] payment 函数已部署且测试通过
- [ ] feedback 函数已部署且测试通过
- [ ] message 函数已部署且测试通过
- [ ] 5 个数据库集合均已创建

**前端验证：**
- [ ] 小程序首页正常显示
- [ ] 计划列表正确加载
- [ ] 打卡流程正常工作
- [ ] 数据统计正确更新
- [ ] 没有 JavaScript 错误

---

## 💡 小贴士

1. **保存这个文件** - 部署时需要参考
2. **记下返回的 planId** - 后续测试需要用到
3. **关注 Console 输出** - 很多问题能从日志看出来
4. **使用快速测试用例** - 复制粘贴比手工输入快得多
5. **逐步完成** - 不要试图同时做多件事

---

## 🎉 部署完成后

- ✅ 第一阶段：云函数部署完成
- 📅 下一步：继续开发其他页面功能
- 📈 预期：每天完成 1-2 个页面的开发和集成

---

**保存此文档，部署时随时查阅！**

版本：1.0 | 更新：2024年 | 状态：完整
