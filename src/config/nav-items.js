import { Home, Users, GraduationCap, Settings, BookOpen, Building2 } from "lucide-react"

export const navItems = {
  admin: [
    { title: "Companies", href: "/companies", icon: Building2 },
    { title: "Coaches", href: "/coaches", icon: Users },
    { title: "Students", href: "/students", icon: GraduationCap },
    { title: "Settings", href: "/settings", icon: Settings },
  ],
  coach: [
    { title: "My Students", href: "/students", icon: Users },
    { title: "Courses", href: "/courses", icon: BookOpen },
  ],
  student: [
    { title: "My Courses", href: "/courses", icon: GraduationCap },
  ],
}