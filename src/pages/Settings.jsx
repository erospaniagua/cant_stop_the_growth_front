// src/pages/Settings.jsx
import { useUser } from "@/context/UserContext"
import { useLanguage } from "@/context/LanguageContext"
import { Button } from "@/components/ui/button"
import { useTranslation } from "react-i18next"

export default function Settings() {
  const { user } = useUser()
  const { language, toggleLanguage } = useLanguage()
  const { t, i18n } = useTranslation()

  const handleToggle = () => {
    toggleLanguage()
    i18n.changeLanguage(language === "en" ? "es" : "en")
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">{t("settings")}</h1>
      <p className="text-muted-foreground">{t("customizePreferences")}</p>

      {/* Common settings */}
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
