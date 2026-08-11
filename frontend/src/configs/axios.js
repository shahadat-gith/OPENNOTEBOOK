import axios from "axios"

export const API_BASE =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000/api/v1"

const TOKEN_KEY = "auth_token"

export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token)
  else localStorage.removeItem(TOKEN_KEY)
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY)
}

export const api = axios.create({
  baseURL: API_BASE,
  // NOTE: do NOT set a global Content-Type here. axios 1.19 converts
  // FormData payloads to JSON when the request header is application/json,
  // which breaks multipart uploads (POST /sources → 422). For plain object
  // bodies axios sets application/json automatically.
})

// Attach the Bearer token to every request.
api.interceptors.request.use((config) => {
  const token = getToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Normalize error messages and drop the session when a request is rejected
// with 401 (expired / invalid token) — AuthContext listens for the event.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      clearToken()
      window.dispatchEvent(new Event("opennotebook:unauthorized"))
    }

    const detail = error.response?.data?.detail
    let message = error.message || "Request failed"
    if (typeof detail === "string") message = detail
    else if (Array.isArray(detail) && detail.length > 0) {
      message = detail.map((d) => d.msg ?? String(d)).join("; ")
    }
    error.message = message
    return Promise.reject(error)
  },
)
