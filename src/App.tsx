import { useState } from 'react'
import { ProjectTypeScreen } from './screens/ProjectTypeScreen'
import { ScopeScreen } from './screens/ScopeScreen'
import { LayoutScreen } from './screens/LayoutScreen'
import { AtmosphereScreen } from './screens/AtmosphereScreen'
import { PaletteScreen } from './screens/PaletteScreen'
import { StyleScreen } from './screens/StyleScreen'
import { BudgetScreen } from './screens/BudgetScreen'
import { ProcessingScreen } from './screens/ProcessingScreen'
import { ConceptsScreen } from './screens/ConceptsScreen'
import { EstimateScreen } from './screens/EstimateScreen'
import { MaterialsScreen } from './screens/MaterialsScreen'
import type { FlowState } from './types/flow'

function App() {
  const [flowState, setFlowState] = useState<FlowState>({})
  const [step, setStep] = useState(1)

  const handleNext = (update: Partial<FlowState>) => {
    setFlowState(prev => ({ ...prev, ...update }))
    setStep(prev => prev + 1)
  }

  if (step === 1) {
    return <ProjectTypeScreen initialState={flowState} onNext={handleNext} />
  }

  if (step === 2) {
    return <ScopeScreen initialState={flowState} onNext={handleNext} />
  }

  if (step === 3) {
    return <LayoutScreen initialState={flowState} onNext={handleNext} />
  }

  if (step === 4) {
    return <AtmosphereScreen initialState={flowState} onNext={handleNext} />
  }

  if (step === 5) {
    return <PaletteScreen initialState={flowState} onNext={handleNext} />
  }

  if (step === 6) {
    return <StyleScreen initialState={flowState} onNext={handleNext} />
  }

  if (step === 7) {
    return <BudgetScreen initialState={flowState} onNext={handleNext} />
  }

  if (step === 8) {
    return <ProcessingScreen initialState={flowState} onNext={handleNext} />
  }

  if (step === 9) {
    return <ConceptsScreen initialState={flowState} onNext={handleNext} />
  }

  if (step === 10) {
    return <EstimateScreen initialState={flowState} onNext={handleNext} />
  }

  if (step === 11) {
    return <MaterialsScreen initialState={flowState} onNext={handleNext} />
  }

  // Placeholder until screens 12–14 are built
  return (
    <div style={{ background: '#131313', color: '#e5e2e1', minHeight: '100svh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif' }}>
      <p style={{ opacity: 0.4, fontSize: 14, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
        Шаг {step} — в разработке
      </p>
    </div>
  )
}

export default App
