import { useSearchParams } from "react-router-dom"
import { Notebook } from "@/components/notebook"
import { WorkspaceProvider } from "@/context/WorkspaceContext"


export function NotebookPage() {
  const [searchParams] = useSearchParams()
  const title = searchParams.get("title")?.trim() || ""

  return (
    <WorkspaceProvider key={title}>
      <Notebook.Notebook />
    </WorkspaceProvider>
  )
}
