import type { EventType, Urgency } from "../types/domain"

export type PrivacyRiskKind = "phone" | "wechat" | "qq" | "studentId" | "dorm" | "bankCard"

export interface PrivacyRisk {
  kind: PrivacyRiskKind
  matched: string
  advice: string
}

export interface LLMPublishInput {
  rawText: string
  hintAreaId?: string
}

export interface LLMPublishResult {
  type: EventType
  title: string
  description: string
  urgency: Urgency
  areaId: string | null
  areaName: string
  tags: string[]
  timeRequirement: string | null
  suggestedHelpers: number
  privacyRisks: PrivacyRisk[]
  safetyTips: string[]
  reasoning: string
}

type SchemaNode =
  | {
      type: "string" | "number" | "integer" | "boolean" | "null"
      description?: string
      enum?: readonly string[]
      nullable?: boolean
    }
  | {
      type: "array"
      description?: string
      items: SchemaNode
      nullable?: boolean
    }
  | {
      type: "object"
      description?: string
      properties: Record<string, SchemaNode>
      required: readonly string[]
      propertyOrdering: readonly string[]
      additionalProperties?: boolean
      nullable?: boolean
    }

export const LLM_RESPONSE_JSON_SCHEMA = {
  type: "object",
  properties: {
    type: {
      type: "string",
      enum: ["idle", "study", "supplies", "errand", "volunteer", "safety"],
    },
    title: {
      type: "string",
    },
    description: {
      type: "string",
    },
    urgency: {
      type: "string",
      enum: ["low", "medium", "high"],
    },
    areaId: {
      type: "string",
      nullable: true,
    },
    areaName: {
      type: "string",
    },
    tags: {
      type: "array",
      items: {
        type: "string",
      },
    },
    timeRequirement: {
      type: "string",
      nullable: true,
    },
    suggestedHelpers: {
      type: "integer",
    },
    privacyRisks: {
      type: "array",
      items: {
        type: "object",
        properties: {
          kind: {
            type: "string",
            enum: ["phone", "wechat", "qq", "studentId", "dorm", "bankCard"],
          },
          matched: {
            type: "string",
          },
          advice: {
            type: "string",
          },
        },
        required: ["kind", "matched", "advice"],
        propertyOrdering: ["kind", "matched", "advice"],
        additionalProperties: false,
      },
    },
    safetyTips: {
      type: "array",
      items: {
        type: "string",
      },
    },
    reasoning: {
      type: "string",
    },
  },
  required: [
    "type",
    "title",
    "description",
    "urgency",
    "areaId",
    "areaName",
    "tags",
    "timeRequirement",
    "suggestedHelpers",
    "privacyRisks",
    "safetyTips",
    "reasoning",
  ],
  propertyOrdering: [
    "type",
    "title",
    "description",
    "urgency",
    "areaId",
    "areaName",
    "tags",
    "timeRequirement",
    "suggestedHelpers",
    "privacyRisks",
    "safetyTips",
    "reasoning",
  ],
  additionalProperties: false,
} satisfies SchemaNode
