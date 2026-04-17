import { useState } from 'react'
import type { FlowState, PartialSurvey } from '../types/flow'
import { BackButton } from '../components/BackButton'
import styles from './PartialSurveyScreen.module.css'

interface Props {
  initialState?: FlowState
  onNext: (update: Partial<FlowState>) => void
  onBack?: () => void
}

const ROOMS = ['Гостиная', 'Спальня', 'Кухня', 'Санузел', 'Коридор', 'Кабинет']

const COVERAGE_OPTIONS: { value: PartialSurvey['coverageCondition']; label: string }[] = [
  { value: 'good', label: 'Хорошее' },
  { value: 'fair', label: 'Среднее' },
  { value: 'poor', label: 'Плохое' },
]

function defaultSurvey(existing?: PartialSurvey): PartialSurvey {
  return existing ?? {
    needsDemolition:   false,
    needsWallLeveling: false,
    needsFloorLeveling: false,
    coverageCondition: 'fair',
    localUpdateOnly:   false,
    affectedRooms:     [],
  }
}

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      className={`${styles.toggle} ${on ? styles.toggleOn : ''}`}
      onClick={onToggle}
    >
      <span className={styles.toggleThumb} />
    </button>
  )
}

export function PartialSurveyScreen({ initialState, onNext, onBack }: Props) {
  const [survey, setSurvey] = useState<PartialSurvey>(() =>
    defaultSurvey(initialState?.partialSurvey),
  )

  const set = <K extends keyof PartialSurvey>(key: K, value: PartialSurvey[K]) =>
    setSurvey(prev => ({ ...prev, [key]: value }))

  const toggleRoom = (room: string) =>
    setSurvey(prev => ({
      ...prev,
      affectedRooms: prev.affectedRooms.includes(room)
        ? prev.affectedRooms.filter(r => r !== room)
        : [...prev.affectedRooms, room],
    }))

  return (
    <div className={styles.root}>
      <header className={styles.header}>
        {onBack && <BackButton onClick={onBack} />}
        <span className={styles.step}>Шаг 2б</span>
      </header>

      <main className={styles.main}>
        <div className={styles.intro}>
          <h1 className={styles.headline}>Состояние объекта</h1>
          <p className={styles.description}>Поможет точно рассчитать состав работ и материалов</p>
        </div>

        <div className={styles.questions}>

          {/* Toggle rows */}
          {([
            ['needsDemolition',   'Нужен демонтаж',        'Снос перегородок, стяжки, покрытий'],
            ['needsWallLeveling', 'Выравнивание стен',      'Штукатурка, шпатлёвка'],
            ['needsFloorLeveling','Выравнивание пола',      'Стяжка или наливной пол'],
            ['localUpdateOnly',   'Только локальное обновление', 'Без демонтажа — покраска, ламинат, плитка'],
          ] as [keyof PartialSurvey, string, string][]).map(([key, label, hint]) => (
            <div key={key} className={styles.row}>
              <div className={styles.rowText}>
                <span className={styles.rowLabel}>{label}</span>
                <span className={styles.rowHint}>{hint}</span>
              </div>
              <Toggle
                on={survey[key] as boolean}
                onToggle={() => set(key, !(survey[key] as boolean))}
              />
            </div>
          ))}

          {/* Coverage condition segmented */}
          <div className={styles.segmentBlock}>
            <span className={styles.segmentLabel}>Состояние покрытий</span>
            <div className={styles.segment} role="group" aria-label="Состояние покрытий">
              {COVERAGE_OPTIONS.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  className={`${styles.segmentBtn} ${survey.coverageCondition === value ? styles.segmentBtnActive : ''}`}
                  onClick={() => set('coverageCondition', value)}
                  aria-pressed={survey.coverageCondition === value}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Affected rooms chip-selector */}
          <div className={styles.chipsBlock}>
            <span className={styles.chipsLabel}>Затронутые комнаты</span>
            <div className={styles.chips} role="group" aria-label="Выберите комнаты">
              {ROOMS.map(room => {
                const active = survey.affectedRooms.includes(room)
                return (
                  <button
                    key={room}
                    type="button"
                    className={`${styles.chip} ${active ? styles.chipActive : ''}`}
                    onClick={() => toggleRoom(room)}
                    aria-pressed={active}
                  >
                    {room}
                  </button>
                )
              })}
            </div>
          </div>

        </div>
      </main>

      <footer className={styles.footer}>
        <button
          className={styles.cta}
          onClick={() => onNext({ partialSurvey: survey })}
        >
          Продолжить
        </button>
      </footer>
    </div>
  )
}
