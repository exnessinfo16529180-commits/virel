import { useState } from 'react'
import type { FlowState, DeliverySlot } from '../types/flow'
import { BackButton } from '../components/BackButton'
import styles from './DeliveryScreen.module.css'

interface Props {
  initialState?: FlowState
  onNext: (update: Partial<FlowState>) => void
  onBack?: () => void
}

type TimeSlot = DeliverySlot['timeSlot']

const TIME_SLOTS: { value: TimeSlot; label: string; range: string }[] = [
  { value: 'morning',   label: 'Утро',     range: '09:00 – 12:00' },
  { value: 'afternoon', label: 'День',     range: '12:00 – 17:00' },
  { value: 'evening',   label: 'Вечер',    range: '17:00 – 21:00' },
]

function getAvailableDates(): { iso: string; label: string; day: string }[] {
  const dates: { iso: string; label: string; day: string }[] = []
  const days = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб']
  const months = ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек']
  const now = new Date()
  for (let i = 2; i <= 16; i++) {
    const d = new Date(now)
    d.setDate(now.getDate() + i)
    if (d.getDay() === 0 || d.getDay() === 6) continue  // skip weekends
    const iso = d.toISOString().split('T')[0]
    const label = `${d.getDate()} ${months[d.getMonth()]}`
    const day = days[d.getDay()]
    dates.push({ iso, label, day })
    if (dates.length >= 7) break
  }
  return dates
}

export function DeliveryScreen({ initialState, onNext, onBack }: Props) {
  const [date, setDate] = useState<string | undefined>(initialState?.deliverySlot?.date)
  const [timeSlot, setTimeSlot] = useState<TimeSlot | undefined>(initialState?.deliverySlot?.timeSlot)

  const isValid = !!date && !!timeSlot
  const availableDates = getAvailableDates()

  return (
    <div className={styles.root}>
      <header className={styles.header}>
        {onBack && <BackButton onClick={onBack} />}
        <span className={styles.step}>Шаг 11 / 16</span>
      </header>

      <main className={styles.main}>
        <div className={styles.intro}>
          <h1 className={styles.headline}>Доставка</h1>
          <p className={styles.description}>Выберите удобное время для доставки материалов</p>
        </div>

        {/* Date picker */}
        <div className={styles.section}>
          <span className={styles.sectionLabel}>Дата доставки</span>
          <div className={styles.dateGrid} role="group" aria-label="Выберите дату доставки">
            {availableDates.map(({ iso, label, day }) => {
              const isSelected = date === iso
              return (
                <button
                  key={iso}
                  type="button"
                  className={`${styles.dateBtn} ${isSelected ? styles.dateBtnActive : ''}`}
                  onClick={() => setDate(iso)}
                  aria-pressed={isSelected}
                  aria-label={`${day}, ${label}`}
                >
                  <span className={styles.dateDay}>{day}</span>
                  <span className={styles.dateNum}>{label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Time slot */}
        <div className={styles.section}>
          <span className={styles.sectionLabel}>Временной слот</span>
          <div className={styles.timeSlots} role="group" aria-label="Выберите время доставки">
            {TIME_SLOTS.map(({ value, label, range }) => {
              const isSelected = timeSlot === value
              return (
                <button
                  key={value}
                  type="button"
                  className={`${styles.timeSlot} ${isSelected ? styles.timeSlotActive : ''}`}
                  onClick={() => setTimeSlot(value)}
                  aria-pressed={isSelected}
                >
                  <span className={styles.timeLabel}>{label}</span>
                  <span className={styles.timeRange}>{range}</span>
                </button>
              )
            })}
          </div>
        </div>

        {date && timeSlot && (
          <p className={styles.confirmation}>
            {availableDates.find(d => d.iso === date)?.label},{' '}
            {TIME_SLOTS.find(s => s.value === timeSlot)?.range}
          </p>
        )}
      </main>

      <footer className={styles.footer}>
        <button
          className={styles.cta}
          disabled={!isValid}
          onClick={() => isValid && onNext({ deliverySlot: { date: date!, timeSlot: timeSlot! } })}
        >
          Подтвердить доставку
        </button>
      </footer>
    </div>
  )
}
