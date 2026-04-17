import styles from './BackButton.module.css'

interface Props {
  onClick: () => void
}

export function BackButton({ onClick }: Props) {
  return (
    <button
      className={styles.btn}
      onClick={onClick}
      aria-label="Назад"
      type="button"
    >
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <path
          d="M12 4L6 10L12 16"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  )
}
