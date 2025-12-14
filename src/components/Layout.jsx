import { Outlet } from "react-router-dom"
import { AppSidebar } from "./AppSidebar"
import Topbar from "./Topbar"
import { useUser } from "@/context/UserContext"

export default function Layout({ role = "admin" }) {
  const { user } = useUser();
  console.log("LAYOUT USER:", user);
  return (
    <div className="flex min-h-screen w-full">
      <AppSidebar role={role} />
      <div className="flex-1 flex flex-col w-full">
        <Topbar />
        <main className="flex-1 w-full p-6">
          <Outlet /> {/* 👈 this renders the nested route */}
        </main>
      </div>
    </div>
  )
}
