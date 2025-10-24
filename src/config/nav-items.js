// src/config/nav-items.js
import { Home, Users, GraduationCap, Settings, BookOpen, Building2, BarChart,LayoutDashboard } from "lucide-react"

export const navItems = {
  admin: [
    { title: "dashboard", href: "/", icon: Home },
    { title: "companies", href: "/companies", icon: Building2 },
    { title: "coaches", href: "/coaches", icon: Users },
    { title: "Learning Routes", href: "/learning-routes", icon: BookOpen },
    { title: "students", href: "/students", icon: GraduationCap },
    { title: "analytics", href: "/analytics", icon: BarChart },
    { title: "Users", href: "/admin/users", icon: Users },
    { title: "settings", href: "/settings", icon: Settings },
  ],
  coach: [
    { title: "students", href: "/students", icon: Users },
    { title: "courses", href: "/courses", icon: BookOpen },
    { title: "settings", href: "/settings", icon: Settings }
  ],
  student: [
    { title: "courses", href: "/courses", icon: GraduationCap },
    { title: "settings", href: "/settings", icon: Settings }
  ],
  company: [
    { title: "courses", href: "/courses", icon: GraduationCap },
    { title: "settings", href: "/settings", icon: Settings }
  ],
  "team-manager": [
    { title: "Dashboard", href: "/managers", icon: LayoutDashboard },
    { title: "Settings", href: "/settings", icon: Settings }
  ],
}