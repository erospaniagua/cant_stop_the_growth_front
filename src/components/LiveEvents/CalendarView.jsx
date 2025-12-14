import { useState, useEffect, useRef } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { apiClient } from "@/api/client";
import EventDetailsModal from "@/components/LiveEvents/EventDetailsModal";

export default function CalendarView() {
  const calendarRef = useRef(null);
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState(null);

  async function loadEvents(start, end) {
    try {
      const data = await apiClient.get(
        `/api/calendar-events/range/search?from=${start.toISOString()}&to=${end.toISOString()}`
      );

      const formatted = data.map((ev) => ({
        id: ev._id,
        title: ev.title,
        start: ev.startDate,
        end: ev.endDate,
        backgroundColor: ev.color || "#3b82f6",
        borderColor: ev.color || "#1d4ed8",
        textColor: "#fff",
        extendedProps: ev
      }));

      setEvents(formatted);
    } catch (err) {
      console.error("Error loading events:", err);
    }
  }

  const handleDatesSet = (arg) => {
    loadEvents(arg.start, arg.end);
  };

  const handleEventClick = (info) => {
    setSelectedEventId(info.event.id);
  };

  return (
    <div className="border rounded p-4 black relative">
      <FullCalendar
        ref={calendarRef}
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        headerToolbar={{
          left: "prev,next today",
          center: "title",
          right: "dayGridMonth,timeGridWeek,timeGridDay"
        }}
        events={events}
        datesSet={handleDatesSet}
        eventClick={handleEventClick}
        height="80vh"
      />

      {selectedEventId && (
        <EventDetailsModal
          eventId={selectedEventId}
          onClose={() => setSelectedEventId(null)}
        />
      )}
    </div>
  );
}
