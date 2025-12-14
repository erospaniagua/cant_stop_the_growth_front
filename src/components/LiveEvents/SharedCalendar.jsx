import { useState, useRef, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";

import { apiClient } from "@/api/client";
import EventDetailsModal from "./EventDetailsModal";

export default function SharedCalendar({ fetchMode, companyId, managerId }) {
  const calendarRef = useRef(null);
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState(null);

  async function loadEvents(start, end) {
    try {
      let url = "";

      if (fetchMode === "user") {
        url = `/api/calendar-events/user/list`;
      }

      if (fetchMode === "company") {
        if (!companyId) return;
        url = `/api/calendar-events/company/${companyId}`;
      }

      if (fetchMode === "team-manager") {
        if (!managerId) return;
        url = `/api/calendar-events/manager/${managerId}`;
      }

      if (fetchMode === "admin-range") {
        if (!start || !end) return;
        url = `/api/calendar-events/range/search?from=${start.toISOString()}&to=${end.toISOString()}`;
      }

      const data = await apiClient.get(url);

      const formatted = data.map(ev => ({
        id: ev._id,
        title: ev.title,
        start: ev.startDate,
        end: ev.endDate,
        backgroundColor: ev.templateInstanceId?.color || ev.color,
        borderColor: ev.templateInstanceId?.color || ev.color,
        extendedProps: ev
      }));

      setEvents(formatted);
    } catch (err) {
      console.error("loadEvents error:", err);
    }
  }

  useEffect(() => {
    if (fetchMode === "user") loadEvents();
    if (fetchMode === "company" && companyId) loadEvents();
    if (fetchMode === "team-manager" && managerId) loadEvents();
  }, [fetchMode, companyId, managerId]);

  const handleDatesSet = (arg) => {
    if (fetchMode === "admin-range") {
      loadEvents(arg.start, arg.end);
    }
  };

  const handleEventClick = (info) => {
    setSelectedEventId(info.event.id);
  };

  const closeModal = () => {
    setSelectedEventId(null);
    loadEvents();
  };

  return (
    <div className="p-4 border rounded black">
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
        timeZone="local"
       eventDisplay="block"
       dayMaxEventRows={3}
      />

      {selectedEventId && (
        <EventDetailsModal eventId={selectedEventId} onClose={closeModal} />
      )}
    </div>
  );
}
