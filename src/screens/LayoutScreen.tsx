import { useEffect, useMemo, useRef, useState } from 'react'
import type { ReactElement } from 'react'
import type {
  FlowState,
  LayoutFileMeta,
  LayoutSource,
  ManualLayoutDraft,
  ManualOpening,
  ManualWall,
} from '../types/flow'
import styles from './LayoutScreen.module.css'

interface Props {
  initialState?: FlowState
  onNext: (update: Partial<FlowState>) => void
}

type PlannerTool = 'select' | 'wall' | 'door' | 'window'
type WallKind = 'outer' | 'inner'

interface Point {
  x: number
  y: number
}

const BOARD_WIDTH = 320
const BOARD_HEIGHT = 220
const GRID = 8
const OPENING_WIDTH = { door: 90, window: 120 } as const

const OPTIONS: { value: LayoutSource; label: string; sub: string }[] = [
  { value: 'upload', label: 'Загрузить документ', sub: 'PDF/JPG/PNG до 20MB' },
  { value: 'manual', label: 'Нарисовать план', sub: 'Удобный room planner: стены, двери, окна' },
  { value: 'later', label: 'Пропустить пока', sub: 'Можно продолжить без плана' },
]

function uid(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`
}

function snap(n: number) {
  return Math.round(n / GRID) * GRID
}

function normalizePoint(x: number, y: number): Point {
  return {
    x: Math.max(0, Math.min(BOARD_WIDTH, snap(x))),
    y: Math.max(0, Math.min(BOARD_HEIGHT, snap(y))),
  }
}

function segmentLength(w: ManualWall) {
  const dx = w.x2 - w.x1
  const dy = w.y2 - w.y1
  return Math.hypot(dx, dy)
}

function pointToSegmentDistance(px: number, py: number, w: ManualWall) {
  const dx = w.x2 - w.x1
  const dy = w.y2 - w.y1
  const len2 = dx * dx + dy * dy
  if (len2 === 0) return { distance: Infinity, t: 0 }
  const t = Math.max(0, Math.min(1, ((px - w.x1) * dx + (py - w.y1) * dy) / len2))
  const cx = w.x1 + t * dx
  const cy = w.y1 + t * dy
  return { distance: Math.hypot(px - cx, py - cy), t }
}

function findNearestWall(p: Point, walls: ManualWall[]) {
  let best: { wall: ManualWall; t: number; distance: number } | null = null
  for (const wall of walls) {
    const { distance, t } = pointToSegmentDistance(p.x, p.y, wall)
    if (!best || distance < best.distance) {
      best = { wall, t, distance }
    }
  }
  return best
}

function hasClosedOuterLoop(walls: ManualWall[]) {
  const outer = walls.filter(w => w.kind === 'outer')
  if (outer.length < 3) return false

  const degree = new Map<string, number>()
  const adjacency = new Map<string, Set<string>>()
  const key = (x: number, y: number) => `${snap(x)}:${snap(y)}`

  for (const w of outer) {
    const a = key(w.x1, w.y1)
    const b = key(w.x2, w.y2)
    degree.set(a, (degree.get(a) ?? 0) + 1)
    degree.set(b, (degree.get(b) ?? 0) + 1)
    if (!adjacency.has(a)) adjacency.set(a, new Set())
    if (!adjacency.has(b)) adjacency.set(b, new Set())
    adjacency.get(a)!.add(b)
    adjacency.get(b)!.add(a)
  }

  if ([...degree.values()].some(d => d !== 2)) return false

  const nodes = [...adjacency.keys()]
  if (nodes.length === 0) return false
  const visited = new Set<string>()
  const stack = [nodes[0]]
  while (stack.length > 0) {
    const current = stack.pop()!
    if (visited.has(current)) continue
    visited.add(current)
    for (const next of adjacency.get(current) ?? []) {
      if (!visited.has(next)) stack.push(next)
    }
  }
  return visited.size === nodes.length
}

function makeStudioTemplate(): ManualWall[] {
  return [
    { id: uid('wall'), x1: 24, y1: 20, x2: 296, y2: 20, kind: 'outer' },
    { id: uid('wall'), x1: 296, y1: 20, x2: 296, y2: 200, kind: 'outer' },
    { id: uid('wall'), x1: 296, y1: 200, x2: 24, y2: 200, kind: 'outer' },
    { id: uid('wall'), x1: 24, y1: 200, x2: 24, y2: 20, kind: 'outer' },
  ]
}

function make2RoomTemplate(): ManualWall[] {
  const walls = makeStudioTemplate()
  walls.push({ id: uid('wall'), x1: 160, y1: 20, x2: 160, y2: 200, kind: 'inner' })
  return walls
}

function make3RoomTemplate(): ManualWall[] {
  const walls = makeStudioTemplate()
  walls.push({ id: uid('wall'), x1: 160, y1: 20, x2: 160, y2: 200, kind: 'inner' })
  walls.push({ id: uid('wall'), x1: 160, y1: 112, x2: 296, y2: 112, kind: 'inner' })
  return walls
}

function defaultDraft(initial?: ManualLayoutDraft): ManualLayoutDraft {
  if (initial) {
    return {
      ...initial,
      walls: initial.walls ?? [],
      openings: initial.openings ?? [],
      rooms: initial.rooms ?? [],
      doors: initial.doors ?? [],
      windows: initial.windows ?? [],
    }
  }
  return {
    totalArea: null,
    ceilingHeight: null,
    walls: make2RoomTemplate(),
    openings: [],
    rooms: [],
    doors: [],
    windows: [],
  }
}

function UploadIcon(): ReactElement {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 16V8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M9 11L12 8L15 11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 16.5V18.5C4 19.6 4.9 20.5 6 20.5H18C19.1 20.5 20 19.6 20 18.5V16.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

function PlannerIcon(): ReactElement {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3.5" y="3.5" width="17" height="17" rx="2" stroke="currentColor" strokeWidth="1.4" />
      <path d="M12 3.5V20.5M3.5 12H20.5" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  )
}

function LaterIcon(): ReactElement {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 7.5C13.6 7.5 14.8 8.5 14.8 10C14.8 11.2 14.2 11.9 12.9 12.6C12.2 13 11.8 13.6 11.8 14.4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <circle cx="12" cy="17" r="0.9" fill="currentColor" />
      <rect x="3.5" y="3.5" width="17" height="17" rx="2" stroke="currentColor" strokeWidth="1.4" strokeDasharray="2 2" />
    </svg>
  )
}

export function LayoutScreen({ initialState, onNext }: Props) {
  const [selected, setSelected] = useState<LayoutSource | undefined>(initialState?.layoutSource)
  const [layoutFile, setLayoutFile] = useState<LayoutFileMeta | undefined>(initialState?.layoutFile)
  const [draft, setDraft] = useState<ManualLayoutDraft>(defaultDraft(initialState?.manualLayout))
  const [tool, setTool] = useState<PlannerTool>('select')
  const [wallKind, setWallKind] = useState<WallKind>('inner')
  const [selectedWallId, setSelectedWallId] = useState<string | null>(null)
  const [pendingPoint, setPendingPoint] = useState<Point | null>(null)
  const [dragHandle, setDragHandle] = useState<{ wallId: string; end: 'start' | 'end' } | null>(null)

  const boardRef = useRef<HTMLDivElement | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const selectedWall = draft.walls.find(w => w.id === selectedWallId) ?? null

  const validation = useMemo(() => {
    const blocking: string[] = []
    const warnings: string[] = []

    if (!selected) {
      blocking.push('Выберите способ передачи планировки.')
      return { blocking, warnings }
    }

    if (selected === 'upload') {
      if (!layoutFile) blocking.push('Добавьте файл планировки.')
      return { blocking, warnings }
    }

    if (selected === 'manual') {
      if (!draft.totalArea || draft.totalArea <= 0) blocking.push('Укажите общую площадь.')
      if (!draft.ceilingHeight || draft.ceilingHeight <= 0) blocking.push('Укажите высоту потолков.')
      if (draft.walls.length < 4) blocking.push('Нужно минимум 4 стены.')
      if (!hasClosedOuterLoop(draft.walls)) blocking.push('Внешний контур должен быть замкнут.')
      if (!draft.openings.some(o => o.kind === 'door')) blocking.push('Добавьте минимум одну дверь.')
      if (!draft.openings.some(o => o.kind === 'window')) warnings.push('Желательно добавить хотя бы одно окно.')
      if (draft.walls.some(w => segmentLength(w) < 24)) blocking.push('Есть слишком короткие стены. Увеличьте длину.')
    }

    if (selected === 'later') warnings.push('Без планировки точность сметы и визуализаций будет ниже.')

    return { blocking, warnings }
  }, [draft, layoutFile, selected])

  const canContinue = selected !== undefined && validation.blocking.length === 0

  const toBoardPoint = (clientX: number, clientY: number): Point | null => {
    const board = boardRef.current
    if (!board) return null
    const rect = board.getBoundingClientRect()
    const x = ((clientX - rect.left) / rect.width) * BOARD_WIDTH
    const y = ((clientY - rect.top) / rect.height) * BOARD_HEIGHT
    if (x < 0 || y < 0 || x > BOARD_WIDTH || y > BOARD_HEIGHT) return null
    return normalizePoint(x, y)
  }

  const placeOpening = (kind: 'door' | 'window', point: Point) => {
    const nearest = findNearestWall(point, draft.walls)
    if (!nearest || nearest.distance > 10) return
    const opening: ManualOpening = {
      id: uid(kind),
      wallId: nearest.wall.id,
      kind,
      t: Number(nearest.t.toFixed(2)),
      width: OPENING_WIDTH[kind],
    }
    setDraft(prev => ({ ...prev, openings: [...prev.openings, opening] }))
    setSelectedWallId(nearest.wall.id)
  }

  const handleBoardPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const point = toBoardPoint(e.clientX, e.clientY)
    if (!point) return

    if (tool === 'wall') {
      if (!pendingPoint) {
        setPendingPoint(point)
      } else {
        const wall: ManualWall = {
          id: uid('wall'),
          x1: pendingPoint.x,
          y1: pendingPoint.y,
          x2: point.x,
          y2: point.y,
          kind: wallKind,
        }
        if (segmentLength(wall) >= 24) {
          setDraft(prev => ({ ...prev, walls: [...prev.walls, wall] }))
          setSelectedWallId(wall.id)
          setPendingPoint(point)
        }
      }
      return
    }

    if (tool === 'door') {
      placeOpening('door', point)
      return
    }

    if (tool === 'window') {
      placeOpening('window', point)
      return
    }

    const nearest = findNearestWall(point, draft.walls)
    if (nearest && nearest.distance <= 8) {
      setSelectedWallId(nearest.wall.id)
    } else {
      setSelectedWallId(null)
    }
  }

  useEffect(() => {
    if (!dragHandle) return

    const move = (e: PointerEvent) => {
      const point = toBoardPoint(e.clientX, e.clientY)
      if (!point) return
      setDraft(prev => ({
        ...prev,
        walls: prev.walls.map(wall => {
          if (wall.id !== dragHandle.wallId) return wall
          if (dragHandle.end === 'start') {
            return { ...wall, x1: point.x, y1: point.y }
          }
          return { ...wall, x2: point.x, y2: point.y }
        }),
      }))
    }

    const up = () => setDragHandle(null)
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
    return () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
    }
  }, [dragHandle])

  const applyTemplate = (template: 'studio' | 'two' | 'three') => {
    const walls =
      template === 'studio' ? makeStudioTemplate() :
      template === 'two' ? make2RoomTemplate() :
      make3RoomTemplate()

    setDraft(prev => ({ ...prev, walls, openings: [] }))
    setSelectedWallId(walls[0]?.id ?? null)
    setPendingPoint(null)
    setTool('select')
  }

  const continueFlow = () => {
    if (selected === 'upload') {
      onNext({ layoutSource: 'upload', layoutFile, manualLayout: undefined })
      return
    }
    if (selected === 'manual') {
      onNext({ layoutSource: 'manual', manualLayout: draft, layoutFile: undefined })
      return
    }
    onNext({ layoutSource: 'later', layoutFile: undefined, manualLayout: undefined })
  }

  return (
    <div className={styles.root}>
      <header className={styles.header}>
        <span className={styles.step}>Шаг 3 / 13</span>
      </header>

      <main className={styles.main}>
        <div className={styles.intro}>
          <h1 className={styles.headline}>Планировка и размеры</h1>
          <p className={styles.description}>Сделайте план в простом room planner формате</p>
        </div>

        <div className={styles.cards} role="group" aria-label="Способ передачи планировки">
          {OPTIONS.map(option => {
            const isActive = selected === option.value
            const Icon = option.value === 'upload' ? UploadIcon : option.value === 'manual' ? PlannerIcon : LaterIcon
            return (
              <button
                key={option.value}
                className={`${styles.card} ${isActive ? styles.cardSelected : ''}`}
                onClick={() => setSelected(option.value)}
              >
                <div className={styles.iconWrap}><Icon /></div>
                <div className={styles.cardText}>
                  <span className={styles.cardLabel}>{option.label}</span>
                  <span className={styles.cardSub}>{option.sub}</span>
                </div>
                <span className={`${styles.dot} ${isActive ? styles.dotSelected : ''}`} />
              </button>
            )
          })}
        </div>

        {selected === 'upload' && (
          <section className={styles.panel}>
            <h2 className={styles.panelTitle}>Файл планировки</h2>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              className={styles.hiddenInput}
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (!file) return
                setLayoutFile({ name: file.name, size: file.size, type: file.type || 'unknown' })
              }}
            />
            <button className={styles.uploadZone} onClick={() => fileInputRef.current?.click()}>
              <span className={styles.uploadBig}>Нажмите, чтобы выбрать файл</span>
              <span className={styles.uploadSmall}>PDF/JPG/PNG до 20MB</span>
            </button>
            {layoutFile && (
              <div className={styles.fileMeta}>
                <span>{layoutFile.name}</span>
                <span>{(layoutFile.size / (1024 * 1024)).toFixed(1)} MB</span>
              </div>
            )}
          </section>
        )}

        {selected === 'manual' && (
          <section className={styles.panel}>
            <h2 className={styles.panelTitle}>Room Planner</h2>

            <div className={styles.inputsGrid}>
              <label className={styles.field}>
                <span>Общая площадь (м²)</span>
                <input
                  type="number"
                  min={1}
                  step={0.1}
                  value={draft.totalArea ?? ''}
                  onChange={(e) => {
                    const v = e.currentTarget.value
                    setDraft(prev => ({ ...prev, totalArea: v === '' ? null : Number(v) }))
                  }}
                />
              </label>
              <label className={styles.field}>
                <span>Высота потолков (м)</span>
                <input
                  type="number"
                  min={2}
                  max={6}
                  step={0.05}
                  value={draft.ceilingHeight ?? ''}
                  onChange={(e) => {
                    const v = e.currentTarget.value
                    setDraft(prev => ({ ...prev, ceilingHeight: v === '' ? null : Number(v) }))
                  }}
                />
              </label>
            </div>

            <div className={styles.toolsRow}>
              <span className={styles.toolTitle}>Инструмент:</span>
              <button className={`${styles.modeBtn} ${tool === 'select' ? styles.modeBtnActive : ''}`} onClick={() => setTool('select')}>Выбор</button>
              <button className={`${styles.modeBtn} ${tool === 'wall' ? styles.modeBtnActive : ''}`} onClick={() => setTool('wall')}>Стена</button>
              <button className={`${styles.modeBtn} ${tool === 'door' ? styles.modeBtnActive : ''}`} onClick={() => setTool('door')}>Дверь</button>
              <button className={`${styles.modeBtn} ${tool === 'window' ? styles.modeBtnActive : ''}`} onClick={() => setTool('window')}>Окно</button>
            </div>

            {tool === 'wall' && (
              <div className={styles.toolsRow}>
                <span className={styles.toolTitle}>Тип стены:</span>
                <button className={`${styles.sideBtn} ${wallKind === 'outer' ? styles.sideBtnActive : ''}`} onClick={() => setWallKind('outer')}>Внешняя</button>
                <button className={`${styles.sideBtn} ${wallKind === 'inner' ? styles.sideBtnActive : ''}`} onClick={() => setWallKind('inner')}>Внутренняя</button>
                {pendingPoint && (
                  <button className={styles.ghostBtn} onClick={() => setPendingPoint(null)}>Завершить рисование</button>
                )}
              </div>
            )}

            <div className={styles.templateRow}>
              <button className={styles.templateChip} onClick={() => applyTemplate('studio')}>Шаблон: студия</button>
              <button className={styles.templateChip} onClick={() => applyTemplate('two')}>Шаблон: 2 комнаты</button>
              <button className={styles.templateChip} onClick={() => applyTemplate('three')}>Шаблон: 3 комнаты</button>
              <button className={styles.templateChip} onClick={() => setDraft(prev => ({ ...prev, walls: [], openings: [] }))}>Очистить</button>
            </div>

            <div ref={boardRef} className={styles.board} onPointerDown={handleBoardPointerDown}>
              <svg viewBox={`0 0 ${BOARD_WIDTH} ${BOARD_HEIGHT}`} className={styles.planSvg}>
                {draft.walls.map(wall => (
                  <line
                    key={wall.id}
                    x1={wall.x1}
                    y1={wall.y1}
                    x2={wall.x2}
                    y2={wall.y2}
                    className={`${styles.wallLine} ${wall.kind === 'outer' ? styles.wallOuter : styles.wallInner} ${selectedWallId === wall.id ? styles.wallSelected : ''}`}
                  />
                ))}

                {draft.openings.map(opening => {
                  const wall = draft.walls.find(w => w.id === opening.wallId)
                  if (!wall) return null
                  const x = wall.x1 + (wall.x2 - wall.x1) * opening.t
                  const y = wall.y1 + (wall.y2 - wall.y1) * opening.t
                  return (
                    <circle
                      key={opening.id}
                      cx={x}
                      cy={y}
                      r={opening.kind === 'door' ? 3.2 : 2.8}
                      className={opening.kind === 'door' ? styles.doorPoint : styles.windowPoint}
                    />
                  )
                })}

                {selectedWall && (
                  <>
                    <circle
                      cx={selectedWall.x1}
                      cy={selectedWall.y1}
                      r={4}
                      className={styles.handlePoint}
                      onPointerDown={(e) => {
                        e.stopPropagation()
                        setDragHandle({ wallId: selectedWall.id, end: 'start' })
                      }}
                    />
                    <circle
                      cx={selectedWall.x2}
                      cy={selectedWall.y2}
                      r={4}
                      className={styles.handlePoint}
                      onPointerDown={(e) => {
                        e.stopPropagation()
                        setDragHandle({ wallId: selectedWall.id, end: 'end' })
                      }}
                    />
                  </>
                )}

                {pendingPoint && (
                  <circle cx={pendingPoint.x} cy={pendingPoint.y} r={3.2} className={styles.pendingPoint} />
                )}
              </svg>
            </div>

            <p className={styles.hint}>
              {tool === 'wall'
                ? pendingPoint
                  ? 'Тапните следующую точку, чтобы продолжить стену.'
                  : 'Тапните на поле, чтобы начать рисовать стену.'
                : tool === 'door'
                  ? 'Тапните на стену, чтобы поставить дверь.'
                  : tool === 'window'
                    ? 'Тапните на стену, чтобы поставить окно.'
                    : 'Выберите стену тапом, затем двигайте точки на концах.'}
            </p>

            {selectedWall && (
              <div className={styles.roomEditor}>
                <h3 className={styles.subTitle}>Выбранная стена</h3>
                <p className={styles.metaLine}>Тип: {selectedWall.kind === 'outer' ? 'Внешняя' : 'Внутренняя'}</p>
                <p className={styles.metaLine}>Длина: {Math.round(segmentLength(selectedWall))} см</p>
                <div className={styles.doorTags}>
                  {draft.openings.filter(o => o.wallId === selectedWall.id).map(opening => (
                    <button
                      key={opening.id}
                      className={styles.tag}
                      onClick={() => setDraft(prev => ({ ...prev, openings: prev.openings.filter(o => o.id !== opening.id) }))}
                    >
                      Удалить {opening.kind === 'door' ? 'дверь' : 'окно'} ×{opening.width}
                    </button>
                  ))}
                </div>
                <div className={styles.toolsRow}>
                  <button
                    className={styles.sideBtn}
                    onClick={() => setDraft(prev => ({
                      ...prev,
                      walls: prev.walls.map(w => w.id === selectedWall.id ? { ...w, kind: w.kind === 'outer' ? 'inner' : 'outer' } : w),
                    }))}
                  >
                    Сменить тип
                  </button>
                  <button
                    className={styles.dangerBtn}
                    onClick={() => setDraft(prev => ({
                      ...prev,
                      walls: prev.walls.filter(w => w.id !== selectedWall.id),
                      openings: prev.openings.filter(o => o.wallId !== selectedWall.id),
                    }))}
                  >
                    Удалить стену
                  </button>
                </div>
              </div>
            )}
          </section>
        )}

        {(validation.blocking.length > 0 || validation.warnings.length > 0) && (
          <section className={styles.validationPanel}>
            {validation.blocking.map(item => <p key={item} className={styles.validationError}>• {item}</p>)}
            {validation.warnings.map(item => <p key={item} className={styles.validationWarn}>• {item}</p>)}
          </section>
        )}
      </main>

      <footer className={styles.footer}>
        <button className={styles.skipBtn} onClick={() => onNext({ layoutSource: 'later', layoutFile: undefined, manualLayout: undefined })}>
          Пропустить
        </button>
        <button className={styles.cta} disabled={!canContinue} onClick={continueFlow}>
          Продолжить
        </button>
      </footer>
    </div>
  )
}
