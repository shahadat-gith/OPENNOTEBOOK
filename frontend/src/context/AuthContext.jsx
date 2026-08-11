import { createContext, useContext, useEffect, useState } from "react";
import { api, clearToken, getToken, setToken } from "@/configs/axios";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    let mounted = true;

    if (!getToken()) {
      setInitializing(false);
      return undefined;
    }

    api
      .get("/auth/me")
      .then(({ data }) => {
        if (mounted) setUser(data);
      })
      .catch(() => {
        // Expired or invalid token — drop the stored session.
        clearToken();
        if (mounted) setUser(null);
      })
      .finally(() => {
        if (mounted) setInitializing(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  // Any 401 from the backend (e.g. an expired token mid-session) signs the
  // user out everywhere at once.
  useEffect(() => {
    const onUnauthorized = () => setUser(null);
    window.addEventListener("opennotebook:unauthorized", onUnauthorized);
    return () =>
      window.removeEventListener("opennotebook:unauthorized", onUnauthorized);
  }, []);

  async function login(email, password) {
    const { data } = await api.post("/auth/login", { email, password });
    setToken(data.access_token);
    const { data: user } = await api.get("/auth/me");
    setUser(user);
    return user;
  }

  async function signup(name, email, password) {
    await api.post("/auth/signup", { name, email, password });
    // Auto sign-in right after creating the account.
    return login(email, password);
  }

  async function logout() {
    try {
      await api.post("/auth/logout");
    } finally {
      clearToken();
      setUser(null);
    }
  }

  return (
    <AuthContext.Provider value={{ user, initializing, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

/** Reads the auth state/actions. Must be used inside <AuthProvider>. */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
