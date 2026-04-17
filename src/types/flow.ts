export interface ConceptImage {
  conceptId: 'concept_a' | 'concept_b' | 'concept_c'
  url: string | null
  error: string | null
}

export interface LayoutFileMeta {
  name: string
  size: number
  type: string
}

export interface ManualRoom {
  id: string
  name: string
  purpose: string
  x: number
  y: number
  width: number
  height: number
}

export type WallSide = 'top' | 'right' | 'bottom' | 'left'

export interface ManualDoor {
  id: string
  roomId: string
  side: WallSide
  offset: number
  width: number
}

export interface ManualWindow {
  id: string
  roomId: string
  side: WallSide
  offset: number
  width: number
}

export interface ManualLayoutDraft {
  totalArea: number | null
  ceilingHeight: number | null
  rooms: ManualRoom[]
  doors: ManualDoor[]
  windows: ManualWindow[]
}

export type ProjectType = 'new_build' | 'resale' | 'commercial'

export type CommercialSubtype = 'office' | 'retail' | 'horeca' | 'industrial' | 'other'

export type Scope = 'full' | 'partial' | 'design_only'

export type LayoutSource = 'upload' | 'manual' | 'later'

export type Atmosphere = 'calm' | 'warm' | 'minimal' | 'contrast'

export type Palette = 'neutral' | 'warm' | 'cool' | 'contrast'

export type InteriorStyle = 'modern' | 'scandi' | 'minimal' | 'neoclassic'

export type BudgetRange =
  | 'under_5m'
  | '5_10m'
  | '10_20m'
  | '20_35m'
  | 'over_35m'
  | 'unsure'

export interface PartialSurvey {
  needsDemolition: boolean
  needsWallLeveling: boolean
  needsFloorLeveling: boolean
  coverageCondition: 'good' | 'fair' | 'poor'
  localUpdateOnly: boolean
  affectedRooms: string[]
}

export interface DeliverySlot {
  date: string
  timeSlot: 'morning' | 'afternoon' | 'evening'
}

// Navigation state machine — all screens in the v2 flow
export type ScreenId =
  | 'project_type'
  | 'commercial_subtype'
  | 'scope'
  | 'partial_survey'
  | 'layout'
  | 'style'
  | 'atmosphere'
  | 'palette'
  | 'budget'
  | 'processing'
  | 'concepts'
  | 'shop'
  | 'delivery'
  | 'team'
  | 'summary'
  | 'pre_finalization'
  | 'estimate'
  | 'contract'

export interface FlowState {
  projectType?: ProjectType
  commercialSubtype?: CommercialSubtype
  scope?: Scope
  partialSurvey?: PartialSurvey
  layoutSource?: LayoutSource
  layoutFile?: LayoutFileMeta
  manualLayout?: ManualLayoutDraft
  atmosphere?: Atmosphere
  palette?: Palette
  style?: InteriorStyle
  budgetRange?: BudgetRange
  processingStage?: 0 | 1 | 2 | 3 | 4
  processingDone?: boolean
  selectedConcept?: 'concept_a' | 'concept_b' | 'concept_c'
  estimate?: {
    works: number
    materials: number
    design: number
    reserve: number
    total: number
  }
  materialsPackage?: 'basic' | 'optimal' | 'premium'
  teamPackage?: 'econom' | 'balanced' | 'premium'
  conceptImages?: ConceptImage[]
  conceptGenerationDebug?: {
    model: string
    statuses: (number | string)[]
    reasons: string[]
    timestamp?: string
    debugSummary?: string
  }
  selectedShop?: string
  deliverySlot?: DeliverySlot
  consentAccepted?: boolean
  projectLaunched?: boolean
}
