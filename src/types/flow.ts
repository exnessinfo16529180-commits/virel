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
  consentAccepted?: boolean
  projectLaunched?: boolean
}
