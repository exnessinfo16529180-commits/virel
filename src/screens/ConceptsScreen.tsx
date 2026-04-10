import { useState } from 'react'
import type { FlowState, ConceptImage } from '../types/flow'
import { generateConceptImages } from '../services/conceptImages'
import styles from './ConceptsScreen.module.css'

interface Props {
  initialState?: FlowState
  onNext: (update: Partial<FlowState>) => void
}

type ConceptId = 'concept_a' | 'concept_b' | 'concept_c'

interface ConceptMeta {
  id: ConceptId
  code: string
  title: string
  description: string
  tags: string[]
  previewClass: string
}

const CONCEPTS: ConceptMeta[] = [
  {
    id: 'concept_a',
    code: 'Концепт A',
    title: 'Тёплый минимализм',
    description: 'Натуральные материалы, янтарный свет, сдержанная роскошь',
    tags: ['Тёплая', 'Натуральный', 'Уют'],
    previewClass: styles.previewA,
  },
  {
    id: 'concept_b',
    code: 'Концепт B',
    title: 'Холодная элегантность',
    description: 'Сталь и стекло, холодный свет, графитовые плоскости',
    tags: ['Холодная', 'Современный', 'Контраст'],
    previewClass: styles.previewB,
  },
  {
    id: 'concept_c',
    code: 'Концепт C',
    title: 'Нейтральный баланс',
    description: 'Бежевые тона, природные текстуры, спокойная атмосфера',
    tags: ['Нейтральная', 'Сканди', 'Баланс'],
    previewClass: styles.previewC,
  },
]

function imageForConcept(
  conceptId: ConceptId,
  images: ConceptImage[] | undefined,
): ConceptImage | null {
  return images?.find(img => img.conceptId === conceptId) ?? null
}

function CheckBadge() {
  return (
    <div className={styles.badge} aria-hidden="true">
      <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
        <path
          d="M2 5.5L4.2 8L9 3"
          stroke="#412d00"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      Выбрано
    </div>
  )
}

// ── Image preview with loading skeleton and gradient fallback ─────────────────

interface PreviewProps {
  image: ConceptImage | null
  fallbackClass: string
  isRetrying: boolean
}

function ConceptPreview({ image, fallbackClass, isRetrying }: PreviewProps) {
  const [imgLoaded, setImgLoaded] = useState(false)
  const [imgError, setImgError] = useState(false)

  const showReal = image?.url && !imgError && !isRetrying

  return (
    <div className={`${styles.preview} ${!showReal ? fallbackClass : ''}`}>
      {showReal && (
        <>
          {!imgLoaded && <div className={styles.imgSkeleton} aria-hidden="true" />}
          <img
            src={image.url!}
            alt=""
            className={`${styles.img} ${imgLoaded ? styles.imgVisible : ''}`}
            onLoad={() => setImgLoaded(true)}
            onError={() => setImgError(true)}
            draggable={false}
          />
        </>
      )}
      {isRetrying && (
        <div className={styles.retryOverlay} aria-hidden="true">
          <span className={styles.retryPulse} />
        </div>
      )}
    </div>
  )
}

// ── Screen ────────────────────────────────────────────────────────────────────

export function ConceptsScreen({ initialState, onNext }: Props) {
  const [selected, setSelected] = useState<ConceptId | undefined>(
    initialState?.selectedConcept,
  )
  const [conceptImages, setConceptImages] = useState<ConceptImage[] | undefined>(
    initialState?.conceptImages,
  )
  const [isRetrying, setIsRetrying] = useState(false)
  const [retryFailed, setRetryFailed] = useState(false)

  // All images failed (or none came through) — show retry button
  const allFailed =
    conceptImages !== undefined &&
    conceptImages.every(img => img.url === null)

  const handleRetry = async () => {
    setIsRetrying(true)
    setRetryFailed(false)
    try {
      const result = await generateConceptImages(initialState ?? {})
      setConceptImages(result.images)
      if (result.allFailed) setRetryFailed(true)
    } catch {
      setRetryFailed(true)
    } finally {
      setIsRetrying(false)
    }
  }

  return (
    <div className={styles.root}>
      <header className={styles.header}>
        <span className={styles.step}>Шаг 9 / 14</span>
      </header>

      <main className={styles.main}>
        <div className={styles.intro}>
          <h1 className={styles.headline}>Ваши концепты</h1>
          <p className={styles.description}>Выберите направление, которое ближе всего</p>
        </div>

        {/* Retry notice — shown only if all images failed */}
        {allFailed && (
          <div className={styles.retryBanner} role="alert">
            <span className={styles.retryBannerText}>
              {retryFailed
                ? 'Не удалось загрузить изображения — показаны цветовые схемы'
                : 'Изображения не загрузились'}
            </span>
            {!retryFailed && (
              <button
                className={styles.retryBtn}
                onClick={handleRetry}
                disabled={isRetrying}
              >
                {isRetrying ? 'Загружаем…' : 'Повторить'}
              </button>
            )}
          </div>
        )}

        <div
          className={styles.cards}
          role="group"
          aria-label="Выберите концепт"
        >
          {CONCEPTS.map(({ id, code, title, description, tags, previewClass }) => {
            const isSelected = selected === id
            const image = imageForConcept(id, conceptImages)
            return (
              <button
                key={id}
                className={`${styles.card} ${isSelected ? styles.cardSelected : ''}`}
                onClick={() => setSelected(id)}
                aria-pressed={isSelected}
              >
                {/* Preview: real image or gradient fallback */}
                <div className={styles.previewWrap}>
                  <ConceptPreview
                    image={image}
                    fallbackClass={previewClass}
                    isRetrying={isRetrying}
                  />
                  {isSelected && <CheckBadge />}
                </div>

                {/* Body */}
                <div className={styles.body}>
                  <span className={`${styles.code} ${isSelected ? styles.codeSelected : ''}`}>
                    {code}
                  </span>
                  <span className={styles.title}>{title}</span>
                  <p className={styles.desc}>{description}</p>
                  <div className={styles.tags} aria-label="Теги концепта">
                    {tags.map(tag => (
                      <span key={tag} className={styles.tag}>{tag}</span>
                    ))}
                  </div>
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
          onClick={() =>
            selected &&
            onNext({ selectedConcept: selected, conceptImages })
          }
        >
          Продолжить
        </button>
      </footer>
    </div>
  )
}
