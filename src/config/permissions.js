// src/config/permissions.js

export const permissions = {
  admin: {
    routes: [
      "/",
      "/companies",
      "/coaches",
      "/learning-tracks",
      "/teams",
      "/analytics",
      "/settings",
      "/admin/users",
      "/event-planning",
      "/my-calendar" // NEW: Admin master calendar
    ],
    can: {
      addCompany: true,
      addCourse: true,
      addStudent: true,
      editCourse: true,
      changeLanguage: true,
    },
  },

  coach: {
    routes: [
      "/",
      "/settings",
      "/my-calendar"  // NEW: Coach calendar
    ],
    can: {
      addCompany: false,
      addCourse: true,
      addStudent: true,
      editCourse: true,
      changeLanguage: true,
    },
  },

  student: {
    routes: [
      "/",
      "/my-learning-tracks",
      "/my-learning-tracks/:routeId",
      "/my-learning-tracks/:routeId/lessons/:lessonId",
      "/my-calendar", // NEW: Student calendar
      "/settings"
    ],
    can: {
      addCompany: false,
      addCourse: false,
      addStudent: false,
      editCourse: false,
      changeLanguage: true,
    },
  },

  company: {
    routes: [
      "/",
      "/my-learning-tracks",
      "/my-learning-tracks/:routeId",
      "/my-learning-tracks/:routeId/lessons/:lessonId",
      "/company-calendar", // NEW: Company-wide calendar
      "/settings",
      "/my-calendar"
    ],
    can: {
      viewCourses: true,
      editCourse: false,
      changeLanguage: true,
    },
  },

  "team-manager": {
    routes: [
      "/",
      "/team-calendar", // NEW: Team calendar
      "/settings",
      "/my-learning-tracks",
      "/my-learning-tracks/:routeId",
      "/my-learning-tracks/:routeId/lessons/:lessonId",
    ],
    can: {
      changeLanguage: true,
    }
  }
};
