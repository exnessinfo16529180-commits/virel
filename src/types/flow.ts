export type ProjectType = 'new_build' | 'resale' | 'commercial'

export type Scope = 'full' | 'partial' | 'design_only'

export type LayoutSource = 'upload' | 'manual' | 'later'

export interface FlowState {
  projectType?: ProjectType
  scope?: Scope
  layoutSource?: LayoutSource
  // screens 4–14 will extend this interface
}
