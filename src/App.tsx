import { useState, useEffect } from 'react'
import type { FlowState, ScreenId } from './types/flow'
import { ProjectTypeScreen } from './screens/ProjectTypeScreen'
import { CommercialSubtypeScreen } from './screens/CommercialSubtypeScreen'
import { ScopeScreen } from './screens/ScopeScreen'
import { PartialSurveyScreen } from './screens/PartialSurveyScreen'
import { LayoutScreen } from './screens/LayoutScreen'
import { StyleScreen } from './screens/StyleScreen'
import { AtmosphereScreen } from './screens/AtmosphereScreen'
import { PaletteScreen } from './screens/PaletteScreen'
import { BudgetScreen } from './screens/BudgetScreen'
import { ProcessingScreen } from './screens/ProcessingScreen'
import { ConceptsScreen } from './screens/ConceptsScreen'
import { ShopScreen } from './screens/ShopScreen'
import { DeliveryScreen } from './screens/DeliveryScreen'
import { TeamScreen } from './screens/TeamScreen'
import { SummaryScreen } from './screens/SummaryScreen'
import { PreFinalizationScreen } from './screens/PreFinalizationScreen'
import { EstimateScreen } from './screens/EstimateScreen'
import { ContractScreen } from './screens/ContractScreen'

// ── Persistence ───────────────────────────────────────────────────────────────

const STORAGE_KEY = 'virel_flow_v2'
const STORAGE_VERSION = 2

function readFlowState(): FlowState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    if (parsed?._version !== STORAGE_VERSION) return {}
    const rest = { ...parsed } as Record<string, unknown>
    delete rest['_version']
    delete rest['_history']
    return rest as unknown as FlowState
  } catch {
    return {}
  }
}

function readHistory(): ScreenId[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return ['project_type']
    const parsed = JSON.parse(raw)
    if (parsed?._version !== STORAGE_VERSION) return ['project_type']
    if (Array.isArray(parsed._history) && parsed._history.length > 0) {
      return parsed._history as ScreenId[]
    }
    return ['project_type']
  } catch {
    return ['project_type']
  }
}

function persist(state: FlowState, history: ScreenId[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      _version: STORAGE_VERSION,
      _history: history,
      ...state,
    }))
  } catch {
    // Storage unavailable or full — silent fail
  }
}

// ── Navigation graph ──────────────────────────────────────────────────────────

function getNextScreen(current: ScreenId, state: FlowState): ScreenId {
  switch (current) {
    case 'project_type':
      return state.projectType === 'commercial' ? 'commercial_subtype' : 'scope'
    case 'commercial_subtype':
      return 'scope'
    case 'scope':
      return state.scope === 'partial' ? 'partial_survey' : 'layout'
    case 'partial_survey':
      return 'layout'
    case 'layout':
      return 'style'
    case 'style':
      return 'atmosphere'
    case 'atmosphere':
      return 'palette'
    case 'palette':
      return 'budget'
    case 'budget':
      return 'processing'
    case 'processing':
      return 'concepts'
    case 'concepts':
      return state.scope !== 'design_only' ? 'shop' : 'team'
    case 'shop':
      return 'delivery'
    case 'delivery':
      return 'team'
    case 'team':
      return 'summary'
    case 'summary':
      return 'pre_finalization'
    case 'pre_finalization':
      return 'estimate'
    case 'estimate':
      return 'contract'
    default:
      return 'contract'
  }
}

// ── App ───────────────────────────────────────────────────────────────────────

function App() {
  const [flowState, setFlowState] = useState<FlowState>(readFlowState)
  const [history, setHistory] = useState<ScreenId[]>(readHistory)

  const currentScreen = history[history.length - 1]
  const canGoBack = history.length > 1

  useEffect(() => {
    persist(flowState, history)
  }, [flowState, history])

  const handleNext = (update: Partial<FlowState>) => {
    const nextState = { ...flowState, ...update }
    const nextScreen = getNextScreen(currentScreen, nextState)
    setFlowState(nextState)
    setHistory(prev => [...prev, nextScreen])
  }

  const handleBack = () => {
    if (!canGoBack) return
    setHistory(prev => prev.slice(0, -1))
  }

  const backProp = canGoBack ? handleBack : undefined
  const props = { initialState: flowState, onNext: handleNext, onBack: backProp }

  switch (currentScreen) {
    case 'project_type':       return <ProjectTypeScreen      {...props} />
    case 'commercial_subtype': return <CommercialSubtypeScreen {...props} />
    case 'scope':              return <ScopeScreen             {...props} />
    case 'partial_survey':     return <PartialSurveyScreen     {...props} />
    case 'layout':             return <LayoutScreen            {...props} />
    case 'style':              return <StyleScreen             {...props} />
    case 'atmosphere':         return <AtmosphereScreen        {...props} />
    case 'palette':            return <PaletteScreen           {...props} />
    case 'budget':             return <BudgetScreen            {...props} />
    case 'processing':         return <ProcessingScreen        {...props} />
    case 'concepts':           return <ConceptsScreen          {...props} />
    case 'shop':               return <ShopScreen              {...props} />
    case 'delivery':           return <DeliveryScreen          {...props} />
    case 'team':               return <TeamScreen              {...props} />
    case 'summary':            return <SummaryScreen           {...props} />
    case 'pre_finalization':   return <PreFinalizationScreen   {...props} />
    case 'estimate':           return <EstimateScreen          {...props} />
    case 'contract':           return <ContractScreen          {...props} />
  }
}

export default App
