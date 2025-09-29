// src/context/UserContext.jsx
import { createContext, useContext, useState } from "react"

const UserContext = createContext()

export function UserProvider({ children }) {
  // Hardcoded for now, but later fetch from API or auth provider
  const [user, setUser] = useState({
    name: "Eros",
    role: "student", // "admin" | "coach" | "student"
  })

  return (
    <UserContext.Provider value={{ user, setUser }}>
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  return useContext(UserContext)
}