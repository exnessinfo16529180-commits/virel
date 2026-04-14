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
  lengthM: number
  widthM: number
}

export type WallSide = 'top' | 'right' | 'bottom' | 'left'

export interface ManualDoor {
  id: string
  roomId: string
  wall: WallSide
  widthCm: number
  heightCm: number
}

export interface ManualWindow {
  id: string
  roomId: string
  wall: WallSide
  widthCm: number
  heightCm: number
  sillHeightCm: number
}

export interface ManualWall {
  id: string
  x1: number
  y1: number
  x2: number
  y2: number
  kind: 'outer' | 'inner'
}

export interface ManualOpening {
  id: string
  roomId: string
  wall: WallSide
  kind: 'door' | 'window'
  widthCm: number
  heightCm: number
  sillHeightCm?: number
}

export type ApartmentType = 'studio' | '1k' | '2k' | '3k' | 'custom'

export interface ManualPlannerMeta {
  apartmentType: ApartmentType
  stepCompleted?: 1 | 2 | 3
}

export interface ManualLayoutDraft {
  totalArea: number | null
  ceilingHeight: number | null
  planner?: ManualPlannerMeta

  // Wizard-first data
  rooms: ManualRoom[]
  openings: ManualOpening[]

  // Legacy fields kept for compatibility with older saved states.
  walls: ManualWall[]
  doors: ManualDoor[]
  windows: ManualWindow[]
}

export type ProjectType = 'new_build' | 'resale' | 'commercial'

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

export interface FlowState {
  projectType?: ProjectType
  scope?: Scope
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
  consentAccepted?: boolean
  projectLaunched?: boolean
}
