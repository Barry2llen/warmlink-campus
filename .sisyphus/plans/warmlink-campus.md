# 暖校 Link 校园互助平台前端工作计划

## TL;DR

> **Quick Summary**: 从零搭建「暖校 Link」校园互助平台前端，覆盖 16 个页面（P0 6 + P1 10），严格遵循 DESIGN.md 的 Airbnb 设计语言（Rausch 红 + warmth-glow 暖橙作为温度语义色），接入真 Gemini API 实现 AI 智能发布（含规则兜底），纯内存 Mock 数据，仅靠 Playwright 场景验证。
>
> **Deliverables**:
> - 16 个 React 页面 + 完整路由（/、/publish、/hall、/help/:id、/map、/profile 等）
> - DESIGN.md 设计 token 体系（Tailwind 主题 + CSS vars）
> - Zustand 域 store（events / users / areas / me / messages）
> - lib/llm/gemini.ts（真 API + JSON schema + 规则兜底）
> - 本地隐私正则检测套件（手机/微信/QQ/学号/宿舍/银行卡）
> - SVG 校园温度地图（程序化绘制 + 呼吸光圈 + 区域可点）
> - 管理端 Dashboard（recharts 图表 + 风险审核）
> - Playwright 端到端 QA 场景全覆盖
>
> **Estimated Effort**: XL（前端从零 16 页 + AI 集成 + 设计系统）
> **Parallel Execution**: YES - 5 个实现波次 + 1 个最终审核波
> **Critical Path**: 预飞修复 → 设计 token → 类型 + Mock seed → Stores + LLM → 共享组件 → P0 页面 → P1 页面 → 集成打磨 → 4 路审核 → 用户 okay

---

## Context

### Original Request
根据 docs 目录下的需求文档完成该项目的开发，阅读 docs 下的前端页面清单、DESIGN.md 并参考 docs/pages 下的所有界面原型（界面原型并不包含所有页面）。

### Interview Summary
**Key Discussions**:
- 设计冲突已裁决：DESIGN.md（Airbnb Rausch）为准，原型 HTML 仅作页面结构与功能参考，颜色/字体/图标/圆角全部按 DESIGN.md 重写
- 页面交付范围：16 页（P0 6 + P1 10），明确排除 8 个页面（/category/:type、/map/area/:id、/profile/warmth、/profile/badges、/admin/help、/admin/areas、/admin/users、/admin/volunteer）
- AI 能力：接入真 Google Gemini API（前端直连，VITE_GEMINI_API_KEY），用户自行在 .env 提供 key
- 数据：纯内存 Mock（Zustand），刷新重置
- 测试：仅 Playwright 场景验证，无 vitest 单测
- 图标：lucide-react（已装），不引入 Material Symbols
- 登录：默认 mock 学生用户，无登录页，管理端通过 /admin 路由直达

**Research Findings**:
- 当前 src/ 仍是 Vite 模板（仅 button.tsx + utils.ts），从零搭建
- package.json 已装 react-router 7、recharts、motion、radix-ui、lucide-react、tailwind-merge、cva、clsx、shadcn、@fontsource-variable/geist
- package.json 缺少：zustand、@google/genai、@fontsource/inter
- 8 套原型 HTML 使用 Material 风格 token 与 Material Symbols，需全部重写为 DESIGN.md 风格
- 原型覆盖：ai_link=AI 发布、link_1=互助详情、link_2=首页、link_3=发布成功、link_4=个人中心、link_5=温度地图、link_6=互助大厅、link_7=我的互助

### Metis Review
**Identified Gaps（已并入计划）**:
- Zustand 与 Gemini SDK 未安装 → 预飞任务安装
- Geist 字体不适合校园温暖语义 → 替换为 Inter + CJK 中文字体回退栈
- shadcn components.json 主题与 DESIGN.md 冲突 → 预飞任务统一映射
- Gemini JSON schema 未定义 → 预飞任务定义 TypeScript 接口
- 隐私正则未撰写测试 → 独立任务覆盖完整正则集
- 暖心值/信用分公式未定 → 在 mock seed 任务中冻结公式
- Rausch 红与"暖校"语义张力 → 决议：warmth-glow #FFB347 升格为暖意语义协奏色（用于暖心值/温度地图/徽章光晕/温度报告海报），Rausch 仅做主 CTA + brand
- SVG 校园地图实现路径 → 决议：程序化 React 组件（不依赖 SVG 资产文件）
- 真 Gemini 失败兜底必须视觉无差别 → 规则兜底产出与真 API 同形态结构
- 移动端 vs 桌面端 → 决议：桌面端为演示主目标，移动端响应式作为加分
- 默认 mock 用户禁止全 0 → 暖心值 127、信用 92、2 次完成、1 次发布、2 个徽章
- /admin 视觉切换 → 持久化"管理员模式"提示条
- 消息系统深度 → 仅通知，不做会话线程
- /publish/confirm 单独页保留（按文档清单），/publish/success 保留
- AI 仅在 /publish 调用，其他地方"AI 治理建议"是硬编码 mock

**保留作为决策点呈现给用户**：
- 是否同意 warmth-glow 升格为暖意语义协奏色（与 Rausch 共担 brand）

---

## Work Objectives

### Core Objective
从 Vite 默认模板出发，按 Airbnb DESIGN.md 视觉规范，从零交付 16 个页面的「暖校 Link」校园互助平台前端，包含 AI 智能发布（接入真 Gemini）、SVG 温度地图、Zustand 内存 Mock、recharts 管理端 Dashboard，所有页面通过 Playwright agent 端到端 QA 验证。

### Concrete Deliverables

#### 路由（共 16 页）
**P0 用户端核心**
- `/` 首页（U01）
- `/publish` AI 智能发布（U02）
- `/hall` 互助大厅（U05）
- `/help/:id` 互助详情（U06）
- `/map` 校园温度地图（U08）
- `/profile` 个人中心（U12）

**P1 用户端增强**
- `/publish/confirm` 发布确认（U03）
- `/publish/success` 发布成功（U04）
- `/my/help` 我的互助（U10）
- `/messages` 消息中心（U11）
- `/profile/report` 温度报告（U15）
- `/resources` 学习资料库（U16）
- `/volunteer` 公益活动（U17）
- `/safety` 安全与隐私说明（U18）

**P1 管理端**
- `/admin` 管理端 Dashboard（A01）
- `/admin/risk` 风险审核（A03）

#### 基础设施
- DESIGN.md token 完整映射到 Tailwind 4 主题 + CSS vars
- Zustand 5 个域 store + seed 初始化
- lib/llm/gemini.ts（真 API + 规则兜底，输出同 schema）
- lib/privacy/detect.ts（本地正则套件 + 单元自测）
- 共享 UI 组件：互助卡片、信用小组件、状态标签、紧急度标签、安全提醒卡、空状态、Toast 系统
- 全局布局：UserShell（顶部导航 + 移动端底栏）、AdminShell（侧边栏 + 管理员模式横幅）
- ErrorBoundary 包裹关键模块

### Definition of Done
- [ ] `npm run build` 通过（tsc + vite build 均无错）
- [ ] `npm run lint` 通过（无 error）
- [ ] 16 个路由全部可访问，每页主交互可用
- [ ] AI 发布在 .env 有 key 时调用真 Gemini，无 key 时规则兜底视觉无差别
- [ ] 隐私检测在输入"我的电话 13912345678"时本地标红
- [ ] SVG 温度地图至少 6 个区域点位带呼吸动画 + 可点击 + 弹出区域详情
- [ ] 个人中心默认用户：暖心值 127、信用 92、≥2 个已得徽章、本周数据非全 0
- [ ] 管理端 Dashboard 渲染 ≥3 个 recharts 图表
- [ ] 8 个 OUT-OF-SCOPE 页面不存在（路由不挂）
- [ ] 全部 Playwright 场景 PASS（每任务 ≥1 happy + ≥1 error/edge）

### Must Have（不可砍）
- DESIGN.md 配色（Rausch + warmth-glow 双协奏）严格落地
- AI 发布流程（输入 → 步骤动画 → 卡片预览 → 确认）
- /hall 卡片信息层级：标题 > 类型/状态 > 描述 > 地点/距离/信用/时间 > 操作
- /map 至少 6 个区域 + 呼吸光圈
- /profile 暖心值 ≥32px 字体
- /admin 管理员模式横幅 + ≥3 图表
- 隐私本地正则（绝不送 LLM）
- Sonner toast 全局
- ErrorBoundary 包裹 AI 与地图模块
- Inter + CJK 中文回退（PingFang SC, Microsoft YaHei）

### Must NOT Have（Guardrails - 任何越界一律 reject）
- ❌ 真实地理 API（`navigator.geolocation`）
- ❌ Web Speech / 语音输入
- ❌ WebSocket / 实时推送 / 轮询
- ❌ 图片上传 / 文件上传 / 文件下载
- ❌ 分页 / 无限滚动
- ❌ Dark mode / 主题切换
- ❌ i18n / 多语言切换
- ❌ 真实登录 / 注册 / 密码 / OAuth
- ❌ 每页 skeleton（仅 AI 发布、/hall 卡片列表、/map 加载用 skeleton）
- ❌ 词云组件
- ❌ 流式 UI（AI 步骤是 setTimeout 假动画，不是真 streaming）
- ❌ 消息会话线程 / 双向 chat
- ❌ AI 调用泛滥（仅 /publish 真调用 Gemini，其他"AI 治理建议"硬编码）
- ❌ 任何 Material Symbols 引入
- ❌ 8 个 OUT-OF-SCOPE 页面：/category/:type、/map/area/:id、/profile/warmth、/profile/badges、/admin/help、/admin/areas、/admin/users、/admin/volunteer
- ❌ AI slop：data/result/item/temp 等通用变量名、过度抽象、"为未来扩展"的死代码
- ❌ as any / @ts-ignore / 空 catch / 注释代码 / console.log 残留
- ❌ JSDoc 全方法注释（仅复杂逻辑加注释）
- ❌ 使用原型 HTML 的 token（#ba0036、#845400、#FFB347 之外的暖橙、Material 圆角）
- ❌ 在 OUT-OF-SCOPE 页面之外创建 placeholder 页

---

## Verification Strategy (MANDATORY)

> **ZERO HUMAN INTERVENTION** - 全部由 agent 通过 Playwright/Bash 直接验证。

### Test Decision
- **Infrastructure exists**: NO（项目无测试框架）
- **Automated tests**: NO（用户明确不要单测）
- **Framework**: 无单测，仅 Playwright 端到端
- **Privacy regex 例外**: privacy/detect.ts 的正则覆盖通过 Playwright 在浏览器内调用 `window.__detectPrivacy("13912345678")` 验证（实现暴露在 dev 模式 window 上）

### QA Policy
每个任务必须包含 agent 执行的 Playwright 场景（playwright skill）。证据保存至 `.sisyphus/evidence/task-{N}-{slug}.{png,txt}`。

- **Frontend/UI 任务**: Playwright 启动 vite dev server → 浏览器导航 → 填写交互 → 断言 DOM 文本/属性 → 截图存档
- **基础设施任务**: Playwright 启动 dev server 后访问页面验证渲染或在 console 调用全局函数验证
- **构建任务**: Bash 跑 `npm run build`，断言 exit 0 + dist/ 生成

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 0 (Pre-flight 修复 - 必须串行最先做):
└── 0. 依赖 + 字体 + shadcn 主题修复（一次性补齐）

Wave 1 (基础设施 - 7 任务全并行):
├── 1. Tailwind/CSS 设计 token（DESIGN.md → tailwind.config.ts + CSS vars）
├── 2. TypeScript 类型契约（events/users/areas/messages/badges/Gemini schema）
├── 3. Mock seed 数据（30 事项 + 8 区域 + 6 用户 + 8 徽章 + 暖心/信用公式）
├── 4. Zustand 域 stores（events/users/areas/me/messages）
├── 5. lib/llm/gemini.ts（真 API + 规则兜底 + 同 schema 输出）
├── 6. lib/privacy/detect.ts（手机/微信/QQ/学号/宿舍/银行卡正则套件）
└── 7. UserShell + AdminShell 布局 + 路由骨架（react-router 7 + ErrorBoundary + Sonner）

Wave 2 (共享组件 - 5 任务全并行 - 依赖 Wave1 全部):
├── 8. EventCard + StatusPill + UrgencyTag + SafetyTip 卡片家族
├── 9. UserBadgePack + WarmthMeter + CreditChip 信用展示家族
├── 10. CategoryTabs + SearchBar + SortBar + EmptyState 列表家族
├── 11. PublishStepper + AICard + MatchList 发布流家族
└── 12. AreaMapSVG（程序化校园 SVG + 呼吸光圈 + 区域 popup）

Wave 3 (P0 页面 - 6 任务全并行 - 依赖 Wave2 全部):
├── 13. U01 首页 `/`
├── 14. U02 AI 发布 `/publish`（含真 Gemini 调用与兜底）
├── 15. U05 互助大厅 `/hall`
├── 16. U06 互助详情 `/help/:id`（含 404 状态）
├── 17. U08 校园温度地图 `/map`
└── 18. U12 个人中心 `/profile`

Wave 4 (P1 页面 - 10 任务全并行 - 依赖 Wave3 关键依赖):
├── 19. U03 发布确认 `/publish/confirm`
├── 20. U04 发布成功 `/publish/success`
├── 21. U10 我的互助 `/my/help`
├── 22. U11 消息中心 `/messages`
├── 23. U15 温度报告 `/profile/report`
├── 24. U16 学习资料库 `/resources`
├── 25. U17 公益活动 `/volunteer`
├── 26. U18 安全与隐私 `/safety`
├── 27. A01 管理端 Dashboard `/admin`（recharts ≥3 图表）
└── 28. A03 风险审核 `/admin/risk`

Wave 5 (集成打磨 - 3 任务并行):
├── 29. 全局响应式 + 移动端 BottomNav + 导航高亮串联
├── 30. 跨页 happy path 串联 + 演示数据预热（/ → /publish → /publish/confirm → /publish/success → /my/help）
└── 31. AI slop 理 + 构建产物体积审计 + npm run build / lint 全绿

Wave FINAL (最终验证 - 4 路并行审核, 然后用户 okay):
├── F1. 计划合规审计（oracle）
├── F2. 代码质量审查（unspecified-high）
├── F3. 真实人工 QA（unspecified-high + playwright skill）
└── F4. 范围保真度检查（deep）
→ 呈现结果 → 等待用户明确 okay

Critical Path: 0 → 1-7 → 8-12 → 13-18 → 19-28 → 29-31 → F1-F4 → user okay
Parallel Speedup: 相比串行约 65% 提速
Max Concurrent: 10（Wave 4 P1 页面）
```

### Dependency Matrix（缩写形式 - 见各任务 Blocked By 字段获取完整依赖）

- **0**: 无 → 解锁全部
- **1-7**: 依赖 0 → 解锁 Wave 2
- **8-12**: 依赖 1, 2, 3, 4, 7 → 解锁 Wave 3
- **13**: 依赖 8, 9, 10 → 解锁 Wave 4 部分
- **14**: 依赖 5, 6, 11 → 解锁 19, 20
- **15**: 依赖 8, 10 → 解锁 16
- **16**: 依赖 8, 9, 15 → 解锁 21
- **17**: 依赖 12 → 解锁 Wave 4 部分
- **18**: 依赖 9 → 解锁 21, 23
- **19**: 依赖 14 → 解锁 20
- **20**: 依赖 19 → 解锁 21
- **27**: 依赖 4 (recharts 数据) → 解锁 28
- **29-31**: 依赖 13-28 全部 → 解锁 Final

### Agent Dispatch Summary

- **Wave 0**: 1 任务 - T0 → `quick`
- **Wave 1**: 7 任务 - T1/T7 → `unspecified-high`，T2/T3 → `quick`，T4/T5/T6 → `deep`
- **Wave 2**: 5 任务 - T8/T9/T10/T11 → `visual-engineering`，T12 → `artistry`
- **Wave 3**: 6 任务 - T13/T15/T17/T18 → `visual-engineering`，T14 → `deep`，T16 → `visual-engineering`
- **Wave 4**: 10 任务 - T19-T26 → `visual-engineering`，T27/T28 → `unspecified-high`
- **Wave 5**: 3 任务 - T29 → `visual-engineering`，T30 → `unspecified-high`，T31 → `unspecified-high`
- **Final**: 4 任务 - F1 → `oracle`，F2 → `unspecified-high`，F3 → `unspecified-high` + playwright skill，F4 → `deep`

---

## TODOs

- [x] 0. 预飞修复：依赖、字体、shadcn 主题对齐

  **What to do**:
  - `npm install zustand @google/genai @fontsource/inter sonner`
  - 删除 src/App.css、src/App.tsx、src/assets/（hero.png 保留）、src/index.css 旧内容（保留文件用 @import 重写）
  - public/icons.svg 删除（旧 vite 模板）
  - src/main.tsx 改为 import "./styles/globals.css" 后续步骤创建
  - 创建空 src/styles/globals.css 占位（含 `@import "tailwindcss";` + `@import "@fontsource/inter/400.css";` + 等等四个权重）
  - 检查 components.json：确认 baseColor 为 neutral，cssVariables: true。若是 oklch slate/zinc 则改 tailwind 主题映射阶段会接管
  - 创建 .env.example：`VITE_GEMINI_API_KEY=your-key-here`
  - 把 .env.local 写入 .gitignore（如果未有）
  - 删除 README.md 末尾 vite 模板内容，替换为最小项目说明（项目名、启动 npm run dev、环境变量说明）

  **Must NOT do**:
  - ❌ 不要修改 vite.config.ts、tsconfig*、eslint.config.js
  - ❌ 不要安装其他未明示依赖
  - ❌ 不要删除 package.json 已装的依赖
  - ❌ 不要删除 hero.png（后续可能用作首页 hero 图）

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: 安装依赖 + 删除模板文件 + 简单文本写入，机械任务
  - **Skills**: 无
  - **Skills Evaluated but Omitted**:
    - `git-master`: 不需要单独 commit 流程，主任务执行后统一 commit

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Sequential（所有后续任务依赖此任务）
  - **Blocks**: 1, 2, 3, 4, 5, 6, 7
  - **Blocked By**: None

  **References**:
  - `package.json:1-43` - 当前依赖列表，禁止改动 dev/build/lint/preview 脚本
  - `components.json` - shadcn 配置文件，确认 baseColor + cssVariables
  - `src/main.tsx` - 入口文件，需要改 import
  - `src/App.tsx`、`src/App.css`、`src/assets/react.svg`、`src/assets/vite.svg` - 模板文件，应删除
  - `vite.config.ts` - 不动
  - DESIGN.md 第 418 行 - "Inter is the closest open-source substitute for Airbnb Cereal"

  **WHY Each Reference Matters**:
  - package.json：确认现有依赖避免重装；脚本不能动
  - components.json：shadcn 主题在 T1 任务中需要继续配置，此处先确认基线
  - src/main.tsx + App.tsx：默认模板，必须替换为干净入口

  **Acceptance Criteria**:

  **QA Scenarios**:

  ```
  Scenario: 依赖与文件结构就绪
    Tool: Bash
    Preconditions: 工作目录 C:\projects\warmlink-campus
    Steps:
      1. cat package.json | grep -E '"(zustand|@google/genai|@fontsource/inter|sonner)"'
      2. test ! -f src/App.tsx && test ! -f src/App.css && test ! -f public/icons.svg && echo OK_DELETED
      3. cat src/main.tsx | grep "styles/globals.css"
      4. cat .env.example | grep "VITE_GEMINI_API_KEY"
      5. cat .gitignore | grep ".env.local"
      6. npm run build  (注意：会失败因 globals.css 还空，本任务不要求 build 通过)
    Expected Result: 步骤 1-5 全部输出匹配；步骤 6 失败可接受（提示缺 tailwind 类）
    Failure Indicators: 任意 grep 无输出、模板文件残留、main.tsx 仍 import App
    Evidence: .sisyphus/evidence/task-0-deps-files.txt

  Scenario: package.json 脚本未被破坏
    Tool: Bash
    Preconditions: 同上
    Steps:
      1. cat package.json | python -c "import sys, json; d=json.load(sys.stdin); print(d['scripts'])"
    Expected Result: 输出包含 dev / build / lint / preview 四脚本，与原始一致
    Failure Indicators: 脚本被改写或丢失
    Evidence: .sisyphus/evidence/task-0-scripts.txt
  ```

  **Evidence to Capture**:
  - [ ] task-0-deps-files.txt
  - [ ] task-0-scripts.txt

  **Commit**: YES
  - Message: `chore(deps): install zustand, gemini-sdk, fix font and clean template`
  - Files: `package.json`, `package-lock.json`, `src/main.tsx`, `.env.example`, `.gitignore`, `README.md`, `src/styles/globals.css`
  - Pre-commit: `npm install` 完成且 `package-lock.json` 已生成

- [x] 1. 设计 token 应用：DESIGN.md → Tailwind 4 主题 + CSS vars

  **What to do**:
  - 创建 `src/styles/tokens.css`：以 `@layer base` 写入所有 CSS 变量，颜色完全照搬 DESIGN.md
    - `--color-primary: #ff385c`、`--color-primary-active: #e00b41`、`--color-primary-disabled: #ffd1da`、`--color-ink: #222222`、`--color-body: #3f3f3f`、`--color-muted: #6a6a6a`、`--color-muted-soft: #929292`、`--color-hairline: #dddddd`、`--color-hairline-soft: #ebebeb`、`--color-border-strong: #c1c1c1`、`--color-canvas: #ffffff`、`--color-surface-soft: #f7f7f7`、`--color-surface-strong: #f2f2f2`
    - 增 1 个语义协奏色：`--color-warmth-glow: #FFB347`（仅暖意场景：暖心值数字、温度地图光圈、徽章光晕、温度报告海报渐变端）
    - 增 1 个紧急语义色：`--color-emergency: #e00b41`（紧急互助/风险标签）
    - 错误：`--color-error: #c13515`、`--color-error-hover: #b32505`
    - 法律链接：`--color-link-blue: #428bff`
  - 创建 `src/styles/globals.css`（覆盖 T0 占位）：
    - `@import "tailwindcss";`
    - `@import "@fontsource/inter/400.css";` + 500/600/700
    - `@import "./tokens.css";`
    - `@theme` 块（Tailwind 4 语法）映射颜色：`--color-primary: var(--color-primary);` 等
    - `@theme` 字体栈：`--font-sans: 'Inter', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;`
    - `@theme` 圆角阶：`--radius-xs: 4px; --radius-sm: 8px; --radius-md: 14px; --radius-lg: 20px; --radius-xl: 32px;`（full 由 Tailwind 自带 9999px）
    - `@theme` 间距阶（沿用 Tailwind 默认 4px 基线，仅补 section: 64px）
    - `@theme` 阴影：`--shadow-card-hover: rgba(0,0,0,0.02) 0 0 0 1px, rgba(0,0,0,0.04) 0 2px 6px 0, rgba(0,0,0,0.1) 0 4px 8px 0;`
    - 全局 `body { font-family: var(--font-sans); color: var(--color-ink); background: var(--color-canvas); }`
    - 全局 `*::selection { background: rgba(255,56,92,0.2); }`
  - 字号映射（用 Tailwind utilities 通过 className 直接表达，不再设置全局 type token）：
    - 各组件用 `text-[28px] font-bold leading-[1.43]` 表达 display-xl，避免污染全局 utility
  - 更新 components.json：确保 cssVariables=true，baseColor=neutral，验证 shadcn 后续添加组件会读取 globals.css 的 vars
  - 在 src/components/ui/button.tsx 中将 primary 颜色改为 `bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-active)]` 验证 token 生效

  **Must NOT do**:
  - ❌ 不要使用原型的 #ba0036 暗红、#845400 暖棕等 Material 颜色
  - ❌ 不要引入 Material Symbols（图标全部 lucide-react）
  - ❌ 不要在 tokens.css 写出 dark mode（user 决议无 dark mode）
  - ❌ 不要写自定义 CSS 类（@apply / .my-card{}）；全部走 Tailwind utility
  - ❌ 不要使用 Geist 字体（已在 T0 替换为 Inter）

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: 涉及 Tailwind 4 新语法 + DESIGN.md 精确映射，需要严谨
  - **Skills**: 无
  - **Skills Evaluated but Omitted**:
    - `frontend-app-builder`: 不在新建应用范围，仅 token 映射

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1（与 2/3/4/5/6/7 并行）
  - **Blocks**: 8-31（所有视觉相关任务）
  - **Blocked By**: 0

  **References**:
  - `DESIGN.md:6-30` - 完整 colors token 定义
  - `DESIGN.md:142-160` - rounded + spacing token 定义
  - `DESIGN.md:162-326` - components 属性引用色值/圆角的范例
  - `DESIGN.md:439-446` - elevation/shadow 单层定义
  - `DESIGN.md:382-419` - typography 含字体家族与字号阶
  - `src/components/ui/button.tsx` - 现有 shadcn button，验证 token
  - `components.json` - shadcn 主题宿主
  - Tailwind 4 文档 https://tailwindcss.com/docs/theme - `@theme` 指令语法

  **WHY Each Reference Matters**:
  - DESIGN.md colors 节：每个色值必须 1:1 落到 CSS var；有任何偏差 F1 会 reject
  - DESIGN.md rounded：必须严格按 0/4/8/14/20/32/full 七阶
  - DESIGN.md elevation：单层阴影是设计规范的硬约束，不可加多级
  - components.json：shadcn 走 cssVariables 路径才会读取 globals.css 的 var
  - Tailwind 4 `@theme`：v4 的新语法，与 v3 的 tailwind.config.js 不同

  **Acceptance Criteria**:

  **QA Scenarios**:

  ```
  Scenario: token 应用后 button 渲染 Rausch 红
    Tool: Playwright (playwright skill)
    Preconditions: T0 已完成；启动 npm run dev (端口 5173 默认)
    Steps:
      1. 创建临时 src/components/ui/button.tsx 验证 demo 路由（或临时在 main.tsx 渲染 <Button>测试</Button>）
      2. 浏览器打开 http://localhost:5173
      3. 等待按钮渲染
      4. 用 page.locator("button:has-text('测试')").evaluate(el => getComputedStyle(el).backgroundColor) 抓取 background-color
      5. 断言值为 rgb(255, 56, 92)
      6. 抓取 font-family 断言包含 "Inter"
      7. 截图 .sisyphus/evidence/task-1-button-rausch.png
    Expected Result: 背景 rgb(255,56,92)，字体含 Inter
    Failure Indicators: 颜色为默认黑/蓝；字体含 Geist/Times
    Evidence: .sisyphus/evidence/task-1-button-rausch.png

  Scenario: warmth-glow 仅在暖意语义场景使用（语义检查）
    Tool: Bash
    Preconditions: token 文件就绪
    Steps:
      1. grep -rn "warmth-glow" src/ 应仅在 tokens.css/globals.css 与未来的 WarmthMeter/AreaMapSVG 等组件出现
      2. 此任务阶段仅需 grep 在 src/styles/ 下出现
    Expected Result: 出现位置受控
    Evidence: .sisyphus/evidence/task-1-warmth-glow-grep.txt

  Scenario: 中文字体回退（Windows）
    Tool: Playwright
    Preconditions: dev server 启动
    Steps:
      1. 在 button 上写中文 "立即发布求助"
      2. 浏览器抓取 computed font-family 字符串
      3. 断言包含 "PingFang SC" 或 "Microsoft YaHei"
    Expected Result: CJK 回退栈生效
    Evidence: .sisyphus/evidence/task-1-cjk-fallback.txt
  ```

  **Evidence to Capture**:
  - [ ] task-1-button-rausch.png
  - [ ] task-1-warmth-glow-grep.txt
  - [ ] task-1-cjk-fallback.txt

  **Commit**: YES
  - Message: `feat(theme): apply DESIGN.md tokens (Rausch + warmth-glow)`
  - Files: `src/styles/globals.css`, `src/styles/tokens.css`, `src/components/ui/button.tsx`, `components.json`
  - Pre-commit: `npm run build` 通过

- [ ] 2. TypeScript 类型契约：领域模型 + Gemini JSON schema

  **What to do**:
  - 创建 `src/lib/types/domain.ts`：导出全部领域模型（按需求文档第 22 章字段需求）
    - `EventType`: `"idle" | "study" | "supplies" | "errand" | "volunteer" | "safety"`
    - `EventStatus`: `"waiting" | "matching" | "ongoing" | "pending_confirm" | "completed" | "cancelled" | "delisted"`
    - `Urgency`: `"low" | "medium" | "high"`
    - `User { id, nickname, avatar, school, college, warmth, credit, badges, helpsGiven, helpsReceived, registeredAt, lastActiveAt, role: "student" | "admin" }`
    - `Event { id, type, title, description, tags[], areaId, location, timeRequirement, urgency, publisherId, status, responders[], views, publishedAt, updatedAt, completedAt?, riskFlag? }`
    - `Area { id, name, x, y, width, height, todayCount, activeCount, hotTypes[], avgResponseMin, temperatureIndex, recentEvents[] }`
    - `Badge { id, name, icon, condition, progress, total, earned, earnedAt? }`
    - `Message { id, type: "intent"|"system"|"safety"|"volunteer"|"review", title, eventId?, sentAt, read, summary }`
    - `Resource { id, title, course, teacher?, type, contributorId, description, tags[], rating, favorites, gets, accessLevel, updatedAt, status: "approved"|"pending"|"rejected" }`
    - `VolunteerActivity { id, name, type, organizer, areaId, startsAt, endsAt, capacity, signedUp, requirements, deadline, status, completedRecords? }`
    - `RiskAlert { id, type, severity: "low"|"medium"|"high", relatedEventId, reason, suggestion, status: "pending"|"processing"|"resolved"|"ignored"|"escalated", createdAt, handler?, resolution? }`
  - 创建 `src/lib/llm/schema.ts`：导出 Gemini 结构化输出契约
    - `LLMPublishInput { rawText: string, hintAreaId?: string }`
    - `LLMPublishResult { type: EventType, title: string, description: string, urgency: Urgency, areaId: string|null, areaName: string, tags: string[], timeRequirement: string|null, suggestedHelpers: number, privacyRisks: PrivacyRisk[], safetyTips: string[], reasoning: string }`
    - `PrivacyRisk { kind: "phone"|"wechat"|"qq"|"studentId"|"dorm"|"bankCard", matched: string, advice: string }`
    - 导出 `LLM_RESPONSE_JSON_SCHEMA` 常量供 Gemini responseSchema 用
  - 创建 `src/lib/types/index.ts`：barrel re-export

  **Must NOT do**:
  - ❌ 不引入 zod 等运行时验证库（用户未授权额外依赖）
  - ❌ 不要把 Gemini 字段命名为 data/result/item/temp 等通用名
  - ❌ 不写 Date 类型（统一用 ISO string）
  - ❌ 不要为后续未实现页面（资料库/公益）单独留空类型

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: 类型定义机械任务，按需求第 22 章直译
  - **Skills**: 无

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1
  - **Blocks**: 3, 4, 5, 8-31
  - **Blocked By**: 0

  **References**:
  - `docs/暖校Link_需求文档.md:1317-1426` - 第 22 章数据字段（用户/事项/物品/资料/活动/风险全部字段定义）
  - `docs/暖校Link_需求文档.md:1430-1471` - 第 23 章状态流转（事项/物品/活动/风险四类状态机）
  - `docs/暖校Link_需求文档.md:373-395` - 第 7 章 AI 解析输出字段（标题/类型/紧急/地点/标签/隐私/安全/匹配数）
  - `docs/暖校Link_需求文档.md:407-417` - 第 7.8 隐私敏感词清单
  - Gemini 文档 https://ai.google.dev/api/generate-content#json-mode - responseSchema 格式

  **WHY Each Reference Matters**:
  - 第 22 章字段：每个领域模型字段必须 1:1 对齐，否则后续 store/UI 缺字段
  - 第 23 章状态机：枚举值必须严格匹配，UI 状态标签依赖
  - 第 7 章 AI 输出：LLMPublishResult 字段必须覆盖 AI 解析的全部 10 项

  **Acceptance Criteria**:

  **QA Scenarios**:

  ```
  Scenario: tsc 类型检查通过
    Tool: Bash
    Preconditions: T0/T1 已完成
    Steps:
      1. npx tsc --noEmit -p tsconfig.app.json
    Expected Result: exit 0，无 type 错误
    Failure Indicators: any 类型缺失、import 错
    Evidence: .sisyphus/evidence/task-2-tsc.txt

  Scenario: schema 字段覆盖完整
    Tool: Bash
    Preconditions: 文件就绪
    Steps:
      1. grep -E "type|title|description|urgency|areaId|tags|privacyRisks|safetyTips|suggestedHelpers" src/lib/llm/schema.ts | wc -l
      2. 期望 ≥9（全部字段都出现）
    Expected Result: ≥9
    Evidence: .sisyphus/evidence/task-2-schema-coverage.txt

  Scenario: 状态枚举完整
    Tool: Bash
    Steps:
      1. grep -E '"waiting"|"matching"|"ongoing"|"pending_confirm"|"completed"|"cancelled"|"delisted"' src/lib/types/domain.ts | wc -l
      2. 期望 ≥7
    Expected Result: 7 个状态全在
    Evidence: .sisyphus/evidence/task-2-status-enum.txt
  ```

  **Evidence to Capture**:
  - [ ] task-2-tsc.txt
  - [ ] task-2-schema-coverage.txt
  - [ ] task-2-status-enum.txt

  **Commit**: YES
  - Message: `feat(types): define event/user/area/llm-schema contracts`
  - Files: `src/lib/types/domain.ts`, `src/lib/types/index.ts`, `src/lib/llm/schema.ts`
  - Pre-commit: `npx tsc --noEmit -p tsconfig.app.json` 通过

- [ ] 3. Mock seed 数据：30 事项 + 8 区域 + 6 用户 + 8 徽章 + 暖心/信用公式

  **What to do**:
  - 创建 `src/lib/mock/seed.ts`，导出常量：
    - `SEED_AREAS`：8 个区域（图书馆 main-library / 一食堂 canteen-1 / 二食堂 canteen-2 / 宿舍区 dorm-area / 教学楼 teaching / 体育场 sports / 快递站 express / 校门口 main-gate），含 SVG 坐标 `{x, y, width, height}`（基于 viewBox 0 0 800 500），todayCount 区间 8-58，hotTypes 2-3 项，avgResponseMin 4-12，temperatureIndex 30-95
    - `SEED_USERS`：6 个用户：
      - `student-01` 林同学（默认登录）：warmth=127, credit=92, helpsGiven=8, helpsReceived=4, badges=["fast-responder","library-light"]
      - `student-02` 陈同学：warmth=320, credit=95, helpsGiven=22, helpsReceived=6
      - `student-03` 王同学：warmth=58, credit=88
      - `student-04` 李同学：warmth=410, credit=98, helpsGiven=35
      - `student-05` 赵同学：warmth=15, credit=82
      - `admin-01` 后勤运营组：role=admin
      - 头像用 https://api.dicebear.com/7.x/avataaars/svg?seed=xxx 占位 URL
    - `SEED_EVENTS`：30 个事项（每类型 4-6 条），按状态分布：12 waiting / 6 matching / 5 ongoing / 4 completed / 3 其它。覆盖：借伞、求资料、台灯赠送、搬行李、带饭、旧书捐赠等场景
    - `SEED_BADGES`：8 个：fast-responder（神速响应）、reliable-classmate（靠谱同学）、resource-master（资料达人）、charity-spark（公益星火）、green-recycler（绿色循环官）、library-light（图书馆之光）、dorm-guardian（宿舍守护者）、warmth-pioneer（暖心先锋）
    - `SEED_MESSAGES`：8 条消息覆盖 5 类型
    - `SEED_RESOURCES`：8 条学习资料
    - `SEED_VOLUNTEER`：6 条公益活动
    - `SEED_RISKS`：6 条风险（不同等级）
  - 暖心值/信用公式（写为注释 + 简单 helper）：
    - `warmth = helpsGiven*15 + completedHelps*5 + goodReviews*3 + sharedResources*8 + volunteerActivities*10 - cancelled*5 - badReviews*10`
    - `credit = 100 + completionRate*0.1 - violations*15 - lateReturns*5`，下限 0 上限 100
  - 创建 `src/lib/mock/index.ts`：barrel + `getDefaultUser()` 函数返回 student-01

  **Must NOT do**:
  - ❌ 不要使用真实姓名/手机号/学号
  - ❌ 不要让默认用户出现全 0 stats
  - ❌ 不要写超过 30 个事项（控制体积）
  - ❌ 不要从外部 fetch 数据（纯静态）
  - ❌ 不要让 SVG 坐标随机，必须按校园布局合理（图书馆中央偏上、宿舍下方、食堂两侧等）

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: 数据制作机械任务
  - **Skills**: 无

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1
  - **Blocks**: 4, 12, 13-31
  - **Blocked By**: 0, 2

  **References**:
  - `docs/暖校Link_需求文档.md:802-845` - 第 14.2-14.3 章校园 8 大区域 + 区域字段
  - `docs/暖校Link_需求文档.md:914-927` - 第 15.5 章 8 类徽章名称
  - `docs/暖校Link_需求文档.md:870-911` - 第 15.3-15.4 章暖心值/信用分增减场景
  - `docs/暖校Link_需求文档.md:526-535` - 第 8.8 章 6 类事项状态枚举
  - `src/lib/types/domain.ts`（T2 产出） - 类型契约

  **WHY Each Reference Matters**:
  - 14.2 8 大区域：seed 必须覆盖全部 8 个，否则地图渲染缺位
  - 15.5 徽章清单：徽章 ID 必须与 SEED_USERS.badges 一致
  - 8.8 状态枚举：seed 事项分布必须覆盖全部 6 种状态

  **Acceptance Criteria**:

  **QA Scenarios**:

  ```
  Scenario: seed 数量与覆盖正确
    Tool: Bash
    Steps:
      1. node -e "const s=require('./dist-eval/seed.cjs'); console.log(s.SEED_AREAS.length, s.SEED_USERS.length, s.SEED_EVENTS.length, s.SEED_BADGES.length)"
         （或用 npx tsx -e "import * as s from './src/lib/mock/seed.ts'; console.log(...)"）
      2. 期望输出：8 6 30 8
    Expected Result: 4 个数字精确匹配 8/6/30/8
    Evidence: .sisyphus/evidence/task-3-seed-counts.txt

  Scenario: 默认用户非全 0
    Tool: Bash
    Steps:
      1. npx tsx -e "import { getDefaultUser } from './src/lib/mock'; const u=getDefaultUser(); console.log(u.warmth, u.credit, u.helpsGiven, u.badges.length)"
      2. 期望 warmth>=100 && credit>=80 && helpsGiven>=2 && badges.length>=2
    Expected Result: 全部条件满足
    Evidence: .sisyphus/evidence/task-3-default-user.txt

  Scenario: 区域 ID 与坐标完整
    Tool: Bash
    Steps:
      1. grep -E '"id":\s*"(main-library|canteen-1|canteen-2|dorm-area|teaching|sports|express|main-gate)"' src/lib/mock/seed.ts | wc -l
      2. 期望 ≥8
    Expected Result: 8 个区域 ID 全在
    Evidence: .sisyphus/evidence/task-3-area-ids.txt
  ```

  **Evidence to Capture**:
  - [ ] task-3-seed-counts.txt
  - [ ] task-3-default-user.txt
  - [ ] task-3-area-ids.txt

  **Commit**: YES
  - Message: `feat(mock): seed events/users/areas/badges with warmth formula`
  - Files: `src/lib/mock/seed.ts`, `src/lib/mock/index.ts`
  - Pre-commit: `npx tsc --noEmit` 通过

- [ ] 4. Zustand 域 stores：events/users/areas/me/messages

  **What to do**:
  - 创建 5 个 Zustand store（不持久化，刷新重置）：
    - `src/lib/store/eventsStore.ts`：state `{ events: Event[], filters: { type?, urgency?, areaId?, query? }, sortBy }`，actions `addEvent / updateEventStatus / respondToEvent / setFilter / setSortBy / getFiltered()`
    - `src/lib/store/usersStore.ts`：state `{ users: User[] }`，actions `getById / list()`
    - `src/lib/store/areasStore.ts`：state `{ areas: Area[] }`，selector `getHotAreas()` 返回按 temperatureIndex 排序前 3
    - `src/lib/store/meStore.ts`：state `{ me: User, draftPublish?: LLMPublishResult, publishedHistory: string[], helpedHistory: string[] }`，actions `setDraftPublish / clearDraftPublish / addPublished / addHelped / addWarmth(n) / addBadgeProgress`
    - `src/lib/store/messagesStore.ts`：state `{ messages: Message[] }`，actions `markRead / addMessage`
  - 在 `src/lib/store/index.ts` 中初始化时调用 seed 数据（store 创建后立即 set）
  - 注意 react-router 7 + Zustand 不需要 Provider，直接 import 使用

  **Must NOT do**:
  - ❌ 不要使用 zustand/persist（用户决议刷新重置）
  - ❌ 不要在 store 内做副作用（fetch、setTimeout）
  - ❌ 不要把 LLM 调用塞进 store（保持 store 纯）
  - ❌ 不要写过度复杂的 selector（保持 < 30 行/store）

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: store 设计影响全局；要把 actions 抽象到合适粒度
  - **Skills**: 无

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1
  - **Blocks**: 8-31
  - **Blocked By**: 0, 2, 3

  **References**:
  - `src/lib/types/domain.ts` - 全部领域类型
  - `src/lib/mock/seed.ts` - 初始数据
  - Zustand 文档 https://github.com/pmndrs/zustand - create + selector 标准用法

  **WHY Each Reference Matters**:
  - domain.ts：store state 必须严格类型化
  - seed.ts：每个 store 的初始 state 直接来自对应 SEED_*

  **Acceptance Criteria**:

  **QA Scenarios**:

  ```
  Scenario: store 初始化与 mutate 正确
    Tool: Playwright（需先有最小渲染入口；可在 main.tsx 临时挂 <StoreSmoke /> 后还原）
    Preconditions: T0-T3 完成
    Steps:
      1. 在 src/components/_smoke/StoreSmoke.tsx 渲染 me / events.length / areas.length 数字到 DOM
      2. 在 main.tsx 渲染 <StoreSmoke />
      3. 启动 dev 打开页面
      4. page.locator("[data-testid=me-warmth]").textContent() 期望 "127"
      5. page.locator("[data-testid=events-count]").textContent() 期望 "30"
      6. page.locator("[data-testid=areas-count]").textContent() 期望 "8"
      7. 点击 [data-testid=add-warmth-btn]，期望 me-warmth 变为 "147"
      8. 截图存档
      9. 完成验证后删除 StoreSmoke 与 main.tsx 临时挂载（保留 router 阶段才正式挂）
    Expected Result: 步骤 4-7 全部断言通过
    Evidence: .sisyphus/evidence/task-4-store-smoke.png

  Scenario: filter selector 工作
    Tool: Playwright
    Steps:
      1. StoreSmoke 暴露按钮点击 setFilter({type:"study"})
      2. 期望 events 渲染数减少到约 4-6（学习资料类）
    Expected Result: 数字减少
    Evidence: .sisyphus/evidence/task-4-filter.png

  Scenario: 无 zustand/persist 引用
    Tool: Bash
    Steps:
      1. grep -rn "zustand/middleware\|persist" src/ ; 期望无输出
    Expected Result: 无输出
    Evidence: .sisyphus/evidence/task-4-no-persist.txt
  ```

  **Evidence to Capture**:
  - [ ] task-4-store-smoke.png
  - [ ] task-4-filter.png
  - [ ] task-4-no-persist.txt

  **Commit**: YES
  - Message: `feat(state): wire zustand domain stores`
  - Files: `src/lib/store/*.ts`
  - Pre-commit: `npx tsc --noEmit` 通过

- [ ] 5. lib/llm/gemini.ts：真 Gemini API + 规则兜底（同 schema 输出）

  **What to do**:
  - 创建 `src/lib/llm/gemini.ts`：
    - 导出 `analyzePublish(input: LLMPublishInput): Promise<LLMPublishResult>`
    - 实现：
      1. 读取 `import.meta.env.VITE_GEMINI_API_KEY`
      2. 若 key 缺失或为 "your-key-here"，直接调用 `fallbackAnalyze(input)`
      3. 否则用当前 Gemini SDK `@google/genai` 的 `new GoogleGenAI({ apiKey: key }).models.generateContent({ model: "gemini-2.5-flash", contents, config: { responseMimeType: "application/json", responseSchema: LLM_RESPONSE_JSON_SCHEMA } })`
      4. prompt 模板：
         ```
         你是「暖校 Link」校园互助平台的 AI 助手。请分析以下用户输入，返回严格符合 schema 的 JSON：
         - type: 闲置物品=idle / 学习资料=study / 生活物资=supplies / 临时求助=errand / 公益帮扶=volunteer / 安全提醒=safety
         - urgency: 高=high（立即/天气/夜间/身体不适/安全），中=medium（当天/考试/短时），低=low（非即时/闲置/长期）
         - 区域候选：{从 SEED_AREAS 注入名称列表}
         - 标题 ≤ 16 字，描述 30-80 字，礼貌清晰，不暴露隐私（手机号/微信号/QQ/学号/详细宿舍号已被本地预处理）
         - tags 3-5 个
         - safetyTips 1-2 条温和提醒
         - reasoning 简述判断依据（≤ 30 字）
         用户输入：「{rawText}」
         ```
      5. try/catch：任何抛错（rate limit / network / 解析失败）→ fallbackAnalyze
      6. 返回前用本地 detect.ts（T6 产出）扫一遍 rawText 收集 privacyRisks，覆盖 LLM 返回值（隐私只信本地）
    - 实现 `fallbackAnalyze(input)`：基于关键词规则
      - 含「伞|借|生活|充电宝」→ supplies / errand
      - 含「资料|笔记|真题|课本|高数」→ study
      - 含「赠送|送|闲置|台灯|二手」→ idle
      - 含「搬|带|帮忙|陪同|带饭|拍照」→ errand
      - 含「志愿|公益|捐|献血」→ volunteer
      - 含「受伤|危险|急救|不舒服」→ safety + urgency=high
      - 含「下雨|今天|马上|急」→ urgency=high；含「明天|考试」→ medium；其它 low
      - 区域：从 areaName 关键词在 SEED_AREAS 名称里 includes 命中第一个；找不到 areaId=null
      - 生成 title/description 用模板：「需要 {物品}」/「我在 {地点} {场景}，希望同学帮忙」
      - tags：从输入分词 + 类型默认标签拼接
      - safetyTips：固定 ["建议在公共区域交接", "保留沟通记录便于核实"]
      - suggestedHelpers: 3
      - reasoning: "规则匹配（演示模式）"
  - 隐私脱敏：在调用 Gemini 前把检测到的隐私串替换为 [已隐藏] 再送 prompt
  - export 一个 `isLLMConfigured(): boolean` 辅助 UI 区分

  **Must NOT do**:
  - ❌ 不要把检测到的原始 PII 送给 Gemini
  - ❌ 不要使用 await fetch 直连（用官方 SDK）
  - ❌ 不要让兜底返回值缺字段（必须与真 API 返回 schema 完全一致）
  - ❌ 不要 console.log 真实 prompt 或 API key
  - ❌ 不要让兜底响应延迟 < 1.5s（演示需要假动画时间）；用 await new Promise(r=>setTimeout(r,1800))

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: AI 集成 + 规则兜底 + 隐私安全，需要严谨设计
  - **Skills**: 无
  - **Skills Evaluated but Omitted**:
    - `react-best-practices`: 此为非组件任务

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1
  - **Blocks**: 14（AI 发布页直接消费）
  - **Blocked By**: 0, 2, 3, 6（必须等 detect.ts）

  **References**:
  - `docs/暖校Link_需求文档.md:328-429` - 第 7 章 AI 智能发布全规则
  - `docs/暖校Link_需求文档.md:1131-1209` - 第 19 章 AI 能力需求 + 风险检测
  - `src/lib/llm/schema.ts` - LLMPublishResult + LLM_RESPONSE_JSON_SCHEMA
  - `src/lib/privacy/detect.ts` - 本地隐私检测（T6 产出）
  - Gemini SDK 文档 https://ai.google.dev/gemini-api/docs/structured-output - responseSchema 用法

  **WHY Each Reference Matters**:
  - 第 7 章规则：紧急度判断/类型分类/隐私清单的判定标准必须严格落地
  - 第 19 章 AI 风险：AI 应识别的 8 类风险用于 safetyTips 模板
  - schema.ts：Gemini responseSchema 必须严格按 JSON Schema 表达
  - detect.ts：隐私检测顺序：本地 → LLM；本地结果覆盖 LLM 结果

  **Acceptance Criteria**:

  **QA Scenarios**:

  ```
  Scenario: 兜底响应正常（无 key 模式）
    Tool: Playwright
    Preconditions: 临时清空 VITE_GEMINI_API_KEY；启动 dev
    Steps:
      1. 在 _smoke/LLMSmoke.tsx 调用 analyzePublish({rawText:"我在图书馆借一把伞"})
      2. 渲染结果到 DOM，含 type / urgency / title / privacyRisks 字段
      3. page.locator("[data-testid=llm-type]").textContent() 期望 "supplies" 或 "errand"
      4. page.locator("[data-testid=llm-urgency]").textContent() 期望非空
      5. page.locator("[data-testid=llm-title]").textContent() 期望含 "伞"
      6. 截图
    Expected Result: 全部断言通过，结果在 1.5s+ 后到达
    Evidence: .sisyphus/evidence/task-5-fallback.png

  Scenario: 隐私串送 LLM 前已脱敏（输入含手机号）
    Tool: Playwright
    Steps:
      1. analyzePublish({rawText:"借伞 联系我 13912345678"}) 
      2. 在 LLMSmoke 暴露最终 prompt 文本（仅在 dev 模式 window.__lastPrompt）
      3. page.evaluate(()=>window.__lastPrompt) 期望含 "[已隐藏]" 不含 "13912345678"
      4. 结果 privacyRisks 期望非空，含 kind="phone"
    Expected Result: 脱敏与本地检测同时生效
    Evidence: .sisyphus/evidence/task-5-redacted.txt

  Scenario: 真 Gemini key 时调用真 API（仅在用户提供 key 时跑）
    Tool: Bash + Playwright
    Preconditions: 用户已在 .env.local 设置 VITE_GEMINI_API_KEY
    Steps:
      1. 启动 dev
      2. analyzePublish 后断言 reasoning 不含 "演示模式"
      3. 若 key 缺失，跳过此 scenario 并记录到 evidence
    Expected Result: 真 API 路径或合理跳过
    Evidence: .sisyphus/evidence/task-5-real-api.txt
  ```

  **Evidence to Capture**:
  - [ ] task-5-fallback.png
  - [ ] task-5-redacted.txt
  - [ ] task-5-real-api.txt

  **Commit**: YES
  - Message: `feat(llm): integrate Gemini with rule-based fallback`
  - Files: `src/lib/llm/gemini.ts`, `src/lib/llm/index.ts`
  - Pre-commit: `npx tsc --noEmit` + `npm run build` 通过

- [ ] 6. lib/privacy/detect.ts：本地隐私正则套件

  **What to do**:
  - 创建 `src/lib/privacy/detect.ts`：
    - 导出 `detectPrivacy(text: string): PrivacyRisk[]`
    - 6 类正则：
      - phone：`/(?<![\d])1[3-9]\d{9}(?![\d])/g`
      - wechat：`/(?:微信|wx|wechat)\s*[:：]?\s*([a-zA-Z][a-zA-Z\d_-]{5,19})/gi`
      - qq：`/(?:QQ|qq)\s*[:：]?\s*(\d{5,11})/gi`
      - studentId：`/(?<![\d])(20\d{2}\d{6,8})(?![\d])/g`（粗判：20 开头 + 8-10 位数字）
      - dorm：`/[东西南北]?(?:区|苑|楼|栋)?\s*\d{1,2}\s*(?:号|栋|楼|幢)\s*\d{2,4}\s*(?:室|号|房)/g`
      - bankCard：`/(?<![\d])\d{16,19}(?![\d])/g`
    - 每类匹配后构造 `PrivacyRisk` 对象，含 advice 文案：
      - phone: "建议改用站内联系，保护个人手机号"
      - wechat: "建议在确认帮助意向后再交换微信"
      - qq: 同上
      - studentId: "学号属于敏感信息，建议隐去"
      - dorm: "完整宿舍门牌号建议替换为楼栋名"
      - bankCard: "银行卡号严禁公开"
    - 导出 `redactPrivacy(text: string): string` 把命中片段替换为 [已隐藏]
  - dev 模式暴露 `window.__detectPrivacy = detectPrivacy` 便于测试

  **Must NOT do**:
  - ❌ 不要把正则结果发给任何远端
  - ❌ 不要假阳性过多（普通 11 位时间戳不应命中 phone：用前后 lookbehind/lookahead 守护）
  - ❌ 不要漏检：banker 16-19 位必须命中
  - ❌ 不要硬编码具体姓名/真实身份证号

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: 正则正确性关键，假阳/假阴都伤体验
  - **Skills**: 无

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1
  - **Blocks**: 5, 14
  - **Blocked By**: 0, 2

  **References**:
  - `docs/暖校Link_需求文档.md:407-417` - 第 7.8 节 8 类隐私敏感词清单
  - `src/lib/llm/schema.ts:PrivacyRisk` - 类型契约

  **WHY Each Reference Matters**:
  - 7.8 清单：完整覆盖手机/微信/QQ/身份证/宿舍门牌/银行卡/精确定位/其它共 8 类，本任务覆盖前 6 类核心

  **Acceptance Criteria**:

  **QA Scenarios**:

  ```
  Scenario: 各类正则命中正确
    Tool: Playwright
    Preconditions: dev 启动，已挂 _smoke/PrivacySmoke 调用 detectPrivacy 渲染结果
    Steps:
      1. 输入 "联系 13912345678 微信:abcdef123 QQ:123456789 学号 2021123456 银行卡 6222020012345678901 1号楼101室"
      2. 期望返回数组 length ≥ 6
      3. 每个 kind 至少出现一次
    Expected Result: 6 类全部命中
    Evidence: .sisyphus/evidence/task-6-positive.txt

  Scenario: 普通文本不假阳
    Tool: Playwright
    Steps:
      1. 输入 "我在图书馆等你 大概 5 分钟到 教学楼 3 号"
      2. 期望返回数组 length === 0
    Expected Result: 不命中
    Evidence: .sisyphus/evidence/task-6-negative.txt

  Scenario: 时间戳不被误判为手机号
    Tool: Playwright
    Steps:
      1. 输入 "时间 1700000000000 ms"（13 位）
      2. 期望 length === 0
    Expected Result: 不命中（前后非边界）
    Evidence: .sisyphus/evidence/task-6-edge-timestamp.txt
  ```

  **Evidence to Capture**:
  - [ ] task-6-positive.txt
  - [ ] task-6-negative.txt
  - [ ] task-6-edge-timestamp.txt

  **Commit**: YES
  - Message: `feat(privacy): add local pii regex detector`
  - Files: `src/lib/privacy/detect.ts`, `src/lib/privacy/index.ts`
  - Pre-commit: `npx tsc --noEmit` 通过

- [ ] 7. UserShell + AdminShell + Router + ErrorBoundary + Sonner

  **What to do**:
  - 创建 `src/router.tsx`：使用 `createBrowserRouter` (react-router 7) 定义全部 16 路由 + 1 个 `*` 404 路由
    - 用户路由树（layout=UserShell）：`/`、`/publish`、`/publish/confirm`、`/publish/success`、`/hall`、`/help/:id`、`/map`、`/profile`、`/profile/report`、`/my/help`、`/messages`、`/resources`、`/volunteer`、`/safety`
    - 管理路由树（layout=AdminShell）：`/admin`、`/admin/risk`
    - 全部页面路由的 element 用 `lazy()` 但本任务先用占位 `<div>页面 X 待实现</div>`
    - `*` 路由渲染统一 NotFound 组件（复用空状态家族 T10 之后即可，本任务先简单 div）
  - 创建 `src/components/layout/UserShell.tsx`：
    - 顶部导航：logo（Heart icon + "暖校 Link"）+ 5 项导航 + 头像下拉
    - 移动端底部：5 个图标 Tab（Home, Sparkles, Heart, Map, User），高 56px，icon 24+label 12+gap 4
    - 桌面 ≥768px 显示顶部，移动 < 768 显示底部
    - 当前路由高亮：用 NavLink 的 isActive
    - 头像下拉：链接到 /admin（演示用）
  - 创建 `src/components/layout/AdminShell.tsx`：
    - 顶部固定持久化"管理员模式"横幅（surface-soft 背景，emergency 描边色）
    - 左侧固定侧边栏（仅显示 /admin 与 /admin/risk 两项；其它管理菜单不渲染）
    - 主区 padding 32px
  - 创建 `src/components/layout/ErrorBoundary.tsx`：捕获 children 错误，回退渲染 "出错了，请刷新重试" 卡片
  - 创建 `src/components/layout/NotFound.tsx`：渲染 "页面不存在 - 返回首页"
  - 修改 `src/main.tsx`：用 `<RouterProvider>` 替代 `<App />`，外层包 `<ErrorBoundary>` + `<Toaster richColors position="bottom-center" />` (sonner)
  - 删除 `src/App.tsx`（如未删）

  **Must NOT do**:
  - ❌ 不要为 8 个 OUT-OF-SCOPE 路由建路由：/category/:type、/map/area/:id、/profile/warmth、/profile/badges、/admin/help、/admin/areas、/admin/users、/admin/volunteer
  - ❌ 不要在 AdminShell 侧边栏放未实现的链接
  - ❌ 不要使用 createHashRouter
  - ❌ 不要在 UserShell 右上角用红色徽点（Toast 已担提示）
  - ❌ 不要 lazy 加载本任务（本任务全用同步占位，T13+ 才正式 lazy）

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: 路由 + 双 Shell + ErrorBoundary 横切关注点
  - **Skills**: 无

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1
  - **Blocks**: 13-31
  - **Blocked By**: 0, 1

  **References**:
  - `docs/暖校Link_前端页面清单与视觉要求.md:23-53` - 用户/管理端路由表
  - `docs/暖校Link_前端页面清单与视觉要求.md:159-167` - 移动端底部导航 5 项
  - `docs/暖校Link_前端页面清单与视觉要求.md:1543-1573` - 页面跳转树
  - `DESIGN.md:471-478` - top-nav 80px 高 + 1px 底部 hairline
  - react-router 7 文档 https://reactrouter.com/start/declarative/routing - createBrowserRouter

  **WHY Each Reference Matters**:
  - 路由表：16 路由 ID 必须严格匹配，OUT-OF-SCOPE 8 个绝不能出现
  - 跳转树：导航高亮逻辑依赖完整路由层级
  - DESIGN top-nav：高 80px 是硬指标

  **Acceptance Criteria**:

  **QA Scenarios**:

  ```
  Scenario: 16 个路由全部可达
    Tool: Playwright
    Steps:
      1. 启动 dev server
      2. 依次访问 /, /publish, /publish/confirm, /publish/success, /hall, /help/1, /map, /profile, /profile/report, /my/help, /messages, /resources, /volunteer, /safety, /admin, /admin/risk
      3. 每个页面期望状态 200，body 文字含 "暖校 Link" 或占位文字
      4. 截图首页与 /admin
    Expected Result: 16 个路由全部 OK
    Evidence: .sisyphus/evidence/task-7-routes.txt + task-7-home.png + task-7-admin.png

  Scenario: 8 个 OUT-OF-SCOPE 路由 404
    Tool: Playwright
    Steps:
      1. 访问 /category/idle, /map/area/main-library, /profile/warmth, /profile/badges, /admin/help, /admin/areas, /admin/users, /admin/volunteer
      2. 每个页面 body 期望含 "页面不存在"
    Expected Result: 8 个全部 404
    Evidence: .sisyphus/evidence/task-7-404.txt

  Scenario: AdminShell "管理员模式"横幅可见
    Tool: Playwright
    Steps:
      1. 访问 /admin
      2. 断言 page.locator("text=管理员模式") 可见
      3. 断言侧边栏只有 2 项（"总览" + "风险审核"），不含 4 个 OUT-OF-SCOPE 链接
    Expected Result: 横幅 + 2 项侧边栏
    Evidence: .sisyphus/evidence/task-7-admin-banner.png

  Scenario: ErrorBoundary 触发回退
    Tool: Playwright
    Steps:
      1. 临时挂 _smoke/Crash 组件直接 throw new Error
      2. 访问该路由，期望页面渲染 "出错了，请刷新重试"
    Expected Result: 回退 UI 出现
    Evidence: .sisyphus/evidence/task-7-error-boundary.png
  ```

  **Evidence to Capture**:
  - [ ] task-7-routes.txt
  - [ ] task-7-home.png
  - [ ] task-7-admin.png
  - [ ] task-7-404.txt
  - [ ] task-7-admin-banner.png
  - [ ] task-7-error-boundary.png

  **Commit**: YES
  - Message: `feat(layout): user/admin shells + router + error boundary`
  - Files: `src/router.tsx`, `src/components/layout/*.tsx`, `src/main.tsx`
  - Pre-commit: `npm run build` 通过

- [ ] 8. 共享组件家族 A：EventCard + StatusPill + UrgencyTag + SafetyTip

  **What to do**:
  - 创建 `src/components/shared/EventCard.tsx`：
    - props: `{ event: Event, layout?: "list"|"compact"|"hero", onHelp?: ()=>void }`
    - layout="list"（大厅默认）：圆角 14px、白底、1px hairline、hover 单层阴影上浮 1px
    - 信息层级（按 DESIGN.md 排版要求）：左侧图标徽圈（48px）+ 右侧主体
      - Row1：UrgencyTag + StatusPill + 类型胶囊（含分类名）
      - Row2：标题（16px/600，最多 1 行 ellipsis）
      - Row3：描述摘要（14px/400 muted，最多 2 行 line-clamp-2）
      - Row4：地点 + 距离 + 时间（14px muted，分隔符 "·"）
      - Row5：发布者头像 + 昵称 + 信用 + 暖心值 + 响应人数（左）｜ 一键帮助按钮（右，胶囊形 Rausch）
    - layout="compact"：用于实时动态列表，去 Row3
    - layout="hero"：首页用，带头图位（用 emoji 或 lucide icon 替代图）
  - 创建 `src/components/shared/StatusPill.tsx`：
    - props: `{ status: EventStatus }`
    - 6 状态色映射（背景柔和不刺眼）：
      - waiting：surface-strong + ink
      - matching：warmth-glow tint + ink
      - ongoing：primary tint + primary
      - pending_confirm：warmth-glow + ink
      - completed：muted-soft tint + muted
      - cancelled / delisted：hairline + muted
  - 创建 `src/components/shared/UrgencyTag.tsx`：
    - props: `{ urgency: Urgency }`
    - high：emergency 背景 + 白字，含 AlertTriangle 图标
    - medium：warmth-glow 浅背景 + ink，含 Clock 图标
    - low：surface-soft + muted，含 Info 图标
  - 创建 `src/components/shared/SafetyTip.tsx`：
    - props: `{ tone: "info"|"warn"|"warm", icon?: LucideIcon, title: string, body?: string }`
    - 圆角 14px、surface-soft 背景、左侧 4px 强调条（warmth-glow / emergency / muted）
    - 语气温和不恐吓
  - 全部组件用 lucide-react 图标，禁止 Material Symbols

  **Must NOT do**:
  - ❌ 不要使用红黄绿三色交通灯式表达（不符合 Airbnb 克制语调）
  - ❌ 不要给卡片加多层阴影
  - ❌ 不要在 EventCard 内部直接 dispatch 状态（onHelp 回调由父级处理）
  - ❌ 不要硬编码 8 行以上信息（移动端撑爆）

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: 视觉组件家族，需精细控制层级与圆角
  - **Skills**: `frontend-app-builder`
    - frontend-app-builder：用于卡片视觉精炼参考
  - **Skills Evaluated but Omitted**:
    - `shadcn`: 暂不引入 shadcn 卡片，按 DESIGN.md 自定义层级

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2
  - **Blocks**: 13, 15, 16, 17, 21
  - **Blocked By**: 1, 2, 3, 4, 7

  **References**:
  - `docs/暖校Link_前端页面清单与视觉要求.md:475-491` - 互助卡片字段完整清单
  - `docs/暖校Link_前端页面清单与视觉要求.md:524-535` - 6 状态枚举
  - `docs/暖校Link_前端页面清单与视觉要求.md:642-658` - 大厅卡片字段
  - `docs/pages/link_6/code.html:200-300` - 原型卡片结构（仅作结构参考，颜色字体重写）
  - `DESIGN.md:482-489` - property-card token（圆角 md=14px, photo 1:1）
  - `src/lib/types/domain.ts` - Event/User 类型

  **WHY Each Reference Matters**:
  - 8.5/8.6：卡片字段不能漏（标题/类型/紧急/地点/时间/描述/发布者/信用/暖心/响应数/标签）
  - link_6：照搬卡片结构层级避免重新发明轮子，但颜色/字体/圆角必须重写
  - DESIGN.md：圆角 14px 是硬指标

  **Acceptance Criteria**:

  **QA Scenarios**:

  ```
  Scenario: EventCard 渲染默认 mock 数据
    Tool: Playwright
    Steps:
      1. _smoke/CardSmoke 渲染 SEED_EVENTS[0] (借伞场景)
      2. 启动 dev 访问 smoke 路由
      3. 断言 locator("text=借").count() ≥ 1, locator("text=图书馆").count() ≥ 1
      4. 抓 card 圆角 computed-style，期望 border-radius 含 14px
      5. 截图
    Expected Result: 卡片渲染正常 + 圆角 14px
    Evidence: .sisyphus/evidence/task-8-card-default.png

  Scenario: UrgencyTag 三档样式
    Tool: Playwright
    Steps:
      1. 渲染 high/medium/low 三种 UrgencyTag
      2. 抓 background-color，期望 high 含 emergency 色（rgb(224,11,65)），low 含 surface-soft
    Expected Result: 三档颜色不同
    Evidence: .sisyphus/evidence/task-8-urgency.png
  ```

  **Evidence to Capture**:
  - [ ] task-8-card-default.png
  - [ ] task-8-urgency.png

  **Commit**: YES
  - Message: `feat(ui): event card + status/urgency/safety primitives`
  - Files: `src/components/shared/EventCard.tsx`, `StatusPill.tsx`, `UrgencyTag.tsx`, `SafetyTip.tsx`
  - Pre-commit: `npm run build` 通过

- [ ] 9. 共享组件家族 B：UserBadgePack + WarmthMeter + CreditChip

  **What to do**:
  - 创建 `src/components/shared/WarmthMeter.tsx`：
    - props: `{ value: number, size?: "sm"|"md"|"hero" }`
    - hero 用于 /profile：数字 64px/700 + warmth-glow 渐变到 Rausch 描边环 + 副标题"暖心值"
    - md 用于 /my/help 概览：数字 32px
    - sm 用于卡片：数字 14px + 火焰图标
    - 数字递增动画（页面进入时 0 → value，duration 1.2s，motion）
  - 创建 `src/components/shared/CreditChip.tsx`：
    - props: `{ value: number }`，按 90+/80-89/<80 三档显示色与文案 ["可信", "良好", "需关注"]
    - 圆角 full、border 1px hairline、内含 ShieldCheck 图标
  - 创建 `src/components/shared/UserBadgePack.tsx`：
    - props: `{ user: User, layout?: "row"|"grid" }`
    - row：横向徽章预览（最多 4 个 + "+N"）
    - grid：3-4 列方格徽章（已得彩色，未得灰）
    - 每个徽章 hover 时弹 tooltip 显示名称 + 条件
    - 已得徽章带 warmth-glow 光晕（box-shadow ring + warmth-glow）
  - 创建 `src/components/shared/UserMicroCard.tsx`：
    - props: `{ userId: string, compact?: boolean }`
    - 渲染头像 + 昵称 + CreditChip + WarmthMeter sm
    - 用于互助详情、互助卡片底部、消息列表

  **Must NOT do**:
  - ❌ 不要用真实用户头像 URL，使用 Dicebear avataaars 占位
  - ❌ 不要在徽章 hover 用 hover-only 提示（移动端不可达），用 Radix Tooltip
  - ❌ 不要在 sm size 显示渐变环（视觉过重）

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: 暖心值视觉是个人中心成就感核心
  - **Skills**: `frontend-app-builder`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2
  - **Blocks**: 13, 16, 18, 21, 23
  - **Blocked By**: 1, 2, 3, 4, 7

  **References**:
  - `docs/暖校Link_前端页面清单与视觉要求.md:1056-1067` - 个人中心暖心值视觉
  - `docs/暖校Link_前端页面清单与视觉要求.md:1115-1119` - 徽章风格统一
  - `docs/暖校Link_需求文档.md:914-927` - 8 类徽章名称
  - `DESIGN.md:264` - rating-display-card 64px/700
  - `src/lib/store/usersStore.ts` - 用户查询

  **WHY Each Reference Matters**:
  - 个人中心 1056：暖心值数字必须突出，hero size 64px
  - DESIGN rating-display：64px/700 是设计系统的"最响"字号，正好套用暖心值

  **Acceptance Criteria**:

  **QA Scenarios**:

  ```
  Scenario: WarmthMeter hero 大数字渲染
    Tool: Playwright
    Steps:
      1. _smoke/WarmthSmoke 渲染 <WarmthMeter value={127} size="hero" />
      2. 期望 page.locator("text=127") 字体 size ≥ 56px（取 computed font-size）
      3. 截图
    Expected Result: 数字 ≥ 56px
    Evidence: .sisyphus/evidence/task-9-warmth-hero.png

  Scenario: 徽章 grid 已得/未得视觉差异
    Tool: Playwright
    Steps:
      1. 渲染 UserBadgePack layout="grid" 给 student-01（2 已得 + 6 未得）
      2. 已得徽章 opacity 期望 1，未得 ≤ 0.5（filter grayscale 或 opacity 50）
      3. 截图
    Expected Result: 视觉对比明显
    Evidence: .sisyphus/evidence/task-9-badges-grid.png
  ```

  **Evidence to Capture**:
  - [ ] task-9-warmth-hero.png
  - [ ] task-9-badges-grid.png

  **Commit**: YES
  - Message: `feat(ui): warmth/credit/badge user trust primitives`
  - Files: `src/components/shared/WarmthMeter.tsx`, `CreditChip.tsx`, `UserBadgePack.tsx`, `UserMicroCard.tsx`
  - Pre-commit: `npm run build` 通过

- [ ] 10. 共享组件家族 C：CategoryTabs + SearchBar + SortBar + EmptyState

  **What to do**:
  - 创建 `src/components/shared/SearchBar.tsx`：
    - props: `{ value: string, onChange, placeholder?, size?: "hero"|"default" }`
    - hero（首页用）：胶囊形（rounded-full）、48px 高、左侧 Search 图标、右侧 Rausch 圆形 orb 按钮（48×48px）
    - default（大厅用）：胶囊形、40px 高、整合在筛选栏中
    - 移动端默认吸顶（CSS sticky top）
  - 创建 `src/components/shared/CategoryTabs.tsx`：
    - props: `{ value: EventType|"all", onChange, counts?: Record<string,number> }`
    - 横向滚动胶囊 Tabs：全部 / 闲置物品 / 学习资料 / 生活物资 / 临时求助 / 公益帮扶（不含安全提醒，按需求 8.3）
    - 选中态：填充 ink 背景 + 白字
    - 未选中：白底 + hairline 边 + ink 字
    - 计数小气泡（如果 counts 提供）
  - 创建 `src/components/shared/SortBar.tsx`：
    - props: `{ value, onChange, options: { value, label }[] }`
    - 下拉选择 + 当前值文字按钮
    - 默认选项：智能推荐 / 距离最近 / 最新发布 / 最急需帮助 / 信用优先
  - 创建 `src/components/shared/EmptyState.tsx`：
    - props: `{ icon?: LucideIcon, title: string, hint?: string, action?: { label, to } }`
    - 居中布局，icon 48px muted、标题 16px ink、hint 14px muted、CTA 按钮 secondary
  - 创建 `src/components/shared/PageSection.tsx`：
    - props: `{ title?, action?, children }`
    - 用于首页/大厅的板块标题 + 右侧动作

  **Must NOT do**:
  - ❌ 不要在 search bar 默认开启 voice 输入图标
  - ❌ 不要在 CategoryTabs 加 "安全提醒" tab（按 8.3 不在用户大厅）
  - ❌ EmptyState 不要堆叠 2 个 CTA

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: 列表家族纯视觉
  - **Skills**: `frontend-app-builder`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2
  - **Blocks**: 13, 15, 21, 22, 24, 25
  - **Blocked By**: 1, 7

  **References**:
  - `docs/暖校Link_前端页面清单与视觉要求.md:179` - 全局搜索栏胶囊形要求
  - `docs/暖校Link_前端页面清单与视觉要求.md:451-462` - 大厅分类（不含安全提醒）
  - `docs/暖校Link_前端页面清单与视觉要求.md:629-639` - 排序选项 6 项
  - `docs/暖校Link_前端页面清单与视觉要求.md:1604-1610` - 空状态规范
  - `DESIGN.md:466-469` - search-bar-pill + search-orb token

  **WHY Each Reference Matters**:
  - DESIGN.md search bar：rounded-full + 48px + 圆形 orb 是硬规范
  - 8.3 分类：5 个用户可见分类（不包含安全提醒）

  **Acceptance Criteria**:

  **QA Scenarios**:

  ```
  Scenario: SearchBar hero 渲染胶囊 + orb
    Tool: Playwright
    Steps:
      1. 渲染 <SearchBar size="hero" placeholder="..." />
      2. 抓 .search-pill computed border-radius 期望 9999px
      3. 抓 orb 元素的 width/height 期望 48px
      4. 截图
    Expected Result: 圆角 + orb 尺寸正确
    Evidence: .sisyphus/evidence/task-10-search-hero.png

  Scenario: CategoryTabs 不含安全提醒
    Tool: Playwright
    Steps:
      1. 渲染 <CategoryTabs />
      2. 期望 page.locator("text=安全提醒").count() === 0
      3. 期望 5 个分类标签可见
    Expected Result: 5 个分类不含安全提醒
    Evidence: .sisyphus/evidence/task-10-tabs.txt

  Scenario: EmptyState 渲染含 CTA
    Tool: Playwright
    Steps:
      1. 渲染 <EmptyState title="暂无搜索结果" action={{label:"重置筛选"}} />
      2. CTA 按钮可点击且 ≥ 44px 高
    Expected Result: CTA 触达性达标
    Evidence: .sisyphus/evidence/task-10-empty.png
  ```

  **Evidence to Capture**:
  - [ ] task-10-search-hero.png
  - [ ] task-10-tabs.txt
  - [ ] task-10-empty.png

  **Commit**: YES
  - Message: `feat(ui): search/category/sort/empty list primitives`
  - Files: `src/components/shared/SearchBar.tsx`, `CategoryTabs.tsx`, `SortBar.tsx`, `EmptyState.tsx`, `PageSection.tsx`
  - Pre-commit: `npm run build` 通过

- [ ] 11. 共享组件家族 D：PublishStepper + AICard + MatchList

  **What to do**:
  - 创建 `src/components/shared/PublishStepper.tsx`：
    - props: `{ steps: { id, label, status: "pending"|"running"|"done" }[], currentIndex }`
    - 5 步骤竖排列表，每行：状态圆点（done=Check 绿、running=Loader2 旋转 primary、pending=灰圈）+ 文案
    - 完成态自动渐隐为 muted
  - 创建 `src/components/shared/AICard.tsx`：
    - props: `{ result: LLMPublishResult, editable?: boolean, onEdit?: (patch)=>void }`
    - 大圆角 20px、白底、单层阴影、左上角 Sparkles 图标 + "AI 解析结果"
    - 字段块（可编辑：点击字段进入 inline edit，editable=true 时）：
      - 类型徽章 + 紧急度
      - 标题（display-sm 20px/600）
      - 地点 + 时间要求
      - 描述（body-md 16px/400）
      - 标签胶囊
      - 隐私风险列表（每项 SafetyTip warn 风格）
      - 安全提醒列表（每项 SafetyTip warm 风格）
      - 推理（reasoning 一行 caption muted，前缀 "AI 判断："）
  - 创建 `src/components/shared/MatchList.tsx`：
    - props: `{ count: number, helpers?: User[] }`
    - 横向滚动卡片：头像 + 昵称 + 距离 + 信用 + "匹配理由"（一行 caption）
    - 没有真用户的话用 SEED_USERS 抽 N 条作为推荐
    - 空态："暂时没有找到匹配的同学，发布后系统会持续匹配"

  **Must NOT do**:
  - ❌ 不要让 AICard 字段编辑时弹 modal（用 inline contentEditable 或受控 input）
  - ❌ 不要让 PublishStepper 步骤少于 5 步（需求 7.6 要求 5 步骤分析感）
  - ❌ MatchList 不要展示真实信息（手机号/微信号永不出现）

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: AI 流程视觉是项目核心记忆点
  - **Skills**: `frontend-app-builder`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2
  - **Blocks**: 14, 19
  - **Blocked By**: 1, 2, 4, 7, 8（复用 SafetyTip）, 9（复用 UserMicroCard）

  **References**:
  - `docs/暖校Link_需求文档.md:373-395` - 第 7.6 章结构化生成字段
  - `docs/暖校Link_前端页面清单与视觉要求.md:373-388` - AI 分析进度区 5 步骤
  - `docs/暖校Link_前端页面清单与视觉要求.md:402-426` - AI 解析结果区字段
  - `docs/pages/ai_link/code.html` - 原型 AI 解析卡结构
  - `src/lib/llm/schema.ts` - LLMPublishResult 字段

  **WHY Each Reference Matters**:
  - 7.6 字段清单：AI 卡片必须含 10 项（标题/类型/紧急/地点/描述/标签/隐私/安全/匹配数/确认入口）
  - 5 步骤：进度感是设计关键，少于 5 步缺乏分析感

  **Acceptance Criteria**:

  **QA Scenarios**:

  ```
  Scenario: PublishStepper 5 步骤可见
    Tool: Playwright
    Steps:
      1. 渲染 <PublishStepper currentIndex=2 ... />
      2. 期望 5 个 li 元素
      3. 第 0/1 项含 Check 图标，第 2 项含 Loader2 动画 class
      4. 截图
    Evidence: .sisyphus/evidence/task-11-stepper.png

  Scenario: AICard 字段编辑
    Tool: Playwright
    Steps:
      1. 渲染 <AICard result={mock} editable={true} />
      2. 点击标题字段 → 输入 "新标题" → blur
      3. 期望 onEdit 被调用，title="新标题"
    Evidence: .sisyphus/evidence/task-11-aicard-edit.txt

  Scenario: MatchList 空态
    Tool: Playwright
    Steps:
      1. 渲染 <MatchList count={0} />
      2. 期望文字含 "暂时没有找到匹配的同学"
    Evidence: .sisyphus/evidence/task-11-match-empty.png
  ```

  **Evidence to Capture**:
  - [ ] task-11-stepper.png
  - [ ] task-11-aicard-edit.txt
  - [ ] task-11-match-empty.png

  **Commit**: YES
  - Message: `feat(ui): publish stepper + ai card + match list`
  - Files: `src/components/shared/PublishStepper.tsx`, `AICard.tsx`, `MatchList.tsx`
  - Pre-commit: `npm run build` 通过

- [ ] 12. AreaMapSVG：程序化校园 SVG + 呼吸光圈 + 区域 popup

  **What to do**:
  - 创建 `src/components/map/AreaMapSVG.tsx`：
    - 单个 React 组件渲染整张校园地图，无外部 SVG 文件
    - viewBox="0 0 800 500"，宽高响应式 (max 100% width)
    - 背景：surface-soft 圆角矩形 + 极淡 grid 线
    - 8 个区域多边形（rect 圆角 20）从 SEED_AREAS 读坐标，背景填充按 temperatureIndex 渐变（30-50 凉冷灰 / 50-75 warmth-glow 浅 / 75-95 warmth-glow 浓）
    - 区域名称文字（标题 16px/600）+ 今日次数（caption 12px）
    - 每个区域中心放呼吸点位（cx, cy = x + width/2, y + height/2）：
      - 内圆：r=8 + warmth-glow fill
      - 外圈：r 在 14-22 之间脉动（motion: animate scale + opacity 0.6→0，2s 循环）
      - 点击热区：透明圆 r=24 ensure ≥44px 触达
    - 点击区域 → 触发 onAreaClick(areaId) → 父级显示 popup
    - 内部维护 hoveredAreaId 状态：hover 时区域描边变 primary
    - 移动端 touch：用 onPointerDown 替代 onClick
  - 创建 `src/components/map/AreaPopup.tsx`：
    - props: `{ area: Area, onClose, onViewHall, onPublishHere }`
    - 浮层卡片（Radix Popover 或自实现 absolute 定位）
    - 字段：区域名 + 今日次数 + 平均响应分钟 + 门类型 tags + 最近 1-2 个事项标题
    - 双 CTA：查看该区域互助 / 在这里发布求助

  **Must NOT do**:
  - ❌ 不要使用真实地图库（Mapbox / Leaflet / 高德）
  - ❌ 不要做 pan/zoom 拖动缩放（用户决议）
  - ❌ 不要让点位 r 大于 24（视觉太抢眼）
  - ❌ AreaPopup 不要包含手机号/详细联系方式

  **Recommended Agent Profile**:
  - **Category**: `artistry`
    - Reason: SVG 程序化绘制 + 动画 + 触达性，是项目最显眼的视觉之一
  - **Skills**: `frontend-app-builder`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2
  - **Blocks**: 17
  - **Blocked By**: 1, 3, 4, 7

  **References**:
  - `docs/暖校Link_需求文档.md:802-845` - 第 14.2-14.3 章地图区域 + 字段
  - `docs/暖校Link_前端页面清单与视觉要求.md:825-888` - 校园温度地图视觉规范
  - `docs/暖校Link_前端页面清单与视觉要求.md:151` - 动效要求：呼吸光圈
  - `src/lib/store/areasStore.ts` - 区域数据
  - `motion/react` - animate API

  **WHY Each Reference Matters**:
  - 14.2 8 大区域：必须全部展示
  - 14.5 温度指数：作为颜色渐变依据
  - 动效要求：呼吸光圈是设计标志

  **Acceptance Criteria**:

  **QA Scenarios**:

  ```
  Scenario: 8 个区域 + 8 个呼吸点
    Tool: Playwright
    Steps:
      1. _smoke/MapSmoke 渲染 <AreaMapSVG onAreaClick=... />
      2. 期望 page.locator("svg [data-area]").count() === 8
      3. 期望 page.locator("svg [data-pulse]").count() === 8
      4. 截图
    Evidence: .sisyphus/evidence/task-12-svg-areas.png

  Scenario: 点击区域弹出 popup
    Tool: Playwright
    Steps:
      1. 点击 [data-area=main-library]
      2. 期望 popup 含 "图书馆" 文字
      3. 期望 popup 含 "在这里发布求助" 按钮
    Evidence: .sisyphus/evidence/task-12-popup.png

  Scenario: 触达性 ≥ 44px
    Tool: Playwright
    Steps:
      1. 抓 [data-pulse-hit] r 属性
      2. 期望 ≥ 22 (直径 ≥44)
    Evidence: .sisyphus/evidence/task-12-touch-target.txt

  Scenario: 呼吸动画运行
    Tool: Playwright
    Steps:
      1. 用 page.waitForTimeout(500) 后两次抓某个 pulse 外圈 r 属性
      2. 期望两次值不同（动画在跑）
    Evidence: .sisyphus/evidence/task-12-pulse.txt
  ```

  **Evidence to Capture**:
  - [ ] task-12-svg-areas.png
  - [ ] task-12-popup.png
  - [ ] task-12-touch-target.txt
  - [ ] task-12-pulse.txt

  **Commit**: YES
  - Message: `feat(map): svg campus map with breathing dots`
  - Files: `src/components/map/AreaMapSVG.tsx`, `AreaPopup.tsx`
  - Pre-commit: `npm run build` 通过

- [ ] 13. U01 首页 `/`：Hero + 数据 + 分类 + 实时动态 + 地图预览

  **What to do**:
  - 创建 `src/pages/Home.tsx` + 必要的 section 组件
  - 模块（按需求 6.2 + 清单 U01）：
    - **Hero 区**：白底 + 顶部 80px 后开始
      - 主标题 "让校园里的每一次需要，都被及时看见"（display-xl 28px/700，移动端 22px）
      - 副标题 "基于 AI 的校园互助与民生温度地图平台"（body-md muted）
      - 居中 hero SearchBar size="hero"，placeholder="告诉 AI 你的需要..."，回车或点 orb 跳转 `/publish?seed=${value}`
      - 三个快捷示例胶囊（"借一把伞" "求复习资料" "送台灯"），点击填入搜索框
      - 双主 CTA 按钮：立即发布求助（primary，跳 `/publish`） / 查看温度地图（secondary，跳 `/map`）
    - **今日校园温度** 4 卡片网格：今日互助次数、平均响应时间、节约闲置物资、点亮校园区域
      - 数字 32px ink + 单位小、副标题 caption muted
      - 4 项数据从 store/areas 聚合（areas reduce todayCount, avgResponseMin 平均, 等）
      - 数字递增 motion 动画
    - **热门互助分类入口** 5 胶囊（CategoryTabs 复用）：闲置 / 学习 / 生活 / 临时 / 公益
      - 点击跳 `/hall?type=xxx`
    - **实时互助动态** 列表（4-6 条 EventCard layout="compact"）
      - 取 store events 按 publishedAt desc 前 6 条 status=waiting
      - 卡片点击跳 `/help/:id`
      - 一键帮助按钮触发 store.respondToEvent + Sonner toast 成功
    - **温度地图预览**：Banner 卡片，显示前 3 个温度最高区域名 + "前往温度地图" CTA → `/map`
    - **Footer**：3 列简洁链接 + 版权
  - 移动端适配：hero 单列、4 卡片改 2x2、分类入口横向滚动

  **Must NOT do**:
  - ❌ 不要嵌入完整地图（仅 banner 跳转）
  - ❌ 不要做"免费试用 / 立即注册"等营销转化按钮
  - ❌ 不要在快捷示例胶囊下加更多预设词（控制 3 个）
  - ❌ 不要在 hero 加视频/真实照片（用渐变背景 + emoji 即可）

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: `frontend-app-builder`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3
  - **Blocks**: 30
  - **Blocked By**: 7, 8, 9, 10

  **References**:
  - `docs/暖校Link_前端页面清单与视觉要求.md:206-316` - U01 首页全部规范
  - `docs/暖校Link_需求文档.md:300-326` - 第 6 章首页需求
  - `docs/pages/link_2/code.html` - 原型结构（颜色字体重写）
  - `DESIGN.md:432-436` - 1280px 容器 + section 64px 间距

  **WHY Each Reference Matters**:
  - U01 模块表：8 大模块不能漏
  - DESIGN 1280：max-width 是硬指标

  **Acceptance Criteria**:

  **QA Scenarios**:

  ```
  Scenario: 首页核心模块全部渲染
    Tool: Playwright
    Steps:
      1. 访问 /
      2. 期望 page.locator("h1").textContent() 含 "需要" 与 "看见"
      3. 期望 hero SearchBar 可见
      4. 期望 4 张统计卡渲染（含 "今日互助次数" 等）
      5. 期望 5 个分类胶囊可见
      6. 期望 ≥4 条实时动态 EventCard
      7. 截图首屏 + 滚动后整体
    Evidence: .sisyphus/evidence/task-13-home-hero.png + task-13-home-full.png

  Scenario: hero 输入跳转保留内容
    Tool: Playwright
    Steps:
      1. 在 hero 输入 "求高数复习资料"
      2. 点击 orb
      3. 期望 URL 含 /publish?seed=求高数复习资料
      4. 期望 /publish 页面 textarea 含该文字
    Evidence: .sisyphus/evidence/task-13-seed-handoff.txt

  Scenario: 快捷示例点击填入搜索框
    Tool: Playwright
    Steps:
      1. 点击 "借一把伞" 胶囊
      2. 期望 SearchBar value 包含 "伞"
    Evidence: .sisyphus/evidence/task-13-quick-example.txt
  ```

  **Evidence to Capture**:
  - [ ] task-13-home-hero.png
  - [ ] task-13-home-full.png
  - [ ] task-13-seed-handoff.txt
  - [ ] task-13-quick-example.txt

  **Commit**: YES
  - Message: `feat(p0): home page with hero + stats + categories + feed`
  - Files: `src/pages/Home.tsx`
  - Pre-commit: `npm run build` 通过

- [ ] 14. U02 AI 智能发布 `/publish`：真 Gemini + 兜底 + 隐私 + 匹配

  **What to do**:
  - 创建 `src/pages/Publish.tsx`
  - URL 参数：`?seed=xxx`（从首页带入）
  - 模块（按 7.x + U02）：
    - **页面标题区**：display-lg "告诉暖校 AI，你现在需要什么？"
    - **自然语言输入区**：textarea 大面积（min-h 160px，圆角 14px）+ 字数 (caption right)，下方 3 个快捷示例胶囊
    - **AI 分析进度区**：点击"AI 生成互助卡片"主按钮后启动
      - 5 步 PublishStepper（理解需求 → 判断类型 → 生成标题 → 检查隐私 → 匹配同学）
      - 每步停留约 600ms，5 步总计 ~3s（兜底用 setTimeout 模拟，真 API 用真实 await + 步骤动画穿插）
      - 同时调用 `analyzePublish({rawText})` 真异步 + Promise.all 假动画 race
    - **AI 解析结果区**：完成后渲染 AICard editable=true
      - 字段编辑后写 `meStore.draftPublish`
    - **匹配推荐区**：MatchList count={result.suggestedHelpers}
    - **隐私与安全提醒区**：result.privacyRisks + result.safetyTips 渲染为 SafetyTip 列表
    - **底部固定操作栏**：取消（清空） / 重新生成 / 确认并发布（→ `/publish/confirm`）
  - 真 Gemini + 兜底集成：
    - 调用 `analyzePublish` 一次（内部判断 key 走真/兜底）
    - 错误捕获 → Sonner toast "AI 暂时不可用，已使用规则模式"
  - 桌面布局：左 50% 输入 + 进度，右 50% 结果（粘性）；移动端：上下纵排

  **Must NOT do**:
  - ❌ 不要在用户没点"AI 生成"前自动调用（防滥用 token）
  - ❌ 不要把原始 PII 文本送给 Gemini（必须先 redactPrivacy）
  - ❌ 不要在结果区出现"评论 / 收藏"等无关入口
  - ❌ AI 失败时不要弹大 modal，用 toast + 兜底结果即可

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: AI 集成 + 隐私 + 流程感关键页面
  - **Skills**: `frontend-app-builder`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3
  - **Blocks**: 19, 20
  - **Blocked By**: 5, 6, 7, 8, 11

  **References**:
  - `docs/暖校Link_需求文档.md:328-429` - 第 7 章 AI 智能发布完整规范
  - `docs/暖校Link_前端页面清单与视觉要求.md:319-468` - U02 全部模块要求
  - `docs/pages/ai_link/code.html` - AI 发布原型结构
  - `src/lib/llm/gemini.ts` - analyzePublish API
  - `src/lib/privacy/detect.ts` - 本地隐私

  **WHY Each Reference Matters**:
  - 7.x：AI 发布是项目核心功能，需求章节最详细，必须 1:1 落地
  - U02 模块：8 大模块顺序与权重明确

  **Acceptance Criteria**:

  **QA Scenarios**:

  ```
  Scenario: 完整发布流程（兜底模式）
    Tool: Playwright
    Preconditions: 临时空 VITE_GEMINI_API_KEY；启动 dev
    Steps:
      1. 访问 /publish
      2. 在 textarea 输入 "我在图书馆突然下雨想借伞"
      3. 点击 "AI 生成互助卡片" 主按钮
      4. 等待 PublishStepper 5 步完成（≤ 5s）
      5. 期望 AICard 渲染含 "伞" 标题
      6. 期望紧急度显示
      7. 点击 "确认并发布" 按钮
      8. 期望跳转 /publish/confirm
      9. 截图各阶段
    Expected Result: 流程顺畅，结果合理，跳转正确
    Evidence: task-14-input.png, task-14-stepping.png, task-14-result.png, task-14-confirm-handoff.txt

  Scenario: PII 输入触发隐私警告
    Tool: Playwright
    Steps:
      1. 输入 "联系我 13912345678 借伞"
      2. 生成
      3. 期望结果含 SafetyTip "建议改用站内联系" 或 "保护个人手机号"
    Evidence: task-14-pii.png

  Scenario: 重新生成清空旧结果
    Tool: Playwright
    Steps:
      1. 输入并生成
      2. 点击 "重新生成"
      3. 期望 stepper 重新跑，旧 AICard 短暂消失
    Evidence: task-14-regenerate.txt
  ```

  **Evidence to Capture**:
  - [ ] task-14-input.png
  - [ ] task-14-stepping.png
  - [ ] task-14-result.png
  - [ ] task-14-confirm-handoff.txt
  - [ ] task-14-pii.png
  - [ ] task-14-regenerate.txt

  **Commit**: YES
  - Message: `feat(p0): ai publish page with gemini + fallback + privacy`
  - Files: `src/pages/Publish.tsx`
  - Pre-commit: `npm run build` 通过

- [ ] 15. U05 互助大厅 `/hall`：搜索 + 筛选 + 排序 + 卡片列表

  **What to do**:
  - 创建 `src/pages/Hall.tsx`
  - URL 参数：`?type=xxx&query=xxx` 由 URL 同步到 store filters
  - 模块（按 8.x + U05）：
    - **顶部 SearchBar**（吸顶 sticky top-0 z-10），placeholder "搜索物品、课程、地点..."
    - **CategoryTabs**：5 个分类
    - **SortBar**：5 选项
    - **EventCard 列表**：栅格响应（桌面 2 列、手机 1 列）
      - 数据来自 useEventsStore.getFiltered()
      - 卡片点击 → `/help/:id`
      - 一键帮助 → 弹 Radix AlertDialog 确认 + 安全提醒 → 确认后 store.respondToEvent + Sonner toast
    - **空状态**：搜索/筛选无结果时 EmptyState "试试其它分类或清除筛选" CTA "重置"
    - **悬浮发布按钮**：右下角 FAB（移动端）跳 `/publish`
  - 列表加载用骨架（仅本页用 skeleton）

  **Must NOT do**:
  - ❌ 不要分页（mock 30 条直出）
  - ❌ 不要带"加载更多"
  - ❌ 不要在卡片内嵌评论或回复

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: `frontend-app-builder`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3
  - **Blocks**: 16, 30
  - **Blocked By**: 4, 7, 8, 10

  **References**:
  - `docs/暖校Link_前端页面清单与视觉要求.md:573-684` - U05 全部模块
  - `docs/暖校Link_需求文档.md:432-535` - 第 8 章互助大厅需求
  - `docs/pages/link_6/code.html` - 大厅原型结构

  **WHY Each Reference Matters**:
  - U05 卡片字段：每张卡片必须含 13 项信息
  - 8.7 一键帮助：弹确认 + 安全提醒 + 描述输入 + 状态变化

  **Acceptance Criteria**:

  **QA Scenarios**:

  ```
  Scenario: 大厅列表渲染 + 筛选
    Tool: Playwright
    Steps:
      1. 访问 /hall
      2. 期望卡片数 ≥ 6
      3. 点击 "学习资料" 分类
      4. 期望卡片数减少到 3-6 之间
      5. 在搜索框输入 "高数"
      6. 期望卡片数继续减少
      7. 截图
    Evidence: task-15-list.png, task-15-filter.png

  Scenario: 空状态出现 + CTA 重置
    Tool: Playwright
    Steps:
      1. 搜索 "abcxyz不存在"
      2. 期望 EmptyState 可见
      3. 点击 "重置"
      4. 期望卡片重新渲染
    Evidence: task-15-empty.png

  Scenario: 一键帮助流程
    Tool: Playwright
    Steps:
      1. 点击第一张卡片的 "一键帮助" 按钮
      2. 期望出现确认对话框（含安全提醒文字）
      3. 点击 "确认提供帮助"
      4. 期望 Sonner toast "已发送帮助意向" 出现
      5. 期望卡片状态从 waiting 变 matching
    Evidence: task-15-help-flow.png + task-15-toast.png
  ```

  **Evidence to Capture**:
  - [ ] task-15-list.png
  - [ ] task-15-filter.png
  - [ ] task-15-empty.png
  - [ ] task-15-help-flow.png
  - [ ] task-15-toast.png

  **Commit**: YES
  - Message: `feat(p0): help hall with search + filter + sort + one-click help`
  - Files: `src/pages/Hall.tsx`
  - Pre-commit: `npm run build` 通过

- [ ] 16. U06 互助详情 `/help/:id`：主信息 + 发布者 + 安全 + 操作

  **What to do**:
  - 创建 `src/pages/HelpDetail.tsx`
  - 路由参数 `:id` → useEventsStore.getById(id)；不存在 → 渲染 EmptyState "找不到这条互助" CTA "返回大厅"
  - 模块（按 U06）：
    - 顶部返回 + 分享（分享按钮仅 toast "链接已复制"）
    - 主信息卡：UrgencyTag + StatusPill + 类型；标题 display-lg；地点 + 距离 + 发布时间；完整描述
    - 发布者信息卡：UserMicroCard 大版（头像 + 昵称 + CreditChip + WarmthMeter md + 已完成次数 + 徽章 row）
    - 地点与交接建议卡：区域名 + "推荐公共交接点：教学楼大厅"等固定文案 + SafetyTip
    - 安全提醒卡：基于事项 type 的 SafetyTip 列表（3 条左右）
    - 响应进度卡：简单进度条 "已有 N 人响应"，按 status 显示阶段
    - 相似互助推荐：横向滚动 3 张 EventCard compact（同 type 不同 id）
    - 底部固定操作栏（移动端粘性）：收藏 + 分享 + 一键帮助（主 CTA）
  - 一键帮助：同 /hall 流程

  **Must NOT do**:
  - ❌ 不要展示发布者真实手机号/微信号
  - ❌ 不要做评论功能
  - ❌ 无效 ID 不要白屏，必须 EmptyState

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: `frontend-app-builder`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3
  - **Blocks**: 21
  - **Blocked By**: 4, 7, 8, 9, 15

  **References**:
  - `docs/暖校Link_前端页面清单与视觉要求.md:686-770` - U06 全部模块
  - `docs/暖校Link_需求文档.md:494-535` - 第 8.6 章详情字段
  - `docs/pages/link_1/code.html` - 详情原型

  **WHY Each Reference Matters**:
  - U06 模块：8 大模块不能漏
  - 8.6 字段：详情必须 13 项

  **Acceptance Criteria**:

  **QA Scenarios**:

  ```
  Scenario: 有效 ID 详情完整
    Tool: Playwright
    Steps:
      1. 访问 /help/{SEED_EVENTS[0].id}
      2. 期望标题、紧急度、发布者昵称、信用分、安全提醒卡都可见
      3. 期望底部 "一键帮助" 按钮可点
      4. 截图整页
    Evidence: task-16-detail.png

  Scenario: 无效 ID 显示 EmptyState
    Tool: Playwright
    Steps:
      1. 访问 /help/zzz-not-exist
      2. 期望文字含 "找不到这条互助"
      3. 点击 "返回大厅" 跳 /hall
    Evidence: task-16-not-found.png

  Scenario: 一键帮助触达
    Tool: Playwright
    Steps:
      1. 详情页底部点 "一键帮助"
      2. 期望确认对话框出现
      3. 确认后 toast 出现
    Evidence: task-16-help.png
  ```

  **Evidence to Capture**:
  - [ ] task-16-detail.png
  - [ ] task-16-not-found.png
  - [ ] task-16-help.png

  **Commit**: YES
  - Message: `feat(p0): help detail page with publisher + safety + bottom action`
  - Files: `src/pages/HelpDetail.tsx`
  - Pre-commit: `npm run build` 通过

- [ ] 17. U08 校园温度地图 `/map`：SVG 地图 + 区域 popup + 排行 + 实时动态

  **What to do**:
  - 创建 `src/pages/Map.tsx`
  - 模块（按 U08 + 14.x）：
    - 顶部 "今日校园温度" 大数字（display-xl，平均温度指数），含状态 tag "非常活跃"/"较活跃"/"平静"
    - 主区域 grid (lg 12 列): 左 8 列 AreaMapSVG，右 4 列侧栏
    - 左侧 AreaMapSVG：8 区域 + 呼吸光圈，点击弹 AreaPopup（floating）
    - AreaPopup 操作 "查看该区域互助" → `/hall?areaId=xxx`；"在这里发布求助" → `/publish?areaId=xxx`
    - 右侧 SectionList：
      - "校园热力排行榜" 前 3 区域名 + 温度指数（areasStore.getHotAreas()）
      - "实时互助动态" 5 条 EventCard compact
      - "互助类型图例" 5 个分类 + 颜色点
  - 移动端：地图占满宽，侧栏内容下移；区域 popup 改为底部抽屉

  **Must NOT do**:
  - ❌ 不做 pan/zoom
  - ❌ 不引入真实地图库
  - ❌ 不显示真实坐标/经纬度

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: `frontend-app-builder`

  **Parallelization**:
  - Wave 3 并行
  - **Blocks**: 30
  - **Blocked By**: 7, 8, 12

  **References**:
  - `docs/暖校Link_前端页面清单与视觉要求.md:808-890` - U08 视觉规范
  - `docs/暖校Link_需求文档.md:798-845` - 第 14 章温度地图
  - `docs/pages/link_5/code.html` - 地图原型结构

  **Acceptance Criteria**:

  **QA Scenarios**:

  ```
  Scenario: 地图页核心模块
    Tool: Playwright
    Steps:
      1. 访问 /map
      2. 期望 AreaMapSVG 渲染（≥ 8 区域）
      3. 期望右侧排行榜 3 项可见
      4. 期望实时动态 ≥ 5 条
      5. 截图整页
    Evidence: task-17-map.png

  Scenario: 区域 popup 跳转
    Tool: Playwright
    Steps:
      1. 点击图书馆区域
      2. popup 出现
      3. 点击 "在这里发布求助"
      4. 期望 URL 含 /publish?areaId=main-library
    Evidence: task-17-area-handoff.txt
  ```

  **Evidence to Capture**:
  - [ ] task-17-map.png
  - [ ] task-17-area-handoff.txt

  **Commit**: `feat(p0): campus warmth map with svg + ranking + feed`

- [ ] 18. U12 个人中心 `/profile`：身份头图 + 暖心 + 信用 + 徽章 + 入口

  **What to do**:
  - 创建 `src/pages/Profile.tsx`
  - 模块（按 U12 + 15.x）：
    - 头部用户卡：头像 + 昵称 + 学校/学院 + "称号"（按 warmth 阶段定，例 "暖心活跃者" / "校园友邻"）
    - 三大指标卡（grid 3 列）：
      - WarmthMeter size="hero"（数字 64px）+ "暖心值"
      - CreditChip 大号 + "信用分"
      - 帮助/被帮助计数（display-md）
    - 本周互助数据 4 卡片：本周帮助、本周受助、贡献资料、参与公益
    - 徽章预览 row（UserBadgePack layout="row"）：4 个 + "+N"，"查看全部" 链接走 toast "演示模式不展开徽章墙"（因为 /profile/badges 是 OUT-OF-SCOPE）
    - 快捷入口列表（清单 5 项）：我的发布、我的帮助、我的收藏、温度报告、安全说明
      - 我的发布/帮助 → `/my/help`
      - 温度报告 → `/profile/report`
      - 我的收藏 → toast "演示版本未实现收藏列表"（避免 404）
      - 安全说明 → `/safety`
    - "退出登录" 文字按钮（演示用 → toast "演示模式不可登出"）
  - 移动端：指标卡 2x2，徽章横滑

  **Must NOT do**:
  - ❌ 不要链接到 /profile/warmth、/profile/badges（OUT-OF-SCOPE）
  - ❌ "退出登录" 不要真重定向
  - ❌ 用户排名不要捏造校外数据，仅用 SEED_USERS 排序得相对位次

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: `frontend-app-builder`

  **Parallelization**:
  - Wave 3 并行
  - **Blocks**: 21, 23
  - **Blocked By**: 4, 7, 9

  **References**:
  - `docs/暖校Link_前端页面清单与视觉要求.md:1014-1067` - U12 模块
  - `docs/暖校Link_需求文档.md:848-961` - 第 15 章个人中心
  - `docs/pages/link_4/code.html` - 个人中心原型

  **Acceptance Criteria**:

  **QA Scenarios**:

  ```
  Scenario: 个人中心默认用户非空
    Tool: Playwright
    Steps:
      1. 访问 /profile
      2. 期望暖心值 = 127
      3. 期望信用分含 "92" 或 "良好"
      4. 期望本周数据非全 0
      5. 期望 ≥ 2 个已得徽章
      6. 暖心值数字 computed font-size ≥ 56px
      7. 截图
    Evidence: task-18-profile.png + task-18-warmth-size.txt

  Scenario: OUT-OF-SCOPE 链接退化为 toast
    Tool: Playwright
    Steps:
      1. 点击 "我的收藏"
      2. 期望 toast 出现，URL 不变
      3. 没有 404
    Evidence: task-18-fallback.txt
  ```

  **Evidence to Capture**:
  - [ ] task-18-profile.png
  - [ ] task-18-warmth-size.txt
  - [ ] task-18-fallback.txt

  **Commit**: `feat(p0): profile page with hero warmth + credit + badge preview`

- [ ] 19. U03 发布确认 `/publish/confirm`：预览 + 可见范围 + 发布

  **What to do**:
  - 创建 `src/pages/PublishConfirm.tsx`
  - 数据来源：`useMeStore.draftPublish`；若空 → 重定向 `/publish`
  - 模块：
    - 预览卡：以最终 EventCard 视觉显示 draftPublish（layout="hero"）
    - 可见范围设置（Radix RadioGroup）：全校可见 / 当前区域可见 / 仅匹配推荐可见
    - 联系方式（Checkbox 多选）：站内消息（默认勾，只读不可取消）/ 匿名联系 / 完成后公开评价
    - 安全提醒确认勾选（必勾才能发布）
    - 底部操作：返回编辑（→ `/publish`）/ 确认发布
  - 确认发布：
    - 调用 `eventsStore.addEvent(draft + 默认 publisher=me + status=waiting)`
    - 清空 draft
    - 跳 `/publish/success`

  **Must NOT do**:
  - ❌ 草稿为空时不要白屏，必须重定向
  - ❌ 不要让用户取消 "站内消息" 联系方式
  - ❌ 不要让 "已读安全提醒" 默认勾选

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: `frontend-app-builder`

  **Parallelization**:
  - Wave 4 并行
  - **Blocks**: 20
  - **Blocked By**: 4, 7, 8, 14

  **References**:
  - `docs/暖校Link_前端页面清单与视觉要求.md:471-526` - U03

  **Acceptance Criteria**:

  **QA Scenarios**:

  ```
  Scenario: 完整确认流程
    Tool: Playwright
    Steps:
      1. 从 /publish 走完一次流程到达 /publish/confirm
      2. 期望预览卡显示标题
      3. 不勾安全提醒，点击 "确认发布"，期望按钮 disabled
      4. 勾选后按钮可用，点击
      5. 期望跳 /publish/success
    Evidence: task-19-confirm.png + task-19-flow.txt

  Scenario: 空 draft 重定向
    Tool: Playwright
    Steps:
      1. 直接访问 /publish/confirm（无 draft）
      2. 期望 URL 自动变 /publish
    Evidence: task-19-redirect.txt
  ```

  **Evidence to Capture**:
  - [ ] task-19-confirm.png
  - [ ] task-19-flow.txt
  - [ ] task-19-redirect.txt

  **Commit**: `feat(p1): publish confirm with visibility + safety acknowledge`

- [ ] 20. U04 发布成功 `/publish/success`：成功反馈 + 下一步

  **What to do**:
  - 创建 `src/pages/PublishSuccess.tsx`
  - 模块：
    - CheckCircle2 大图标（warmth-glow 背景）+ display-lg "发布成功！"
    - 摘要卡（最近 publish 的 event）：标题 + 当前状态 + 推荐人数 + 预计响应时间
    - 三大下一步 CTA（卡片网格）：
      - 查看我的求助 → `/my/help`
      - 去互助大厅看看 → `/hall`
      - 继续发布 → `/publish`
  - motion 上浮动画（fade-in-up）

  **Must NOT do**:
  - ❌ 不要播放声音
  - ❌ 没有 lastPublishedEventId 时不要白屏（fallback 到大厅链接）

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: `frontend-app-builder`

  **Parallelization**:
  - Wave 4 并行
  - **Blocks**: 21
  - **Blocked By**: 7, 19

  **References**:
  - `docs/暖校Link_前端页面清单与视觉要求.md:528-571` - U04
  - `docs/pages/link_3/code.html` - 成功页原型

  **Acceptance Criteria**:

  **QA Scenarios**:

  ```
  Scenario: 成功页渲染
    Tool: Playwright
    Steps:
      1. 经 /publish 完整流程到 /publish/success
      2. 期望 "发布成功" 大字
      3. 期望 3 个 CTA 卡片可点
      4. 截图
    Evidence: task-20-success.png

  Scenario: CTA 跳转正确
    Tool: Playwright
    Steps:
      1. 点击 "查看我的求助"，URL 变 /my/help
    Evidence: task-20-cta.txt
  ```

  **Evidence to Capture**:
  - [ ] task-20-success.png
  - [ ] task-20-cta.txt

  **Commit**: `feat(p1): publish success with next steps`

- [ ] 21. U10 我的互助 `/my/help`：3 概览 + Tabs + 列表 + 操作

  **What to do**:
  - 创建 `src/pages/MyHelp.tsx`
  - 模块：
    - 顶部 3 概览数字卡：我发布的、我帮助的、进行中（按状态聚合）
    - Tabs：我发布的 / 我帮助的 / 已完成 / 已取消
    - 列表：EventCard layout="list" + 状态进度条（5 阶段）+ 底部下一步操作（按状态映射）
      - waiting：取消、查看响应
      - matching：选定帮助者（toast 演示）、取消
      - ongoing：确认完成、联系对方（toast）
      - completed：评价（toast 演示打分）
    - 空态：未发布过 → EmptyState CTA "去发布"

  **Must NOT do**:
  - ❌ 不要做真实评价 modal（toast 演示）
  - ❌ 不要展示对方真实联系方式

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: `frontend-app-builder`

  **Parallelization**:
  - Wave 4 并行
  - **Blocked By**: 4, 7, 8, 16, 18, 20

  **References**:
  - `docs/暖校Link_前端页面清单与视觉要求.md:919-969` - U10
  - `docs/pages/link_7/code.html` - 我的互助原型

  **Acceptance Criteria**:

  **QA Scenarios**:

  ```
  Scenario: Tabs 切换
    Tool: Playwright
    Steps:
      1. 访问 /my/help
      2. 默认 "我发布的" Tab，期望显示当前用户发布的事项
      3. 切到 "已完成"，期望卡片数变化
      4. 截图
    Evidence: task-21-tabs.png

  Scenario: 状态操作触发 toast
    Tool: Playwright
    Steps:
      1. 在 ongoing 卡片点 "确认完成"
      2. 期望 toast 出现 + 卡片状态更新
    Evidence: task-21-action.png
  ```

  **Evidence to Capture**:
  - [ ] task-21-tabs.png
  - [ ] task-21-action.png

  **Commit**: `feat(p1): my help dashboard with tabs + status actions`

- [ ] 22. U11 消息中心 `/messages`：分类 Tabs + 列表 + 详情抽屉

  **What to do**:
  - 创建 `src/pages/Messages.tsx`
  - 模块：
    - Tabs：全部 / 帮助意向 / 系统通知 / 安全提醒 / 公益活动 / 评价反馈
    - 列表：每条消息 ListItem（头像/icon + 标题 + 关联事项 + 时间 + 未读红点）
    - 点击 → 右侧抽屉（Radix Dialog）显示完整内容 + "查看事项" CTA
    - 顶部 "全部标记已读" 按钮
    - 空态 EmptyState

  **Must NOT do**:
  - ❌ 不做回复输入框
  - ❌ 不做实时推送

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: `frontend-app-builder`

  **Parallelization**:
  - Wave 4 并行
  - **Blocked By**: 4, 7, 10

  **References**:
  - `docs/暖校Link_前端页面清单与视觉要求.md:971-1011` - U11

  **Acceptance Criteria**:

  **QA Scenarios**:

  ```
  Scenario: 消息列表 + 抽屉
    Tool: Playwright
    Steps:
      1. 访问 /messages
      2. 期望 ≥ 5 条消息
      3. 点击第一条
      4. 期望抽屉打开，含详情
    Evidence: task-22-messages.png

  Scenario: 标记已读
    Tool: Playwright
    Steps:
      1. 点 "全部标记已读"
      2. 期望未读红点全消失
    Evidence: task-22-read.png
  ```

  **Evidence to Capture**:
  - [ ] task-22-messages.png
  - [ ] task-22-read.png

  **Commit**: `feat(p1): messages center with tabs + drawer`

- [ ] 23. U15 温度报告 `/profile/report`：周月切换 + 数据 + 海报

  **What to do**:
  - 创建 `src/pages/WarmthReport.tsx`
  - 模块：
    - 顶部周/月 Toggle
    - 关键数据摘要 (4-6 卡)：帮助人数、获得帮助、共享资料、流转物品、点亮区域、获得徽章
    - 互助故事时间线（vertical timeline，3-5 条）：基于 SEED_EVENTS 已完成事项
    - 点亮区域统计：mini SVG（复用 AreaMapSVG 简化版仅高亮 N 个区域）
    - 分享海报卡片（白底 + warmth-glow 渐变 + 用户头像 + 数字 + 暖心值 + Logo），底部 "下载海报" 按钮（toast "演示版本未实现下载"）

  **Must NOT do**:
  - ❌ 不做真实图片导出（toast 演示）
  - ❌ 不要让海报数据与实际数据不一致

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: `frontend-app-builder`

  **Parallelization**:
  - Wave 4 并行
  - **Blocked By**: 9, 12, 18

  **References**:
  - `docs/暖校Link_前端页面清单与视觉要求.md:1122-1161` - U15

  **Acceptance Criteria**:

  **QA Scenarios**:

  ```
  Scenario: 报告渲染
    Tool: Playwright
    Steps:
      1. 访问 /profile/report
      2. 期望 ≥ 4 张数据卡可见
      3. 期望时间线 ≥ 3 条
      4. 期望海报卡含暖心值数字
      5. 截图
    Evidence: task-23-report.png

  Scenario: 周/月切换数字变化
    Tool: Playwright
    Steps:
      1. 切到 "本月" Tab
      2. 期望至少 1 个卡片数字变化
    Evidence: task-23-toggle.txt
  ```

  **Evidence to Capture**:
  - [ ] task-23-report.png
  - [ ] task-23-toggle.txt

  **Commit**: `feat(p1): warmth report with timeline + share poster`

- [ ] 24. U16 学习资料库 `/resources`：搜索 + 课程筛选 + 资料卡片

  **What to do**:
  - 创建 `src/pages/Resources.tsx`
  - 模块：
    - 顶部 SearchBar + 课程筛选 Tabs（全部 / 高数 / 计网 / 数据结构 / 操作系统 / 英语）
    - 资料类型筛选 Tabs（笔记 / 真题 / 复习提纲 / 课件）
    - 资料卡片网格：标题 + 课程标签 + 类型 + 评分 + 贡献者 UserMicroCard + 收藏数 + 获取数 + 更新时间
    - 点击卡片 → toast "演示版本未实现详情" 或简单 alert
    - "申请获取" 按钮 → toast "已发送申请"
    - 顶部 "上传资料" 按钮 → toast "演示模式不支持文件上传"

  **Must NOT do**:
  - ❌ 不实现文件上传/下载
  - ❌ 不做资料详情页

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: `frontend-app-builder`

  **Parallelization**:
  - Wave 4 并行
  - **Blocked By**: 4, 7, 10

  **References**:
  - `docs/暖校Link_前端页面清单与视觉要求.md:1163-1197` - U16

  **Acceptance Criteria**:

  **QA Scenarios**:

  ```
  Scenario: 资料库渲染
    Tool: Playwright
    Steps:
      1. 访问 /resources
      2. 期望 ≥ 6 张资料卡
      3. 切换课程筛选
    Evidence: task-24-resources.png
  ```

  **Evidence to Capture**:
  - [ ] task-24-resources.png

  **Commit**: `feat(p1): resources library with filter + cards`

- [ ] 25. U17 公益活动 `/volunteer`：Banner + 分类 + 卡片 + 报名

  **What to do**:
  - 创建 `src/pages/Volunteer.tsx`
  - 模块：
    - Hero Banner（warmth-glow 渐变 + 公益主题文案）
    - 分类筛选：全部 / 旧书捐赠 / 志愿招募 / 帮扶 / 绿色低碳
    - 活动卡片网格：名称 + 类型 + 时间 + 地点 + 招募人数 + 已报名进度条 + 发起组织 + 报名按钮
    - 公益影响力 4 数字卡（社区贡献小时、参与人次、闲置物品流转、公益活动数）
  - 报名按钮 → 弹 Radix Dialog 确认 → toast "报名成功" + 更新 signedUp（store mutate）

  **Must NOT do**:
  - ❌ 不做真实活动详情页
  - ❌ 不做表单字段（昵称/手机号），直接 mock 当前用户报名

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: `frontend-app-builder`

  **Parallelization**:
  - Wave 4 并行
  - **Blocked By**: 4, 7, 10

  **References**:
  - `docs/暖校Link_前端页面清单与视觉要求.md:1199-1236` - U17

  **Acceptance Criteria**:

  **QA Scenarios**:

  ```
  Scenario: 活动列表 + 报名
    Tool: Playwright
    Steps:
      1. 访问 /volunteer
      2. 期望 ≥ 4 张活动卡
      3. 点击 "立即报名" 弹确认
      4. 确认后 toast 成功，进度条 +1
    Evidence: task-25-volunteer.png + task-25-signup.png
  ```

  **Evidence to Capture**:
  - [ ] task-25-volunteer.png
  - [ ] task-25-signup.png

  **Commit**: `feat(p1): volunteer activities with cards + sign-up`

- [ ] 26. U18 安全与隐私说明 `/safety`：原则 + 分组 + 流程

  **What to do**:
  - 创建 `src/pages/Safety.tsx`
  - 模块：
    - 顶部 ShieldCheck 大图标 + display-lg "你的安全是我们的第一原则"
    - 4 大分组卡（icon + 标题 + 3-5 条要点）：
      - 隐私保护（昵称对外、敏感信息脱敏）
      - 线下交接（公共区域、夜间提示）
      - 内容合规（禁止物品清单）
      - 投诉举报（流程 + 联系方式）
    - 常见问题手风琴（Radix Accordion）4-6 条 FAQ
    - 底部 "举报内容" 按钮 → toast 演示

  **Must NOT do**:
  - ❌ 不要复制大段法律文本
  - ❌ 不要恐吓性图片

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: `frontend-app-builder`

  **Parallelization**:
  - Wave 4 并行
  - **Blocked By**: 7, 8

  **References**:
  - `docs/暖校Link_前端页面清单与视觉要求.md:1239-1265` - U18
  - `docs/暖校Link_需求文档.md:1267-1313` - 第 21 章隐私安全合规

  **Acceptance Criteria**:

  **QA Scenarios**:

  ```
  Scenario: 安全页 4 分组渲染
    Tool: Playwright
    Steps:
      1. 访问 /safety
      2. 期望 4 大分组卡可见
      3. 期望 FAQ 手风琴展开收起
    Evidence: task-26-safety.png
  ```

  **Evidence to Capture**:
  - [ ] task-26-safety.png

  **Commit**: `feat(p1): safety & privacy explainer page`

- [ ] 27. A01 管理端 Dashboard `/admin`：核心指标 + 3 图表 + 风险预览 + AI 治理

  **What to do**:
  - 创建 `src/pages/admin/AdminDashboard.tsx`
  - 模块：
    - 顶部时间筛选 Tabs（今日 / 本周 / 本月 - 仅 UI 切换不变数据，演示）
    - 核心指标卡 grid 6（今日新增、今日完成、平均响应、活跃用户、风险数、用户满意度）
    - **3 个 recharts 图表**：
      - 互助类型分布柱状图（recharts BarChart, 6 type）
      - 区域热力排行横向条形图（recharts BarChart layout=vertical, 8 areas）
      - 互助趋势折线图（recharts LineChart, 7 天 mock 数据）
    - 高频需求词区（横向 tag cloud 用 flex 包裹，无库），按 frequency size
    - 实时风险提醒列表（前 5 条 RiskAlert）
    - AI 治理建议卡（**硬编码 mock 文本** "建议在快递站增加雨伞共享点" "周三晚自习高峰期可加派志愿者" 等 3 条）

  **Must NOT do**:
  - ❌ 不调用 Gemini API（治理建议硬编码）
  - ❌ 不实现侧边栏未完成菜单链接（仅"总览"+"风险审核"）
  - ❌ 不显示真实姓名

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: recharts + 数据聚合
  - **Skills**: 无

  **Parallelization**:
  - Wave 4 并行
  - **Blocks**: 28
  - **Blocked By**: 4, 7

  **References**:
  - `docs/暖校Link_前端页面清单与视觉要求.md:1271-1313` - A01
  - `docs/暖校Link_需求文档.md:1052-1129` - 第 18 章管理端

  **Acceptance Criteria**:

  **QA Scenarios**:

  ```
  Scenario: Dashboard 核心模块
    Tool: Playwright
    Steps:
      1. 访问 /admin
      2. 期望 "管理员模式" 横幅可见
      3. 期望 6 个指标卡
      4. 期望 ≥ 3 个 recharts SVG (svg.recharts-surface 或类似 selector)
      5. 期望 AI 治理建议卡含 ≥ 3 条建议
      6. 截图整页
    Evidence: task-27-admin.png

  Scenario: 侧边栏仅 2 项
    Tool: Playwright
    Steps:
      1. 期望 nav links 仅含 "总览" + "风险审核"
      2. 不含 "用户管理" 等
    Evidence: task-27-sidebar.txt
  ```

  **Evidence to Capture**:
  - [ ] task-27-admin.png
  - [ ] task-27-sidebar.txt

  **Commit**: `feat(p1): admin dashboard with 3 charts + governance card`

- [ ] 28. A03 风险审核 `/admin/risk`：等级概览 + 列表 + 详情 + 操作

  **What to do**:
  - 创建 `src/pages/admin/RiskReview.tsx`
  - 模块：
    - 顶部风险等级概览（3 卡：高 N / 中 N / 低 N）
    - 风险分类筛选 Tabs（全部/隐私泄露/线下风险/违规物品/异常发布/紧急安全/投诉举报）
    - 风险列表（按 severity desc）：每行 RiskAlert 显示类型 + 关联事项 + 触发原因 + 建议 + 状态 + "查看" 按钮
    - 点击 → 右侧抽屉显示完整 + 5 操作按钮（标记已处理 / 忽略 / 提醒用户修改 / 暂停展示 / 人工复核）
    - 操作 → store mutate + Sonner toast

  **Must NOT do**:
  - ❌ 不要做真实邮件/短信发送
  - ❌ 不要做用户黑名单功能

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: 无

  **Parallelization**:
  - Wave 4 并行
  - **Blocked By**: 4, 7, 27

  **References**:
  - `docs/暖校Link_前端页面清单与视觉要求.md:1366-1407` - A03

  **Acceptance Criteria**:

  **QA Scenarios**:

  ```
  Scenario: 风险列表 + 详情抽屉
    Tool: Playwright
    Steps:
      1. 访问 /admin/risk
      2. 期望 ≥ 3 条风险
      3. 点击第一条 → 抽屉打开
      4. 点击 "标记已处理" → toast + 状态更新
    Evidence: task-28-risk.png

  Scenario: 等级筛选
    Tool: Playwright
    Steps:
      1. 切到 "隐私泄露" Tab
      2. 期望列表数变化
    Evidence: task-28-filter.txt
  ```

  **Evidence to Capture**:
  - [ ] task-28-risk.png
  - [ ] task-28-filter.txt

  **Commit**: `feat(p1): risk review page with severity overview + actions`

- [ ] 29. 全局响应式 + 移动端 BottomNav 串联

  **What to do**:
  - 全 16 页通跑 dev server，移动端尺寸 (375x667) 检查：
    - 卡片是否单列
    - SearchBar 是否吸顶
    - BottomNav 5 项是否高 ≥ 56px 触达
    - 长标题是否截断不溢出
  - 桌面 (1280 + 1440) 检查：
    - 1280 容器居中
    - 1440 不超宽
  - 修复任何溢出/触达/吸顶问题
  - 加 1 个全局 `<a href="#main">跳到主内容</a>` skip-link（a11y）

  **Must NOT do**:
  - ❌ 不要调整任何业务逻辑
  - ❌ 不要重写组件结构

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: `frontend-testing-debugging`

  **Parallelization**:
  - Wave 5 并行
  - **Blocked By**: 13-28

  **Acceptance Criteria**:

  **QA Scenarios**:

  ```
  Scenario: 移动端遍历
    Tool: Playwright (viewport 375x667)
    Steps:
      1. 遍历 16 路由
      2. 每页截图 + 检查无水平滚动
    Evidence: task-29-mobile/*.png

  Scenario: 桌面 1440 不超宽
    Tool: Playwright (viewport 1440x900)
    Steps:
      1. 访问 /, /hall, /map, /admin
      2. 期望 main 元素 max-width ≤ 1280
    Evidence: task-29-desktop.png
  ```

  **Evidence to Capture**:
  - [ ] task-29-mobile/ 16 张
  - [ ] task-29-desktop.png

  **Commit**: `chore(polish): responsive + mobile nav + a11y skip-link`

- [ ] 30. 跨页 happy path 串联 + 演示数据预热

  **What to do**:
  - 跑通完整闭环并修复任何衔接问题：
    - / 输入需求 → /publish (含 seed) → AI 生成 → /publish/confirm → 确认 → /publish/success → 查看求助 → /my/help → 点击事项 → /help/:id → 一键帮助 → /messages 看消息 → /profile 看暖心值
  - 修复任何状态不流转 / URL 参数不带 / 跳转白屏
  - seed 数据加 2-3 个"刚刚"时间戳事项保证首页实时动态有最近内容
  - 验证 /map → 区域 popup → 跳 /hall?areaId=xxx 筛选生效

  **Must NOT do**:
  - ❌ 不要新增页面
  - ❌ 不要改 UI

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: `frontend-testing-debugging`

  **Parallelization**:
  - Wave 5 并行
  - **Blocked By**: 13-28

  **Acceptance Criteria**:

  **QA Scenarios**:

  ```
  Scenario: 完整发布闭环
    Tool: Playwright
    Steps:
      1. / → 输入 → /publish → 生成 → /publish/confirm → 发布 → /publish/success
      2. 期望全程无 console error
      3. /my/help 看到新事项
    Evidence: task-30-loop.txt + task-30-screenshots/

  Scenario: 区域跳大厅筛选
    Tool: Playwright
    Steps:
      1. /map 点图书馆 popup → "查看该区域互助"
      2. URL 含 areaId=main-library
      3. /hall 卡片仅含图书馆相关
    Evidence: task-30-area-filter.png
  ```

  **Evidence to Capture**:
  - [ ] task-30-loop.txt
  - [ ] task-30-screenshots/
  - [ ] task-30-area-filter.png

  **Commit**: `chore(polish): cross-page integration + seed warmup`

- [ ] 31. AI slop 清理 + 构建审计

  **What to do**:
  - 全仓搜：
    - `as any`、`@ts-ignore`、`console.log`、空 catch、注释代码、未用 import → 全部清除（保留必要的 console.error 在 catch 内）
    - 通用变量名 data/result/item/temp 替换为业务名（如果存在）
  - `npm run build` 检查 dist 体积
    - dist/assets/*.js 总大小记录到 evidence
    - 若 main bundle > 800KB，加 lazy() 拆分页面
  - `npm run lint` 全绿
  - 全 16 页面在 console 无 error/warning
  - 删除任何 _smoke 临时组件 + main.tsx 移除 smoke 挂载（仅保留路由）

  **Must NOT do**:
  - ❌ 不要为减体积砍功能
  - ❌ 不要改 tsconfig 关 strict

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: `ai-slop-remover`

  **Parallelization**:
  - Wave 5 并行
  - **Blocked By**: 13-28

  **Acceptance Criteria**:

  **QA Scenarios**:

  ```
  Scenario: 关键词全清
    Tool: Bash
    Steps:
      1. grep -rn "as any\|@ts-ignore\|console\.log\b" src/ ; 期望无输出
      2. grep -rn "_smoke" src/ ; 期望无输出
    Evidence: task-31-keywords.txt

  Scenario: 构建产物
    Tool: Bash
    Steps:
      1. npm run build ; 期望 exit 0
      2. ls -la dist/assets/*.js ; 记录总体积
    Evidence: task-31-build.txt

  Scenario: 16 页面无 console error
    Tool: Playwright
    Steps:
      1. 遍历 16 路由 + 监听 console.error
      2. 期望整体 0 error
    Evidence: task-31-console.txt
  ```

  **Evidence to Capture**:
  - [ ] task-31-keywords.txt
  - [ ] task-31-build.txt
  - [ ] task-31-console.txt

  **Commit**: `chore(polish): remove ai slop + build audit + cleanup smoke`

---

## Final Verification Wave (MANDATORY — after ALL implementation tasks)

> 4 个审核 agent 并行运行。全部 APPROVE 后呈现给用户，等待明确 "okay" 才完成。
>
> **不可在 F1-F4 标记完成前自动结束。** 任何 reject → 修复 → 重跑 → 再呈现 → 等用户 okay。

- [ ] F1. **Plan Compliance Audit** — `oracle`
  通读 .sisyphus/plans/warmlink-campus.md。对每条 "Must Have" 验证实现存在（读文件 / curl 路由 / 跑命令）；对每条 "Must NOT Have" 在代码库搜禁词模式 — 命中则 file:line reject。检查 .sisyphus/evidence/ 证据齐全。比对交付与计划。
  Output: `Must Have [N/N] | Must NOT Have [N/N] | Tasks [N/N] | VERDICT: APPROVE/REJECT`

- [ ] F2. **Code Quality Review** — `unspecified-high`
  跑 `tsc --noEmit` + `npm run lint` + `npm run build`。审查全部改动文件：`as any` / `@ts-ignore` / 空 catch / `console.log` / 注释代码 / 未用 import。检查 AI slop：过多注释、过度抽象、通用变量名（data/result/item/temp）。
  Output: `Build [PASS/FAIL] | Lint [PASS/FAIL] | Files [N clean/N issues] | VERDICT`

- [ ] F3. **Real Manual QA** — `unspecified-high` + `playwright` skill
  从干净状态开始。跑通每个任务的每个 QA 场景 — 严格按步骤、捕证据。测跨任务集成：完整发布闭环（/ → /publish → /publish/confirm → /publish/success → /my/help → /help/:id → /profile）。测边界：空筛选、无效 :id、Gemini 不可用、Sonner toast、ErrorBoundary 触发。证据存 `.sisyphus/evidence/final-qa/`。
  Output: `Scenarios [N/N pass] | Integration [N/N] | Edge Cases [N tested] | VERDICT`

- [ ] F4. **Scope Fidelity Check** — `deep`
  对每个任务：读 "What to do"，读实际 git diff。1:1 验证 — spec 中每件事都做了（无遗漏），spec 之外什么都没多做（无 creep）。检查 "Must NOT do" 合规。检测交叉污染：任务 N 改了任务 M 的文件。标记不可解释的改动。**特别确认 8 个 OUT-OF-SCOPE 路由未被实现。**
  Output: `Tasks [N/N compliant] | Out-of-scope routes [CLEAN/N built] | Contamination [CLEAN/N issues] | VERDICT`

---

## Commit Strategy

按任务粒度提交，每任务一个 commit。约定式提交：

- T0: `chore(deps): install zustand, gemini-sdk, fix font and shadcn theme`
- T1: `feat(theme): apply DESIGN.md tokens (Rausch + warmth-glow)`
- T2: `feat(types): define event/user/area/llm-schema contracts`
- T3: `feat(mock): seed events/users/areas/badges with warmth formula`
- T4: `feat(state): wire zustand domain stores`
- T5: `feat(llm): integrate Gemini with rule-based fallback`
- T6: `feat(privacy): add local pii regex detector`
- T7: `feat(layout): user/admin shells + router + error boundary`
- T8-T12: `feat(ui): {component-family} shared components`
- T13-T18: `feat(p0): {page-name} page`
- T19-T28: `feat(p1): {page-name} page`
- T29-T31: `chore(polish): {scope}`

预提交：每任务 commit 前必须 `npm run build` 通过。

---

## Success Criteria

### Verification Commands
```bash
# 构建
npm run build  # Expected: exit 0, dist/ generated

# Lint
npm run lint  # Expected: no errors

# 路由可达（Playwright）
# / → 渲染 hero + AI 输入框
# /publish → AI 输入区
# /hall → 卡片列表
# /help/1 → 详情，/help/9999 → 404 状态
# /map → SVG 校园 + 呼吸光圈
# /profile → 暖心值 ≥32px
# /admin → "管理员模式" 横幅 + ≥3 个 recharts 图表
# /admin/risk → 风险列表

# OUT-OF-SCOPE 路由不挂（404）
# /category/anything → 404
# /map/area/anything → 404
# /profile/warmth → 404
# /profile/badges → 404
# /admin/help → 404
# /admin/areas → 404
# /admin/users → 404
# /admin/volunteer → 404
```

### Final Checklist
- [ ] 全部 "Must Have" 存在
- [ ] 全部 "Must NOT Have" 不存在
- [ ] 16 个路由可达
- [ ] 8 个 OUT-OF-SCOPE 路由 404
- [ ] AI 发布在有/无 Gemini key 两种状态下视觉无差
- [ ] 隐私正则 6 类全部命中
- [ ] DESIGN.md token 全部映射
- [ ] Inter + CJK 中文回退在 Windows Chrome 不出现 SimSun
