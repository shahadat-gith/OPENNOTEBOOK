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
