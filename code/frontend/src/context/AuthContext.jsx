import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { getCurrentUser } from "../services/authService";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  // Check sessionStorage first (tab-level isolation), then localStorage (persistent)
  const [token, setToken] = useState(() => {
    try {
      return (
        sessionStorage.getItem("token") ||
        localStorage.getItem("token") ||
        null
      );
    } catch {
      return null;
    }
  });

  const [user, setUser] = useState(() => {
    try {
      const savedUser =
        sessionStorage.getItem("user") ||
        localStorage.getItem("user");
      return savedUser ? JSON.parse(savedUser) : null;
    } catch (err) {
      console.warn("[Auth] Failed to parse cached user:", err);
      try {
        sessionStorage.removeItem("user");
        localStorage.removeItem("user");
      } catch {
        // ignore storage errors
      }
      return null;
    }
  });

  const logout = useCallback(() => {
    try {
      sessionStorage.removeItem("token");
      sessionStorage.removeItem("user");
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    } catch (err) {
      console.warn("[Auth] Failed to clear auth from storage:", err);
    }

    setToken(null);
    setUser(null);
  }, []);

  const login = useCallback((newToken, userData, remember = true) => {
    try {
      // Store in sessionStorage for current tab / window session isolation
      sessionStorage.setItem("token", newToken);
      if (userData) {
        sessionStorage.setItem("user", JSON.stringify(userData));
      }

      // Also persist to localStorage if remember is enabled
      if (remember) {
        localStorage.setItem("token", newToken);
        if (userData) {
          localStorage.setItem("user", JSON.stringify(userData));
        }
      }
    } catch (err) {
      console.warn("[Auth] Failed to persist auth to storage:", err);
    }

    setToken(newToken);
    setUser(userData || null);
  }, []);

  // Validate restored token once on cold startup against backend
  const hasCheckedInitialSession = useRef(false);

  useEffect(() => {
    if (hasCheckedInitialSession.current) return;
    hasCheckedInitialSession.current = true;

    if (!token) return;

    let active = true;
    async function verifyInitialSession() {
      try {
        const verifiedUser = await getCurrentUser(token);
        if (active && verifiedUser) {
          setUser(verifiedUser);
          try {
            sessionStorage.setItem("user", JSON.stringify(verifiedUser));
            if (localStorage.getItem("token")) {
              localStorage.setItem("user", JSON.stringify(verifiedUser));
            }
          } catch {
            // ignore storage errors
          }
        }
      } catch (err) {
        if (err.message === "UNAUTHORIZED") {
          console.warn("[Auth] Token invalid or expired. Clearing session.");
          if (active) {
            logout();
          }
        }
      }
    }

    verifyInitialSession();
    return () => {
      active = false;
    };
  }, [token, logout]);

  const isAuthenticated = Boolean(token);

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        isAuthenticated,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}