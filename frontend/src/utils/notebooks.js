/** Backend notebook shape (snake_case) → UI shape (camelCase). */
export function toNotebook(nb) {
  return {
    id: nb.id,
    title: nb.title,
    description: nb.description ?? "",
    sourceCount: nb.source_count ?? 0,
    updatedAt: nb.updated_at,
  }
}

/** Backend source shape (snake_case) → UI shape (camelCase). */
export function toSource(source) {
  return {
    id: source.id,
    name: source.name,
    type: source.type,
    status: source.status,
    sizeBytes: source.size_bytes ?? 0,
    pageCount: source.page_count ?? 0,
    chunkCount: source.chunk_count ?? 0,
    error: source.error ?? null,
    createdAt: source.created_at,
    updatedAt: source.updated_at,
  }
}

/** Backend message shape (snake_case) → UI shape (camelCase). */
export function toMessage(message) {
  return {
    id: message.id,
    role: message.role,
    status: message.status ?? "complete",
    content: message.content ?? "",
    sourceIds: message.source_ids ?? [],
    citations: (message.citations ?? []).map((c) => ({
      id: c.id,
      index: c.index,
      sourceId: c.source_id,
      sourceName: c.source_name,
      quote: c.quote,
      page: c.page ?? null,
      relevance: c.relevance ?? 0,
    })),
    createdAt: message.created_at,
  }
}
