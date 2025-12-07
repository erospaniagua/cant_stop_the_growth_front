// src/config/nav-items.js
import { Home, Users, GraduationCap, Settings, BookOpen, Building2, BarChart,LayoutDashboard, CalendarDays, UsersIcon } from "lucide-react"

export const navItems = {
  admin: [
    { title: "dashboard", href: "/", icon: Home },
    { title: "companies", href: "/companies", icon: Building2 },
    { title: "coaches", href: "/coaches", icon: Users },
    { title: "Learning Routes", href: "/learning-routes", icon: BookOpen },
    { title: "Event Planning", href: "/event-planning", icon: BookOpen },
    { title: "My Calendar", href: "/my-calendar", icon: CalendarDays }, // Admin calendar
    { title: "Teams", href: "/teams", icon: UsersIcon },
    { title: "analytics", href: "/analytics", icon: BarChart },
    { title: "Users", href: "/admin/users", icon: Users },
    { title: "settings", href: "/settings", icon: Settings },
  ],

  coach: [
    { title: "students", href: "/students", icon: Users },
    { title: "courses", href: "/courses", icon: BookOpen },
    { title: "My Calendar", href: "/my-calendar", icon: CalendarDays },
    { title: "settings", href: "/settings", icon: Settings }
  ],

  student: [
    { title: "My Learning Routes", href: "/my-learning-routes", icon: GraduationCap },
    { title: "My Calendar", href: "/my-calendar", icon: CalendarDays },
    { title: "settings", href: "/settings", icon: Settings }
  ],

  company: [
    { title: "courses", href: "/courses", icon: GraduationCap },
    { title: "Company Calendar", href: "/company-calendar", icon: CalendarDays },
    { title: "My Calendar", href: "/my-calendar", icon: CalendarDays },
    { title: "settings", href: "/settings", icon: Settings }
  ],

  "team-manager": [
    { title: "Dashboard", href: "/managers", icon: LayoutDashboard },
    { title: "Team Calendar", href: "/team-calendar", icon: CalendarDays },
    { title: "Settings", href: "/settings", icon: Settings }
  ],
};
