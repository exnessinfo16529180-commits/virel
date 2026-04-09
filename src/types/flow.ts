export type ProjectType = 'new_build' | 'resale' | 'commercial'

export type Scope = 'full' | 'partial' | 'design_only'

export interface FlowState {
  projectType?: ProjectType
  scope?: Scope
  // screens 3–14 will extend this interface
}
