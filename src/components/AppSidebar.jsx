import { useState } from "react"
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
import { NavLink, useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { LogOut } from "lucide-react"
import { UserBadge } from "@/components/UserBadge"
import SidebarLogo from "@/components/SidebarLogo"
import LogoutConfirmModal from "@/components/LogoutConfirmModal"

export function AppSidebar() {
  const { user, loading, logout } = useUser()
  const { t } = useTranslation()
  const navigate = useNavigate()

  const [logoutOpen, setLogoutOpen] = useState(false)

  if (loading) {
    return (
      <Sidebar>
        <SidebarContent>
          <SidebarGroupLabel>{t("Loading...")}</SidebarGroupLabel>
        </SidebarContent>
      </Sidebar>
    )
  }

  if (!user) return null

  const role = user.role
  const allowedRoutes = permissions[role]?.routes || []
  const items =
    navItems[role]?.filter((item) => allowedRoutes.includes(item.href)) || []

  const confirmLogout = () => {
    logout()
    navigate("/login")
  }

  return (
    <>
      <Sidebar>
        <SidebarContent>
          <SidebarLogo />
          <SidebarGroup>
            <SidebarGroupLabel>{t("Main")}</SidebarGroupLabel>
            <SidebarMenu>
              {items.map((item) => (
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
                      <span>{t(item.title)}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>

        <div className="p-4 border-t flex flex-col gap-2">
          <UserBadge />
          <button
            onClick={() => setLogoutOpen(true)}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:bg-muted px-2 py-1.5 rounded-md transition"
          >
            <LogOut className="h-4 w-4" />
            <span>{t("Log out")}</span>
          </button>
        </div>
      </Sidebar>

      <LogoutConfirmModal
        open={logoutOpen}
        onOpenChange={setLogoutOpen}
        onConfirm={confirmLogout}
      />
    </>
  )
}
