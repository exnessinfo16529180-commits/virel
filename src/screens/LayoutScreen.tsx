import { useMemo, useRef, useState } from 'react'
import type { FlowState, LayoutFileMeta, LayoutSource, ManualLayoutDraft, ManualOpening, ManualRoom, ApartmentType } from '../types/flow'
import styles from './LayoutScreen.module.css'

interface Props {
  initialState?: FlowState
  onNext: (update: Partial<FlowState>) => void
}

type WizardStep = 1 | 2 | 3
type OpeningKind = 'door' | 'window'

const ROOM_PURPOSES = ['Жилая', 'Кухня', 'Санузел', 'Коридор', 'Кабинет', 'Гардероб']
const WALL_SIDES = [
  { value: 'top', label: 'Верхняя' },
  { value: 'right', label: 'Правая' },
  { value: 'bottom', label: 'Нижняя' },
  { value: 'left', label: 'Левая' },
] as const

const APARTMENT_TYPES: { value: ApartmentType; label: string }[] = [
  { value: 'studio', label: 'Студия' },
  { value: '1k', label: '1-комнатная' },
  { value: '2k', label: '2-комнатная' },
  { value: '3k', label: '3-комнатная' },
  { value: 'custom', label: 'Своя планировка' },
]

const OPTIONS: { value: LayoutSource; title: string; sub: string }[] = [
  { value: 'upload', title: 'Загрузить документ', sub: 'PDF/JPG/PNG до 20MB' },
  { value: 'manual', title: 'Ввести вручную', sub: 'Пошагово: база → комнаты → двери/окна' },
  { value: 'later', title: 'Пропустить пока', sub: 'Продолжить без точной планировки' },
]

function uid(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`
}

function roomArea(room: ManualRoom) {
  return room.lengthM * room.widthM
}

function sumRoomsArea(rooms: ManualRoom[]) {
  return rooms.reduce((sum, room) => sum + roomArea(room), 0)
}

function normalizeDraft(initial?: ManualLayoutDraft): ManualLayoutDraft {
  if (!initial) {
    return {
      totalArea: null,
      ceilingHeight: null,
      planner: { apartmentType: 'custom', stepCompleted: 1 },
      rooms: [],
      openings: [],
      walls: [],
      doors: [],
      windows: [],
    }
  }

  const rooms: ManualRoom[] = (initial.rooms ?? []).map((room, idx) => {
    const legacy = room as unknown as { lengthM?: number; widthM?: number; width?: number; height?: number; purpose?: string; name?: string }
    const lengthM = legacy.lengthM ?? (legacy.width ? Number((legacy.width / 24).toFixed(1)) : 4)
    const widthM = legacy.widthM ?? (legacy.height ? Number((legacy.height / 24).toFixed(1)) : 3.2)
    return {
      id: room.id ?? uid('room'),
      name: room.name || `Комната ${idx + 1}`,
      purpose: legacy.purpose || 'Жилая',
      lengthM: Number(lengthM),
      widthM: Number(widthM),
    }
  })

  const openings: ManualOpening[] = initial.openings ?? []

  return {
    totalArea: initial.totalArea ?? null,
    ceilingHeight: initial.ceilingHeight ?? null,
    planner: {
      apartmentType: initial.planner?.apartmentType ?? 'custom',
      stepCompleted: initial.planner?.stepCompleted ?? 1,
    },
    rooms,
    openings,
    walls: initial.walls ?? [],
    doors: initial.doors ?? [],
    windows: initial.windows ?? [],
  }
}

function defaultRoomsByType(type: ApartmentType): ManualRoom[] {
  if (type === 'studio') {
    return [
      { id: uid('room'), name: 'Студия', purpose: 'Жилая', lengthM: 6, widthM: 4.5 },
      { id: uid('room'), name: 'Санузел', purpose: 'Санузел', lengthM: 2.2, widthM: 1.8 },
    ]
  }
  if (type === '1k') {
    return [
      { id: uid('room'), name: 'Комната', purpose: 'Жилая', lengthM: 5, widthM: 3.8 },
      { id: uid('room'), name: 'Кухня', purpose: 'Кухня', lengthM: 3.2, widthM: 2.8 },
      { id: uid('room'), name: 'Санузел', purpose: 'Санузел', lengthM: 2.2, widthM: 1.8 },
    ]
  }
  if (type === '2k') {
    return [
      { id: uid('room'), name: 'Гостиная', purpose: 'Жилая', lengthM: 5.2, widthM: 3.9 },
      { id: uid('room'), name: 'Спальня', purpose: 'Жилая', lengthM: 4.1, widthM: 3.3 },
      { id: uid('room'), name: 'Кухня', purpose: 'Кухня', lengthM: 3.3, widthM: 2.9 },
      { id: uid('room'), name: 'Санузел', purpose: 'Санузел', lengthM: 2.3, widthM: 1.8 },
    ]
  }
  if (type === '3k') {
    return [
      { id: uid('room'), name: 'Гостиная', purpose: 'Жилая', lengthM: 5.4, widthM: 4.1 },
      { id: uid('room'), name: 'Спальня 1', purpose: 'Жилая', lengthM: 4.2, widthM: 3.3 },
      { id: uid('room'), name: 'Спальня 2', purpose: 'Жилая', lengthM: 3.8, widthM: 3.1 },
      { id: uid('room'), name: 'Кухня', purpose: 'Кухня', lengthM: 3.4, widthM: 3.0 },
      { id: uid('room'), name: 'Санузел', purpose: 'Санузел', lengthM: 2.4, widthM: 1.9 },
    ]
  }
  return []
}

function createOpening(roomId?: string): ManualOpening {
  return {
    id: uid('opening'),
    roomId: roomId ?? '',
    kind: 'door',
    wall: 'top',
    widthCm: 90,
    heightCm: 210,
    sillHeightCm: 90,
  }
}

export function LayoutScreen({ initialState, onNext }: Props) {
  const [selected, setSelected] = useState<LayoutSource | undefined>(initialState?.layoutSource)
  const [layoutFile, setLayoutFile] = useState<LayoutFileMeta | undefined>(initialState?.layoutFile)
  const [draft, setDraft] = useState<ManualLayoutDraft>(() => normalizeDraft(initialState?.manualLayout))
  const [wizardStep, setWizardStep] = useState<WizardStep>(() => (initialState?.manualLayout?.planner?.stepCompleted ?? 1) as WizardStep)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const blocking = useMemo(() => {
    const errors: string[] = []

    if (!selected) {
      errors.push('Выберите способ передачи планировки.')
      return errors
    }

    if (selected === 'upload') {
      if (!layoutFile) errors.push('Добавьте файл планировки.')
      return errors
    }

    if (selected === 'manual') {
      if (!draft.totalArea || draft.totalArea <= 0) errors.push('Укажите общую площадь.')
      if (!draft.ceilingHeight || draft.ceilingHeight <= 0) errors.push('Укажите высоту потолков.')
      if (draft.rooms.length === 0) errors.push('Добавьте минимум одну комнату.')

      for (const room of draft.rooms) {
        if (!room.name.trim()) errors.push('У каждой комнаты должно быть название.')
        if (!room.lengthM || !room.widthM || room.lengthM <= 0 || room.widthM <= 0) {
          errors.push(`Проверьте размеры комнаты "${room.name || 'без названия'}".`)
          break
        }
      }

      if (!draft.openings.some(o => o.kind === 'door')) {
        errors.push('Добавьте минимум одну дверь.')
      }

      for (const opening of draft.openings) {
        if (!opening.roomId) {
          errors.push('Укажите комнату для каждого проёма.')
          break
        }
        if (!opening.widthCm || !opening.heightCm || opening.widthCm <= 0 || opening.heightCm <= 0) {
          errors.push('Проверьте размеры двери/окна.')
          break
        }
        if (opening.kind === 'window' && (!opening.sillHeightCm || opening.sillHeightCm <= 0)) {
          errors.push('Для окна укажите высоту подоконника.')
          break
        }
      }
    }

    return errors
  }, [draft, layoutFile, selected])

  const warnings = useMemo(() => {
    const list: string[] = []
    if (selected === 'manual' && draft.totalArea && draft.totalArea > 0) {
      const roomsArea = sumRoomsArea(draft.rooms)
      if (roomsArea > 0) {
        const ratio = Math.abs(roomsArea - draft.totalArea) / draft.totalArea
        if (ratio > 0.35) {
          list.push('Сумма площадей комнат заметно отличается от общей площади.')
        }
      }
      if (!draft.openings.some(o => o.kind === 'window')) {
        list.push('Желательно добавить хотя бы одно окно.')
      }
    }
    if (selected === 'later') {
      list.push('Без планировки точность сметы и визуализаций будет ниже.')
    }
    return list
  }, [draft, selected])

  const canNextStep1 = draft.totalArea !== null && draft.totalArea > 0 && draft.ceilingHeight !== null && draft.ceilingHeight > 0
  const canNextStep2 = draft.rooms.length > 0 && draft.rooms.every(r => r.name.trim() && r.lengthM > 0 && r.widthM > 0)
  const canContinue =
    selected !== undefined &&
    ((selected === 'manual' && wizardStep < 3)
      ? (wizardStep === 1 ? canNextStep1 : canNextStep2)
      : blocking.length === 0)

  const roomsArea = sumRoomsArea(draft.rooms)

  const updateRoom = (roomId: string, patch: Partial<ManualRoom>) => {
    setDraft(prev => ({
      ...prev,
      rooms: prev.rooms.map(room => (room.id === roomId ? { ...room, ...patch } : room)),
    }))
  }

  const removeRoom = (roomId: string) => {
    setDraft(prev => ({
      ...prev,
      rooms: prev.rooms.filter(room => room.id !== roomId),
      openings: prev.openings.filter(opening => opening.roomId !== roomId),
    }))
  }

  const updateOpening = (openingId: string, patch: Partial<ManualOpening>) => {
    setDraft(prev => ({
      ...prev,
      openings: prev.openings.map(item => (item.id === openingId ? { ...item, ...patch } : item)),
    }))
  }

  const next = () => {
    if (!selected) return

    if (selected === 'manual' && wizardStep < 3) {
      const step = wizardStep === 1 ? 2 : 3
      setWizardStep(step)
      setDraft(prev => ({
        ...prev,
        planner: {
          apartmentType: prev.planner?.apartmentType ?? 'custom',
          stepCompleted: step,
        },
      }))
      return
    }

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
          <p className={styles.description}>Понятный мастер для смартфона: без сложного рисования</p>
        </div>

        <div className={styles.sourceCards}>
          {OPTIONS.map(option => {
            const isSelected = selected === option.value
            return (
              <button
                key={option.value}
                className={`${styles.sourceCard} ${isSelected ? styles.sourceCardSelected : ''}`}
                onClick={() => setSelected(option.value)}
              >
                <div className={styles.sourceText}>
                  <span className={styles.sourceTitle}>{option.title}</span>
                  <span className={styles.sourceSub}>{option.sub}</span>
                </div>
                <span className={`${styles.dot} ${isSelected ? styles.dotSelected : ''}`} />
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
                setLayoutFile({
                  name: file.name,
                  size: file.size,
                  type: file.type || 'unknown',
                })
              }}
            />
            <button className={styles.uploadZone} onClick={() => fileInputRef.current?.click()}>
              <span className={styles.uploadBig}>Нажмите, чтобы выбрать файл</span>
              <span className={styles.uploadSmall}>PDF / JPG / PNG до 20MB</span>
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
            <div className={styles.wizardHeader}>
              <span className={styles.wizardTitle}>Пошаговый планировщик</span>
              <span className={styles.wizardStep}>{wizardStep}/3</span>
            </div>

            <div className={styles.progress}>
              <span className={`${styles.progressDot} ${wizardStep >= 1 ? styles.progressDotActive : ''}`}>1</span>
              <span className={`${styles.progressLine} ${wizardStep >= 2 ? styles.progressLineActive : ''}`} />
              <span className={`${styles.progressDot} ${wizardStep >= 2 ? styles.progressDotActive : ''}`}>2</span>
              <span className={`${styles.progressLine} ${wizardStep >= 3 ? styles.progressLineActive : ''}`} />
              <span className={`${styles.progressDot} ${wizardStep >= 3 ? styles.progressDotActive : ''}`}>3</span>
            </div>

            {wizardStep === 1 && (
              <>
                <h3 className={styles.subTitle}>1. База объекта</h3>
                <div className={styles.grid2}>
                  <label className={styles.field}>
                    <span>Общая площадь (м²)</span>
                    <input
                      type="number"
                      min={1}
                      step={0.1}
                      value={draft.totalArea ?? ''}
                      onChange={(e) => {
                        const value = e.currentTarget.value
                        setDraft(prev => ({ ...prev, totalArea: value === '' ? null : Number(value) }))
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
                        const value = e.currentTarget.value
                        setDraft(prev => ({ ...prev, ceilingHeight: value === '' ? null : Number(value) }))
                      }}
                    />
                  </label>
                </div>

                <label className={styles.field}>
                  <span>Тип квартиры</span>
                  <select
                    value={draft.planner?.apartmentType ?? 'custom'}
                    onChange={(e) => {
                      const nextType = e.currentTarget.value as ApartmentType
                      setDraft(prev => ({
                        ...prev,
                        planner: { apartmentType: nextType, stepCompleted: prev.planner?.stepCompleted ?? 1 },
                        rooms: nextType === 'custom' ? prev.rooms : defaultRoomsByType(nextType),
                        openings: nextType === 'custom' ? prev.openings : [],
                      }))
                    }}
                  >
                    {APARTMENT_TYPES.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </label>
              </>
            )}

            {wizardStep === 2 && (
              <>
                <div className={styles.sectionHeader}>
                  <h3 className={styles.subTitle}>2. Комнаты и размеры</h3>
                  <button
                    className={styles.ghostBtn}
                    onClick={() =>
                      setDraft(prev => ({
                        ...prev,
                        rooms: [
                          ...prev.rooms,
                          {
                            id: uid('room'),
                            name: `Комната ${prev.rooms.length + 1}`,
                            purpose: 'Жилая',
                            lengthM: 4,
                            widthM: 3.2,
                          },
                        ],
                      }))
                    }
                  >
                    + Добавить комнату
                  </button>
                </div>

                {draft.rooms.length === 0 && (
                  <p className={styles.emptyHint}>Добавьте минимум одну комнату.</p>
                )}

                <div className={styles.roomList}>
                  {draft.rooms.map(room => (
                    <article key={room.id} className={styles.roomCard}>
                      <div className={styles.grid2}>
                        <label className={styles.field}>
                          <span>Название</span>
                          <input value={room.name} onChange={(e) => updateRoom(room.id, { name: e.currentTarget.value })} />
                        </label>
                        <label className={styles.field}>
                          <span>Назначение</span>
                          <select value={room.purpose} onChange={(e) => updateRoom(room.id, { purpose: e.currentTarget.value })}>
                            {ROOM_PURPOSES.map(item => (
                              <option key={item} value={item}>{item}</option>
                            ))}
                          </select>
                        </label>
                        <label className={styles.field}>
                          <span>Длина (м)</span>
                          <input
                            type="number"
                            min={1}
                            step={0.1}
                            value={room.lengthM}
                            onChange={(e) => updateRoom(room.id, { lengthM: Number(e.currentTarget.value) })}
                          />
                        </label>
                        <label className={styles.field}>
                          <span>Ширина (м)</span>
                          <input
                            type="number"
                            min={1}
                            step={0.1}
                            value={room.widthM}
                            onChange={(e) => updateRoom(room.id, { widthM: Number(e.currentTarget.value) })}
                          />
                        </label>
                      </div>
                      <div className={styles.roomMeta}>
                        <span>Площадь: {roomArea(room).toFixed(1)} м²</span>
                        <button className={styles.deleteBtn} onClick={() => removeRoom(room.id)}>Удалить</button>
                      </div>
                    </article>
                  ))}
                </div>

                <div className={styles.summaryCard}>
                  <span>Сумма площадей комнат: {roomsArea.toFixed(1)} м²</span>
                  <span>Общая площадь: {draft.totalArea?.toFixed(1) ?? '—'} м²</span>
                </div>
              </>
            )}

            {wizardStep === 3 && (
              <>
                <div className={styles.sectionHeader}>
                  <h3 className={styles.subTitle}>3. Двери и окна</h3>
                  <button
                    className={styles.ghostBtn}
                    onClick={() => setDraft(prev => ({ ...prev, openings: [...prev.openings, createOpening(prev.rooms[0]?.id)] }))}
                  >
                    + Добавить проём
                  </button>
                </div>

                {draft.openings.length === 0 && (
                  <p className={styles.emptyHint}>Добавьте хотя бы одну дверь.</p>
                )}

                <div className={styles.openingsList}>
                  {draft.openings.map(opening => (
                    <article key={opening.id} className={styles.openingCard}>
                      <div className={styles.grid2}>
                        <label className={styles.field}>
                          <span>Тип</span>
                          <select
                            value={opening.kind}
                            onChange={(e) => {
                              const nextKind = e.currentTarget.value as OpeningKind
                              updateOpening(opening.id, {
                                kind: nextKind,
                                widthCm: nextKind === 'door' ? 90 : 120,
                                heightCm: nextKind === 'door' ? 210 : 140,
                              })
                            }}
                          >
                            <option value="door">Дверь</option>
                            <option value="window">Окно</option>
                          </select>
                        </label>
                        <label className={styles.field}>
                          <span>Комната</span>
                          <select value={opening.roomId} onChange={(e) => updateOpening(opening.id, { roomId: e.currentTarget.value })}>
                            <option value="">Выберите</option>
                            {draft.rooms.map(room => (
                              <option key={room.id} value={room.id}>{room.name}</option>
                            ))}
                          </select>
                        </label>
                        <label className={styles.field}>
                          <span>Сторона стены</span>
                          <select value={opening.wall} onChange={(e) => updateOpening(opening.id, { wall: e.currentTarget.value as ManualOpening['wall'] })}>
                            {WALL_SIDES.map(side => (
                              <option key={side.value} value={side.value}>{side.label}</option>
                            ))}
                          </select>
                        </label>
                        <label className={styles.field}>
                          <span>Ширина (см)</span>
                          <input
                            type="number"
                            min={40}
                            step={1}
                            value={opening.widthCm}
                            onChange={(e) => updateOpening(opening.id, { widthCm: Number(e.currentTarget.value) })}
                          />
                        </label>
                        <label className={styles.field}>
                          <span>Высота (см)</span>
                          <input
                            type="number"
                            min={60}
                            step={1}
                            value={opening.heightCm}
                            onChange={(e) => updateOpening(opening.id, { heightCm: Number(e.currentTarget.value) })}
                          />
                        </label>
                        {opening.kind === 'window' && (
                          <label className={styles.field}>
                            <span>Высота подоконника (см)</span>
                            <input
                              type="number"
                              min={40}
                              step={1}
                              value={opening.sillHeightCm ?? 90}
                              onChange={(e) => updateOpening(opening.id, { sillHeightCm: Number(e.currentTarget.value) })}
                            />
                          </label>
                        )}
                      </div>
                      <button
                        className={styles.deleteBtn}
                        onClick={() => setDraft(prev => ({ ...prev, openings: prev.openings.filter(item => item.id !== opening.id) }))}
                      >
                        Удалить проём
                      </button>
                    </article>
                  ))}
                </div>
              </>
            )}
          </section>
        )}

        {(blocking.length > 0 || warnings.length > 0) && (
          <section className={styles.validationPanel}>
            {blocking.map(item => (
              <p key={item} className={styles.validationError}>• {item}</p>
            ))}
            {warnings.map(item => (
              <p key={item} className={styles.validationWarn}>• {item}</p>
            ))}
          </section>
        )}
      </main>

      <footer className={styles.footer}>
        <button
          className={styles.skipBtn}
          onClick={() => onNext({ layoutSource: 'later', layoutFile: undefined, manualLayout: undefined })}
        >
          Пропустить
        </button>

        {selected === 'manual' && wizardStep > 1 && (
          <button className={styles.backBtn} onClick={() => setWizardStep((wizardStep - 1) as WizardStep)}>
            Назад
          </button>
        )}

        <button className={styles.cta} disabled={!canContinue} onClick={next}>
          {selected === 'manual' && wizardStep < 3 ? 'Далее' : 'Продолжить'}
        </button>
      </footer>
    </div>
  )
}
