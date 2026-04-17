import { useState } from 'react'
import type { FlowState } from '../types/flow'
import { BackButton } from '../components/BackButton'
import styles from './ShopScreen.module.css'

interface Props {
  initialState?: FlowState
  onNext: (update: Partial<FlowState>) => void
  onBack?: () => void
}

interface Shop {
  id: string
  name: string
  tag: string
  deliveryDays: string
  priceTag: string
  priceTagClass: string
  availability: string
  availabilityClass: string
}

const SHOPS: Shop[] = [
  {
    id: 'leroy',
    name: 'Leroy Merlin',
    tag: 'Широкий ассортимент',
    deliveryDays: '3–5 дней',
    priceTag: 'Базовая цена',
    priceTagClass: styles.priceNeutral,
    availability: 'В наличии',
    availabilityClass: styles.dotGreen,
  },
  {
    id: 'porcelanosa',
    name: 'Porcelanosa',
    tag: 'Премиум-класс',
    deliveryDays: '10–21 день',
    priceTag: '+18% к смете',
    priceTagClass: styles.priceGold,
    availability: 'Под заказ',
    availabilityClass: styles.dotAmber,
  },
  {
    id: 'ikea',
    name: 'ИКЕА',
    tag: 'Доступные цены',
    deliveryDays: '2–3 дня',
    priceTag: '-12% к смете',
    priceTagClass: styles.priceGreen,
    availability: 'В наличии',
    availabilityClass: styles.dotGreen,
  },
]

export function ShopScreen({ initialState, onNext, onBack }: Props) {
  const [selected, setSelected] = useState<string | undefined>(initialState?.selectedShop)

  return (
    <div className={styles.root}>
      <header className={styles.header}>
        {onBack && <BackButton onClick={onBack} />}
        <span className={styles.step}>Шаг 10 / 16</span>
      </header>

      <main className={styles.main}>
        <div className={styles.intro}>
          <h1 className={styles.headline}>Поставщик материалов</h1>
          <p className={styles.description}>От выбора зависят сроки и итоговая стоимость</p>
        </div>

        <div className={styles.cards} role="group" aria-label="Выберите поставщика">
          {SHOPS.map(({ id, name, tag, deliveryDays, priceTag, priceTagClass, availability, availabilityClass }) => {
            const isSelected = selected === id
            return (
              <button
                key={id}
                className={`${styles.card} ${isSelected ? styles.cardSelected : ''}`}
                onClick={() => setSelected(id)}
                aria-pressed={isSelected}
              >
                <div className={styles.cardTop}>
                  <div className={styles.shopMeta}>
                    <span className={styles.shopName}>{name}</span>
                    <span className={styles.shopTag}>{tag}</span>
                  </div>
                  <div className={`${styles.dot} ${isSelected ? styles.dotSelected : ''}`} aria-hidden="true" />
                </div>

                <div className={styles.cardBottom}>
                  <div className={styles.metaPill}>
                    <span className={styles.metaIcon} aria-hidden="true">🚚</span>
                    <span className={styles.metaText}>{deliveryDays}</span>
                  </div>
                  <div className={styles.metaPill}>
                    <span className={`${styles.availDot} ${availabilityClass}`} aria-hidden="true" />
                    <span className={styles.metaText}>{availability}</span>
                  </div>
                  <span className={`${styles.priceTag} ${priceTagClass}`}>{priceTag}</span>
                </div>
              </button>
            )
          })}
        </div>

        <p className={styles.note}>
          Итоговая стоимость материалов зависит от выбранного поставщика
        </p>
      </main>

      <footer className={styles.footer}>
        <button
          className={styles.cta}
          disabled={!selected}
          onClick={() => selected && onNext({ selectedShop: selected })}
        >
          Выбрать и продолжить
        </button>
      </footer>
    </div>
  )
}
