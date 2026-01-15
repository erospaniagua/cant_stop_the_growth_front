import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useUser } from "@/context/UserContext"
import BlueprintBackground from "@/components/BlueprintBackground"

export default function Login() {
  const { login } = useUser()
  const navigate = useNavigate()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const user = await login(email, password)

      const route =
        {
          admin: "/",
          coach: "/coaches",
          student: "/",
          company: "/companies",
          "team-manager": "/",
        }[user.role] || "/"

      navigate(route)
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="relative flex min-h-screen overflow-hidden text-white">
      {/* Fullscreen animated blueprint background */}
      <div className="absolute inset-0 z-0">
        <BlueprintBackground />
      </div>

      {/* Left login panel */}
      <div className="relative z-10 flex items-center justify-center w-[40%] min-w-[380px] px-10 bg-black/40 backdrop-blur-md">
        <div className="w-full max-w-sm bg-white/5 p-8 rounded-2xl shadow-2xl border border-white/10">
          <h2 className="text-3xl font-semibold mb-6 text-center">Sign In</h2>

          {error && (
            <p className="text-red-400 text-sm mb-3 text-center">{error}</p>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <input
              type="email"
              placeholder="Email"
              className="w-full px-4 py-2 rounded bg-white/10 border border-white/20 focus:outline-none focus:border-red-500 placeholder-white/70"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            {/* Password + visibility toggle */}
            <div>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                className="w-full px-4 py-2 rounded bg-white/10 border border-white/20 focus:outline-none focus:border-red-500 placeholder-white/70"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <label className="flex items-center gap-2 mt-2 text-sm text-white/80">
                <input
                  type="checkbox"
                  checked={showPassword}
                  onChange={(e) => setShowPassword(e.target.checked)}
                  className="h-4 w-4 accent-red-500"
                />
                <span>Show password</span>
              </label>
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="w-full bg-red-600 hover:bg-red-700 py-2 rounded font-medium transition-colors"
            >
              Sign In
            </button>
          </form>
        </div>
      </div>

      {/* Right side – blueprint space */}
      <div className="flex-1" />
    </div>
  )
}
