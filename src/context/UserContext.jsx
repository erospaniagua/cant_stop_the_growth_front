import { createContext, useContext, useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"

const UserContext = createContext()

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate() // 👈 add navigation hook

  // 🧠 Load from localStorage on startup
  useEffect(() => {
    const storedUser = localStorage.getItem("user")
    const storedToken = localStorage.getItem("token")

    if (storedUser && storedToken) {
      setUser(JSON.parse(storedUser))
      setToken(storedToken)
    }
    setLoading(false)
  }, [])

  // 🧩 Login
  const login = async (email, password) => {
    const res = await fetch("http://localhost:5000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    })

    const data = await res.json()
    if (!res.ok) throw new Error(data.message || "Login failed")

    // 🧠 Save token + user to context and localStorage
    setUser(data.user)
    setToken(data.token)
    localStorage.setItem("user", JSON.stringify(data.user))
    localStorage.setItem("token", data.token)

    // 🧭 Redirect logic
    if (data.user.mustChangePassword) {
      navigate("/settings", { replace: true })
    } else {
      navigate("/", { replace: true })
    }

    return data.user
  }

  // 🚪 Logout
  const logout = () => {
    setUser(null)
    setToken(null)
    localStorage.removeItem("user")
    localStorage.removeItem("token")
    navigate("/login", { replace: true }) // 👈 optional redirect
  }

  const updateUser = (updatedFields) => {
  setUser((prev) => {
    const newUser = { ...prev, ...updatedFields }
    localStorage.setItem("user", JSON.stringify(newUser))
    return newUser
  })
}

  return (
    <UserContext.Provider value={{ user, token, login, logout, updateUser, loading }}>
      {children}
    </UserContext.Provider>
  )
}

export const useUser = () => useContext(UserContext)
