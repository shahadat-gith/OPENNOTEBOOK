import { useEffect, useRef, useState } from "react"
import { MdAutoAwesome, MdFormatQuote } from "react-icons/md"
import { RichText } from "./RichText"
import { SourceTypeIcon, SOURCE_TYPE_META } from "./SourceTypeIcon"
import { UI } from "@/components/ui"
import { cn } from "@/utils/cn"
import { useWorkspace } from "@/context/WorkspaceContext"

/**
 * A single chat message.
 * @param {object}  message      The message object (id, content, citations…).
 * @param {"user" | "assistant"} usertype Which side renders it.
 * @param {boolean} [streaming]  Whether the assistant reply is still streaming.
 */
export function MessageItem({ message, usertype = "assistant", streaming }) {
  const { sources } = useWorkspace()
  const [activeCitation, setActiveCitation] = useState(null)
  const citationRefs = useRef(new Map())
  const timeoutRef = useRef(null)

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  function handleCitationClick(index) {
    setActiveCitation(index)
    const el = citationRefs.current.get(index)
    el?.scrollIntoView({ behavior: "smooth", block: "nearest" })
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(() => setActiveCitation(null), 2200)
  }

  if (usertype === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-[18px] rounded-br-[6px] bg-bubble px-4 py-2.5 text-[15px] text-bubble-foreground shadow-sm sm:max-w-[75%]">
          <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
        </div>
      </div>
    )
  }

  const usedSources = (message.sourceIds ?? [])
    .map((id) => sources.find((s) => s.id === id))
    .filter(Boolean)

  return (
    <div className="flex gap-3">
      <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 text-white shadow-sm">
        <MdAutoAwesome className="size-4" />
      </span>

      <div className="min-w-0 flex-1 space-y-3">
        <div className="text-[15px] text-foreground">
          <RichText
            content={message.content}
            streaming={streaming}
            onCitationClick={handleCitationClick}
            activeCitation={activeCitation}
          />
        </div>

        {usedSources.length > 0 && !streaming && (
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="mr-1 text-xs text-muted-foreground">Sources used</span>
            {usedSources.map((source) => (
              <UI.Tooltip key={source.id}>
                <UI.TooltipTrigger asChild>
                  <span className="flex items-center gap-1.5 rounded-full border bg-card py-1 pr-2.5 pl-1 text-xs font-medium text-foreground">
                    <span className="flex size-5 items-center justify-center rounded-full bg-[#262a30] ring-1 ring-white/10">
                      <SourceTypeIcon type={source.type} className="text-[#8ab4f8]" />
                    </span>
                    <span className="max-w-40 truncate">{source.name}</span>
                  </span>
                </UI.TooltipTrigger>
                <UI.TooltipContent>{SOURCE_TYPE_META[source.type].label}</UI.TooltipContent>
              </UI.Tooltip>
            ))}
          </div>
        )}

        {message.citations && message.citations.length > 0 && !streaming && (
          <div className="grid gap-2">
            {message.citations.map((citation) => (
              <div
                key={citation.id}
                ref={(el) => {
                  citationRefs.current.set(citation.index, el)
                }}
                className={cn(
                  "flex gap-2.5 rounded-xl border bg-card p-3 transition-all duration-300",
                  activeCitation === citation.index &&
                    "border-primary/40 bg-primary/5 ring-1 ring-primary/20",
                )}
              >
                <span className="flex size-5 shrink-0 items-center justify-center rounded-md bg-accent text-[11px] font-semibold text-accent-foreground">
                  {citation.index}
                </span>
                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-foreground">
                    <MdFormatQuote className="size-3 text-muted-foreground" />
                    {citation.sourceName}
                    {citation.page && (
                      <span className="text-muted-foreground">· p. {citation.page}</span>
                    )}
                  </div>
                  <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                    “{citation.quote}”
                  </p>
                  <div className="flex items-center gap-1.5">
                    <span className="h-1 w-16 overflow-hidden rounded-full bg-muted">
                      <span
                        className="block h-full rounded-full bg-primary/60"
                        style={{ width: `${Math.round(citation.relevance * 100)}%` }}
                      />
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      Relevance {Math.round(citation.relevance * 100)}%
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
