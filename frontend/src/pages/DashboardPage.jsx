import { useEffect, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import { toast } from "sonner"
import { MdAdd, MdAutoAwesome, MdBook, MdChevronRight, MdLogout, MdSchedule } from "react-icons/md"
import { Home } from "@/components/home"
import { Shared } from "@/components/shared"
import { UI } from "@/components/ui"
import { api } from "@/configs/axios"
import { useAuth } from "@/context/AuthContext"
import { toNotebook } from "@/utils/notebooks"

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.4, ease: "easeOut" },
  }),
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" })
}

function LoadingState() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-[#121417] text-[#9aa0a6]">
      <MdAutoAwesome className="size-8 animate-pulse text-[#8ab4f8]" />
      <p className="text-sm">Loading your notebooks…</p>
    </div>
  )
}

export function DashboardPage() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [notebooks, setNotebooks] = useState([])
  const [busy, setBusy] = useState(true)
  const [createOpen, setCreateOpen] = useState(false)

  useEffect(() => {
    if (!user) return
    let mounted = true
    void api
      .get("/notebooks")
      .then(({ data }) => {
        if (mounted) setNotebooks(data.map(toNotebook))
      })
      .catch((error) =>
        toast.error(error.message || "Could not load your notebooks."),
      )
      .finally(() => {
        if (mounted) setBusy(false)
      })
    return () => {
      mounted = false
    }
  }, [user])

  async function handleLogout() {
    await logout()
    toast.success("Signed out — see you soon!")
    navigate("/")
  }

  function openNotebook(notebook) {
    // `id` will drive which notebook's sources load once the backend ships;
    // the notebook page reads the title from `?title=` today.
    navigate(`/notebook?id=${notebook.id}&title=${encodeURIComponent(notebook.title)}`)
  }

  if (busy) return <LoadingState />

  return (
    <div className="flex min-h-dvh flex-col bg-[#121417] text-[#e3e3e3]">
      {/* Top bar */}
      <header className="flex h-16 shrink-0 items-center gap-3 border-b border-border bg-[#121417]/80 px-4 backdrop-blur-sm sm:px-6">
        <Link to="/" className="flex min-w-0 items-center gap-3 rounded-lg transition-opacity hover:opacity-80">
          <Shared.BrandMark className="size-9 [&>svg]:size-5" />
          <span className="hidden text-[15px] font-medium sm:inline">OpenNotebook</span>
        </Link>

        <div className="ml-auto flex items-center gap-2">
          <span className="hidden max-w-48 truncate rounded-full border border-white/10 bg-[#1e2227] px-3 py-1.5 text-[13px] text-[#e3e3e3] sm:inline">
            {user.name}
          </span>
          <UI.Button
            variant="ghost"
            onClick={handleLogout}
            aria-label="Sign out"
            className="h-9 gap-2 rounded-full border border-white/10 bg-[#1e2227] px-4 text-sm text-[#e3e3e3] hover:bg-[#262a30] hover:text-white"
          >
            <MdLogout className="size-4" />
            <span className="hidden sm:inline">Sign out</span>
          </UI.Button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10 sm:px-6">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Your notebooks</h1>
          <p className="mt-1.5 text-[15px] text-[#9aa0a6]">
            {notebooks.length} {notebooks.length === 1 ? "notebook" : "notebooks"} · click one to open it
          </p>
        </motion.div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {/* Create new notebook */}
          <motion.button
            type="button"
            variants={fadeUp}
            custom={0}
            initial="hidden"
            animate="visible"
            onClick={() => setCreateOpen(true)}
            className="group flex min-h-40 flex-col items-center justify-center gap-2.5 rounded-2xl border-2 border-dashed border-white/15 bg-transparent text-[#9aa0a6] transition-all duration-300 hover:-translate-y-1 hover:border-[#8ab4f8]/50 hover:bg-white/[0.02] hover:text-[#e3e3e3]"
          >
            <span className="flex size-12 items-center justify-center rounded-full bg-[#262a30] transition-transform duration-300 group-hover:scale-110">
              <MdAdd className="size-6" />
            </span>
            <span className="text-sm font-medium">Create new notebook</span>
          </motion.button>

          {/* Notebook cards */}
          {notebooks.map((notebook, i) => (
            <motion.button
              key={notebook.id}
              type="button"
              variants={fadeUp}
              custom={i + 1}
              initial="hidden"
              animate="visible"
              onClick={() => openNotebook(notebook)}
              className="group relative flex min-h-40 flex-col justify-between overflow-hidden rounded-2xl border border-white/10 bg-[#1a1d20] p-5 text-left transition-all duration-300 hover:-translate-y-1 hover:border-white/20 hover:shadow-xl hover:shadow-black/30"
            >
              {/* Brand hairline on hover */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 top-0 h-0.5 bg-[#8ab4f8]/0 transition-colors duration-300 group-hover:bg-[#8ab4f8]/60"
              />

              <div>
                <span className="flex size-10 items-center justify-center rounded-xl bg-[#8ab4f8]/10 text-[#8ab4f8] ring-1 ring-white/10 transition-transform duration-300 group-hover:scale-105">
                  <MdBook className="size-5" />
                </span>
                <h2 className="mt-3 line-clamp-2 text-[15px] leading-snug font-semibold text-[#e3e3e3]">
                  {notebook.title}
                </h2>
              </div>

              <div className="mt-4 flex items-center gap-3 text-xs text-[#7c8189]">
                <span className="flex items-center gap-1">
                  <MdSchedule className="size-3.5" />
                  Updated {formatDate(notebook.updatedAt)}
                </span>
                <span className="flex items-center gap-1">
                  {notebook.sourceCount} {notebook.sourceCount === 1 ? "source" : "sources"}
                </span>
                <MdChevronRight className="ml-auto size-4 text-[#7c8189] transition-all duration-300 group-hover:translate-x-0.5 group-hover:text-[#8ab4f8]" />
              </div>
            </motion.button>
          ))}
        </div>
      </main>

      <Home.CreateNotebookDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  )
}
