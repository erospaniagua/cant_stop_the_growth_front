import { createContext, useContext, useState, useEffect } from "react";
import { apiClient } from "@/api/client";

const UserContext = createContext(null);

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // 🔹 Cargar desde localStorage una sola vez
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const storedToken = localStorage.getItem("token");

    if (storedUser && storedToken) {
      try {
        setUser(JSON.parse(storedUser));
        setToken(storedToken);
      } catch (err) {
        console.error("Failed parsing stored user:", err);
        localStorage.removeItem("user");
        localStorage.removeItem("token");
      }
    }

    setLoading(false);
  }, []);

  // 🔹 LOGIN: guarda en estado + localStorage
  const login = async (email, password) => {
    const data = await apiClient.post("/api/auth/login", { email, password });

    if (!data || !data.user || !data.token) {
      throw new Error("Invalid login response from server");
    }

    setUser(data.user);
    setToken(data.token);

    localStorage.setItem("user", JSON.stringify(data.user));
    localStorage.setItem("token", data.token);

    return data.user;
  };

  // 🔹 LOGOUT: limpia todo
  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
  };

  // 🔹 UPDATE USER: sincroniza contexto + localStorage
  const updateUser = (fields) => {
    setUser((prev) => {
      const updated = { ...(prev || {}), ...fields };
      localStorage.setItem("user", JSON.stringify(updated));
      return updated;
    });
  };

  const value = { user, token, login, logout, updateUser, loading };

  if (loading) {
    // Bloquea TODO hasta haber leído localStorage
    return null;
  }

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);
