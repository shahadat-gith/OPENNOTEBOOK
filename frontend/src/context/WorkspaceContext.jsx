import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { API_BASE, api, getToken } from "@/configs/axios";
import { toMessage, toSource } from "@/utils/notebooks";

const WorkspaceContext = createContext(null);

function uid(prefix) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Streams an answer from POST /ask (server-sent events). Yields parsed
 * events: {type:"delta",content}, {type:"done",message}, {type:"error",detail}.
 */
async function* streamAsk({ question, notebookId }, signal) {
  const response = await fetch(`${API_BASE}/ask`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
    },
    body: JSON.stringify({ question, notebook_id: notebookId }),
    signal,
  })

  if (!response.ok) {
    let detail = `Request failed (${response.status})`
    try {
      const body = await response.json()
      if (typeof body.detail === "string") detail = body.detail
    } catch {
      // Non-JSON error body — keep the status message.
    }
    throw new Error(detail)
  }

  if (!response.body) {
    throw new Error("Streaming is not supported by this browser.")
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ""

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })

    // SSE events are separated by a blank line (\n\n).
    let separator
    while ((separator = buffer.indexOf("\n\n")) !== -1) {
      const raw = buffer.slice(0, separator)
      buffer = buffer.slice(separator + 2)
      const dataLine = raw.split("\n").find((line) => line.startsWith("data:"))
      if (!dataLine) continue
      try {
        yield JSON.parse(dataLine.slice(5).trim())
      } catch {
        // Malformed event — skip it.
      }
    }
  }
}

/**
 * Provides the workspace state (sources, messages) and actions to the whole
 * notebook page. Sources and chat messages are fetched from and synced with
 * the backend (`/api/v1/sources`, `/api/v1/ask`).
 */
export function WorkspaceProvider({ children }) {
  const [searchParams] = useSearchParams();
  const notebookId = searchParams.get("id")?.trim() || "";
  const notebookTitle = searchParams.get("title")?.trim() || "My notebook";

  const [sources, setSources] = useState([]);
  const [messages, setMessages] = useState([]);

  // Aborts any in-flight answer stream when the workspace unmounts.
  const abortRef = useRef(null);
  useEffect(() => () => abortRef.current?.abort(), []);

  // Only surface the first load/poll failure — the 2.5s busy poll retries
  // silently so a transient backend hiccup doesn't spam toasts.
  const [loadErrorShown, setLoadErrorShown] = useState(false);

  /** Fetch the notebook's sources from the backend. */
  const refreshSources = useCallback(async () => {
    if (!notebookId) return;
    try {
      const { data } = await api.get("/sources", {
        params: { notebook_id: notebookId },
      });
      setSources(data.map(toSource));
      setLoadErrorShown(false);
    } catch (error) {
      if (!loadErrorShown) {
        setLoadErrorShown(true);
        toast.error(error.message || "Could not load sources.");
      }
    }
  }, [notebookId, loadErrorShown]);

  // Load sources whenever the notebook changes.
  useEffect(() => {
    void refreshSources();
  }, [refreshSources]);

  // Poll for status changes while any source is still uploading/processing.
  useEffect(() => {
    const busy = sources.some(
      (s) => s.status === "uploading" || s.status === "processing",
    );
    if (!busy) return undefined;
    const timer = setInterval(() => void refreshSources(), 2500);
    return () => clearInterval(timer);
  }, [sources, refreshSources]);

  /** Load the notebook's conversation history from the backend. */
  const loadMessages = useCallback(async () => {
    if (!notebookId) return;
    try {
      const { data } = await api.get("/ask", {
        params: { notebook_id: notebookId },
      });
      setMessages(data.map(toMessage));
    } catch (error) {
      // History is best-effort: keep the current thread on failure.
      if (error.response?.status !== 401) {
        toast.error(error.message || "Could not load chat history.");
      }
    }
  }, [notebookId]);

  // Reset and load the thread whenever the notebook changes.
  useEffect(() => {
    setMessages([]);
    void loadMessages();
  }, [notebookId, loadMessages]);

  /**
   * Upload one or more PDF files to the backend (POST /sources) and prepend
   * the returned sources. Each file is attempted independently so one failure
   * doesn't drop the successful uploads.
   */
  const uploadSources = useCallback(
    async (files) => {
      if (!notebookId) throw new Error("No notebook selected.");
      const uploaded = [];
      const failed = [];
      for (const file of files) {
        try {
          const form = new FormData();
          form.append("file", file);
          const { data } = await api.post("/sources", form, {
            params: { notebook_id: notebookId },
          });
          uploaded.push(toSource(data));
        } catch (error) {
          failed.push({
            name: file.name,
            message: error.message || "Upload failed",
          });
        }
      }
      if (uploaded.length > 0) setSources((prev) => [...uploaded, ...prev]);
      return { uploaded, failed };
    },
    [notebookId],
  );

  /** Delete a source from the backend and remove it from the UI. */
  const removeSource = useCallback(async (id) => {
    await api.delete(`/sources/${id}`);
    setSources((prev) => prev.filter((s) => s.id !== id));
  }, []);

  /**
   * Sends a question: appends the user message, streams the backend answer
   * live via SSE (POST /ask), then finalizes it with its citations when the
   * stream completes. On failure the placeholder is marked failed.
   */
  const sendMessage = useCallback(
    async (text) => {
      if (!notebookId) return;
      const userMsg = {
        id: uid("msg"),
        role: "user",
        content: text,
        createdAt: new Date().toISOString(),
      };
      const assistantId = uid("msg");
      const assistantSeed = {
        id: assistantId,
        role: "assistant",
        status: "streaming",
        content: "",
        createdAt: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, userMsg, assistantSeed]);

      const controller = new AbortController();
      abortRef.current = controller;
      let receivedDone = false;

      try {
        for await (const event of streamAsk(
          { question: text, notebookId },
          controller.signal,
        )) {
          if (event.type === "delta") {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId
                  ? { ...m, content: m.content + (event.content ?? "") }
                  : m,
              ),
            );
          } else if (event.type === "done") {
            receivedDone = true;
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId ? { ...m, ...toMessage(event.message) } : m,
              ),
            );
            break;
          } else if (event.type === "error") {
            throw new Error(event.detail || "Could not get an answer.")
          }
        }

        // Stream ended without a done/error event (dropped connection) —
        // don't leave the placeholder stuck in "streaming".
        if (!receivedDone) {
          throw new Error("The connection was interrupted. Please try again.")
        }
      } catch (error) {
        if (error.name === "AbortError") return;
        const detail = error.message || "Could not get an answer.";
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? { ...m, status: "failed", content: detail }
              : m,
          ),
        );
        toast.error(detail);
      } finally {
        abortRef.current = null;
      }
    },
    [notebookId],
  );

  return (
    <WorkspaceContext.Provider
      value={{
        notebookId,
        notebookTitle,
        sources,
        messages,
        uploadSources,
        removeSource,
        sendMessage,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}

/** Reads the workspace state/actions. Must be used inside <WorkspaceProvider>. */
export function useWorkspace() {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) {
    throw new Error("useWorkspace must be used within a WorkspaceProvider");
  }
  return ctx;
}
