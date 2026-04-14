import { useEffect, useMemo, useRef, useState } from 'react'
import type { ReactElement } from 'react'
import type {
  FlowState,
  LayoutFileMeta,
  LayoutSource,
  ManualDoor,
  ManualLayoutDraft,
  ManualRoom,
  ManualWindow,
  WallSide,
} from '../types/flow'
import styles from './LayoutScreen.module.css'

interface Props {
  initialState?: FlowState
  onNext: (update: Partial<FlowState>) => void
}

const BOARD_WIDTH = 320
const BOARD_HEIGHT = 220
const MIN_ROOM_SIZE = 44
const SIDES: WallSide[] = ['top', 'right', 'bottom', 'left']

type ToolMode = 'move' | 'door' | 'window'

interface RoomTemplate {
  name: string
  purpose: string
  width: number
  height: number
}

const ROOM_TEMPLATES: RoomTemplate[] = [
  { name: 'Гостиная', purpose: 'Жилая', width: 120, height: 88 },
  { name: 'Спальня', purpose: 'Жилая', width: 92, height: 74 },
  { name: 'Кухня', purpose: 'Кухня', width: 88, height: 68 },
  { name: 'Санузел', purpose: 'Санузел', width: 64, height: 56 },
  { name: 'Коридор', purpose: 'Коридор', width: 80, height: 50 },
]

const PURPOSES = ['Жилая', 'Кухня', 'Санузел', 'Коридор', 'Кабинет', 'Гардероб']

function uid(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`
}

function UploadIcon(): ReactElement {
  return (
    <svg width="32" height="32" viewBox="0 0 36 36" fill="none" aria-hidden="true">
      <rect x="7" y="4" width="22" height="24" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M18 22V30" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M14 26L18 22L22 26" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function ManualIcon(): ReactElement {
  return (
    <svg width="32" height="32" viewBox="0 0 36 36" fill="none" aria-hidden="true">
      <rect x="4" y="4" width="28" height="22" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
      <line x1="18" y1="4" x2="18" y2="26" stroke="currentColor" strokeWidth="1.25"/>
      <line x1="4" y1="15" x2="32" y2="15" stroke="currentColor" strokeWidth="1.25"/>
      <circle cx="28" cy="30" r="2.2" stroke="currentColor" strokeWidth="1.2" />
      <line x1="24" y1="30" x2="32" y2="30" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  )
}

function LaterIcon(): ReactElement {
  return (
    <svg width="32" height="32" viewBox="0 0 36 36" fill="none" aria-hidden="true">
      <rect x="7" y="5" width="22" height="26" rx="1.5" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 2.5"/>
      <path
        d="M15.5 14.5C15.5 12.567 17.067 11 19 11C20.933 11 22.5 12.567 22.5 14.5C22.5 16.433 19 18 19 20"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle cx="19" cy="23" r="1" fill="currentColor"/>
    </svg>
  )
}

const OPTIONS: { value: LayoutSource; label: string; sub: string; Icon: () => ReactElement }[] = [
  {
    value: 'upload',
    label: 'Загрузить документ',
    sub: 'PDF/JPG/PNG, до 20MB',
    Icon: UploadIcon,
  },
  {
    value: 'manual',
    label: 'Собрать вручную',
    sub: 'Room planner с комнатами, дверями и окнами',
    Icon: ManualIcon,
  },
  {
    value: 'later',
    label: 'Пропустить пока',
    sub: 'Продолжить без точной планировки',
    Icon: LaterIcon,
  },
]

function rectsOverlap(a: ManualRoom, b: ManualRoom) {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  )
}

function openingStyle(kind: 'door' | 'window', side: WallSide, offset: number, openingWidth: number, room: ManualRoom) {
  const color = kind === 'door' ? '#e9c176' : '#9cc8ff'
  const base = {
    background: color,
  } as React.CSSProperties

  if (side === 'top' || side === 'bottom') {
    const ratio = Math.max(0.08, Math.min(0.8, openingWidth / room.width))
    const left = Math.max(0, Math.min(1 - ratio, offset - ratio / 2)) * 100
    return {
      ...base,
      left: `${left}%`,
      width: `${ratio * 100}%`,
      height: '3px',
      [side]: '-2px',
    } as React.CSSProperties
  }

  const ratio = Math.max(0.08, Math.min(0.8, openingWidth / room.height))
  const top = Math.max(0, Math.min(1 - ratio, offset - ratio / 2)) * 100
  return {
    ...base,
    top: `${top}%`,
    height: `${ratio * 100}%`,
    width: '3px',
    [side]: '-2px',
  } as React.CSSProperties
}

function defaultManualLayout(initial?: ManualLayoutDraft): ManualLayoutDraft {
  if (initial) {
    return {
      ...initial,
      windows: initial.windows ?? [],
    }
  }
  return {
    totalArea: null,
    ceilingHeight: null,
    rooms: [],
    doors: [],
    windows: [],
  }
}

export function LayoutScreen({ initialState, onNext }: Props) {
  const [selected, setSelected] = useState<LayoutSource | undefined>(initialState?.layoutSource)
  const [layoutFile, setLayoutFile] = useState<LayoutFileMeta | undefined>(initialState?.layoutFile)
  const [manual, setManual] = useState<ManualLayoutDraft>(defaultManualLayout(initialState?.manualLayout))
  const [activeRoomId, setActiveRoomId] = useState<string | null>(initialState?.manualLayout?.rooms[0]?.id ?? null)
  const [toolMode, setToolMode] = useState<ToolMode>('move')
  const [selectedSide, setSelectedSide] = useState<WallSide>('top')
  const [openingWidth, setOpeningWidth] = useState<number>(90)
  const [dragState, setDragState] = useState<{
    roomId: string
    startClientX: number
    startClientY: number
    startRoomX: number
    startRoomY: number
  } | null>(null)

  const boardRef = useRef<HTMLDivElement | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const activeRoom = manual.rooms.find(r => r.id === activeRoomId) ?? null

  const addRoom = (template: RoomTemplate) => {
    const next: ManualRoom = {
      id: uid('room'),
      name: template.name,
      purpose: template.purpose,
      width: template.width,
      height: template.height,
      x: 20 + (manual.rooms.length % 4) * 24,
      y: 16 + (manual.rooms.length % 3) * 22,
    }
    setManual(prev => ({ ...prev, rooms: [...prev.rooms, next] }))
    setActiveRoomId(next.id)
  }

  const addOpening = (kind: 'door' | 'window', roomId: string) => {
    if (kind === 'door') {
      const next: ManualDoor = {
        id: uid('door'),
        roomId,
        side: selectedSide,
        offset: 0.5,
        width: openingWidth,
      }
      setManual(prev => ({ ...prev, doors: [...prev.doors, next] }))
      return
    }

    const next: ManualWindow = {
      id: uid('window'),
      roomId,
      side: selectedSide,
      offset: 0.5,
      width: openingWidth,
    }
    setManual(prev => ({ ...prev, windows: [...prev.windows, next] }))
  }

  const updateRoom = (id: string, patch: Partial<ManualRoom>) => {
    setManual(prev => ({
      ...prev,
      rooms: prev.rooms.map(room => (room.id === id ? { ...room, ...patch } : room)),
    }))
  }

  const removeRoom = (roomId: string) => {
    setManual(prev => ({
      ...prev,
      rooms: prev.rooms.filter(room => room.id !== roomId),
      doors: prev.doors.filter(door => door.roomId !== roomId),
      windows: prev.windows.filter(window => window.roomId !== roomId),
    }))
    setActiveRoomId(prev => (prev === roomId ? null : prev))
  }

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
      if (manual.rooms.length === 0) blocking.push('Добавьте минимум одну комнату.')
      if (!manual.totalArea || manual.totalArea <= 0) blocking.push('Укажите общую площадь (м²).')
      if (!manual.ceilingHeight || manual.ceilingHeight <= 0) blocking.push('Укажите высоту потолков.')
      if (manual.doors.length === 0) blocking.push('Добавьте хотя бы одну дверь.')

      for (let i = 0; i < manual.rooms.length; i += 1) {
        const room = manual.rooms[i]
        if (room.width < MIN_ROOM_SIZE || room.height < MIN_ROOM_SIZE) {
          blocking.push(`"${room.name}" слишком маленькая. Минимум 44×44.`)
          break
        }
      }

      for (let i = 0; i < manual.rooms.length; i += 1) {
        for (let j = i + 1; j < manual.rooms.length; j += 1) {
          if (rectsOverlap(manual.rooms[i], manual.rooms[j])) {
            blocking.push(`Комнаты "${manual.rooms[i].name}" и "${manual.rooms[j].name}" пересекаются.`)
            i = manual.rooms.length
            break
          }
        }
      }

      if (manual.windows.length === 0) {
        warnings.push('Не добавлены окна. Освещённость может быть оценена неточно.')
      }
    }

    if (selected === 'later') {
      warnings.push('Без плана точность сметы и визуализаций будет ниже.')
    }

    return { blocking, warnings }
  }, [layoutFile, manual, selected])

  useEffect(() => {
    if (!dragState) return

    const move = (e: PointerEvent) => {
      const board = boardRef.current
      if (!board) return
      const rect = board.getBoundingClientRect()
      const scaleX = rect.width / BOARD_WIDTH
      const scaleY = rect.height / BOARD_HEIGHT
      const dx = (e.clientX - dragState.startClientX) / scaleX
      const dy = (e.clientY - dragState.startClientY) / scaleY

      setManual(prev => ({
        ...prev,
        rooms: prev.rooms.map(room => {
          if (room.id !== dragState.roomId) return room
          const x = Math.max(0, Math.min(BOARD_WIDTH - room.width, dragState.startRoomX + dx))
          const y = Math.max(0, Math.min(BOARD_HEIGHT - room.height, dragState.startRoomY + dy))
          return { ...room, x: Math.round(x), y: Math.round(y) }
        }),
      }))
    }

    const up = () => setDragState(null)
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
    return () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
    }
  }, [dragState])

  const canContinue = selected !== undefined && validation.blocking.length === 0

  const continueFlow = () => {
    if (selected === 'upload') {
      onNext({ layoutSource: 'upload', layoutFile, manualLayout: undefined })
      return
    }
    if (selected === 'manual') {
      onNext({ layoutSource: 'manual', manualLayout: manual, layoutFile: undefined })
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
          <p className={styles.description}>Соберите план как в room planner: комнаты, двери и окна</p>
        </div>

        <div className={styles.cards} role="group" aria-label="Способ передачи планировки">
          {OPTIONS.map(({ value, label, sub, Icon }) => {
            const isSelected = selected === value
            return (
              <button
                key={value}
                className={`${styles.card} ${isSelected ? styles.cardSelected : ''}`}
                onClick={() => setSelected(value)}
                aria-pressed={isSelected}
              >
                <div className={styles.iconWrap}><Icon /></div>
                <div className={styles.cardText}>
                  <span className={styles.cardLabel}>{label}</span>
                  <span className={styles.cardSub}>{sub}</span>
                </div>
                <div className={`${styles.dot} ${isSelected ? styles.dotSelected : ''}`} />
              </button>
            )
          })}
        </div>

        {selected === 'upload' && (
          <section className={styles.panel}>
            <h2 className={styles.panelTitle}>Файл планировки</h2>
            <input
              ref={fileInputRef}
              className={styles.hiddenInput}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (!file) return
                setLayoutFile({ name: file.name, size: file.size, type: file.type || 'unknown' })
              }}
            />
            <button className={styles.uploadZone} onClick={() => fileInputRef.current?.click()}>
              <span className={styles.uploadBig}>Нажмите для выбора файла</span>
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
                  value={manual.totalArea ?? ''}
                  onChange={(e) => {
                    const v = e.currentTarget.value
                    setManual(prev => ({ ...prev, totalArea: v === '' ? null : Number(v) }))
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
                  value={manual.ceilingHeight ?? ''}
                  onChange={(e) => {
                    const v = e.currentTarget.value
                    setManual(prev => ({ ...prev, ceilingHeight: v === '' ? null : Number(v) }))
                  }}
                />
              </label>
            </div>

            <div className={styles.toolsRow}>
              <span className={styles.toolTitle}>Режим:</span>
              <button className={`${styles.modeBtn} ${toolMode === 'move' ? styles.modeBtnActive : ''}`} onClick={() => setToolMode('move')}>
                Двигать
              </button>
              <button className={`${styles.modeBtn} ${toolMode === 'door' ? styles.modeBtnActive : ''}`} onClick={() => setToolMode('door')}>
                Дверь
              </button>
              <button className={`${styles.modeBtn} ${toolMode === 'window' ? styles.modeBtnActive : ''}`} onClick={() => setToolMode('window')}>
                Окно
              </button>
            </div>

            <div className={styles.templateRow}>
              {ROOM_TEMPLATES.map(t => (
                <button key={t.name} className={styles.templateChip} onClick={() => addRoom(t)}>
                  + {t.name}
                </button>
              ))}
            </div>

            <div ref={boardRef} className={styles.board}>
              {manual.rooms.map(room => (
                <button
                  key={room.id}
                  className={`${styles.room} ${activeRoomId === room.id ? styles.roomActive : ''}`}
                  style={{
                    left: `${(room.x / BOARD_WIDTH) * 100}%`,
                    top: `${(room.y / BOARD_HEIGHT) * 100}%`,
                    width: `${(room.width / BOARD_WIDTH) * 100}%`,
                    height: `${(room.height / BOARD_HEIGHT) * 100}%`,
                  }}
                  onClick={() => {
                    setActiveRoomId(room.id)
                    if (toolMode === 'door' || toolMode === 'window') {
                      addOpening(toolMode, room.id)
                    }
                  }}
                  onPointerDown={(e) => {
                    if (toolMode !== 'move') return
                    setActiveRoomId(room.id)
                    setDragState({
                      roomId: room.id,
                      startClientX: e.clientX,
                      startClientY: e.clientY,
                      startRoomX: room.x,
                      startRoomY: room.y,
                    })
                  }}
                >
                  <span className={styles.roomName}>{room.name}</span>
                  <span className={styles.roomDims}>{room.width}×{room.height}</span>

                  {manual.doors
                    .filter(d => d.roomId === room.id)
                    .map(door => (
                      <span key={door.id} className={styles.opening} style={openingStyle('door', door.side, door.offset, door.width, room)} />
                    ))}

                  {manual.windows
                    .filter(w => w.roomId === room.id)
                    .map(windowItem => (
                      <span key={windowItem.id} className={styles.opening} style={openingStyle('window', windowItem.side, windowItem.offset, windowItem.width, room)} />
                    ))}
                </button>
              ))}
            </div>

            {activeRoom && (
              <div className={styles.roomEditor}>
                <h3 className={styles.subTitle}>Активная комната</h3>
                <div className={styles.inputsGrid}>
                  <label className={styles.field}>
                    <span>Название</span>
                    <input value={activeRoom.name} onChange={(e) => updateRoom(activeRoom.id, { name: e.currentTarget.value })} />
                  </label>
                  <label className={styles.field}>
                    <span>Назначение</span>
                    <select value={activeRoom.purpose} onChange={(e) => updateRoom(activeRoom.id, { purpose: e.currentTarget.value })}>
                      {PURPOSES.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </label>
                  <label className={styles.field}>
                    <span>Ширина</span>
                    <input
                      type="number"
                      min={MIN_ROOM_SIZE}
                      max={BOARD_WIDTH - activeRoom.x}
                      value={activeRoom.width}
                      onChange={(e) => updateRoom(activeRoom.id, { width: Number(e.currentTarget.value) })}
                    />
                  </label>
                  <label className={styles.field}>
                    <span>Высота</span>
                    <input
                      type="number"
                      min={MIN_ROOM_SIZE}
                      max={BOARD_HEIGHT - activeRoom.y}
                      value={activeRoom.height}
                      onChange={(e) => updateRoom(activeRoom.id, { height: Number(e.currentTarget.value) })}
                    />
                  </label>
                </div>

                <div className={styles.toolsRow}>
                  <span className={styles.toolTitle}>Сторона:</span>
                  {SIDES.map(side => (
                    <button key={side} className={`${styles.sideBtn} ${selectedSide === side ? styles.sideBtnActive : ''}`} onClick={() => setSelectedSide(side)}>
                      {side}
                    </button>
                  ))}
                </div>
                <label className={styles.field}>
                  <span>Ширина проёма / окна (см)</span>
                  <input
                    type="number"
                    min={60}
                    max={160}
                    step={5}
                    value={openingWidth}
                    onChange={(e) => setOpeningWidth(Number(e.currentTarget.value))}
                  />
                </label>

                <div className={styles.doorTags}>
                  {manual.doors.filter(d => d.roomId === activeRoom.id).map(door => (
                    <button
                      key={door.id}
                      className={styles.tag}
                      onClick={() => setManual(prev => ({ ...prev, doors: prev.doors.filter(d => d.id !== door.id) }))}
                    >
                      Дверь {door.side} ×{door.width}
                    </button>
                  ))}
                  {manual.windows.filter(w => w.roomId === activeRoom.id).map(windowItem => (
                    <button
                      key={windowItem.id}
                      className={styles.tag}
                      onClick={() => setManual(prev => ({ ...prev, windows: prev.windows.filter(w => w.id !== windowItem.id) }))}
                    >
                      Окно {windowItem.side} ×{windowItem.width}
                    </button>
                  ))}
                </div>

                <button className={styles.dangerBtn} onClick={() => removeRoom(activeRoom.id)}>
                  Удалить комнату
                </button>
              </div>
            )}
          </section>
        )}

        {(validation.blocking.length > 0 || validation.warnings.length > 0) && (
          <section className={styles.validationPanel}>
            {validation.blocking.map(item => (
              <p key={item} className={styles.validationError}>• {item}</p>
            ))}
            {validation.warnings.map(item => (
              <p key={item} className={styles.validationWarn}>• {item}</p>
            ))}
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
