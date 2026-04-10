export type ProjectType = 'new_build' | 'resale' | 'commercial'

export type Scope = 'full' | 'partial' | 'design_only'

export type LayoutSource = 'upload' | 'manual' | 'later'

export type Atmosphere = 'calm' | 'warm' | 'minimal' | 'contrast'

export type Palette = 'neutral' | 'warm' | 'cool' | 'contrast'

export type InteriorStyle = 'modern' | 'scandi' | 'minimal' | 'neoclassic'

export interface FlowState {
  projectType?: ProjectType
  scope?: Scope
  layoutSource?: LayoutSource
  atmosphere?: Atmosphere
  palette?: Palette
  style?: InteriorStyle
  // screens 7–14 will extend this interface
}
