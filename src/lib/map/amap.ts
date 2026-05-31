import { load as loadAMap } from "@amap/amap-jsapi-loader"
import type {} from "@amap/amap-jsapi-types"

export const CAMPUS_MAP_CENTER: [number, number] = [115.82807, 28.65223]
export const CAMPUS_MAP_ZOOM = 16.6

const amapKey = import.meta.env.VITE_AMAP_KEY?.trim()
const amapSecurityCode = import.meta.env.VITE_AMAP_SECURITY_CODE?.trim()

declare global {
  interface Window {
    _AMapSecurityConfig?: {
      securityJsCode?: string
      serviceHost?: string
    }
  }
}

export function hasAmapKey() {
  return Boolean(amapKey)
}

export function loadCampusAmap() {
  if (!amapKey) {
    return Promise.reject(new Error("缺少 VITE_AMAP_KEY，无法加载高德地图。"))
  }

  if (amapSecurityCode) {
    window._AMapSecurityConfig = {
      securityJsCode: amapSecurityCode,
    }
  }

  return loadAMap({
    key: amapKey,
    version: "2.0",
    plugins: ["AMap.Scale", "AMap.ToolBar"],
  }) as Promise<typeof AMap>
}
