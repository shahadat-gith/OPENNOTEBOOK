/**
 * Barrel for home components.
 *
 *   import { Home } from "@/components/home"
 *   <Home.CreateNotebookDialog />
 *
 * NOTE: files inside this folder must import siblings directly (e.g.
 * `./CreateNotebookDialog`), never via this barrel — that would create a
 * circular import.
 */
import { CreateNotebookDialog } from "./CreateNotebookDialog"

export const Home = {
  CreateNotebookDialog,
}
