import { CLASS_META, type Classification } from '../analysis/config'
interface Props {
  cls: Classification
  size?: number
  title?: boolean
}

export function ClassBadge({ cls, size = 18, title = true }: Props) {
  const meta = CLASS_META[cls]
  const fontSize = Math.round(size * (meta.glyph.length > 1 ? 0.5 : 0.62))
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      role="img"
      aria-label={meta.label}
      style={{ display: 'block' }}
    >
      {title && <title>{meta.label}</title>}
      <rect x="0" y="0" width="24" height="24" fill={meta.color} />
      <text
        x="12"
        y="12"
        textAnchor="middle"
        dominantBaseline="central"
        fontFamily="'JetBrains Mono', monospace"
        fontWeight="700"
        fontSize={fontSize / (size / 24)}
        fill="#0f0f0f"
      >
        {meta.glyph}
      </text>
    </svg>
  )
}