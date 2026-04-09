import { useState } from 'react'
import { ProjectTypeScreen } from './screens/ProjectTypeScreen'
import type { FlowState } from './types/flow'

function App() {
  const [flowState, setFlowState] = useState<FlowState>({})
  const [step, setStep] = useState(1)

  const handleNext = (update: Partial<FlowState>) => {
    setFlowState(prev => ({ ...prev, ...update }))
    setStep(prev => prev + 1)
  }

  // Screens 2–14 will be routed here as they are built
  if (step === 1) {
    return <ProjectTypeScreen initialState={flowState} onNext={handleNext} />
  }

  // Placeholder until next screen exists
  return (
    <div style={{ background: '#131313', color: '#e5e2e1', minHeight: '100svh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif' }}>
      <p style={{ opacity: 0.4, fontSize: 14, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
        Screen {step} — в разработке
      </p>
    </div>
  )
}

export default App
