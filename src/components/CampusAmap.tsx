import { useEffect, useRef, useState } from "react"
import type {} from "@amap/amap-jsapi-types"

import { CAMPUS_MAP_CENTER, CAMPUS_MAP_ZOOM, hasAmapKey, loadCampusAmap } from "@/lib/map/amap"
import type { Area } from "@/lib/types"
import { cn } from "@/lib/utils"

type CampusAmapProps = {
  areas: Area[]
  selectedAreaId: string
  activeTypeLabel: string | null
  onSelectArea: (id: string) => void
  className?: string
  compact?: boolean
  showControls?: boolean
}

type MarkerRecord = {
  areaId: string
  marker: AMap.Marker
}

type AMapWithControls = typeof AMap & {
  Scale: new () => AMap.Control
  ToolBar: new (options?: { position?: string }) => AMap.Control
}

function createMarkerContent(area: Area, selected: boolean, compact: boolean) {
  const el = document.createElement("button")
  el.type = "button"
  el.className = [
    "group relative rounded-2xl border bg-white text-left shadow-[0_14px_30px_rgba(15,23,42,0.18)] transition",
    compact ? "min-w-[88px] px-2.5 py-2" : "min-w-[112px] px-3 py-2",
    selected ? "border-[#ff385c] ring-4 ring-[#ff385c]/15" : "border-white/90 hover:border-[#ff385c]",
  ].join(" ")
  el.innerHTML = `
    <span class="absolute -right-1 -top-1 size-4 rounded-full bg-[#ff385c] shadow-[0_0_0_10px_rgba(255,56,92,0.14)]"></span>
    <strong class="block ${compact ? "text-xs" : "text-sm"} text-[#1f2937]">${area.name}</strong>
    <span class="mt-1 block text-xs text-[#6b7280]">${area.todayCount} 次互助</span>
    <span class="mt-1 block ${compact ? "text-base" : "text-lg"} font-bold text-[#ff385c]">${area.temperatureIndex}</span>
  `
  return el
}

export function CampusAmap({
  areas,
  selectedAreaId,
  activeTypeLabel,
  onSelectArea,
  className,
  compact = false,
  showControls = true,
}: CampusAmapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<AMap.Map | null>(null)
  const markersRef = useRef<MarkerRecord[]>([])
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "missing-key" | "error">(
    hasAmapKey() ? "idle" : "missing-key",
  )
  const [errorMessage, setErrorMessage] = useState("")

  useEffect(() => {
    const container = containerRef.current

    if (!container || !hasAmapKey()) {
      return
    }

    let disposed = false
    setStatus("loading")

    loadCampusAmap()
      .then((AMap) => {
        if (disposed) {
          return
        }

        const map = new AMap.Map(container, {
          center: CAMPUS_MAP_CENTER,
          zoom: compact ? CAMPUS_MAP_ZOOM - 0.35 : CAMPUS_MAP_ZOOM,
          viewMode: "2D",
          mapStyle: "amap://styles/fresh",
        })
        const AMapControls = AMap as AMapWithControls

        if (showControls) {
          map.addControl(new AMapControls.Scale())
          map.addControl(new AMapControls.ToolBar({ position: "RB" }))
        }

        mapRef.current = map
        setStatus("ready")
      })
      .catch((error: unknown) => {
        if (disposed) {
          return
        }

        setErrorMessage(error instanceof Error ? error.message : "高德地图加载失败，请检查 Key 与网络。")
        setStatus("error")
      })

    return () => {
      disposed = true
      markersRef.current.forEach(({ marker }) => marker.remove())
      markersRef.current = []
      mapRef.current?.destroy()
      mapRef.current = null
    }
  }, [compact, showControls])

  useEffect(() => {
    const map = mapRef.current

    if (!map || status !== "ready") {
      return
    }

    markersRef.current.forEach(({ marker }) => marker.remove())
    markersRef.current = areas.map((area) => {
      const marker = new AMap.Marker({
        position: area.lngLat,
        anchor: "bottom-center",
        offset: new AMap.Pixel(0, -6),
        content: createMarkerContent(area, area.id === selectedAreaId, compact),
        zIndex: area.id === selectedAreaId ? 120 : 100,
      })

      marker.on("click", () => onSelectArea(area.id))
      marker.setMap(map)

      if (activeTypeLabel && !area.hotTypes.includes(activeTypeLabel)) {
        marker.hide()
      }

      return { areaId: area.id, marker }
    })
  }, [activeTypeLabel, areas, compact, onSelectArea, selectedAreaId, status])

  useEffect(() => {
    const map = mapRef.current
    const selectedArea = areas.find((area) => area.id === selectedAreaId)

    if (map && selectedArea) {
      map.panTo(selectedArea.lngLat)
    }
  }, [areas, selectedAreaId])

  return (
    <div className={cn("relative h-[520px] overflow-hidden rounded-[28px] border border-[var(--color-hairline)] bg-white", className)}>
      <div ref={containerRef} className={cn("absolute inset-0", status !== "ready" && "opacity-0")} />

      {status === "loading" || status === "idle" ? (
        <div className="absolute inset-0 animate-pulse bg-[linear-gradient(120deg,#fff_0%,#fff1f2_42%,#eef6ff_100%)]">
          <div className="absolute left-6 top-6 h-10 w-44 rounded-full bg-white/70" />
          <div className="absolute bottom-8 left-8 h-20 w-56 rounded-3xl bg-white/70" />
          <div className="absolute right-8 top-20 h-28 w-40 rounded-3xl bg-white/70" />
        </div>
      ) : null}

      {status === "missing-key" ? (
        <MapFallback
          title="需要配置高德地图 Key"
          description="请在 .env.local 中配置 VITE_AMAP_KEY 和 VITE_AMAP_SECURITY_CODE，重启开发服务器后即可加载真实地图。"
        />
      ) : null}

      {status === "error" ? (
        <MapFallback title="高德地图加载失败" description={errorMessage || "请检查高德 Key、JS API 权限、Referer 白名单和网络连接。"} />
      ) : null}
    </div>
  )
}

function MapFallback({ title, description }: { title: string; description: string }) {
  return (
    <div className="absolute inset-0 grid place-items-center bg-[linear-gradient(120deg,#fff_0%,#fff7f8_45%,#eef6ff_100%)] p-6">
      <div className="max-w-md rounded-[28px] border border-[var(--color-hairline)] bg-white p-6 text-center shadow-[var(--shadow-card-hover)]">
        <h3 className="text-xl font-bold">{title}</h3>
        <p className="mt-3 text-sm leading-6 text-[var(--color-muted)]">{description}</p>
      </div>
    </div>
  )
}
