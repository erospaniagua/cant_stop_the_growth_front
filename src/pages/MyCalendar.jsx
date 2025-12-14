import SharedCalendar from "@/components/LiveEvents/SharedCalendar";

export default function MyCalendar() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">My Calendar</h1>
      <SharedCalendar fetchMode="user" />
    </div>
  );
}
