import { useState } from "react"
import { toast } from "sonner"
import { MdDescription, MdVerticalSplit } from "react-icons/md"
import { UI } from "@/components/ui"
import { useWorkspace } from "@/context/WorkspaceContext"
import { cn } from "@/utils/cn"
import { UploadedSourceItems } from "./UploadedSourceItems"
import { SourceUploadModal } from "./SourceUploadModal"

function isPdf(name) {
  return /\.pdf$/i.test(name)
}

/**
 * Mock upload — placeholder until POST /sources ships.
 * Mirrors the backend SourceOut shape (id, name, type, status, size_bytes,
 * page_count, error, created_at, updated_at) plus `pages` used by the
 * placeholder chat answers.
 */
async function uploadSourceMock(file) {
  const id = `src-${Math.random().toString(36).slice(2, 9)}`
  // Approximate the ingest pipeline duration until the real endpoint exists.
  await new Promise((resolve) => setTimeout(resolve, 650 * 5))
  const now = new Date().toISOString()
  return {
    id,
    notebookId: "workspace",
    name: file.name.replace(/\.pdf$/i, ""),
    type: "pdf",
    status: "ready",
    sizeBytes: file.size || 1_234_567,
    pageCount: 18,
    error: null,
    createdAt: now,
    updatedAt: now,
    pages: [
      {
        pageNumber: 1,
        text: "This document was just uploaded. In the real app, the backend extracts its text and chunks it into a vector index so the assistant can answer questions about it.",
      },
    ],
  }
}

export function SourcePanel({ collapsed, onToggleCollapse }) {
  const { sources, addSource } = useWorkspace()
  const [dragging, setDragging] = useState(false)
  const [busy, setBusy] = useState(false)

  async function handleFiles(list) {
    if (!list) return
    const all = Array.from(list)
    const accepted = all.filter((f) => isPdf(f.name))
    const rejected = all.filter((f) => !isPdf(f.name))
    rejected.forEach(() => toast.error("Only PDF files are supported."))
    if (accepted.length === 0) return
    setBusy(true)
    await Promise.all(
      accepted.map(async (file) => {
        const source = await uploadSourceMock(file)
        addSource(source)
        toast.success(`"${source.name}" added to your sources`)
      }),
    )
    setBusy(false)
  }

  /* Collapsed: a slim vertical rail to reopen the panel. */
  if (collapsed) {
    return (
      <div className="flex w-12 shrink-0 flex-col items-center border-r border-border bg-[#1a1d20] pt-3">
        <button
          type="button"
          onClick={onToggleCollapse}
          className="flex size-8 items-center justify-center rounded-lg text-[#9aa0a6] transition-colors hover:bg-white/5 hover:text-[#e3e3e3]"
          aria-label="Expand panel"
        >
          <MdVerticalSplit className="size-5 rotate-180" />
        </button>
        <span className="mt-2 text-[11px] font-medium tracking-wide text-[#9aa0a6] [writing-mode:vertical-rl]">
          Sources
        </span>
      </div>
    )
  }

  return (
    <div className="flex w-full shrink-0 flex-col border-r border-border bg-[#1a1d20] lg:w-[400px]">
      {/* Panel header */}
      <div className="flex items-center justify-between px-5 pt-4">
        <h2 className="text-base font-semibold text-[#e3e3e3]">Sources</h2>
        <UI.Button
          variant="ghost"
          size="icon"
          onClick={onToggleCollapse}
          className="rounded-full text-[#9aa0a6] hover:text-[#e3e3e3]"
          aria-label="Collapse panel"
        >
          <MdVerticalSplit className="size-5" />
        </UI.Button>
      </div>

      {/* Add sources */}
      <div className="px-4 pt-3">
        <SourceUploadModal
          trigger={
            <UI.Button
              disabled={busy}
              className="h-10 w-full rounded-full border border-white/15 bg-transparent text-[#e3e3e3] hover:bg-white/5"
            >
              <MdDescription className="size-4" />
              Add sources
            </UI.Button>
          }
        />
      </div>

      {/* Sources list or empty dropzone */}
      <div
        className="flex min-h-0 flex-1 flex-col"
        onDragOver={(e) => {
          e.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragging(false)
          handleFiles(e.dataTransfer.files)
        }}
      >
        {sources.length > 0 ? (
          <UI.ScrollArea className="min-h-0 flex-1 px-2 pt-3 pb-2">
            <div className="grid gap-0.5">
              {sources.map((source) => (
                <UploadedSourceItems key={source.id} source={source} />
              ))}
            </div>
          </UI.ScrollArea>
        ) : (
          <div
            className={cn(
              "flex flex-1 flex-col items-center justify-center gap-3 px-8 text-center transition-colors",
              dragging && "bg-white/[0.03]",
            )}
          >
            <span className="flex size-14 items-center justify-center rounded-full bg-[#262a30] text-[#9aa0a6]">
              <MdDescription className="size-7" />
            </span>
            <p className="text-[15px] font-medium text-[#e3e3e3]">
              Saved sources will appear here
            </p>
            <p className="text-[13px] leading-relaxed text-[#9aa0a6]">
              Add a PDF to this notebook, then ask questions
              <br />
              or create things based on your sources.
            </p>
          </div>
        )}
      </div>

      {/* Drop hint */}
      {sources.length === 0 && (
        <p className="px-6 pb-4 text-center text-[13px] text-[#9aa0a6]">
          Drop files here or{" "}
          <SourceUploadModal
            trigger={
              <span className="cursor-pointer font-medium text-[#8ab4f8] hover:underline">
                add a source
              </span>
            }
          />
        </p>
      )}
    </div>
  )
}
