# Milestone 4 框架交接

仓库：https://github.com/FauReam/icsi418y-cstda-milestone4

已根据 Chrome 中的课程作业、M1 项目提案、M2 需求报告及最新提交的 M3 设计搭建 CSTDA 原型框架，沿用 React + Express + MongoDB。往期 PA4 是项目与 backlog 管理作业；本次 CSTDA 是小组日历与待办项目，已单独建仓。

## 已具备的功能

- 账号登录、退出、密码哈希、会话过期和用户数据隔离；账号通过 seed 创建。
- 月历切换、日期选择、当天日程与空状态。
- General 默认分类、自建分类、All 汇总视图和按分类筛选。
- 事件创建、编辑、跨分类移动、删除确认；颜色继承、覆盖与恢复。
- 任务创建、编辑、删除确认、完成/重新打开和 High/Medium/Low 优先级。
- MongoDB 持久化、输入验证、错误提示、键盘焦点样式和响应式页面。
- 自动集成测试和 GitHub Actions 构建检查。

## 启动

在仓库根目录执行：

```bash
npm ci
cp .env.example .env
npm run db:up
npm run seed -- --demo
npm run dev
```

浏览器打开 http://127.0.0.1:5173 。首次 seed 会打印 `student` 的随机密码，请本地保存。已有账号再次 seed 不会改密码。也可用 `.env` 中的 `SEED_USERNAME` 创建自己的测试账号。

验证命令为 `npm test` 和 `npm run build`。生产方式为先 build，再 `npm start`，打开 http://127.0.0.1:9000 。测试和开发依赖运行中的 MongoDB；`npm run db:down` 只停止项目数据库容器，保留数据卷。

## M4 要交的内容

原计划有 6 条 MVP，达到至少 60% 需要至少 4 条验收通过，即 4/6 = 66.7%。US-07 共享日历、US-08 重复事件单列为 stretch，不计入分母；登录也不算第 7 条故事。

代码已经提供 6 条故事的实现路径，并通过 10 项 API 集成测试及部分 Chrome 操作验证。最终报告中的 Complete 状态需要小组按验收清单复测，并在视频里展示实际结果。

后续使用：

1. `acceptance-checklist.md`：逐条验收，补 Firefox、键盘、性能及完整 UI 流程证据。
2. `prototype-report.md`：填写真实 Complete/Incomplete、完成比例、未完成工作与实际成员贡献，再导出 PDF。
3. `demo-script.md`：按 3–5 分钟要求录制；每条已完成故事要有 US 编号及可观察的保存结果。

文件名为 `Team03- Milestone 4- Prototype Report.pdf` 和 `Team03- Milestone 4- Demo` 加视频扩展名。Chrome 作业页显示截止 **2026 年 12 月 1 日 23:59**；提交前再核对课程页面。框架任务未向 Brightspace 提交任何内容。

五人小组的分配为共同工作 25%，每人 15%，总计 100%。每个人应按真实工作填写贡献，不能沿用前次分工当成本次完成情况。
