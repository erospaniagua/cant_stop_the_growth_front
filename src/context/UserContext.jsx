import { createContext, useContext, useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { apiClient } from "@/api/client"   // 👈 import your API handler

const UserContext = createContext()

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  // Load from localStorage on startup
  useEffect(() => {
    const storedUser = localStorage.getItem("user")
    const storedToken = localStorage.getItem("token")

    if (storedUser && storedToken) {
      setUser(JSON.parse(storedUser))
      setToken(storedToken)
    }
    setLoading(false)
  }, [])

  // LOGIN — now using apiClient
  const login = async (email, password) => {
    const data = await apiClient.post("/api/auth/login", { email, password })

    setUser(data.user)
    setToken(data.token)

    localStorage.setItem("user", JSON.stringify(data.user))
    localStorage.setItem("token", data.token)

    if (data.user.mustChangePassword) {
      navigate("/settings", { replace: true })
    } else {
      navigate("/", { replace: true })
    }

    return data.user
  }

  // LOGOUT
  const logout = () => {
    setUser(null)
    setToken(null)
    localStorage.removeItem("user")
    localStorage.removeItem("token")
    navigate("/login", { replace: true })
  }

  // Update cached user
  const updateUser = (fields) => {
    setUser((prev) => {
      const updated = { ...prev, ...fields }
      localStorage.setItem("user", JSON.stringify(updated))
      return updated
    })
  }

  return (
    <UserContext.Provider value={{ user, token, login, logout, updateUser, loading }}>
      {children}
    </UserContext.Provider>
  )
}

export const useUser = () => useContext(UserContext)
