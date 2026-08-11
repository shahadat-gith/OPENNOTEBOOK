import { useState } from "react"
import { Link } from "react-router-dom"
import { toast } from "sonner"
import { MdSettings, MdShare } from "react-icons/md"
import { Shared } from "@/components/shared"
import { UI } from "@/components/ui"
import { useWorkspace } from "@/context/WorkspaceContext"
import { cn } from "@/utils/cn"
import { ChatPanel } from "./ChatPanel"
import { SourcePanel } from "./SourcePanel"

const HEADER_ACTIONS = [
  { key: "share", label: "Share", icon: MdShare },
  { key: "settings", label: "Settings", icon: MdSettings },
]

/** The notebook workspace: Sources panel + Chat panel, with a top bar. */
export function Notebook() {
  const { notebookTitle } = useWorkspace()
  const [sourcesCollapsed, setSourcesCollapsed] = useState(false)

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-[#121417] text-[#e3e3e3]">
      {/* Top bar: brand + notebook title → home */}
      <header className="flex h-16 shrink-0 items-center gap-3 border-b border-border bg-[#1a1d20] px-4 sm:px-6">
        <Link
          to="/"
          title="Back to home"
          className="flex min-w-0 items-center gap-3 rounded-lg transition-opacity hover:opacity-80"
        >
          <Shared.BrandMark className="size-9 [&>svg]:size-5" />
          <span className="truncate text-[15px] font-medium text-[#e3e3e3]">{notebookTitle}</span>
        </Link>

        <div className="ml-auto flex items-center gap-2">
          {HEADER_ACTIONS.map(({ key, label, icon: Icon }) => (
            <UI.Button
              key={key}
              variant="ghost"
              onClick={() =>
                toast.info("This is a frontend preview — this action is coming soon.")
              }
              className={cn(
                "h-9 gap-2 rounded-full border border-white/10 bg-[#1e2227] px-4 text-sm text-[#e3e3e3]",
                "hover:bg-[#262a30] hover:text-white",
              )}
            >
              <Icon className="size-4" />
              <span className="hidden sm:inline">{label}</span>
            </UI.Button>
          ))}
        </div>
      </header>

      {/* Panels */}
      <div className="flex min-h-0 flex-1">
        <SourcePanel
          collapsed={sourcesCollapsed}
          onToggleCollapse={() => setSourcesCollapsed((c) => !c)}
        />
        <ChatPanel />
      </div>

      <footer className="flex h-9 shrink-0 items-center justify-center bg-[#121417] px-4">
        <p className="text-[11px] text-[#9aa0a6]">
          OpenNotebook can be inaccurate; please double check its responses.
        </p>
      </footer>
    </div>
  )
}
