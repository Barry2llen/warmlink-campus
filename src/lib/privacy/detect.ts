import type { PrivacyRisk, PrivacyRiskKind } from "../llm/schema"

export type { PrivacyRisk, PrivacyRiskKind } from "../llm/schema"

type Detector = {
  kind: PrivacyRiskKind
  regex: RegExp
  sensitiveGroup?: number
  advice: string
  accepts?: (text: string, start: number, end: number, raw: string) => boolean
}

type PrivacyRiskMatch = PrivacyRisk & {
  start: number
  end: number
}

const PHONE_ADVICE = "保护个人手机号，避免公开联系方式。"
const CONTACT_ADVICE = "建议确认互助意向后再交换微信/QQ。"
const STUDENT_ID_ADVICE = "隐藏学号，避免身份信息被公开。"
const DORM_ADVICE = "宿舍信息建议只保留楼栋，隐藏具体房间。"
const BANK_CARD_ADVICE = "银行卡号绝不要公开发布。"

const isAsciiLetterOrDigit = (value: string) => /^[A-Za-z0-9]$/.test(value)

const hasSafeBoundary = (text: string, start: number, end: number) => {
  const before = start > 0 ? text[start - 1] : ""
  const after = end < text.length ? text[end] : ""

  return (!before || !isAsciiLetterOrDigit(before)) && (!after || !isAsciiLetterOrDigit(after))
}

const acceptsPhone = (text: string, start: number, end: number, raw: string) =>
  /^1[3-9]\d{9}$/.test(raw) && hasSafeBoundary(text, start, end)

const acceptsBankCard = (text: string, start: number, end: number, raw: string) => {
  return /^\d{16,19}$/.test(raw) && hasSafeBoundary(text, start, end)
}

// Regex intent follows the plan samples: phone, student ID, and bank card use digit boundaries;
// contact methods use labels, while dorm rooms can stand alone or follow a dorm/location label.
const DETECTORS: Detector[] = [
  {
    kind: "bankCard",
    regex: /\d{16,19}/g,
    advice: BANK_CARD_ADVICE,
    accepts: acceptsBankCard,
  },
  {
    kind: "phone",
    regex: /1[3-9]\d{9}/g,
    advice: PHONE_ADVICE,
    accepts: acceptsPhone,
  },
  {
    kind: "wechat",
    regex: /(?:微信号?|wechat|wx)[:：\s-]*([A-Za-z][A-Za-z0-9_-]{5,19})/gi,
    sensitiveGroup: 1,
    advice: CONTACT_ADVICE,
  },
  {
    kind: "qq",
    regex: /(?:qq|扣扣)[:：\s-]*([1-9]\d{4,11})(?!\d)/gi,
    sensitiveGroup: 1,
    advice: CONTACT_ADVICE,
  },
  {
    kind: "studentId",
    regex: /20\d{8,10}/g,
    advice: STUDENT_ID_ADVICE,
    accepts: (_text, start, end) => hasSafeBoundary(_text, start, end),
  },
  {
    kind: "dorm",
    regex: /(?:宿舍|寝室|住在|房间)?[:：\s-]*([A-Za-z\u4e00-\u9fa5]{0,8}\d{1,2}(?:栋|幢|号楼|楼)[ -]?\d{3,4}室?)/gi,
    sensitiveGroup: 1,
    advice: DORM_ADVICE,
  },
]

const getSensitiveMatch = (match: RegExpMatchArray, sensitiveGroup?: number) => {
  if (!sensitiveGroup) {
    return { raw: match[0], offset: 0 }
  }

  const raw = match[sensitiveGroup]
  if (!raw) {
    return null
  }

  return { raw, offset: match[0].lastIndexOf(raw) }
}

const dedupeRiskMatches = (risks: PrivacyRiskMatch[]) => {
  const seen = new Set<string>()

  return risks.filter((risk) => {
    const key = `${risk.kind}:${risk.start}:${risk.end}:${risk.matched}`
    if (seen.has(key)) {
      return false
    }

    seen.add(key)
    return true
  })
}

const detectPrivacyMatches = (text: string): PrivacyRiskMatch[] => {
  const risks: PrivacyRiskMatch[] = []

  for (const detector of DETECTORS) {
    for (const match of text.matchAll(detector.regex)) {
      const sensitiveMatch = getSensitiveMatch(match, detector.sensitiveGroup)
      const matchIndex = match.index ?? 0

      if (!sensitiveMatch || sensitiveMatch.offset < 0) {
        continue
      }

      const start = matchIndex + sensitiveMatch.offset
      const end = start + sensitiveMatch.raw.length
      const accepted = detector.accepts?.(text, start, end, sensitiveMatch.raw) ?? true

      if (!accepted) {
        continue
      }

      risks.push({
        kind: detector.kind,
        matched: sensitiveMatch.raw,
        start,
        end,
        advice: detector.advice,
      })
    }
  }

  return dedupeRiskMatches(risks).sort((left, right) => left.start - right.start || left.end - right.end)
}

export function detectPrivacy(text: string): PrivacyRisk[] {
  return detectPrivacyMatches(text).map(({ kind, matched, advice }) => ({ kind, matched, advice }))
}

export function redactPrivacy(text: string): string {
  const risks = detectPrivacyMatches(text)
  const redactedParts: string[] = []
  let cursor = 0

  for (const risk of risks) {
    if (risk.start < cursor) {
      continue
    }

    redactedParts.push(text.slice(cursor, risk.start), "[已隐藏]")
    cursor = risk.end
  }

  redactedParts.push(text.slice(cursor))
  return redactedParts.join("")
}

declare global {
  interface Window {
    __detectPrivacy?: typeof detectPrivacy
  }
}

const isDevMode = typeof import.meta.env !== "undefined" && import.meta.env.DEV

if (isDevMode && typeof window !== "undefined") {
  Object.defineProperty(window, "__detectPrivacy", {
    value: detectPrivacy,
    configurable: true,
    writable: false,
  })
}
