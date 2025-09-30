import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar"
import { ModeToggle } from "@/components/ModeToggle"
import { navItems } from "@/config/nav-items"
import { permissions } from "@/config/permissions"
import { useUser } from "@/context/UserContext"
import { NavLink } from "react-router-dom"
import { useTranslation } from "react-i18next"

export function AppSidebar({ role = "admin" }) {
  const { user } = useUser()
  const allowedRoutes = permissions[user.role]?.routes || []
  const { t } = useTranslation()

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Main</SidebarGroupLabel>
          <SidebarMenu>
            {navItems[user.role]
              ?.filter((item) => allowedRoutes.includes(item.href))
              .map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.href}
                      className={({ isActive }) =>
                        `flex items-center gap-2 px-2 py-1.5 rounded-md transition ${
                          isActive
                            ? "bg-primary text-primary-foreground"
                            : "text-muted-foreground hover:bg-muted"
                        }`
                      }
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{t(item.title)}</span> {/* 👈 translate here */}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <div className="p-4 border-t">
        <ModeToggle />
      </div>
    </Sidebar>
  )
}
