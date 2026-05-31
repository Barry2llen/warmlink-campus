export type ISODateString = string

export type EventType =
  | "idle"
  | "study"
  | "supplies"
  | "errand"
  | "volunteer"
  | "safety"

export type EventStatus =
  | "waiting"
  | "matching"
  | "ongoing"
  | "pending_confirm"
  | "completed"
  | "cancelled"
  | "delisted"

export type Urgency = "low" | "medium" | "high"

export type UserRole = "student" | "admin"

export type MessageType = "intent" | "system" | "safety" | "volunteer" | "review"

export type ResourceStatus = "approved" | "pending" | "rejected"

export type RiskSeverity = "low" | "medium" | "high"

export type RiskStatus = "pending" | "processing" | "resolved" | "ignored" | "escalated"

export interface User {
  id: string
  nickname: string
  avatar: string
  school: string
  college: string
  warmth: number
  credit: number
  badges: string[]
  helpsGiven: number
  helpsReceived: number
  registeredAt: ISODateString
  lastActiveAt: ISODateString
  role: UserRole
}

export interface Event {
  id: string
  type: EventType
  title: string
  description: string
  tags: string[]
  areaId: string
  location: string
  timeRequirement: string | null
  urgency: Urgency
  publisherId: string
  status: EventStatus
  responders: string[]
  views: number
  publishedAt: ISODateString
  updatedAt: ISODateString
  completedAt?: ISODateString
  riskFlag?: boolean
}

export interface Area {
  id: string
  name: string
  lngLat: [number, number]
  x: number
  y: number
  width: number
  height: number
  todayCount: number
  activeCount: number
  hotTypes: string[]
  avgResponseMin: number
  temperatureIndex: number
  recentEvents: string[]
}

export interface Badge {
  id: string
  name: string
  icon: string
  condition: string
  progress: number
  total: number
  earned: boolean
  earnedAt?: ISODateString
}

export interface Message {
  id: string
  type: MessageType
  title: string
  eventId?: string
  sentAt: ISODateString
  read: boolean
  summary: string
}

export interface Resource {
  id: string
  title: string
  course: string
  teacher?: string
  type: string
  contributorId: string
  description: string
  tags: string[]
  rating: number
  favorites: number
  gets: number
  accessLevel: string
  updatedAt: ISODateString
  status: ResourceStatus
}

export interface VolunteerActivity {
  id: string
  name: string
  type: string
  organizer: string
  areaId: string
  startsAt: ISODateString
  endsAt: ISODateString
  capacity: number
  signedUp: number
  requirements: string[]
  deadline: ISODateString
  status: string
  completedRecords?: number
}

export interface RiskAlert {
  id: string
  type: string
  severity: RiskSeverity
  relatedEventId: string
  reason: string
  suggestion: string
  status: RiskStatus
  createdAt: ISODateString
  handler?: string
  resolution?: string
}
