export type ProjectType = 'new_build' | 'resale' | 'commercial'

export interface FlowState {
  projectType?: ProjectType
  // screens 2–14 will extend this interface
}
