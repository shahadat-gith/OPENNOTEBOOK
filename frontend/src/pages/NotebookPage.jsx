import { useSearchParams } from "react-router-dom"
import { Notebook } from "@/components/notebook"
import { WorkspaceProvider } from "@/context/WorkspaceContext"


export function NotebookPage() {
  const [searchParams] = useSearchParams()
  const id = searchParams.get("id")?.trim() || ""
  const title = searchParams.get("title")?.trim() || ""

  return (
    <WorkspaceProvider key={id || title}>
      <Notebook.Notebook />
    </WorkspaceProvider>
  )
}
