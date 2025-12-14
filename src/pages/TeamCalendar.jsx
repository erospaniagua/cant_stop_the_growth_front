import SharedCalendar from "@/components/LiveEvents/SharedCalendar";
import { useUser } from "@/context/UserContext";

export default function TeamCalendar() {
  const { user } = useUser();

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Team Calendar</h1>
       <SharedCalendar
        fetchMode="team-manager"
        managerId={user.id}
       />
   </div>
  );
}
