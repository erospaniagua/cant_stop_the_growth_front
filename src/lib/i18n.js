import i18n from "i18next"
import { initReactI18next } from "react-i18next"

i18n.use(initReactI18next).init({
  resources: {
    en: {
      translation: {
        //sidebar
         dashboard: "Dashboard",
         companies: "Companies",
         coaches: "Coaches",
         courses: "Courses",
         students: "Students",
         analytics: "Analytics",
         settings: "Settings",
        //settings

        customizePreferences: "Customize your preferences.",
        general: "General",
        language: "Language",
        switchToSpanish: "Switch to Español",
        switchToEnglish: "Switch to English",

        adminSettings: "Admin Settings",
        adminSettingsDesc: "Manage users, system config, etc.",

        coachSettings: "Coach Settings",
        coachSettingsDesc: "Manage your profile and courses.",

        studentSettings: "Student Settings",
        studentSettingsDesc: "Manage notifications and profile.",

        companySettings: "Company Settings",
        companySettingsDesc: "Manage billing and account access.",
        
      },
    },
    es: {
      translation: {
        //barra lateral
        dashboard: "Panel",
        companies: "Empresas",
        coaches: "Entrenadores",
        courses: "Cursos",
        students: "Estudiantes",
        analytics: "Analíticas",
    
        //configuracion
        settings: "Configuración",
        customizePreferences: "Personaliza tus preferencias.",
        general: "General",
        language: "Idioma",
        switchToSpanish: "Cambiar a Español",
        switchToEnglish: "Cambiar a Inglés",

        adminSettings: "Configuración de Administrador",
        adminSettingsDesc: "Gestiona usuarios, configuración del sistema, etc.",

        coachSettings: "Configuración de Coach",
        coachSettingsDesc: "Gestiona tu perfil y cursos.",

        studentSettings: "Configuración de Estudiante",
        studentSettingsDesc: "Gestiona notificaciones y perfil.",

        companySettings: "Configuración de Empresa",
        companySettingsDesc: "Gestiona facturación y acceso a la cuenta.",
      },
    },
  },
  lng: "en",
  fallbackLng: "en",
  interpolation: { escapeValue: false },
})

export default i18n

