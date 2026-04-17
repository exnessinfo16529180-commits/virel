import type { FlowState, BudgetRange } from '../types/flow'
import { BackButton } from '../components/BackButton'
import styles from './EstimateScreen.module.css'

interface Props {
  initialState?: FlowState
  onNext: (update: Partial<FlowState>) => void
  onBack?: () => void
}

// Deterministic mock totals by budget range (in millions ₸)
const TOTAL_BY_RANGE: Record<BudgetRange, number> = {
  under_5m:  4_500_000,
  '5_10m':   8_000_000,
  '10_20m': 15_000_000,
  '20_35m': 27_000_000,
  over_35m: 40_000_000,
  unsure:   12_000_000,
}

// Fixed proportions: works 54%, materials 30%, design 8%, reserve 8%
function buildEstimate(total: number) {
  const works     = Math.round(total * 0.54)
  const materials = Math.round(total * 0.30)
  const design    = Math.round(total * 0.08)
  const reserve   = total - works - materials - design   // remainder = exact total
  return { works, materials, design, reserve, total }
}

function formatAmount(n: number): string {
  // e.g. 15000000 → "15 000 000 ₸"
  return n.toLocaleString('ru-RU') + '\u00a0₸'
}

export function EstimateScreen({ initialState, onNext, onBack }: Props) {
  const range  = initialState?.budgetRange ?? 'unsure'
  const total  = TOTAL_BY_RANGE[range]
  const est    = buildEstimate(total)

  const LINE_ITEMS: { label: string; amount: number }[] = [
    { label: 'Работы',                       amount: est.works },
    { label: 'Материалы',                    amount: est.materials },
    { label: 'Дизайн и проектирование',      amount: est.design },
    { label: 'Резерв',                       amount: est.reserve },
  ]

  return (
    <div className={styles.root}>
      <header className={styles.header}>
        {onBack && <BackButton onClick={onBack} />}
        <span className={styles.step}>Шаг 15 / 16</span>
      </header>

      <main className={styles.main}>
        <div className={styles.intro}>
          <h1 className={styles.headline}>Предварительная смета</h1>
          <p className={styles.description}>Оценка по вашему сценарию ремонта</p>
        </div>

        {/* Line items */}
        <div className={styles.lineItems}>
          {LINE_ITEMS.map(({ label, amount }) => (
            <div key={label} className={styles.lineCard}>
              <span className={styles.lineLabel}>{label}</span>
              <span className={styles.lineAmount}>{formatAmount(amount)}</span>
            </div>
          ))}
        </div>

        {/* Total block */}
        <div className={styles.totalCard}>
          <div className={styles.totalLeft}>
            <span className={styles.totalTitle}>Итого</span>
            <span className={styles.totalSub}>Предварительно</span>
          </div>
          <span className={styles.totalAmount}>{formatAmount(est.total)}</span>
        </div>

        {/* Footnote */}
        <p className={styles.footnote}>
          Это предварительная оценка — точная сумма будет после замера
        </p>
      </main>

      <footer className={styles.footer}>
        <button
          className={styles.cta}
          onClick={() => onNext({ estimate: est })}
        >
          Продолжить
        </button>
      </footer>
    </div>
  )
}
