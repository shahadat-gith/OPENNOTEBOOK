/**
 * Barrel for notebook components (the whole workspace page lives here).
 *
 *   import { Notebook } from "@/components/notebook"
 *   <Notebook.Notebook />  <Notebook.ChatPanel />  ...
 *
 * NOTE: files inside this folder must import siblings directly (e.g.
 * `./ChatPanel`), never via this barrel — that would create a circular import.
 */
import { Notebook as NotebookView } from "./Notebook"
import { ChatPanel } from "./ChatPanel"
import { SourcePanel } from "./SourcePanel"
import { UploadedSourceItems } from "./UploadedSourceItems"
import { SourceUploadModal } from "./SourceUploadModal"
import { MessageItem } from "./MessageItem"

export const Notebook = {
  Notebook: NotebookView,
  ChatPanel,
  SourcePanel,
  UploadedSourceItems,
  SourceUploadModal,
  MessageItem,
}
