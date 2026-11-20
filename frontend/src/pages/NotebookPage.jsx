import { Navigate, useSearchParams } from "react-router-dom"
import { Notebook } from "@/components/notebook"
import { WorkspaceProvider } from "@/context/WorkspaceContext"

export function NotebookPage() {
  const [searchParams] = useSearchParams()
  const id = searchParams.get("id")?.trim() || ""

  if (!id) return <Navigate to="/dashboard" replace />

  return (
    <WorkspaceProvider key={id}>
      <Notebook.Notebook />
    </WorkspaceProvider>
  )
}
