import { useState } from "react";
import TemplatesList from "@/components/LiveEvents/TemplatesList";
import TemplateForm from "@/components/LiveEvents/TemplateForm";
import UseTemplateForm from "@/components/LiveEvents/UseTemplateForm";
import TemplateInstanceDetail from "@/components/LiveEvents/TemplateInstanceDetail";
import CalendarView from "@/components/LiveEvents/CalendarView";
import InvitationsModal from "@/components/LiveEvents/InvitationsModal";
import SingleEventModal from "@/components/LiveEvents/SingleEventModal";
// import SingleEventModal from "@/components/LiveEvents/SingleEventModal"; // next step

export default function EventPlanning() {
  const [view, setView] = useState("list");
  const [activeTemplateId, setActiveTemplateId] = useState(null);
  const [activeInstanceId, setActiveInstanceId] = useState(null);

  const [showInvitesModal, setShowInvitesModal] = useState(false);
  const [inviteInstanceId, setInviteInstanceId] = useState(null);

  // next step
  const [showSingleEventModal, setShowSingleEventModal] = useState(false);

  return (
    <div className="p-4">

      {/* TOP NAV (tabs + contextual actions) */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex gap-4">
          <button
            onClick={() => setView("list")}
            className={`px-3 py-2 rounded ${
              view === "list" ? "bg-gray-700 text-white" : "bg-gray-800 text-white"
            }`}
          >
            Templates
          </button>

          <button
            onClick={() => setView("calendar")}
            className={`px-3 py-2 rounded ${
              view === "calendar"
                ? "bg-gray-700 text-white"
                : "bg-gray-800 text-white"
            }`}
          >
            Calendar
          </button>
        </div>

        {/* ➕ Add single event (calendar-only) */}
        {view === "calendar" && (
          <button
            onClick={() => setShowSingleEventModal(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded"
          >
            + Add single event
          </button>
        )}
      </div>

      {/* VIEWS */}
      {view === "list" && (
        <TemplatesList
          onCreate={() => setView("create")}
          onEdit={(id) => {
            setActiveTemplateId(id);
            setView("edit");
          }}
          onUse={(id) => {
            setActiveTemplateId(id);
            setView("use");
          }}
          onOpenInstance={(id) => {
            setActiveInstanceId(id);
            setView("instance");
          }}
          onOpenInvites={(instanceId) => {
            setInviteInstanceId(instanceId);
            setShowInvitesModal(true);
          }}
        />
      )}

      {showInvitesModal && (
        <InvitationsModal
          instanceId={inviteInstanceId}
          onClose={() => {
            setShowInvitesModal(false);
            setInviteInstanceId(null);
          }}
        />
      )}

      {view === "create" && (
        <TemplateForm
          onBack={() => setView("list")}
          templateId={null}
        />
      )}

      {view === "edit" && (
        <TemplateForm
          templateId={activeTemplateId}
          onBack={() => setView("list")}
        />
      )}

      {view === "use" && (
        <UseTemplateForm
          templateId={activeTemplateId}
          onBack={() => setView("list")}
          onCreatedInstance={(id) => {
            setActiveInstanceId(id);
            setView("instance");
          }}
        />
      )}

      {view === "instance" && (
        <TemplateInstanceDetail
          instanceId={activeInstanceId}
          onBack={() => setView("list")}
        />
      )}

      {view === "calendar" && (
        <CalendarView />
      )}

      {/* NEXT STEP */}
      {showSingleEventModal && (
         
       <SingleEventModal
  open={showSingleEventModal}
  onClose={() => setShowSingleEventModal(false)}
  onCreated={() => {
    setShowSingleEventModal(false);
    // later: trigger calendar refresh
  }}
/>
       
      )}
    </div>
  );
}
