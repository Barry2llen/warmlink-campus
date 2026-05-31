import { detectPrivacy, redactPrivacy } from "@/lib/privacy"
import type { Area, EventType, Urgency } from "@/lib/types"
import { LLM_RESPONSE_JSON_SCHEMA, type LLMPublishInput, type LLMPublishResult, type PrivacyRisk } from "@/lib/llm/schema"

const geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY?.trim()
const geminiModel = import.meta.env.VITE_GEMINI_MODEL?.trim() || "gemini-2.5-flash"

export function hasGeminiApiKey() {
  return Boolean(geminiApiKey && geminiApiKey !== "your-key-here")
}

export async function analyzePublishDraftWithGemini(input: LLMPublishInput, areas: Area[]): Promise<LLMPublishResult> {
  if (!geminiApiKey) {
    throw new Error("缺少 VITE_GEMINI_API_KEY，无法调用 Gemini。")
  }

  const { GoogleGenAI } = await import("@google/genai")
  const ai = new GoogleGenAI({ apiKey: geminiApiKey })
  const response = await ai.models.generateContent({
    model: geminiModel,
    contents: buildPrompt(input, areas),
    config: {
      responseMimeType: "application/json",
      responseJsonSchema: LLM_RESPONSE_JSON_SCHEMA,
      temperature: 0.25,
      maxOutputTokens: 1200,
    },
  })

  const text = response.text
  if (!text) {
    throw new Error("Gemini 未返回可解析内容。")
  }

  return normalizeResult(JSON.parse(text) as Partial<LLMPublishResult>, input.rawText, input.hintAreaId, areas)
}

function buildPrompt(input: LLMPublishInput, areas: Area[]) {
  const areaLines = areas
    .map((area) => `- ${area.id}: ${area.name}，热门类型：${area.hotTypes.join("、")}`)
    .join("\n")

  return `
你是“暖校 Link”的校园互助发布助手。请把用户的一句话需求转换为可发布的校园互助事项 JSON。

要求：
- 只能返回 JSON，不要 Markdown。
- type 必须是 idle、study、supplies、errand、volunteer、safety 之一。
- urgency 必须是 low、medium、high 之一。
- areaId 必须从下方区域 id 中选择；无法判断时使用 hintAreaId；仍无法判断时使用 library。
- description 必须适合公开发布，不要暴露手机号、微信、QQ、学号、宿舍门牌、银行卡等隐私。
- privacyRisks 只记录检测到的隐私，不要编造。
- safetyTips 给出 2 到 3 条简短中文提醒。

可用校园区域：
${areaLines}

hintAreaId: ${input.hintAreaId ?? "无"}
用户原文：
${input.rawText}
`.trim()
}

function normalizeResult(result: Partial<LLMPublishResult>, rawText: string, hintAreaId: string | undefined, areas: Area[]): LLMPublishResult {
  const area = findArea(result.areaId, areas) ?? findArea(hintAreaId, areas) ?? areas[0]
  const type = normalizeEventType(result.type)
  const urgency = normalizeUrgency(result.urgency)
  const localPrivacyRisks = detectPrivacy(rawText)

  return {
    type,
    title: cleanText(result.title, "校园互助需求").slice(0, 28),
    description: cleanText(
      result.description,
      `我希望在${area.name}附近获得帮助：${redactPrivacy(rawText)}。若有同学方便响应，可通过站内消息联系，并在校园公共区域完成确认。`,
    ),
    urgency,
    areaId: area.id,
    areaName: area.name,
    tags: normalizeTags(result.tags, area.name, type),
    timeRequirement: cleanNullableText(result.timeRequirement) ?? (urgency === "high" ? "尽快" : "今天内"),
    suggestedHelpers: clampInteger(result.suggestedHelpers, 1, 8, type === "study" ? 5 : 2),
    privacyRisks: mergePrivacyRisks(result.privacyRisks, localPrivacyRisks),
    safetyTips: normalizeSafetyTips(result.safetyTips, localPrivacyRisks.length > 0, urgency),
    reasoning: cleanText(result.reasoning, "已根据用户原文、校园区域和隐私风险生成发布草稿。"),
  }
}

function findArea(id: string | null | undefined, areas: Area[]) {
  return id ? areas.find((area) => area.id === id) : undefined
}

function normalizeEventType(value: unknown): EventType {
  return ["idle", "study", "supplies", "errand", "volunteer", "safety"].includes(String(value)) ? (value as EventType) : "errand"
}

function normalizeUrgency(value: unknown): Urgency {
  return ["low", "medium", "high"].includes(String(value)) ? (value as Urgency) : "medium"
}

function cleanText(value: unknown, fallback: string) {
  const text = typeof value === "string" ? value.trim() : ""
  return text || fallback
}

function cleanNullableText(value: unknown) {
  const text = typeof value === "string" ? value.trim() : ""
  return text || null
}

function normalizeTags(tags: unknown, areaName: string, type: EventType) {
  const values = Array.isArray(tags) ? tags.filter((tag): tag is string => typeof tag === "string" && tag.trim().length > 0) : []
  return Array.from(new Set([...values.map((tag) => tag.trim()), areaName, type])).slice(0, 5)
}

function normalizeSafetyTips(tips: unknown, hasPrivacyRisk: boolean, urgency: Urgency) {
  const values = Array.isArray(tips) ? tips.filter((tip): tip is string => typeof tip === "string" && tip.trim().length > 0) : []
  const defaults = [
    hasPrivacyRisk ? "检测到可能的隐私信息，发布前已建议隐藏。" : "未检测到明显隐私信息，仍建议通过站内消息沟通。",
    "线下交接请选择图书馆门厅、食堂门口等公共区域。",
    urgency === "high" ? "高紧急事项建议同步通知熟悉同学或学校相关部门。" : "涉及借用物品时建议明确归还时间和物品状态。",
  ]

  return Array.from(new Set([...values.map((tip) => tip.trim()), ...defaults])).slice(0, 3)
}

function mergePrivacyRisks(modelRisks: unknown, localRisks: PrivacyRisk[]) {
  const risks = Array.isArray(modelRisks)
    ? modelRisks.filter((risk): risk is PrivacyRisk => {
        return (
          risk &&
          typeof risk === "object" &&
          "kind" in risk &&
          "matched" in risk &&
          "advice" in risk &&
          typeof risk.kind === "string" &&
          typeof risk.matched === "string" &&
          typeof risk.advice === "string"
        )
      })
    : []

  const merged = new Map<string, PrivacyRisk>()
  ;[...localRisks, ...risks].forEach((risk) => merged.set(`${risk.kind}:${risk.matched}`, risk))
  return Array.from(merged.values())
}

function clampInteger(value: unknown, min: number, max: number, fallback: number) {
  const number = typeof value === "number" ? value : Number(value)
  if (!Number.isFinite(number)) {
    return fallback
  }

  return Math.min(max, Math.max(min, Math.round(number)))
}
