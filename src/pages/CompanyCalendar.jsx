import SharedCalendar from "@/components/LiveEvents/SharedCalendar";
import { useUser } from "@/context/UserContext";

export default function CompanyCalendar() {
  const { user } = useUser();

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Company Calendar</h1>

      <SharedCalendar
        fetchMode="company"
        companyId={user.company?.id}
      />
    </div>
  );
}
