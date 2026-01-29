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
      "/my-calendar",
      "/career-maps",
      "/admin/career-maps/:id", // NEW: Admin master calendar
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
      "/settings",
      "/my-career-maps",
      "/career-maps/:careerMapId"
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
      "/my-calendar",
      "/team-careers"
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
      "/team-careers",
      "/my-career-maps"
    ],
    can: {
      changeLanguage: true,
    }
  }
};
