import { useState } from 'react'
import type { FlowState } from '../types/flow'
import styles from './ContractScreen.module.css'

interface Props {
  initialState?: FlowState
  onNext: (update: Partial<FlowState>) => void
}

const INCLUDED = [
  'Зафиксированный сценарий проекта',
  'Предварительная смета',
  'Пакет материалов',
  'Подобранный формат команды',
]

function GoldCheck() {
  return (
    <svg
      className={styles.checkIcon}
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="9" cy="9" r="8.25" stroke="#e9c176" strokeWidth="1.5" />
      <path
        d="M5.5 9.2L7.8 11.7L12.5 6.5"
        stroke="#e9c176"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function SuccessOrb() {
  return (
    <div className={styles.successOrb} aria-hidden="true">
      <div className={styles.successOrbRing} />
      <div className={styles.successOrbCore} />
    </div>
  )
}

export function ContractScreen({ onNext }: Props) {
  const [consent, setConsent]   = useState(false)
  const [launched, setLaunched] = useState(false)

  const handleLaunch = () => {
    setLaunched(true)
    onNext({ consentAccepted: true, projectLaunched: true })
  }

  if (launched) {
    return (
      <div className={styles.root}>
        <main className={styles.successMain}>
          <SuccessOrb />
          <div className={styles.successText}>
            <h2 className={styles.successHeadline}>Заявка отправлена</h2>
            <p className={styles.successDesc}>Ожидайте звонка от менеджера</p>
          </div>
        </main>
        <footer className={styles.footer}>
          <button
            className={styles.ctaSecondary}
            onClick={() => window.location.reload()}
          >
            Вернуться на главную
          </button>
        </footer>
      </div>
    )
  }

  return (
    <div className={styles.root}>
      <header className={styles.header}>
        <span className={styles.step}>Шаг 14 / 14</span>
      </header>

      <main className={styles.main}>
        <div className={styles.intro}>
          <h1 className={styles.headline}>Готово к запуску</h1>
          <p className={styles.description}>Мы подготовили основу для старта ремонта</p>
        </div>

        {/* What's included */}
        <div className={styles.includedCard}>
          <span className={styles.sectionLabel}>Что включено</span>
          <ul className={styles.includedList}>
            {INCLUDED.map(item => (
              <li key={item} className={styles.includedItem}>
                <GoldCheck />
                <span className={styles.includedText}>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Next step */}
        <div className={styles.nextCard}>
          <span className={styles.sectionLabel}>Следующий шаг</span>
          <p className={styles.nextText}>
            Менеджер свяжется в течение рабочего дня для подтверждения
            деталей и подписания договора.
          </p>
        </div>

        {/* Consent */}
        <label className={styles.consentRow}>
          <span
            className={`${styles.checkbox} ${consent ? styles.checkboxChecked : ''}`}
            role="checkbox"
            aria-checked={consent}
            tabIndex={0}
            onClick={() => setConsent(v => !v)}
            onKeyDown={e => (e.key === ' ' || e.key === 'Enter') && setConsent(v => !v)}
          >
            {consent && (
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
                <path
                  d="M1.5 5L4 7.5L8.5 2.5"
                  stroke="#412d00"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </span>
          <span className={styles.consentLabel}>
            Согласен с условиями и обработкой данных
          </span>
        </label>
      </main>

      <footer className={styles.footer}>
        <button
          className={styles.cta}
          disabled={!consent}
          onClick={handleLaunch}
        >
          Запустить проект
        </button>
        <button
          className={styles.downloadLink}
          onClick={() => {/* stub — no file yet */}}
          aria-label="Скачать резюме проекта (недоступно)"
        >
          Скачать резюме
        </button>
      </footer>
    </div>
  )
}
