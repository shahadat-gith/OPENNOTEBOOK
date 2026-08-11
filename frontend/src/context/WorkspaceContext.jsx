import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useSearchParams } from "react-router-dom";
import { mockAnswers } from "@/data";

const WorkspaceContext = createContext(null);

function uid(prefix) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Mock answer — placeholder until the RAG pipeline ships.
 * Keyword-matches canned answers; this is where POST /ask plugs in.
 */
async function answerQuestion(question, workspaceSources = []) {
  await sleep(900);
  const q = question.toLowerCase();
  const match = mockAnswers.find((a) => a.keywords.some((k) => q.includes(k)));

  if (match) {
    return {
      id: uid("msg"),
      role: "assistant",
      status: "complete",
      content: match.content,
      createdAt: new Date().toISOString(),
      sourceIds: match.sourceIds,
      citations: match.citations.map((c) => ({ ...c, id: uid("cit") })),
    };
  }

  // Fallback: ground the answer on the first readable page of the notebook.
  const primary = workspaceSources.find(
    (s) => s.status === "ready" && s.pages.length > 0,
  );

  if (!primary) {
    return {
      id: uid("msg"),
      role: "assistant",
      status: "complete",
      content:
        "This notebook doesn't have any sources yet. Add a PDF, then ask me anything about it.",
      createdAt: new Date().toISOString(),
      sourceIds: [],
      citations: [],
    };
  }

  const quote = primary.pages[0].text.slice(0, 220) + "…";
  return {
    id: uid("msg"),
    role: "assistant",
    status: "complete",
    content: `I couldn't find a confident answer to that in your sources. Here is a relevant passage from **${primary.name}** [[citation:1]]:\n\n"${quote}"\n\nTry rephrasing your question — or add more sources to this notebook for better coverage.`,
    createdAt: new Date().toISOString(),
    sourceIds: [primary.id],
    citations: [
      {
        id: uid("cit"),
        index: 1,
        sourceId: primary.id,
        sourceName: primary.name,
        quote: primary.pages[0].text.slice(0, 220),
        page: primary.pages[0].pageNumber,
        relevance: 0.6,
      },
    ],
  };
}

/**
 * Provides the workspace state (sources, messages) and actions to the whole
 * notebook page. Plain React state — no external state library.
 *
 * The notebook title lives in the URL (`/notebook?title=...`) so it can be
 * shared, bookmarked and refreshed without any persistence layer.
 */
export function WorkspaceProvider({ children }) {
  const [searchParams] = useSearchParams();
  const notebookTitle = searchParams.get("title")?.trim() || "My notebook";

  const [sources, setSources] = useState([]);
  const [messages, setMessages] = useState([]);

  // Keep the latest sources readable from inside async actions.
  const sourcesRef = useRef(sources);
  useEffect(() => {
    sourcesRef.current = sources;
  }, [sources]);

  const addSource = useCallback((source) => {
    setSources((prev) => [source, ...prev]);
  }, []);

  const removeSource = useCallback(async (id) => {
    // Placeholder until DELETE /sources/:id ships.
    await sleep(150);
    setSources((prev) => prev.filter((s) => s.id !== id));
  }, []);

  /**
   * Sends a question: appends the user message, streams a simulated
   * assistant answer (typewriter), then finalizes it with citations.
   */
  const sendMessage = useCallback(async (text) => {
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

    const answer = await answerQuestion(text, sourcesRef.current);

    // Typewriter effect over the returned answer.
    const step = 6;
    for (let i = 0; i <= answer.content.length; i += step) {
      const partial = answer.content.slice(0, i);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId ? { ...m, content: partial } : m,
        ),
      );
      await sleep(24);
    }

    setMessages((prev) =>
      prev.map((m) => (m.id === assistantId ? { ...m, ...answer } : m)),
    );
  }, []);

  return (
    <WorkspaceContext.Provider
      value={{
        notebookTitle,
        sources,
        messages,
        addSource,
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
