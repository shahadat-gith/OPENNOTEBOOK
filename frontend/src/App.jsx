import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom"
import { Pages } from "@/pages"
import { UI } from "@/components/ui"
import { AuthProvider, useAuth } from "@/context/AuthContext"

function FullScreenLoader() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-[#121417]">
      <div className="size-8 animate-spin rounded-full border-2 border-[#8ab4f8] border-t-transparent" />
    </div>
  )
}

/** Requires a signed-in user — otherwise redirects to /login. */
function ProtectedRoute({ children }) {
  const { user, initializing } = useAuth()
  const location = useLocation()

  if (initializing) return <FullScreenLoader />
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />
  return children
}

/** Login/signup pages — signed-in users go straight to the dashboard. */
function GuestOnlyRoute({ children }) {
  const { user, initializing } = useAuth()

  if (initializing) return <FullScreenLoader />
  if (user) return <Navigate to="/dashboard" replace />
  return children
}

export default function App() {
  return (
    <UI.TooltipProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Entry page: explains the app and creates notebooks. */}
            <Route path="/" element={<Pages.HomePage />} />
            {/* Auth pages (hidden once signed in). */}
            <Route
              path="/login"
              element={
                <GuestOnlyRoute>
                  <Pages.LoginPage />
                </GuestOnlyRoute>
              }
            />
            <Route
              path="/signup"
              element={
                <GuestOnlyRoute>
                  <Pages.SignupPage />
                </GuestOnlyRoute>
              }
            />
            {/* Dashboard: all of the user's notebooks (auth required). */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Pages.DashboardPage />
                </ProtectedRoute>
              }
            />
            {/* The notebook workspace (auth required). */}
            <Route
              path="/notebook"
              element={
                <ProtectedRoute>
                  <Pages.NotebookPage />
                </ProtectedRoute>
              }
            />
            {/* Anything unknown lands on the entry page. */}
            <Route path="*" element={<Pages.HomePage />} />
          </Routes>
        </BrowserRouter>
        <UI.Toaster richColors position="top-center" />
      </AuthProvider>
    </UI.TooltipProvider>
  )
}
