
import { Home, Users, GraduationCap, Settings } from "lucide-react"

export const navItems = {
  admin: [
    { title: "Companies", icon: Home, href: "/companies" },
    { title: "Coaches", icon: Users, href: "/coaches" },
    { title: "Students", icon: GraduationCap, href: "/students" },
    { title: "Settings", icon: Settings, href: "/settings" },
  ],
  coach: [
    { title: "My Students", icon: Users, href: "/students" },
    { title: "Courses", icon: GraduationCap, href: "/courses" },
  ],
  student: [
    { title: "My Courses", icon: GraduationCap, href: "/courses" },
  ],
}
