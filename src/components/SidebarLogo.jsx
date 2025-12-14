import { useState } from "react"
import { useUser } from "@/context/UserContext"
import CSTGLogo from "@/assets/cstg-logo.png"

export default function SidebarLogo() {
  const { user } = useUser()
  const [hasError, setHasError] = useState(false)

  const isAdminOrCoach =
    user?.role === "admin" || user?.role === "coach"

  // 👇 match current Company schema
  const companyLogo = user?.company?.logo

  const logoSrc =
    isAdminOrCoach || !companyLogo || hasError
      ? CSTGLogo
      : companyLogo

  return (
    <div className="h-10 flex items-center justify-center border-b">
      <img
        src={logoSrc}
        alt="Logo"
        className="h-10 max-w-[160px] object-contain"
        onError={() => setHasError(true)}
      />
    </div>
  )
}
