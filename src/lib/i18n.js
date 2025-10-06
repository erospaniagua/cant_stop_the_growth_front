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

        //companies
        // inside en.translation
        companiesTitle: "Companies",
        addCompany: "Add Company",
        refresh: "Refresh",
        name: "Name",
        manager: "Manager",
        teamSize: "Team Size",
        revenue: "Revenue",
        trade: "Trade",
        coach: "Coach",
        status: "Status",
        employees: "Employees",
        managers: "Managers",
        access: "Access",
        reports: "Reports",
        addEmployee: "Add Employee",
        assignClass: "Assign Class",
        addManager: "Add Manager",
        assignCoach: "Assign Coach",
        addAccess: "Add Access",
        assignAccess: "Assign Access",
        viewCompany: "View Company",
        editCompany: "Edit Company",
        addNewCompany: "Add New Company",

        // form fields
        owner: "Owner",
        primaryContact: "Primary Contact",
        phone: "Phone",
        email: "Email",
        type: "Type",
        privateEquity: "Private Equity",
        privateOwner: "Private Owner",
        quotePdf: "Quote (PDF)",
        subscription: "Subscription",
        additionalServices: "Additional Services",
        coachLabel: "Coach",
        salesman: "Salesman",
        successManager: "Success Manager",
        trainingKickoffDay: "Training Kickoff Day",
        onsiteDay: "Onsite Day",
        submit: "Submit",
        selected: "Selected",
        none: "None",
        companyLogo: "Company Logo",
        dragOrClickImage: "Drag & drop an image here, or click to upload",
        dragOrClickPdf: "Drag & drop a PDF file here, or click to upload",

        
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

        //companies
        companiesTitle: "Empresas",
        addCompany: "Agregar Empresa",
        refresh: "Actualizar",
        name: "Nombre",
        manager: "Gerente",
        teamSize: "Tamaño del Equipo",
        revenue: "Ingresos",
        trade: "Rubro",
        coach: "Coach",
        status: "Estado",
        employees: "Empleados",
        managers: "Gerentes",
        access: "Accesos",
        reports: "Reportes",
        addEmployee: "Agregar Empleado",
        assignClass: "Asignar Clase",
        addManager: "Agregar Gerente",
        assignCoach: "Asignar Coach",
        addAccess: "Agregar Acceso",
        assignAccess: "Asignar Acceso",
        viewCompany: "Ver Empresa",
        editCompany: "Editar Empresa",
        addNewCompany: "Nueva Empresa",

        // form fields
        owner: "Propietario",
        primaryContact: "Contacto Principal",
        phone: "Teléfono",
        email: "Correo Electrónico",
        type: "Tipo",
        privateEquity: "Capital Privado",
        privateOwner: "Dueño Privado",
        quotePdf: "Cotización (PDF)",
        subscription: "Suscripción",
        additionalServices: "Servicios Adicionales",
        coachLabel: "Coach",
        salesman: "Vendedor",
        successManager: "Gerente de Éxito",
        trainingKickoffDay: "Inicio de Entrenamiento",
        onsiteDay: "Día Presencial",
        submit: "Guardar",
        selected: "Seleccionado",
        none: "Ninguno",
        companyLogo: "Logotipo de la Empresa",
        dragOrClickImage: "Arrastra y suelta una imagen aquí o haz clic para subirla",
        dragOrClickPdf: "Arrastra y suelta un archivo PDF aquí o haz clic para subirlo",
        
      },
    },
  },
  lng: "en",
  fallbackLng: "en",
  interpolation: { escapeValue: false },
})

export default i18n

