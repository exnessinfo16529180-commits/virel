import { useState } from 'react'
import type { FlowState } from '../types/flow'
import styles from './MaterialsScreen.module.css'

interface Props {
  initialState?: FlowState
  onNext: (update: Partial<FlowState>) => void
}

type PackageId = 'basic' | 'optimal' | 'premium'

interface Package {
  id: PackageId
  title: string
  description: string
  brands: string
  costTag: string
  costTagClass: string
}

const PACKAGES: Package[] = [
  {
    id: 'basic',
    title: 'Базовый',
    description:
      'Российские и белорусские производители, стандартная керамика, ламинат 32 класс',
    brands: 'Kerama Marazzi · Kronospan · Volpato',
    costTag: 'эконом',
    costTagClass: styles.tagNeutral,
  },
  {
    id: 'optimal',
    title: 'Оптимальный',
    description:
      'Европейские бренды среднего сегмента, керамогранит, паркетная доска, матовые краски',
    brands: 'Marazzi · Quick-Step · Farrow & Ball',
    costTag: 'баланс',
    costTagClass: styles.tagGold,
  },
  {
    id: 'premium',
    title: 'Премиум',
    description:
      'Итальянские и скандинавские бренды, натуральный камень, массив, дизайнерская фурнитура',
    brands: 'Porcelanosa · Dinesen · Vola',
    costTag: 'высокий',
    costTagClass: styles.tagNeutral,
  },
]

export function MaterialsScreen({ initialState, onNext }: Props) {
  const [selected, setSelected] = useState<PackageId | undefined>(
    initialState?.materialsPackage,
  )

  return (
    <div className={styles.root}>
      <header className={styles.header}>
        <span className={styles.step}>Шаг 10 / 13</span>
      </header>

      <main className={styles.main}>
        <div className={styles.intro}>
          <h1 className={styles.headline}>Материалы</h1>
          <p className={styles.description}>Уровень отделочных материалов</p>
        </div>

        <div className={styles.cards} role="group" aria-label="Выберите пакет материалов">
          {PACKAGES.map(({ id, title, description, brands, costTag, costTagClass }) => {
            const isSelected = selected === id
            return (
              <button
                key={id}
                className={`${styles.card} ${isSelected ? styles.cardSelected : ''}`}
                onClick={() => setSelected(id)}
                aria-pressed={isSelected}
              >
                <div className={styles.cardTop}>
                  <span className={`${styles.costTag} ${costTagClass}`}>{costTag}</span>
                  <div
                    className={`${styles.dot} ${isSelected ? styles.dotSelected : ''}`}
                    aria-hidden="true"
                  />
                </div>

                <div className={styles.cardBody}>
                  <span className={`${styles.title} ${isSelected ? styles.titleSelected : ''}`}>
                    {title}
                  </span>
                  <p className={styles.desc}>{description}</p>
                  <span className={styles.brands}>{brands}</span>
                </div>
              </button>
            )
          })}
        </div>
      </main>

      <footer className={styles.footer}>
        <button
          className={styles.cta}
          disabled={!selected}
          onClick={() => selected && onNext({ materialsPackage: selected })}
        >
          Продолжить
        </button>
      </footer>
    </div>
  )
}
