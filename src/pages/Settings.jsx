// src/pages/Settings.jsx
import { useState } from "react"
import { useUser } from "@/context/UserContext"
import { useLanguage } from "@/context/LanguageContext"
import { Button } from "@/components/ui/button"
import { useTranslation } from "react-i18next"

export default function Settings() {
  const { user, token } = useUser()
  const { language, toggleLanguage } = useLanguage()
  const { t, i18n } = useTranslation()

  const [oldPassword, setOldPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)

  const handleToggle = () => {
    toggleLanguage()
    i18n.changeLanguage(language === "en" ? "es" : "en")
  }

  // 🧩 Handle password change
  const handleChangePassword = async (e) => {
    e.preventDefault()

    if (!oldPassword || !newPassword || !confirmPassword) {
      alert("Please fill in all fields.")
      return
    }
    if (newPassword !== confirmPassword) {
      alert("New passwords do not match.")
      return
    }

    try {
      setLoading(true)
      const res = await fetch("http://localhost:5000/api/users/change-password", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ oldPassword, newPassword }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.message || "Error updating password")

      alert("Password updated successfully.")
      setOldPassword("")
      setNewPassword("")
      setConfirmPassword("")
    } catch (err) {
      console.error("Error changing password:", err)
      alert(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">{t("settings")}</h1>
      <p className="text-muted-foreground">{t("customizePreferences")}</p>

      {/* General settings */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">{t("general")}</h2>
        <div>
          <p className="mb-2">
            {t("language")}: {language === "en" ? "English" : "Español"}
          </p>
          <Button onClick={handleToggle}>
            {language === "en" ? t("switchToSpanish") : t("switchToEnglish")}
          </Button>
        </div>
      </div>

      {/* Password change section */}
      <div className="space-y-4 border-t pt-6">
        <h2 className="text-xl font-semibold">{t("changePassword")}</h2>
        <p className="text-muted-foreground">
          {t("changePasswordDesc") ||
            "Update your account password below. Make sure to use a strong password."}
        </p>

        <form onSubmit={handleChangePassword} className="space-y-3 max-w-md">
          <input
            type="password"
            placeholder="Current password"
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
            className="border rounded p-2 w-full"
          />
          <input
            type="password"
            placeholder="New password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="border rounded p-2 w-full"
          />
          <input
            type="password"
            placeholder="Confirm new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="border rounded p-2 w-full"
          />

          <Button
            type="submit"
            disabled={loading}
            className="w-full mt-2"
          >
            {loading ? "Updating..." : "Change Password"}
          </Button>
        </form>
      </div>

      {/* Role-specific settings */}
      {user.role === "admin" && (
        <div>
          <h2 className="text-xl font-semibold">{t("adminSettings")}</h2>
          <p className="text-muted-foreground">{t("adminSettingsDesc")}</p>
        </div>
      )}

      {user.role === "coach" && (
        <div>
          <h2 className="text-xl font-semibold">{t("coachSettings")}</h2>
          <p className="text-muted-foreground">{t("coachSettingsDesc")}</p>
        </div>
      )}

      {user.role === "student" && (
        <div>
          <h2 className="text-xl font-semibold">{t("studentSettings")}</h2>
          <p className="text-muted-foreground">{t("studentSettingsDesc")}</p>
        </div>
      )}

      {user.role === "company" && (
        <div>
          <h2 className="text-xl font-semibold">{t("companySettings")}</h2>
          <p className="text-muted-foreground">{t("companySettingsDesc")}</p>
        </div>
      )}
    </div>
  )
}
