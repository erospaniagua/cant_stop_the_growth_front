import { useUser } from "@/context/UserContext";
import DashboardAdmin from "./DashboardAdmin";
import DashboardCoach from "./DashboardCoach";
import DashboardStudent from "./DashboardStudent";
import DashboardCompany from "./DashboardCompany";
import Layout from "@/components/Layout";

export default function Dashboard() {
  const { user } = useUser()

  return (
    <>
      {user.role === "admin" && <DashboardAdmin />}
      {user.role === "coach" && <DashboardCoach />}
      {user.role === "student" && <DashboardStudent />}
      {user.role === "company" && <DashboardCompany />}
   </>
  )
}