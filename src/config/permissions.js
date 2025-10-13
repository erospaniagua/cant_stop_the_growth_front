// src/config/permissions.js
export const permissions = {
  admin: {
    routes: ["/", "/companies", "/coaches", "/courses", "/students", "/analytics", "/settings"],
    can: {
      addCompany: true,
      addCourse: true,
      addStudent: true,
      editCourse: true,
      changeLanguage: true,
    },
  },
  coach: {
    routes: ["/", "/students", "/courses", "/settings"],
    can: {
      addCompany: false,
      addCourse: true,
      addStudent: true,
      editCourse: true,
      changeLanguage: true,
    },
  },
  student: {
    routes: ["/", "/courses", "/settings"],
    can: {
      addCompany: false,
      addCourse: false,
      addStudent: false,
      editCourse: false,
      changeLanguage: true,
    },
  },
  company: {
    routes: ["/", "/courses", "/settings"],
    can: {
      viewCourses: true,
      editCourse: false,
      changeLanguage: true,
    },
    
  },
  "team-manager": { routes: ["/managers", "/settings"] }
}
