import { useEffect, useMemo, useRef, useState } from 'react'
import type { ReactElement } from 'react'
import type {
  FlowState,
  LayoutFileMeta,
  LayoutSource,
  ManualDoor,
  ManualLayoutDraft,
  ManualRoom,
} from '../types/flow'
import styles from './LayoutScreen.module.css'

interface Props {
  initialState?: FlowState
  onNext: (update: Partial<FlowState>) => void
}

const BOARD_WIDTH = 320
const BOARD_HEIGHT = 220
const MIN_ROOM_SIZE = 48

function uid(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`
}

function UploadIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 36 36" fill="none" aria-hidden="true">
      <rect x="7" y="4" width="22" height="24" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M18 22V30" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M14 26L18 22L22 26" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function ManualIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 36 36" fill="none" aria-hidden="true">
      <rect x="4" y="4" width="28" height="22" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
      <line x1="18" y1="4" x2="18" y2="26" stroke="currentColor" strokeWidth="1.25"/>
      <line x1="4" y1="15" x2="32" y2="15" stroke="currentColor" strokeWidth="1.25"/>
      <path d="M26 30L28 28L30 30L28 32L26 30Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
      <line x1="28" y1="28" x2="23" y2="33" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  )
}

function LaterIcon() {
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
    sub: 'Комнаты, размеры и двери в 2D-конструкторе',
    Icon: ManualIcon,
  },
  {
    value: 'later',
    label: 'Пропустить пока',
    sub: 'Продолжим без плана (точность ниже)',
    Icon: LaterIcon,
  },
]

const PURPOSES = ['Жилая', 'Кухня', 'Санузел', 'Коридор', 'Кабинет', 'Гардероб']

function rectsOverlap(a: ManualRoom, b: ManualRoom) {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  )
}

function fmtMb(bytes: number) {
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function createDefaultRoom(index: number): ManualRoom {
  return {
    id: uid('room'),
    name: `Комната ${index + 1}`,
    purpose: index === 0 ? 'Жилая' : 'Кухня',
    x: 24 + (index % 3) * 34,
    y: 20 + (index % 2) * 28,
    width: 96,
    height: 72,
  }
}

export function LayoutScreen({ initialState, onNext }: Props) {
  const [selected, setSelected] = useState<LayoutSource | undefined>(initialState?.layoutSource)
  const [layoutFile, setLayoutFile] = useState<LayoutFileMeta | undefined>(initialState?.layoutFile)
  const [manual, setManual] = useState<ManualLayoutDraft>(
    initialState?.manualLayout ?? {
      totalArea: null,
      ceilingHeight: null,
      rooms: [createDefaultRoom(0)],
      doors: [],
    },
  )
  const [activeRoomId, setActiveRoomId] = useState<string | null>(
    initialState?.manualLayout?.rooms[0]?.id ?? null,
  )
  const [doorFromRoomId, setDoorFromRoomId] = useState<string>('')
  const [doorToRoomId, setDoorToRoomId] = useState<string>('')
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

  const validation = useMemo(() => {
    const blocking: string[] = []
    const warnings: string[] = []

    if (!selected) {
      blocking.push('Выберите способ передачи планировки.')
      return { blocking, warnings }
    }

    if (selected === 'upload') {
      if (!layoutFile) {
        blocking.push('Добавьте файл планировки перед продолжением.')
      }
      return { blocking, warnings }
    }

    if (selected === 'manual') {
      if (manual.rooms.length === 0) {
        blocking.push('Добавьте минимум одну комнату.')
      }
      if (!manual.totalArea || manual.totalArea <= 0) {
        blocking.push('Укажите общую площадь в м².')
      }
      if (!manual.ceilingHeight || manual.ceilingHeight <= 0) {
        blocking.push('Укажите высоту потолков.')
      }
      if (manual.rooms.length > 1 && manual.doors.length === 0) {
        blocking.push('Добавьте минимум одну дверь между комнатами.')
      }

      for (let i = 0; i < manual.rooms.length; i += 1) {
        const room = manual.rooms[i]
        if (room.width < MIN_ROOM_SIZE || room.height < MIN_ROOM_SIZE) {
          blocking.push(`"${room.name}" слишком маленькая. Минимум 48×48.`)
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

      if (manual.totalArea && manual.totalArea > 0) {
        const roomsArea = manual.rooms.reduce((sum, room) => sum + (room.width * room.height) / 100, 0)
        const diffRatio = Math.abs(roomsArea - manual.totalArea) / manual.totalArea
        if (diffRatio > 0.35) {
          warnings.push('Сумма площадей комнат сильно отличается от общей площади. Проверьте размеры.')
        }
      }
    }

    if (selected === 'later') {
      warnings.push('Без планировки точность сметы и концептов будет ниже.')
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
          const nextX = Math.max(0, Math.min(BOARD_WIDTH - room.width, dragState.startRoomX + dx))
          const nextY = Math.max(0, Math.min(BOARD_HEIGHT - room.height, dragState.startRoomY + dy))
          return { ...room, x: Math.round(nextX), y: Math.round(nextY) }
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

  const updateRoom = (id: string, patch: Partial<ManualRoom>) => {
    setManual(prev => ({
      ...prev,
      rooms: prev.rooms.map(room => (room.id === id ? { ...room, ...patch } : room)),
    }))
  }

  const removeRoom = (id: string) => {
    setManual(prev => ({
      ...prev,
      rooms: prev.rooms.filter(room => room.id !== id),
      doors: prev.doors.filter(door => door.fromRoomId !== id && door.toRoomId !== id),
    }))
    setActiveRoomId(prev => (prev === id ? null : prev))
  }

  const addDoor = () => {
    if (!doorFromRoomId || !doorToRoomId || doorFromRoomId === doorToRoomId) return
    const exists = manual.doors.some(
      door =>
        (door.fromRoomId === doorFromRoomId && door.toRoomId === doorToRoomId) ||
        (door.fromRoomId === doorToRoomId && door.toRoomId === doorFromRoomId),
    )
    if (exists) return

    const nextDoor: ManualDoor = {
      id: uid('door'),
      fromRoomId: doorFromRoomId,
      toRoomId: doorToRoomId,
      width: 90,
    }
    setManual(prev => ({ ...prev, doors: [...prev.doors, nextDoor] }))
    setDoorFromRoomId('')
    setDoorToRoomId('')
  }

  const handleContinue = () => {
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

  const canContinue = selected !== undefined && validation.blocking.length === 0

  return (
    <div className={styles.root}>
      <header className={styles.header}>
        <span className={styles.step}>Шаг 3 / 14</span>
      </header>

      <main className={styles.main}>
        <div className={styles.intro}>
          <h1 className={styles.headline}>Планировка и размеры</h1>
          <p className={styles.description}>Передайте план документом или соберите вручную в 2D</p>
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
                <div className={styles.iconWrap}>
                  <Icon />
                </div>
                <div className={styles.cardText}>
                  <span className={styles.cardLabel}>{label}</span>
                  <span className={styles.cardSub}>{sub}</span>
                </div>
                <div className={`${styles.dot} ${isSelected ? styles.dotSelected : ''}`} aria-hidden="true" />
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
              accept=".pdf,.png,.jpg,.jpeg"
              className={styles.hiddenInput}
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (!file) return
                setLayoutFile({
                  name: file.name,
                  size: file.size,
                  type: file.type || 'unknown',
                })
              }}
            />
            <button className={styles.uploadZone} onClick={() => fileInputRef.current?.click()}>
              <span className={styles.uploadBig}>Перетащите файл или нажмите для выбора</span>
              <span className={styles.uploadSmall}>PDF / JPG / PNG, до 20MB</span>
            </button>

            {layoutFile && (
              <div className={styles.fileMeta}>
                <span>{layoutFile.name}</span>
                <span>{fmtMb(layoutFile.size)}</span>
              </div>
            )}
          </section>
        )}

        {selected === 'manual' && (
          <section className={styles.panel}>
            <h2 className={styles.panelTitle}>2D-конструктор</h2>

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
                  onClick={() => setActiveRoomId(room.id)}
                  onPointerDown={(e) => {
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
                </button>
              ))}

              <svg className={styles.doorsSvg} viewBox={`0 0 ${BOARD_WIDTH} ${BOARD_HEIGHT}`} preserveAspectRatio="none">
                {manual.doors.map(door => {
                  const from = manual.rooms.find(r => r.id === door.fromRoomId)
                  const to = manual.rooms.find(r => r.id === door.toRoomId)
                  if (!from || !to) return null
                  const x1 = from.x + from.width / 2
                  const y1 = from.y + from.height / 2
                  const x2 = to.x + to.width / 2
                  const y2 = to.y + to.height / 2
                  return (
                    <line
                      key={door.id}
                      x1={x1}
                      y1={y1}
                      x2={x2}
                      y2={y2}
                      className={styles.doorLine}
                    />
                  )
                })}
              </svg>
            </div>

            <div className={styles.roomsRow}>
              <button
                className={styles.ghostBtn}
                onClick={() => {
                  const next = createDefaultRoom(manual.rooms.length)
                  setManual(prev => ({ ...prev, rooms: [...prev.rooms, next] }))
                  setActiveRoomId(next.id)
                }}
              >
                + Добавить комнату
              </button>
            </div>

            {activeRoom && (
              <div className={styles.roomEditor}>
                <h3 className={styles.subTitle}>Настройки комнаты</h3>
                <div className={styles.inputsGrid}>
                  <label className={styles.field}>
                    <span>Название</span>
                    <input value={activeRoom.name} onChange={(e) => updateRoom(activeRoom.id, { name: e.currentTarget.value })} />
                  </label>
                  <label className={styles.field}>
                    <span>Назначение</span>
                    <select value={activeRoom.purpose} onChange={(e) => updateRoom(activeRoom.id, { purpose: e.currentTarget.value })}>
                      {PURPOSES.map(purpose => (
                        <option key={purpose} value={purpose}>{purpose}</option>
                      ))}
                    </select>
                  </label>
                  <label className={styles.field}>
                    <span>X</span>
                    <input
                      type="number"
                      min={0}
                      max={BOARD_WIDTH - activeRoom.width}
                      value={activeRoom.x}
                      onChange={(e) => updateRoom(activeRoom.id, { x: Number(e.currentTarget.value) })}
                    />
                  </label>
                  <label className={styles.field}>
                    <span>Y</span>
                    <input
                      type="number"
                      min={0}
                      max={BOARD_HEIGHT - activeRoom.height}
                      value={activeRoom.y}
                      onChange={(e) => updateRoom(activeRoom.id, { y: Number(e.currentTarget.value) })}
                    />
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
                {manual.rooms.length > 1 && (
                  <button className={styles.dangerBtn} onClick={() => removeRoom(activeRoom.id)}>
                    Удалить комнату
                  </button>
                )}
              </div>
            )}

            <div className={styles.roomEditor}>
              <h3 className={styles.subTitle}>Двери между комнатами</h3>
              <div className={styles.doorsComposer}>
                <select value={doorFromRoomId} onChange={(e) => setDoorFromRoomId(e.currentTarget.value)}>
                  <option value="">Из комнаты</option>
                  {manual.rooms.map(room => (
                    <option key={room.id} value={room.id}>{room.name}</option>
                  ))}
                </select>
                <select value={doorToRoomId} onChange={(e) => setDoorToRoomId(e.currentTarget.value)}>
                  <option value="">В комнату</option>
                  {manual.rooms.map(room => (
                    <option key={room.id} value={room.id}>{room.name}</option>
                  ))}
                </select>
                <button className={styles.ghostBtn} onClick={addDoor}>+ Дверь</button>
              </div>

              {manual.doors.length > 0 && (
                <div className={styles.doorTags}>
                  {manual.doors.map(door => {
                    const from = manual.rooms.find(room => room.id === door.fromRoomId)?.name ?? 'Комната'
                    const to = manual.rooms.find(room => room.id === door.toRoomId)?.name ?? 'Комната'
                    return (
                      <button
                        key={door.id}
                        className={styles.tag}
                        onClick={() => {
                          setManual(prev => ({ ...prev, doors: prev.doors.filter(d => d.id !== door.id) }))
                        }}
                      >
                        {from} ↔ {to}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
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
        <button className={styles.cta} disabled={!canContinue} onClick={handleContinue}>
          Продолжить
        </button>
      </footer>
    </div>
  )
}
