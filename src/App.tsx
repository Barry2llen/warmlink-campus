import { useMemo, useState } from "react"
import { Link, NavLink, Route, Routes, useNavigate, useParams, useSearchParams } from "react-router"
import {
  AlertTriangle,
  ArrowLeft,
  Bell,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  CircleGauge,
  Clock3,
  Flame,
  Gift,
  HandHeart,
  Home,
  LayoutDashboard,
  MapPin,
  MessageCircle,
  Package,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  Trophy,
  Umbrella,
  UserRound,
  UsersRound,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { CampusAmap } from "@/components/CampusAmap"
import { analyzePublishDraftWithGemini, hasGeminiApiKey } from "@/lib/llm/gemini"
import { detectPrivacy, redactPrivacy } from "@/lib/privacy"
import type { Area, Event, EventStatus, EventType, LLMPublishResult, RiskAlert, Urgency, User } from "@/lib/types"
import { cn } from "@/lib/utils"

const eventTypeMeta: Record<EventType, { label: string; icon: typeof Package; tone: string; short: string }> = {
  idle: { label: "闲置物品", icon: Gift, tone: "bg-[#fff1f2] text-[#be123c]", short: "闲置" },
  study: { label: "学习资料", icon: BookOpen, tone: "bg-[#eef6ff] text-[#1769aa]", short: "资料" },
  supplies: { label: "生活物资", icon: Umbrella, tone: "bg-[#fff7ed] text-[#c2410c]", short: "物资" },
  errand: { label: "临时求助", icon: HandHeart, tone: "bg-[#f0fdf4] text-[#15803d]", short: "求助" },
  volunteer: { label: "公益帮扶", icon: UsersRound, tone: "bg-[#f5f3ff] text-[#6d28d9]", short: "公益" },
  safety: { label: "安全提醒", icon: ShieldCheck, tone: "bg-[#fee2e2] text-[#b91c1c]", short: "安全" },
}

const urgencyMeta: Record<Urgency, { label: string; className: string }> = {
  high: { label: "高", className: "bg-[#fee2e2] text-[#b91c1c]" },
  medium: { label: "中", className: "bg-[#fff7ed] text-[#c2410c]" },
  low: { label: "低", className: "bg-[#f0fdf4] text-[#15803d]" },
}

const statusMeta: Record<EventStatus, { label: string; className: string }> = {
  waiting: { label: "待帮助", className: "bg-white text-[var(--color-ink)] border border-[var(--color-hairline)]" },
  matching: { label: "匹配中", className: "bg-[#fff1f2] text-[var(--color-primary)]" },
  ongoing: { label: "进行中", className: "bg-[#eef6ff] text-[#1769aa]" },
  pending_confirm: { label: "待确认", className: "bg-[#fff7ed] text-[#c2410c]" },
  completed: { label: "已完成", className: "bg-[#f0fdf4] text-[#15803d]" },
  cancelled: { label: "已取消", className: "bg-[var(--color-surface-strong)] text-[var(--color-muted)]" },
  delisted: { label: "已下架", className: "bg-[#fee2e2] text-[#b91c1c]" },
}

const users: User[] = [
  {
    id: "u1",
    nickname: "林同学",
    avatar: "林",
    school: "暖校大学",
    college: "计算机学院",
    warmth: 450,
    credit: 820,
    badges: ["急速响应者", "靠谱同学"],
    helpsGiven: 12,
    helpsReceived: 5,
    registeredAt: "2026-03-01",
    lastActiveAt: "2026-05-31",
    role: "student",
  },
  {
    id: "u2",
    nickname: "陈学姐",
    avatar: "陈",
    school: "暖校大学",
    college: "经管学院",
    warmth: 1280,
    credit: 892,
    badges: ["资料达人", "暖心先锋"],
    helpsGiven: 36,
    helpsReceived: 9,
    registeredAt: "2025-09-08",
    lastActiveAt: "2026-05-31",
    role: "student",
  },
  {
    id: "u3",
    nickname: "周同学",
    avatar: "周",
    school: "暖校大学",
    college: "设计学院",
    warmth: 760,
    credit: 858,
    badges: ["绿色循环官"],
    helpsGiven: 21,
    helpsReceived: 4,
    registeredAt: "2025-11-12",
    lastActiveAt: "2026-05-31",
    role: "student",
  },
]

const areas: Area[] = [
  { id: "library", name: "图书馆", lngLat: [115.82794, 28.65332], x: 45, y: 30, width: 18, height: 14, todayCount: 28, activeCount: 9, hotTypes: ["学习资料", "生活物资"], avgResponseMin: 8, temperatureIndex: 92, recentEvents: ["借用雨伞", "计算机网络复习资料"] },
  { id: "dorm", name: "宿舍区", lngLat: [115.82395, 28.6505], x: 15, y: 55, width: 22, height: 20, todayCount: 34, activeCount: 12, hotTypes: ["闲置物品", "临时求助"], avgResponseMin: 11, temperatureIndex: 88, recentEvents: ["闲置台灯赠送", "搬运行李"] },
  { id: "canteen", name: "一食堂", lngLat: [115.82998, 28.65095], x: 65, y: 58, width: 16, height: 12, todayCount: 16, activeCount: 5, hotTypes: ["临时求助", "公益帮扶"], avgResponseMin: 6, temperatureIndex: 76, recentEvents: ["帮带晚饭", "公益餐盒回收"] },
  { id: "teaching", name: "教学楼", lngLat: [115.82957, 28.65385], x: 58, y: 18, width: 22, height: 15, todayCount: 19, activeCount: 7, hotTypes: ["学习资料", "安全提醒"], avgResponseMin: 10, temperatureIndex: 81, recentEvents: ["实验报告模板", "晚间结伴回宿舍"] },
  { id: "express", name: "快递站", lngLat: [115.82495, 28.654], x: 30, y: 18, width: 13, height: 12, todayCount: 12, activeCount: 4, hotTypes: ["临时求助"], avgResponseMin: 9, temperatureIndex: 68, recentEvents: ["代取快递", "借小推车"] },
  { id: "stadium", name: "体育场", lngLat: [115.8311, 28.6523], x: 75, y: 34, width: 16, height: 16, todayCount: 10, activeCount: 3, hotTypes: ["公益帮扶"], avgResponseMin: 15, temperatureIndex: 61, recentEvents: ["夜跑搭子", "志愿活动集合"] },
  { id: "gate", name: "校门口", lngLat: [115.82248, 28.65427], x: 8, y: 36, width: 14, height: 12, todayCount: 14, activeCount: 4, hotTypes: ["临时求助", "安全提醒"], avgResponseMin: 7, temperatureIndex: 73, recentEvents: ["新生问路", "晚间返校提醒"] },
  { id: "activity", name: "学生活动中心", lngLat: [115.8266, 28.6519], x: 42, y: 64, width: 18, height: 14, todayCount: 18, activeCount: 6, hotTypes: ["公益帮扶", "闲置物品"], avgResponseMin: 12, temperatureIndex: 79, recentEvents: ["社团物资借用", "公益活动集合"] },
]

const initialEvents: Event[] = [
  {
    id: "e1",
    type: "supplies",
    title: "图书馆北门借用雨伞",
    description: "在图书馆二楼自习，突然下大雨了没带伞，希望能借一把伞回宿舍，用完会立即归还。",
    tags: ["雨伞", "图书馆", "立即需要"],
    areaId: "library",
    location: "主图书馆北门",
    timeRequirement: "20 分钟内",
    urgency: "high",
    publisherId: "u1",
    status: "waiting",
    responders: ["u2"],
    views: 128,
    publishedAt: "10 分钟前",
    updatedAt: "刚刚",
    riskFlag: false,
  },
  {
    id: "e2",
    type: "study",
    title: "求计算机网络期末复习资料",
    description: "希望找一份计算机网络复习提纲或历年题整理，愿意用数据库笔记交换。",
    tags: ["计算机网络", "期末", "资料交换"],
    areaId: "teaching",
    location: "第三教学楼",
    timeRequirement: "今晚前",
    urgency: "medium",
    publisherId: "u2",
    status: "matching",
    responders: ["u1", "u3"],
    views: 203,
    publishedAt: "32 分钟前",
    updatedAt: "5 分钟前",
  },
  {
    id: "e3",
    type: "idle",
    title: "闲置护眼台灯赠送",
    description: "毕业整理宿舍，有一盏九成新的护眼台灯可以送给需要自习的同学，宿舍区公共大厅交接。",
    tags: ["台灯", "毕业季", "免费赠送"],
    areaId: "dorm",
    location: "南区宿舍公共大厅",
    timeRequirement: "本周内",
    urgency: "low",
    publisherId: "u3",
    status: "waiting",
    responders: [],
    views: 87,
    publishedAt: "1 小时前",
    updatedAt: "20 分钟前",
  },
  {
    id: "e4",
    type: "errand",
    title: "需要两位同学帮忙搬行李",
    description: "从西门快递站到 8 号宿舍楼，有两个行李箱和一箱书，预计 15 分钟，可请奶茶。",
    tags: ["搬行李", "快递站", "今天"],
    areaId: "express",
    location: "西门快递站",
    timeRequirement: "今天 18:30",
    urgency: "medium",
    publisherId: "u1",
    status: "ongoing",
    responders: ["u2", "u3"],
    views: 156,
    publishedAt: "2 小时前",
    updatedAt: "18 分钟前",
  },
  {
    id: "e5",
    type: "volunteer",
    title: "周末旧书循环公益活动招募",
    description: "校青协在一食堂门口组织旧书回收与免费流转活动，招募 8 名志愿者负责登记和整理。",
    tags: ["旧书循环", "志愿者", "绿色校园"],
    areaId: "canteen",
    location: "一食堂东门",
    timeRequirement: "周六 9:00",
    urgency: "low",
    publisherId: "u2",
    status: "waiting",
    responders: ["u1", "u3"],
    views: 240,
    publishedAt: "昨天",
    updatedAt: "1 小时前",
  },
  {
    id: "e6",
    type: "safety",
    title: "晚间结伴从教学楼回宿舍",
    description: "今晚课程结束较晚，想找同路线同学一起从教学楼回南区宿舍，避免单独走偏僻路段。",
    tags: ["夜间", "结伴", "安全"],
    areaId: "teaching",
    location: "第三教学楼大厅",
    timeRequirement: "今晚 21:30",
    urgency: "high",
    publisherId: "u3",
    status: "matching",
    responders: ["u1"],
    views: 99,
    publishedAt: "15 分钟前",
    updatedAt: "2 分钟前",
    riskFlag: true,
  },
]

const risks: RiskAlert[] = [
  { id: "r1", type: "隐私泄露", severity: "high", relatedEventId: "e6", reason: "内容含夜间单独行动与具体时间地点", suggestion: "建议保留公共集合点并提示结伴同行。", status: "pending", createdAt: "2 分钟前" },
  { id: "r2", type: "线下风险", severity: "medium", relatedEventId: "e1", reason: "雨天高紧急物资交接", suggestion: "提醒双方选择图书馆门厅交接。", status: "processing", createdAt: "8 分钟前", handler: "AI 审核" },
  { id: "r3", type: "版权合规", severity: "medium", relatedEventId: "e2", reason: "学习资料可能涉及历年题分享", suggestion: "提示不得上传作弊或未授权资料。", status: "pending", createdAt: "30 分钟前" },
]

const helperCards = [
  { name: "陈学姐", resource: "可借折叠伞", distance: "180m", credit: 892, warmth: 1280, speed: "平均 6 分钟响应", reason: "常在图书馆附近，历史借物评价很好" },
  { name: "周同学", resource: "可帮搬运 / 指路", distance: "260m", credit: 858, warmth: 760, speed: "平均 9 分钟响应", reason: "同区域活跃，近期完成 5 次临时协助" },
]

function getUser(id: string) {
  return users.find((user) => user.id === id) ?? users[0]
}

function getArea(id: string) {
  return areas.find((area) => area.id === id) ?? areas[0]
}

function App() {
  const [events, setEvents] = useState(initialEvents)
  const [toast, setToast] = useState("")
  const [draft, setDraft] = useState("我在图书馆想借一把伞，20 分钟后回南区宿舍")

  const publishEvent = (event: Event) => {
    setEvents((current) => [event, ...current])
    setToast("发布成功，已进入互助大厅并同步到温度地图。")
  }

  const respondToEvent = (id: string) => {
    setEvents((current) =>
      current.map((event) =>
        event.id === id
          ? {
              ...event,
              responders: event.responders.includes("u3") ? event.responders : [...event.responders, "u3"],
              status: event.status === "waiting" ? "matching" : event.status,
            }
          : event,
      ),
    )
    setToast("帮助意向已发送，发布者会收到站内通知。")
  }

  return (
    <div className="min-h-screen bg-[var(--color-canvas)] text-[var(--color-ink)]">
      <TopNav />
      {toast ? <Toast message={toast} onClose={() => setToast("")} /> : null}
      <main className="pb-24 md:pb-10">
        <Routes>
          <Route path="/" element={<HomePage events={events} draft={draft} setDraft={setDraft} />} />
          <Route path="/publish" element={<PublishPage draft={draft} setDraft={setDraft} onPublish={publishEvent} />} />
          <Route path="/publish/success" element={<PublishSuccessPage />} />
          <Route path="/hall" element={<HallPage events={events} onRespond={respondToEvent} />} />
          <Route path="/help/:id" element={<DetailPage events={events} onRespond={respondToEvent} />} />
          <Route path="/category/:type" element={<CategoryPage events={events} onRespond={respondToEvent} />} />
          <Route path="/map" element={<MapPage events={events} />} />
          <Route path="/map/area/:id" element={<AreaPage events={events} onRespond={respondToEvent} />} />
          <Route path="/my/help" element={<MyHelpPage events={events} />} />
          <Route path="/messages" element={<MessagesPage />} />
          <Route path="/profile" element={<ProfilePage events={events} />} />
          <Route path="/profile/report" element={<ReportPage />} />
          <Route path="/resources" element={<ResourcesPage />} />
          <Route path="/volunteer" element={<VolunteerPage />} />
          <Route path="/safety" element={<SafetyPage />} />
          <Route path="/admin" element={<AdminPage events={events} />} />
          <Route path="/admin/risk" element={<RiskPage events={events} />} />
        </Routes>
      </main>
      <BottomNav />
    </div>
  )
}

function TopNav() {
  const links = [
    { to: "/", label: "首页" },
    { to: "/publish", label: "AI 发布" },
    { to: "/hall", label: "互助大厅" },
    { to: "/map", label: "温度地图" },
    { to: "/profile", label: "我的" },
    { to: "/admin", label: "管理端" },
  ]

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--color-hairline-soft)] bg-white/92 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-8">
        <Link to="/" className="flex items-center gap-2 text-lg font-bold text-[var(--color-primary)]">
          <span className="grid size-9 place-items-center rounded-full bg-[#fff1f2]">
            <Flame data-icon="inline-start" />
          </span>
          暖校 Link
        </Link>
        <nav className="hidden items-center gap-1 lg:flex">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                cn(
                  "rounded-full px-4 py-2 text-sm font-medium text-[var(--color-muted)] transition hover:bg-[var(--color-surface-soft)] hover:text-[var(--color-ink)]",
                  isActive && "bg-[#fff1f2] text-[var(--color-primary)]",
                )
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
        <div className="hidden items-center gap-3 lg:flex">
          <Link to="/messages" className="grid size-10 place-items-center rounded-full border border-[var(--color-hairline)] text-[var(--color-muted)] hover:text-[var(--color-primary)]">
            <Bell data-icon="inline-start" />
          </Link>
          <Button asChild className="h-10 rounded-full px-5">
            <Link to="/publish">发布求助</Link>
          </Button>
        </div>
      </div>
    </header>
  )
}

function BottomNav() {
  const links = [
    { to: "/", label: "首页", icon: Home },
    { to: "/publish", label: "发布", icon: Sparkles },
    { to: "/hall", label: "大厅", icon: HandHeart },
    { to: "/map", label: "地图", icon: MapPin },
    { to: "/profile", label: "我的", icon: UserRound },
  ]

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-[var(--color-hairline)] bg-white/95 px-2 py-2 backdrop-blur lg:hidden">
      <div className="mx-auto grid max-w-md grid-cols-5">
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn("flex flex-col items-center gap-1 rounded-full px-2 py-1 text-[11px] font-medium text-[var(--color-muted)]", isActive && "bg-[#fff1f2] text-[var(--color-primary)]")
            }
          >
            <Icon data-icon="inline-start" />
            {label}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}

function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  return (
    <button
      type="button"
      onClick={onClose}
      className="fixed right-4 top-20 z-50 flex w-[min(360px,calc(100vw-2rem))] items-center gap-3 rounded-2xl border border-[var(--color-hairline)] bg-white px-4 py-3 text-left text-sm shadow-[var(--shadow-card-hover)]"
    >
      <CheckCircle2 className="text-[#15803d]" data-icon="inline-start" />
      <span>{message}</span>
    </button>
  )
}

function PageShell({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("mx-auto max-w-7xl px-4 py-8 md:px-8 md:py-12", className)}>{children}</div>
}

function HomePage({ events, draft, setDraft }: { events: Event[]; draft: string; setDraft: (value: string) => void }) {
  const navigate = useNavigate()
  const [heroArea, setHeroArea] = useState("library")
  const stats = [
    ["今日互助", "128", "次"],
    ["平均响应", "9", "分钟"],
    ["节约物资", "46", "件"],
    ["点亮区域", "8", "处"],
  ]

  return (
    <PageShell className="pt-6 md:pt-10">
      <section className="grid items-center gap-8 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="flex flex-col gap-7">
          <div className="flex flex-col gap-5">
            <h1 className="max-w-3xl text-4xl font-bold leading-tight text-[var(--color-ink)] md:text-6xl">
              让校园里的每一次需要，都被及时看见
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-[var(--color-body)]">
              用一句话发布求助，AI 自动识别类型、生成互助卡片、提示隐私风险，并把合适的同学和资源连接起来。
            </p>
          </div>
          <div className="rounded-full border border-[var(--color-hairline)] bg-white p-2 shadow-[0_14px_40px_rgba(0,0,0,0.07)]">
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="flex flex-1 items-center gap-3 px-4">
                <Search className="text-[var(--color-muted)]" data-icon="inline-start" />
                <input
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  className="h-12 flex-1 bg-transparent text-sm outline-none md:text-base"
                  placeholder="例如：我在图书馆想借一把伞"
                />
              </div>
              <Button className="h-12 rounded-full px-6" onClick={() => navigate("/publish")}>
                <Sparkles data-icon="inline-start" />
                AI 发布
              </Button>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 text-sm">
            {["借一把伞", "求复习资料", "送闲置台灯"].map((text) => (
              <button key={text} type="button" onClick={() => setDraft(text)} className="rounded-full border border-[var(--color-hairline)] px-4 py-2 text-[var(--color-muted)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]">
                {text}
              </button>
            ))}
          </div>
        </div>
        <div className="relative min-h-[430px] overflow-hidden rounded-[32px] border border-[var(--color-hairline-soft)] bg-[var(--color-surface-soft)] p-5">
          <CampusAmap
            areas={areas}
            selectedAreaId={heroArea}
            activeTypeLabel={null}
            onSelectArea={setHeroArea}
            compact
            showControls={false}
            className="absolute inset-0 h-full rounded-[32px] border-0"
          />
          <div className="pointer-events-none absolute inset-0 bg-white/35" />
          <div className="absolute left-8 top-8 rounded-3xl bg-white/95 p-5 shadow-[var(--shadow-card-hover)] backdrop-blur">
            <Badge tone="bg-[#fee2e2] text-[#b91c1c]">高优先级</Badge>
            <h3 className="mt-3 text-xl font-semibold">图书馆借用雨伞</h3>
            <p className="mt-2 max-w-[240px] text-sm leading-6 text-[var(--color-muted)]">AI 已匹配附近 2 位可帮助同学</p>
          </div>
          <div className="absolute right-5 top-28 rounded-3xl bg-white/95 p-5 shadow-[var(--shadow-card-hover)] backdrop-blur">
            <MapPin className="mb-3 text-[var(--color-primary)]" data-icon="inline-start" />
            <p className="text-sm text-[var(--color-muted)]">校园温度指数</p>
            <p className="mt-1 text-4xl font-bold">92</p>
          </div>
          <div className="absolute bottom-7 left-6 right-6 rounded-3xl bg-white/95 p-5 shadow-[var(--shadow-card-hover)] backdrop-blur">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[var(--color-muted)]">实时互助动态</p>
                <h3 className="mt-1 text-lg font-semibold">计算机网络复习资料交换</h3>
              </div>
              <Link to="/help/e2" className="grid size-10 place-items-center rounded-full bg-[var(--color-surface-soft)]">
                <ChevronRight data-icon="inline-start" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map(([label, value, unit]) => (
          <MetricCard key={label} label={label} value={value} unit={unit} />
        ))}
      </section>

      <section className="mt-14 grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
        <div>
          <SectionHeading title="热门互助分类" description="按场景快速进入大厅筛选，找到你能帮或需要的内容。" />
          <div className="mt-6 grid gap-3">
            {(Object.keys(eventTypeMeta).filter((type) => type !== "safety") as EventType[]).map((type) => {
              const meta = eventTypeMeta[type]
              const Icon = meta.icon
              return (
                <Link key={type} to={`/category/${type}`} className="flex items-center justify-between rounded-2xl border border-[var(--color-hairline)] bg-white p-4 transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-card-hover)]">
                  <div className="flex items-center gap-3">
                    <span className={cn("grid size-11 place-items-center rounded-full", meta.tone)}>
                      <Icon data-icon="inline-start" />
                    </span>
                    <div>
                      <h3 className="font-semibold">{meta.label}</h3>
                      <p className="text-sm text-[var(--color-muted)]">浏览最新 {meta.short} 事项</p>
                    </div>
                  </div>
                  <ChevronRight className="text-[var(--color-muted-soft)]" data-icon="inline-start" />
                </Link>
              )
            })}
          </div>
        </div>
        <div>
          <SectionHeading title="近期互助动态" description="校园里的需求正在被看见，也正在被响应。" />
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {events.slice(0, 4).map((event) => (
              <EventCard key={event.id} event={event} compact />
            ))}
          </div>
        </div>
      </section>

      <section className="mt-14 grid gap-6 rounded-[28px] border border-[var(--color-hairline)] bg-[var(--color-surface-soft)] p-6 md:grid-cols-[1fr_1.3fr] md:p-8">
        <div className="flex flex-col justify-between gap-6">
          <SectionHeading title="温度地图预览" description="看见不同区域的互助活跃度、风险提醒和最近事件。" />
          <Button asChild className="w-fit rounded-full px-5">
            <Link to="/map">查看温度地图</Link>
          </Button>
        </div>
        <MiniMap />
      </section>
    </PageShell>
  )
}

function PublishPage({ draft, setDraft, onPublish }: { draft: string; setDraft: (value: string) => void; onPublish: (event: Event) => void }) {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [analysisState, setAnalysisState] = useState<"idle" | "loading" | "success" | "local" | "error">("idle")
  const [analysisError, setAnalysisError] = useState("")
  const [generated, setGenerated] = useState<{ key: string; result: LLMPublishResult } | null>(null)
  const [published, setPublished] = useState(false)
  const areaHint = searchParams.get("area")
  const requestKey = `${draft}\n${areaHint ?? ""}`
  const fallbackResult = useMemo(() => analyzeDraft(draft, areaHint), [areaHint, draft])
  const result = generated?.key === requestKey ? generated.result : fallbackResult
  const privacyText = redactPrivacy(draft)
  const hasRealAi = hasGeminiApiKey()

  const generateAnalysis = async () => {
    setAnalysisError("")
    setAnalysisState("loading")

    if (!hasRealAi) {
      setGenerated({ key: requestKey, result: fallbackResult })
      setAnalysisState("local")
      return
    }

    try {
      const aiResult = await analyzePublishDraftWithGemini({ rawText: draft, hintAreaId: areaHint ?? undefined }, areas)
      setGenerated({ key: requestKey, result: aiResult })
      setAnalysisState("success")
    } catch (error) {
      setGenerated({ key: requestKey, result: fallbackResult })
      setAnalysisError(error instanceof Error ? error.message : "Gemini 调用失败，已回退到本地规则。")
      setAnalysisState("error")
    }
  }

  const submit = () => {
    const newEvent: Event = {
      id: `e${Date.now()}`,
      type: result.type,
      title: result.title,
      description: result.description,
      tags: result.tags,
      areaId: result.areaId ?? "library",
      location: result.areaName,
      timeRequirement: result.timeRequirement,
      urgency: result.urgency,
      publisherId: "u1",
      status: "waiting",
      responders: [],
      views: 0,
      publishedAt: "刚刚",
      updatedAt: "刚刚",
      riskFlag: result.privacyRisks.length > 0 || result.type === "safety",
    }
    onPublish(newEvent)
    setPublished(true)
    navigate("/publish/success")
  }

  return (
    <PageShell>
      <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
        <section className="flex flex-col gap-6">
          <SectionHeading title="告诉暖校 AI，你现在需要什么？" description="不需要填写复杂表单。输入一句话，系统会生成可发布的互助卡片。" />
          <div className="rounded-[28px] border border-[var(--color-hairline)] bg-white p-5 shadow-[0_12px_34px_rgba(0,0,0,0.05)]">
            <textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              className="h-44 w-full resize-none rounded-3xl border border-[var(--color-hairline-soft)] bg-[var(--color-surface-soft)] p-5 text-base leading-7 outline-none focus:border-[var(--color-primary)]"
              placeholder="例如：我在图书馆想借一把伞"
            />
            <div className="mt-4 flex flex-wrap gap-2">
              {["我在图书馆想借一把伞", "求一份计算机网络复习资料", "我有闲置台灯想送给需要的人", "需要两个人帮忙搬行李"].map((text) => (
                <button key={text} type="button" onClick={() => setDraft(text)} className="rounded-full border border-[var(--color-hairline)] px-3 py-2 text-sm text-[var(--color-muted)] hover:text-[var(--color-primary)]">
                  {text}
                </button>
              ))}
            </div>
            <Button className="mt-5 h-12 w-full rounded-full" onClick={generateAnalysis} disabled={analysisState === "loading"}>
              <Sparkles data-icon="inline-start" />
              {analysisState === "loading" ? "AI 正在生成..." : "AI 生成互助卡片"}
            </Button>
            <p className="mt-3 text-center text-xs text-[var(--color-muted)]">
              {hasRealAi ? "已检测到 Gemini API Key，将优先调用真实模型。" : "未配置 Gemini API Key，当前使用本地规则生成。"}
            </p>
          </div>
          <div className="rounded-3xl border border-[var(--color-hairline)] bg-[var(--color-surface-soft)] p-5">
            <h3 className="flex items-center gap-2 font-semibold">
              <ShieldCheck className="text-[#15803d]" data-icon="inline-start" />
              隐私预处理
            </h3>
            <p className="mt-3 text-sm leading-6 text-[var(--color-muted)]">{privacyText || "输入内容后将自动检测手机号、微信、QQ、学号、宿舍门牌和银行卡号。"}</p>
          </div>
        </section>
        <section className="flex flex-col gap-5">
          <div className="rounded-[28px] border border-[var(--color-hairline)] bg-white p-5">
            <h2 className="text-lg font-semibold">AI 分析进度</h2>
            <div className="mt-4 flex flex-col gap-3">
              {["正在理解你的需求", "正在判断互助类型", "正在生成发布标题", "正在检查隐私风险", "正在匹配附近可帮助的同学"].map((step, index) => (
                <div key={step} className="flex items-center gap-3 rounded-2xl bg-[var(--color-surface-soft)] p-3 text-sm">
                  {analysisState !== "idle" || index < 2 ? <CheckCircle2 className="text-[#15803d]" data-icon="inline-start" /> : <CircleGauge className="text-[var(--color-muted-soft)]" data-icon="inline-start" />}
                  {step}
                </div>
              ))}
            </div>
            <div className="mt-4 rounded-2xl bg-[var(--color-surface-soft)] p-3 text-sm leading-6 text-[var(--color-muted)]">
              {analysisState === "success" ? "真实 Gemini 模型已生成本次互助卡片。" : null}
              {analysisState === "local" ? "未配置有效 Gemini Key，已使用本地规则生成。" : null}
              {analysisState === "error" ? `Gemini 调用失败，已回退到本地规则。${analysisError}` : null}
              {analysisState === "loading" ? "正在请求 Gemini，请稍候。" : null}
              {analysisState === "idle" ? "点击生成后，系统会优先使用 Gemini；不可用时自动回退本地规则。" : null}
            </div>
          </div>
          <GeneratedCard result={result} />
          <div className="grid gap-3 md:grid-cols-2">
            {helperCards.map((helper) => (
              <div key={helper.name} className="rounded-3xl border border-[var(--color-hairline)] bg-white p-4">
                <div className="flex items-center justify-between">
                  <Avatar label={helper.name.slice(0, 1)} />
                  <Badge tone="bg-[#f0fdf4] text-[#15803d]">{helper.distance}</Badge>
                </div>
                <h3 className="mt-3 font-semibold">{helper.name}</h3>
                <p className="mt-1 text-sm text-[var(--color-muted)]">{helper.resource}</p>
                <p className="mt-3 text-sm leading-6">{helper.reason}</p>
                <div className="mt-4 flex justify-between text-xs text-[var(--color-muted)]">
                  <span>信用 {helper.credit}</span>
                  <span>暖心 {helper.warmth}</span>
                  <span>{helper.speed}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="rounded-3xl border border-[#fed7aa] bg-[#fff7ed] p-5">
            <h3 className="flex items-center gap-2 font-semibold text-[#9a3412]">
              <AlertTriangle data-icon="inline-start" />
              隐私与安全提醒
            </h3>
            <ul className="mt-3 flex flex-col gap-2 text-sm leading-6 text-[#7c2d12]">
              {result.safetyTips.map((tip) => (
                <li key={tip}>• {tip}</li>
              ))}
            </ul>
          </div>
          <Button className="h-12 rounded-full" onClick={submit} disabled={published}>
            <Send data-icon="inline-start" />
            确认发布
          </Button>
        </section>
      </div>
    </PageShell>
  )
}

function analyzeDraft(raw: string, areaHint: string | null) {
  const text = raw || "我在图书馆想借一把伞"
  const area = areaHint ? getArea(areaHint) : areas.find((item) => text.includes(item.name.slice(0, 2))) ?? areas[0]
  const privacyRisks = detectPrivacy(text)
  let type: EventType = "errand"
  if (/资料|复习|课程|笔记|真题|网络/.test(text)) type = "study"
  if (/伞|充电宝|雨|借|物资/.test(text)) type = "supplies"
  if (/闲置|送|交换|台灯|赠/.test(text)) type = "idle"
  if (/公益|志愿|招募|活动/.test(text)) type = "volunteer"
  if (/夜|受伤|危险|结伴|安全/.test(text)) type = "safety"

  const urgency: Urgency = /立即|现在|下雨|受伤|夜|危险/.test(text) ? "high" : /今天|今晚|期末|考试|短时间/.test(text) ? "medium" : "low"
  const titleByType: Record<EventType, string> = {
    idle: "闲置物品温暖流转",
    study: "学习资料共享求助",
    supplies: text.includes("伞") ? "借用雨伞" : "生活物资临时借用",
    errand: text.includes("搬") ? "帮忙搬运行李" : "校园临时协助",
    volunteer: "公益活动志愿招募",
    safety: "安全结伴互助提醒",
  }

  return {
    type,
    title: titleByType[type],
    description: `我希望在${area.name}附近获得帮助：${redactPrivacy(text)}。若有同学方便响应，可通过站内消息联系，并在校园公共区域完成确认。`,
    urgency,
    areaId: area.id,
    areaName: area.name,
    tags: [eventTypeMeta[type].label, area.name, urgencyMeta[urgency].label === "高" ? "尽快响应" : "校园互助"],
    timeRequirement: urgency === "high" ? "尽快" : "今天内",
    suggestedHelpers: type === "study" ? 5 : 2,
    privacyRisks,
    safetyTips: [
      privacyRisks.length > 0 ? "检测到可能的隐私信息，发布前已建议隐藏。" : "未检测到明显隐私信息，仍建议通过站内消息沟通。",
      "线下交接请选择图书馆门厅、食堂门口等公共区域。",
      urgency === "high" ? "高紧急事项建议同步通知熟悉同学或学校相关部门。" : "涉及借用物品时建议明确归还时间和物品状态。",
    ],
    reasoning: "本地规则根据关键词、区域提示和隐私检测生成发布草稿。",
  }
}

function GeneratedCard({ result }: { result: LLMPublishResult }) {
  const TypeIcon = eventTypeMeta[result.type].icon
  return (
    <div className="rounded-[28px] border border-[var(--color-hairline)] bg-white p-5 shadow-[0_12px_34px_rgba(0,0,0,0.05)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap gap-2">
            <Badge tone={eventTypeMeta[result.type].tone}>{eventTypeMeta[result.type].label}</Badge>
            <Badge tone={urgencyMeta[result.urgency].className}>紧急程度 {urgencyMeta[result.urgency].label}</Badge>
          </div>
          <h2 className="mt-4 text-2xl font-bold">{result.title}</h2>
        </div>
        <span className={cn("grid size-12 shrink-0 place-items-center rounded-full", eventTypeMeta[result.type].tone)}>
          <TypeIcon data-icon="inline-start" />
        </span>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <InfoBlock label="推荐地点" value={result.areaName} />
        <InfoBlock label="时间要求" value={result.timeRequirement ?? "待确认"} />
      </div>
      <p className="mt-5 rounded-3xl bg-[var(--color-surface-soft)] p-4 text-sm leading-7 text-[var(--color-body)]">{result.description}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {result.tags.map((tag) => (
          <Badge key={tag}>{tag}</Badge>
        ))}
      </div>
      <p className="mt-4 text-sm text-[var(--color-muted)]">推荐匹配 {result.suggestedHelpers} 位可能帮助者，原因：同区域活跃、信用分较高、历史响应速度较快。</p>
    </div>
  )
}

function HallPage({ events, onRespond }: { events: Event[]; onRespond: (id: string) => void }) {
  const [params, setParams] = useSearchParams()
  const [query, setQuery] = useState("")
  const [sort, setSort] = useState("智能推荐")
  const selectedType = (params.get("type") ?? "all") as EventType | "all"
  const filtered = useMemo(() => {
    const keyword = query.trim()
    return events.filter((event) => {
      const matchType = selectedType === "all" || event.type === selectedType
      const searchable = [event.title, event.description, event.location, event.tags.join(" ")].join(" ")
      return matchType && (!keyword || searchable.includes(keyword))
    })
  }, [events, query, selectedType])

  return (
    <PageShell>
      <div className="flex flex-col gap-6">
        <SectionHeading title="互助大厅" description="浏览正在发生的校园互助、共享物品、学习资料和公益活动。" />
        <div className="sticky top-16 z-20 rounded-[28px] border border-[var(--color-hairline)] bg-white/95 p-3 backdrop-blur">
          <div className="flex flex-col gap-3 lg:flex-row">
            <div className="flex min-h-12 flex-1 items-center gap-3 rounded-full bg-[var(--color-surface-soft)] px-4">
              <Search className="text-[var(--color-muted)]" data-icon="inline-start" />
              <input value={query} onChange={(event) => setQuery(event.target.value)} className="flex-1 bg-transparent outline-none" placeholder="搜索物品、课程、地点、标签" />
            </div>
            <select value={sort} onChange={(event) => setSort(event.target.value)} className="h-12 rounded-full border border-[var(--color-hairline)] bg-white px-4 text-sm outline-none">
              {["智能推荐", "距离最近", "最新发布", "最急需帮助", "信用优先", "热门互动"].map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </div>
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
            <FilterPill active={selectedType === "all"} onClick={() => setParams({})}>全部</FilterPill>
            {(Object.keys(eventTypeMeta) as EventType[]).map((type) => (
              <FilterPill key={type} active={selectedType === type} onClick={() => setParams({ type })}>
                {eventTypeMeta[type].label}
              </FilterPill>
            ))}
          </div>
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="grid gap-4 md:grid-cols-2">
              {filtered.length > 0 ? filtered.map((event) => <EventCard key={event.id} event={event} onRespond={onRespond} />) : <EmptyState title="暂时没有匹配事项" action="去发布一个需求" to="/publish" />}
            </div>
          </div>
          <aside className="flex flex-col gap-4">
            <Panel title="推荐互助">
              {events.slice(0, 3).map((event) => (
                <Link key={event.id} to={`/help/${event.id}`} className="flex items-center justify-between rounded-2xl p-3 hover:bg-[var(--color-surface-soft)]">
                  <span className="text-sm font-medium">{event.title}</span>
                  <ChevronRight className="text-[var(--color-muted-soft)]" data-icon="inline-start" />
                </Link>
              ))}
            </Panel>
            <Panel title="大厅状态">
              <div className="grid grid-cols-2 gap-3">
                <MetricCard label="活跃事项" value={String(events.length)} unit="个" compact />
                <MetricCard label="待响应" value={String(events.filter((event) => event.status === "waiting").length)} unit="个" compact />
              </div>
            </Panel>
          </aside>
        </div>
      </div>
      <Button asChild className="fixed bottom-24 right-5 z-30 h-12 rounded-full px-5 shadow-[var(--shadow-card-hover)] md:bottom-8">
        <Link to="/publish">
          <Sparkles data-icon="inline-start" />
          发布求助
        </Link>
      </Button>
    </PageShell>
  )
}

function DetailPage({ events, onRespond }: { events: Event[]; onRespond: (id: string) => void }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const event = events.find((item) => item.id === id) ?? events[0]
  const publisher = getUser(event.publisherId)
  const area = getArea(event.areaId)
  const TypeIcon = eventTypeMeta[event.type].icon

  return (
    <PageShell className="max-w-4xl">
      <button type="button" onClick={() => navigate(-1)} className="mb-5 flex items-center gap-2 rounded-full text-sm font-medium text-[var(--color-muted)] hover:text-[var(--color-primary)]">
        <ArrowLeft data-icon="inline-start" />
        返回
      </button>
      <article className="rounded-[32px] border border-[var(--color-hairline)] bg-white p-6 md:p-8">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={eventTypeMeta[event.type].tone}>
            <TypeIcon data-icon="inline-start" />
            {eventTypeMeta[event.type].label}
          </Badge>
          <Badge tone={urgencyMeta[event.urgency].className}>紧急程度 {urgencyMeta[event.urgency].label}</Badge>
          <Badge tone={statusMeta[event.status].className}>{statusMeta[event.status].label}</Badge>
        </div>
        <h1 className="mt-5 text-3xl font-bold md:text-5xl">{event.title}</h1>
        <div className="mt-5 flex flex-wrap gap-4 text-sm text-[var(--color-muted)]">
          <span className="flex items-center gap-1">
            <MapPin data-icon="inline-start" />
            {event.location}
          </span>
          <span className="flex items-center gap-1">
            <Clock3 data-icon="inline-start" />
            {event.publishedAt}发布
          </span>
          <span>{event.views} 次浏览</span>
        </div>
        <p className="mt-6 text-lg leading-9 text-[var(--color-body)]">{event.description}</p>
        <div className="mt-5 flex flex-wrap gap-2">
          {event.tags.map((tag) => (
            <Badge key={tag}>{tag}</Badge>
          ))}
        </div>
      </article>
      <div className="mt-6 grid gap-5 md:grid-cols-[1fr_0.8fr]">
        <Panel title="发布者信用信息">
          <div className="flex items-center gap-4">
            <Avatar label={publisher.avatar} />
            <div>
              <h3 className="font-semibold">{publisher.nickname}</h3>
              <p className="text-sm text-[var(--color-muted)]">{publisher.school} · {publisher.college}</p>
            </div>
          </div>
          <div className="mt-5 grid grid-cols-3 gap-3">
            <MetricCard label="信用分" value={String(publisher.credit)} unit="" compact />
            <MetricCard label="暖心值" value={String(publisher.warmth)} unit="" compact />
            <MetricCard label="完成互助" value={String(publisher.helpsGiven)} unit="次" compact />
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {publisher.badges.map((badge) => (
              <Badge key={badge} tone="bg-[#fff7ed] text-[#c2410c]">{badge}</Badge>
            ))}
          </div>
        </Panel>
        <Panel title="地点与交接建议">
          <InfoBlock label="校园区域" value={area.name} />
          <InfoBlock label="推荐交接点" value={`${area.name}公共门厅`} />
          <InfoBlock label="平均响应" value={`${area.avgResponseMin} 分钟`} />
          <Button asChild className="mt-4 h-10 rounded-full">
            <Link to={`/map?area=${area.id}`}>在地图中查看</Link>
          </Button>
        </Panel>
      </div>
      <div className="mt-6 rounded-3xl border border-[#fed7aa] bg-[#fff7ed] p-5">
        <h3 className="flex items-center gap-2 font-semibold text-[#9a3412]">
          <ShieldCheck data-icon="inline-start" />
          安全交接提醒
        </h3>
        <p className="mt-2 text-sm leading-6 text-[#7c2d12]">线下交接请选择公共区域，不公开手机号和详细宿舍号。夜间或高紧急事项建议结伴并保留站内记录。</p>
      </div>
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--color-hairline)] bg-white p-3 md:static md:mt-6 md:rounded-full md:border">
        <div className="mx-auto flex max-w-4xl items-center gap-3">
          <Button variant="outline" className="h-12 rounded-full px-4">收藏</Button>
          <Button variant="outline" className="h-12 rounded-full px-4">举报</Button>
          <Button className="h-12 flex-1 rounded-full" onClick={() => onRespond(event.id)}>
            <HandHeart data-icon="inline-start" />
            一键帮助
          </Button>
        </div>
      </div>
    </PageShell>
  )
}

function MapPage({ events }: { events: Event[] }) {
  const [params] = useSearchParams()
  const [selected, setSelected] = useState(params.get("area") ?? areas[0].id)
  const [activeType, setActiveType] = useState<EventType | "all">("all")
  const activeTypeLabel = activeType === "all" ? null : eventTypeMeta[activeType].label
  const visibleAreas = useMemo(
    () => (activeTypeLabel ? areas.filter((item) => item.hotTypes.includes(activeTypeLabel)) : areas),
    [activeTypeLabel],
  )

  const selectedAreaId = visibleAreas.some((item) => item.id === selected) ? selected : visibleAreas[0]?.id ?? areas[0].id
  const area = getArea(selectedAreaId)
  const areaEvents = events.filter((event) => event.areaId === area.id)

  return (
    <PageShell>
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <section className="flex flex-col gap-5">
          <SectionHeading title="校园温度地图" description="用热力点位看见校园互助正在发生的位置、类型和响应速度。" />
          <div className="rounded-[32px] border border-[var(--color-hairline)] bg-[var(--color-surface-soft)] p-4 md:p-6">
            <div className="mb-4 flex flex-wrap gap-2">
              <FilterPill active={activeType === "all"} onClick={() => setActiveType("all")}>全部</FilterPill>
              {(Object.keys(eventTypeMeta) as EventType[]).map((type) => (
                <FilterPill key={type} active={activeType === type} onClick={() => setActiveType(type)}>{eventTypeMeta[type].label}</FilterPill>
              ))}
            </div>
            <CampusAmap areas={visibleAreas} selectedAreaId={selectedAreaId} activeTypeLabel={activeTypeLabel} onSelectArea={setSelected} />
            <p className="mt-3 text-xs text-[var(--color-muted)]">底图由高德地图 JS API 2.0 提供，点位为南昌航空大学前湖校区演示坐标，可在配置中替换为精确建筑坐标。</p>
          </div>
        </section>
        <aside className="flex flex-col gap-4">
          <Panel title={`${area.name}区域详情`}>
            <div className="grid grid-cols-2 gap-3">
              <MetricCard label="今日互助" value={String(area.todayCount)} unit="次" compact />
              <MetricCard label="活跃事项" value={String(area.activeCount)} unit="个" compact />
              <MetricCard label="平均响应" value={String(area.avgResponseMin)} unit="分钟" compact />
              <MetricCard label="温度指数" value={String(area.temperatureIndex)} unit="" compact />
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {area.hotTypes.map((type) => (
                <Badge key={type} tone="bg-[#fff7ed] text-[#c2410c]">{type}</Badge>
              ))}
            </div>
            <div className="mt-5 flex gap-2">
              <Button asChild className="h-10 flex-1 rounded-full">
                <Link to={`/map/area/${area.id}`}>查看该区域</Link>
              </Button>
              <Button asChild variant="outline" className="h-10 flex-1 rounded-full">
                <Link to={`/publish?area=${area.id}`}>在这里发布</Link>
              </Button>
            </div>
          </Panel>
          <Panel title="最近事件">
            {areaEvents.length > 0 ? areaEvents.map((event) => <EventRow key={event.id} event={event} />) : area.recentEvents.map((title) => <p key={title} className="rounded-2xl bg-[var(--color-surface-soft)] p-3 text-sm">{title}</p>)}
          </Panel>
          <Panel title="区域排行榜">
            {areas.slice().sort((a, b) => b.temperatureIndex - a.temperatureIndex).slice(0, 4).map((item, index) => (
              <div key={item.id} className="flex items-center justify-between rounded-2xl p-3 hover:bg-[var(--color-surface-soft)]">
                <span className="text-sm font-medium">{index + 1}. {item.name}</span>
                <span className="font-semibold text-[var(--color-primary)]">{item.temperatureIndex}</span>
              </div>
            ))}
          </Panel>
        </aside>
      </div>
    </PageShell>
  )
}

function ProfilePage({ events }: { events: Event[] }) {
  const me = users[0]
  const myEvents = events.filter((event) => event.publisherId === me.id || event.responders.includes(me.id))
  const badges = ["靠谱同学", "急速响应者", "绿色循环官", "图书馆之光"]

  return (
    <PageShell>
      <section className="rounded-[32px] border border-[var(--color-hairline)] bg-[linear-gradient(135deg,#fff,#fff1f2)] p-6 md:p-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <Avatar label={me.avatar} large />
            <div>
              <h1 className="text-3xl font-bold">{me.nickname}</h1>
              <p className="mt-1 text-[var(--color-muted)]">{me.school} · {me.college} · 暖心先锋候选人</p>
            </div>
          </div>
          <Button asChild className="h-11 rounded-full px-5">
            <Link to="/profile/report">查看温度报告</Link>
          </Button>
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard label="暖心值" value={String(me.warmth)} unit="" />
          <MetricCard label="信用分" value={String(me.credit)} unit="" />
          <MetricCard label="全校排名" value="86" unit="名" />
          <MetricCard label="本周互助" value={String(myEvents.length)} unit="次" />
        </div>
      </section>
      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_0.85fr]">
        <Panel title="徽章预览">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {badges.map((badge, index) => (
              <div key={badge} className={cn("rounded-3xl border border-[var(--color-hairline)] p-4 text-center", index < 2 ? "bg-[#fff7ed]" : "bg-[var(--color-surface-soft)] opacity-70")}>
                <Trophy className="mx-auto text-[var(--color-warmth-glow)]" data-icon="inline-start" />
                <p className="mt-3 text-sm font-semibold">{badge}</p>
                <p className="mt-1 text-xs text-[var(--color-muted)]">{index < 2 ? "已获得" : "进度 60%"}</p>
              </div>
            ))}
          </div>
        </Panel>
        <Panel title="快捷入口">
          <div className="grid gap-3">
            {[
              ["/my/help", "我的互助", "查看发布、响应、进行中的事项"],
              ["/resources", "我的资料", "管理共享资料和收藏"],
              ["/messages", "消息中心", "处理帮助意向和安全提醒"],
            ].map(([to, title, desc]) => (
              <Link key={to} to={to} className="flex items-center justify-between rounded-2xl border border-[var(--color-hairline-soft)] p-4 hover:bg-[var(--color-surface-soft)]">
                <span>
                  <strong>{title}</strong>
                  <p className="mt-1 text-sm text-[var(--color-muted)]">{desc}</p>
                </span>
                <ChevronRight data-icon="inline-start" />
              </Link>
            ))}
          </div>
        </Panel>
      </div>
      <div className="mt-8">
        <SectionHeading title="互助记录" description="最近发布和参与的校园互助事项。" />
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {myEvents.slice(0, 3).map((event) => (
            <EventCard key={event.id} event={event} compact />
          ))}
        </div>
      </div>
    </PageShell>
  )
}

function AdminPage({ events }: { events: Event[] }) {
  const typeData = (Object.keys(eventTypeMeta) as EventType[]).map((type) => ({
    type,
    count: events.filter((event) => event.type === type).length,
  }))

  return (
    <AdminShell title="管理端总览 Dashboard">
      <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
        <MetricCard label="今日新增求助" value="32" unit="个" />
        <MetricCard label="今日完成互助" value="18" unit="次" />
        <MetricCard label="平均响应" value="9" unit="分钟" />
        <MetricCard label="活跃用户" value="486" unit="人" />
        <MetricCard label="风险提醒" value={String(risks.length)} unit="条" />
        <MetricCard label="满意度" value="96" unit="%" />
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Panel title="互助类型分布">
          <div className="flex flex-col gap-3">
            {typeData.map(({ type, count }) => (
              <div key={type}>
                <div className="mb-1 flex justify-between text-sm">
                  <span>{eventTypeMeta[type].label}</span>
                  <span>{count}</span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-[var(--color-surface-soft)]">
                  <div className="h-full rounded-full bg-[var(--color-primary)]" style={{ width: `${Math.max(count * 22, 8)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </Panel>
        <Panel title="区域热力排行">
          {areas.slice().sort((a, b) => b.todayCount - a.todayCount).map((area) => (
            <div key={area.id} className="flex items-center justify-between rounded-2xl p-3 hover:bg-[var(--color-surface-soft)]">
              <span>{area.name}</span>
              <strong>{area.todayCount} 次</strong>
            </div>
          ))}
        </Panel>
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <Panel title="实时风险提醒">
          {risks.map((risk) => (
            <RiskRow key={risk.id} risk={risk} event={events.find((event) => event.id === risk.relatedEventId)} />
          ))}
          <Button asChild variant="outline" className="mt-4 h-10 rounded-full">
            <Link to="/admin/risk">进入风险审核</Link>
          </Button>
        </Panel>
        <Panel title="AI 治理建议">
          <div className="rounded-3xl bg-[#fff7ed] p-5">
            <h3 className="flex items-center gap-2 font-semibold text-[#9a3412]">
              <Sparkles data-icon="inline-start" />
              本周建议
            </h3>
            <p className="mt-3 leading-7 text-[#7c2d12]">图书馆与宿舍区的雨具、复习资料和搬运需求集中，建议在两处设置临时共享伞架与毕业季闲置流转点，并由志愿组织定时维护。</p>
          </div>
        </Panel>
      </div>
    </AdminShell>
  )
}

function RiskPage({ events }: { events: Event[] }) {
  const [selected, setSelected] = useState(risks[0].id)
  const risk = risks.find((item) => item.id === selected) ?? risks[0]
  const event = events.find((item) => item.id === risk.relatedEventId)

  return (
    <AdminShell title="风险审核">
      <div className="grid gap-6 lg:grid-cols-[1fr_420px]">
        <Panel title="风险列表">
          {risks.map((item) => (
            <button key={item.id} type="button" onClick={() => setSelected(item.id)} className={cn("w-full rounded-2xl p-4 text-left hover:bg-[var(--color-surface-soft)]", selected === item.id && "bg-[#fff1f2]")}>
              <div className="flex items-center justify-between">
                <strong>{item.type}</strong>
                <Badge tone={item.severity === "high" ? "bg-[#fee2e2] text-[#b91c1c]" : "bg-[#fff7ed] text-[#c2410c]"}>{item.severity}</Badge>
              </div>
              <p className="mt-2 text-sm text-[var(--color-muted)]">{item.reason}</p>
            </button>
          ))}
        </Panel>
        <Panel title="风险详情">
          <Badge tone="bg-[#fee2e2] text-[#b91c1c]">{risk.type}</Badge>
          <h2 className="mt-4 text-xl font-bold">{event?.title ?? "关联事项"}</h2>
          <p className="mt-3 text-sm leading-6 text-[var(--color-muted)]">{event?.description}</p>
          <InfoBlock label="触发原因" value={risk.reason} />
          <InfoBlock label="处理建议" value={risk.suggestion} />
          <div className="mt-5 grid grid-cols-2 gap-3">
            <Button className="h-10 rounded-full">标记已处理</Button>
            <Button variant="outline" className="h-10 rounded-full">提醒用户修改</Button>
            <Button variant="outline" className="h-10 rounded-full">暂停展示</Button>
            <Button variant="outline" className="h-10 rounded-full">人工复核</Button>
          </div>
        </Panel>
      </div>
    </AdminShell>
  )
}

function CategoryPage({ events, onRespond }: { events: Event[]; onRespond: (id: string) => void }) {
  const { type = "study" } = useParams()
  const eventType = (Object.keys(eventTypeMeta).includes(type) ? type : "study") as EventType
  const meta = eventTypeMeta[eventType]
  return (
    <PageShell>
      <SectionHeading title={meta.label} description={`集中浏览${meta.label}相关的校园互助内容。`} />
      <div className="mt-5 flex flex-wrap gap-2">
        {["最新", "附近", "高信用", "待帮助"].map((item) => (
          <Badge key={item}>{item}</Badge>
        ))}
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {events.filter((event) => event.type === eventType).map((event) => (
          <EventCard key={event.id} event={event} onRespond={onRespond} />
        ))}
      </div>
    </PageShell>
  )
}

function AreaPage({ events, onRespond }: { events: Event[]; onRespond: (id: string) => void }) {
  const { id = "library" } = useParams()
  const area = getArea(id)
  const areaEvents = events.filter((event) => event.areaId === area.id)
  return (
    <PageShell>
      <SectionHeading title={`${area.name}互助`} description="查看该区域的温度指数、热门类型和可响应事项。" />
      <div className="mt-6 grid gap-4 md:grid-cols-4">
        <MetricCard label="今日互助" value={String(area.todayCount)} unit="次" />
        <MetricCard label="温度指数" value={String(area.temperatureIndex)} unit="" />
        <MetricCard label="平均响应" value={String(area.avgResponseMin)} unit="分钟" />
        <MetricCard label="活跃事项" value={String(areaEvents.length)} unit="个" />
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {areaEvents.map((event) => (
          <EventCard key={event.id} event={event} onRespond={onRespond} />
        ))}
      </div>
    </PageShell>
  )
}

function MyHelpPage({ events }: { events: Event[] }) {
  const [tab, setTab] = useState("我发布的")
  const visible = events.filter((event) => (tab === "我发布的" ? event.publisherId === "u1" : tab === "我帮助的" ? event.responders.includes("u1") : tab === "进行中" ? event.status === "ongoing" : event.status === "completed"))
  return (
    <PageShell>
      <SectionHeading title="我的互助" description="管理我发布、响应和进行中的互助事项。" />
      <div className="mt-6 flex gap-2 overflow-x-auto">
        {["我发布的", "我帮助的", "进行中", "已完成"].map((item) => (
          <FilterPill key={item} active={tab === item} onClick={() => setTab(item)}>{item}</FilterPill>
        ))}
      </div>
      <div className="mt-6 grid gap-4">
        {visible.map((event) => (
          <div key={event.id} className="rounded-3xl border border-[var(--color-hairline)] bg-white p-5">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <Badge tone={statusMeta[event.status].className}>{statusMeta[event.status].label}</Badge>
                <h3 className="mt-3 text-xl font-semibold">{event.title}</h3>
                <p className="mt-2 text-sm text-[var(--color-muted)]">{event.location} · {event.timeRequirement}</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="h-10 rounded-full">评价</Button>
                <Button className="h-10 rounded-full">确认完成</Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </PageShell>
  )
}

function MessagesPage() {
  const messages = [
    ["帮助意向", "陈学姐愿意借你一把折叠伞", "关联：图书馆借用雨伞", false],
    ["安全提醒", "夜间结伴事项建议保留公共集合点", "关联：晚间结伴回宿舍", false],
    ["系统通知", "你的闲置台灯已被 2 位同学收藏", "关联：闲置台灯赠送", true],
  ] as const
  return (
    <PageShell>
      <SectionHeading title="消息中心" description="集中处理帮助意向、系统通知、安全提醒和评价反馈。" />
      <div className="mt-6 grid gap-4">
        {messages.map(([type, title, desc, read]) => (
          <div key={title} className="flex items-center justify-between rounded-3xl border border-[var(--color-hairline)] bg-white p-5">
            <div className="flex items-center gap-4">
              <span className={cn("size-3 rounded-full", read ? "bg-[var(--color-hairline)]" : "bg-[var(--color-primary)]")} />
              <div>
                <Badge>{type}</Badge>
                <h3 className="mt-2 font-semibold">{title}</h3>
                <p className="mt-1 text-sm text-[var(--color-muted)]">{desc}</p>
              </div>
            </div>
            <Button variant="outline" className="h-10 rounded-full">查看</Button>
          </div>
        ))}
      </div>
    </PageShell>
  )
}

function ReportPage() {
  return (
    <PageShell>
      <section className="rounded-[36px] border border-[var(--color-hairline)] bg-[linear-gradient(135deg,#fff7ed,#fff1f2)] p-8 text-center">
        <Flame className="mx-auto text-[var(--color-primary)]" data-icon="inline-start" />
        <h1 className="mt-4 text-4xl font-bold">本周个人温度报告</h1>
        <p className="mx-auto mt-4 max-w-2xl leading-7 text-[var(--color-muted)]">你帮助了 7 位同学，分享 2 份资料，点亮图书馆、宿舍区和一食堂三个区域。</p>
        <div className="mt-8 grid gap-4 md:grid-cols-4">
          <MetricCard label="帮助人数" value="7" unit="人" />
          <MetricCard label="获得帮助" value="3" unit="次" />
          <MetricCard label="共享资料" value="2" unit="份" />
          <MetricCard label="新增暖心值" value="+86" unit="" />
        </div>
      </section>
    </PageShell>
  )
}

function ResourcesPage() {
  return <SimpleListPage title="学习资料库" description="共享课程笔记、真题、复习提纲和实验报告。" items={["计算机网络期末提纲", "高等数学错题整理", "数据库实验报告模板"]} />
}

function VolunteerPage() {
  return <SimpleListPage title="公益活动" description="浏览校园公益帮扶、志愿招募和活动报名。" items={["旧书循环公益活动", "毕业季闲置物资整理", "食堂环保餐盒回收"]} />
}

function SafetyPage() {
  return <SimpleListPage title="安全与隐私说明" description="了解平台如何保护隐私、提醒线下安全并处理风险投诉。" items={["默认隐藏手机号和详细宿舍号", "线下交接优先选择公共区域", "高风险内容进入管理员审核"]} />
}

function SimpleListPage({ title, description, items }: { title: string; description: string; items: string[] }) {
  return (
    <PageShell>
      <SectionHeading title={title} description={description} />
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {items.map((item) => (
          <div key={item} className="rounded-3xl border border-[var(--color-hairline)] bg-white p-5">
            <h3 className="text-lg font-semibold">{item}</h3>
            <p className="mt-3 text-sm leading-6 text-[var(--color-muted)]">支持查看详情、收藏、申请或报名，相关状态会进入个人中心记录。</p>
            <Button className="mt-5 h-10 rounded-full">查看详情</Button>
          </div>
        ))}
      </div>
    </PageShell>
  )
}

function PublishSuccessPage() {
  return (
    <PageShell className="max-w-3xl text-center">
      <div className="rounded-[36px] border border-[var(--color-hairline)] bg-white p-8">
        <CheckCircle2 className="mx-auto text-[#15803d]" data-icon="inline-start" />
        <h1 className="mt-4 text-4xl font-bold">发布成功</h1>
        <p className="mx-auto mt-3 w-full max-w-xl leading-7 text-[var(--color-muted)]">互助事项已同步到互助大厅和校园温度地图，系统正在推荐给附近可能帮助的同学。</p>
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <MetricCard label="推荐人数" value="2" unit="位" />
          <MetricCard label="预计响应" value="9" unit="分钟" />
          <MetricCard label="当前状态" value="待" unit="帮助" />
        </div>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Button asChild className="h-11 rounded-full px-5"><Link to="/my/help">查看我的求助</Link></Button>
          <Button asChild variant="outline" className="h-11 rounded-full px-5"><Link to="/hall">去互助大厅看看</Link></Button>
          <Button asChild variant="outline" className="h-11 rounded-full px-5"><Link to="/publish">继续发布</Link></Button>
        </div>
      </div>
    </PageShell>
  )
}

function AdminShell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <PageShell>
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="flex items-center gap-2 text-sm font-semibold text-[var(--color-primary)]">
            <LayoutDashboard data-icon="inline-start" />
            校园治理后台
          </p>
          <h1 className="mt-2 text-3xl font-bold">{title}</h1>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" className="h-10 rounded-full"><Link to="/admin">总览</Link></Button>
          <Button asChild variant="outline" className="h-10 rounded-full"><Link to="/admin/risk">风险审核</Link></Button>
        </div>
      </div>
      {children}
    </PageShell>
  )
}

function EventCard({ event, compact = false, onRespond }: { event: Event; compact?: boolean; onRespond?: (id: string) => void }) {
  const meta = eventTypeMeta[event.type]
  const TypeIcon = meta.icon
  const publisher = getUser(event.publisherId)
  return (
    <article className="rounded-[28px] border border-[var(--color-hairline)] bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-card-hover)]">
      <Link to={`/help/${event.id}`} className="block">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            <Badge tone={meta.tone}>
              <TypeIcon data-icon="inline-start" />
              {meta.label}
            </Badge>
            <Badge tone={urgencyMeta[event.urgency].className}>{urgencyMeta[event.urgency].label}</Badge>
          </div>
          <Badge tone={statusMeta[event.status].className}>{statusMeta[event.status].label}</Badge>
        </div>
        <h3 className="mt-4 text-lg font-semibold leading-7">{event.title}</h3>
        <p className={cn("mt-2 text-sm leading-6 text-[var(--color-muted)]", compact && "line-clamp-2")}>{event.description}</p>
        <div className="mt-4 flex flex-wrap gap-3 text-xs text-[var(--color-muted)]">
          <span className="flex items-center gap-1">
            <MapPin data-icon="inline-start" />
            {event.location}
          </span>
          <span>{event.publishedAt}</span>
          <span>{event.responders.length} 人响应</span>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {event.tags.slice(0, 3).map((tag) => (
            <Badge key={tag}>{tag}</Badge>
          ))}
        </div>
        <div className="mt-4 flex items-center justify-between border-t border-[var(--color-hairline-soft)] pt-4">
          <div className="flex items-center gap-2">
            <Avatar label={publisher.avatar} small />
            <span className="text-sm font-medium">{publisher.nickname}</span>
          </div>
          <span className="text-xs text-[var(--color-muted)]">信用 {publisher.credit} · 暖心 {publisher.warmth}</span>
        </div>
      </Link>
      {onRespond ? (
        <Button className="mt-4 h-10 w-full rounded-full" onClick={() => onRespond(event.id)}>
          <HandHeart data-icon="inline-start" />
          一键帮助
        </Button>
      ) : null}
    </article>
  )
}

function EventRow({ event }: { event: Event }) {
  return (
    <Link to={`/help/${event.id}`} className="flex items-center justify-between rounded-2xl p-3 hover:bg-[var(--color-surface-soft)]">
      <span>
        <strong className="block text-sm">{event.title}</strong>
        <span className="text-xs text-[var(--color-muted)]">{event.location}</span>
      </span>
      <ChevronRight className="text-[var(--color-muted-soft)]" data-icon="inline-start" />
    </Link>
  )
}

function RiskRow({ risk, event }: { risk: RiskAlert; event?: Event }) {
  return (
    <div className="rounded-2xl border border-[var(--color-hairline-soft)] p-4">
      <div className="flex items-center justify-between">
        <strong>{risk.type}</strong>
        <Badge tone={risk.severity === "high" ? "bg-[#fee2e2] text-[#b91c1c]" : "bg-[#fff7ed] text-[#c2410c]"}>{risk.severity}</Badge>
      </div>
      <p className="mt-2 text-sm text-[var(--color-muted)]">{event?.title ?? risk.relatedEventId}</p>
      <p className="mt-2 text-sm leading-6">{risk.suggestion}</p>
    </div>
  )
}

function MetricCard({ label, value, unit, compact = false }: { label: string; value: string; unit: string; compact?: boolean }) {
  return (
    <div className={cn("rounded-3xl border border-[var(--color-hairline)] bg-white p-5", compact && "p-4")}>
      <p className="text-sm text-[var(--color-muted)]">{label}</p>
      <p className={cn("mt-2 font-bold text-[var(--color-ink)]", compact ? "text-2xl" : "text-4xl")}>
        {value}<span className="ml-1 text-sm font-medium text-[var(--color-muted)]">{unit}</span>
      </p>
    </div>
  )
}

function SectionHeading({ title, description }: { title: string; description: string }) {
  return (
    <div>
      <h1 className="text-3xl font-bold leading-tight md:text-4xl">{title}</h1>
      <p className="mt-3 max-w-2xl text-base leading-7 text-[var(--color-muted)]">{description}</p>
    </div>
  )
}

function Badge({ children, tone }: { children: React.ReactNode; tone?: string }) {
  return <span className={cn("inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold", tone ?? "bg-[var(--color-surface-soft)] text-[var(--color-muted)]")}>{children}</span>
}

function FilterPill({ children, active, onClick }: { children: React.ReactNode; active: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className={cn("shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition", active ? "border-[var(--color-primary)] bg-[#fff1f2] text-[var(--color-primary)]" : "border-[var(--color-hairline)] bg-white text-[var(--color-muted)] hover:text-[var(--color-ink)]")}>
      {children}
    </button>
  )
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-[28px] border border-[var(--color-hairline)] bg-white p-5">
      <h2 className="mb-4 text-lg font-semibold">{title}</h2>
      <div className="flex flex-col gap-3">{children}</div>
    </section>
  )
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="mt-3 rounded-2xl bg-[var(--color-surface-soft)] p-4">
      <p className="text-xs font-semibold text-[var(--color-muted)]">{label}</p>
      <p className="mt-1 text-sm font-medium leading-6">{value}</p>
    </div>
  )
}

function Avatar({ label, small = false, large = false }: { label: string; small?: boolean; large?: boolean }) {
  return <span className={cn("grid place-items-center rounded-full bg-[#fff1f2] font-bold text-[var(--color-primary)]", small ? "size-8 text-sm" : large ? "size-20 text-2xl" : "size-12")}>{label}</span>
}

function EmptyState({ title, action, to }: { title: string; action: string; to: string }) {
  return (
    <div className="col-span-full rounded-[28px] border border-dashed border-[var(--color-hairline)] bg-white p-8 text-center">
      <MessageCircle className="mx-auto text-[var(--color-muted)]" data-icon="inline-start" />
      <h3 className="mt-4 text-xl font-semibold">{title}</h3>
      <Button asChild className="mt-5 h-10 rounded-full"><Link to={to}>{action}</Link></Button>
    </div>
  )
}

function MiniMap() {
  const [selectedArea, setSelectedArea] = useState("library")

  return (
    <CampusAmap
      areas={areas}
      selectedAreaId={selectedArea}
      activeTypeLabel={null}
      onSelectArea={setSelectedArea}
      compact
      showControls={false}
      className="h-72"
    />
  )
}

export default App
