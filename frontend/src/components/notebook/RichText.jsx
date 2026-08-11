import { Fragment } from "react"
import { cn } from "@/utils/cn"

/** Renders assistant content: paragraphs, **bold**, and [[citation:n]] chips. */
export function RichText({
  content,
  streaming,
  onCitationClick,
  activeCitation,
  className,
}) {
  const paragraphs = content.split(/\n{2,}/).filter(Boolean)

  if (paragraphs.length === 0 && streaming) {
    return (
      <span className="flex gap-1 py-1" aria-label="Thinking">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="size-1.5 animate-bounce rounded-full bg-muted-foreground"
            style={{ animationDelay: `${i * 150}ms` }}
          />
        ))}
      </span>
    )
  }

  return (
    <div className={cn("space-y-3", className)}>
      {paragraphs.map((paragraph, pIndex) => (
        <p key={pIndex} className="leading-relaxed">
          {renderInline(paragraph, onCitationClick, activeCitation)}
        </p>
      ))}
    </div>
  )
}

function renderInline(text, onCitationClick, activeCitation) {
  // Split on [[citation:n]] markers.
  const parts = text.split(/\[\[citation:(\d+)\]\]/g)
  return parts.map((part, i) => {
    if (i % 2 === 1) {
      const n = Number(part)
      return (
        <button
          key={i}
          type="button"
          onClick={() => onCitationClick?.(n)}
          className={cn(
            "mx-0.5 inline-flex size-5 items-center justify-center rounded-md align-middle text-[11px] font-semibold transition-colors",
            "bg-accent text-accent-foreground hover:bg-primary/15 hover:text-primary",
            activeCitation === n && "bg-primary text-primary-foreground ring-1 ring-primary/30",
          )}
          aria-label={`Citation ${n}`}
        >
          {n}
        </button>
      )
    }
    return <Fragment key={i}>{renderBold(part)}</Fragment>
  })
}

function renderBold(text) {
  const parts = text.split(/\*\*(.+?)\*\*/g)
  return parts.map((part, i) =>
    i % 2 === 1 ? (
      <strong key={i} className="font-semibold text-foreground">
        {part}
      </strong>
    ) : (
      <Fragment key={i}>{part}</Fragment>
    ),
  )
}
