import { useState } from "react";
import TemplatesList from "@/components/LiveEvents/TemplatesList";
import TemplateForm from "@/components/LiveEvents/TemplateForm";
import UseTemplateForm from "@/components/LiveEvents/UseTemplateForm";
import TemplateInstanceDetail from "@/components/LiveEvents/TemplateInstanceDetail";
import CalendarView from "@/components/LiveEvents/CalendarView";
import InvitationsModal from "@/components/LiveEvents/InvitationsModal";

export default function EventPlanning() {
  const [view, setView] = useState("list");
  const [activeTemplateId, setActiveTemplateId] = useState(null);
  const [activeInstanceId, setActiveInstanceId] = useState(null);
  

const [showInvitesModal, setShowInvitesModal] = useState(false);
const [inviteInstanceId, setInviteInstanceId] = useState(null);


  return (
    <div className="p-4">

      {/* TOP NAV (tabs) */}
      <div className="flex gap-4 mb-6">
        <button onClick={() => setView("list")} className="px-3 py-2 bg-gray-800 text-white rounded">
          Templates
        </button>

        <button onClick={() => setView("calendar")} className="px-3 py-2 bg-gray-800 text-white rounded">
          Calendar
        </button>
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
          }}/>
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
    </div>
  );
}
