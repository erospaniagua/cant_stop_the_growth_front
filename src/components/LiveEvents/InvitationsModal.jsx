import { useState, useEffect, useMemo } from "react";
import { apiClient } from "@/api/client";

/* ================================================================
   Helpers
================================================================= */
function inviteKey(inv) {
  return inv?.userId?._id || inv?.email;
}

export default function InvitationsModal({
  mode = "existing-instance", // "new-instance" | "existing-instance"
  instanceId = null,
  initialInvites = [],
  onClose,
  onConfirm,
}) {
  const [loading, setLoading] = useState(true);

  const [query, setQuery] = useState("");
  const [selectedCompany, setSelectedCompany] = useState("");
  const [selectedRole, setSelectedRole] = useState("");
  const [selectedCats, setSelectedCats] = useState([]);

  const [searchResults, setSearchResults] = useState([]);
  const [companies, setCompanies] = useState([]);

  const [invites, setInvites] = useState(
    mode === "new-instance" ? initialInvites : []
  );

  const [pendingAdds, setPendingAdds] = useState([]);
  const [pendingRemoves, setPendingRemoves] = useState([]);

  const [manualEmail, setManualEmail] = useState("");

  const ROLES = ["student", "coach", "team-manager", "admin"];
  const CATEGORIES = ["Leadership", "Sales", "Service", "Office Staff", "Install"];

  /* ================================================================
     Derived state
================================================================= */
  const inviteSet = useMemo(
    () => new Set(invites.map(inviteKey)),
    [invites]
  );

  const isInvited = user =>
    inviteSet.has(user?._id || user?.email);

  /* ================================================================
     LOAD DATA
================================================================= */
  useEffect(() => {
    if (mode === "existing-instance") {
      loadInstanceInvites();
    } else {
      setLoading(false);
    }
    loadCompanies();
  }, []);

  async function loadInstanceInvites() {
    try {
      const data = await apiClient.get(
        `/api/tour-invites/${instanceId}/list`
      );
      setInvites(data);
    } catch (err) {
      console.error("Load invitations error:", err);
    } finally {
      setLoading(false);
    }
  }

  async function loadCompanies() {
    try {
      const data = await apiClient.get("/api/companies");
      setCompanies(data);
    } catch (err) {
      console.error("Error loading companies:", err);
    }
  }

  /* ================================================================
     SEARCH
================================================================= */
  async function searchUsers() {
    try {
      const params = new URLSearchParams();
      if (query) params.append("query", query);
      if (selectedCompany) params.append("companyId", selectedCompany);
      if (selectedRole) params.append("roles", selectedRole);
      if (selectedCats.length)
        params.append("categories", selectedCats.join(","));

      const data = await apiClient.get(
        `/api/tour-invites/search?${params.toString()}`
      );
      setSearchResults(data);
    } catch (err) {
      console.error("Search error:", err);
    }
  }

  /* ================================================================
     INVITES
================================================================= */
  function addInvite(user) {
    const key = user._id || user.email;
    if (inviteSet.has(key)) return;

    const newInvite = user._id
      ? { _id: "local", userId: { ...user } }
      : { _id: "local", email: key };

    setInvites(prev => [...prev, newInvite]);

    if (mode === "existing-instance") {
      setPendingAdds(prev => [...prev, key]);
      setPendingRemoves(prev => prev.filter(k => k !== key));
    }
  }

  function removeInvite(user) {
    const key = user._id || user.email;

    setInvites(prev => prev.filter(inv => inviteKey(inv) !== key));

    if (mode === "existing-instance") {
      setPendingRemoves(prev => [...prev, key]);
      setPendingAdds(prev => prev.filter(k => k !== key));
    }
  }

  function addManualEmail() {
    const email = manualEmail.trim();
    if (!email || inviteSet.has(email)) return;

    setInvites(prev => [...prev, { _id: "local-email", email }]);

    if (mode === "existing-instance") {
      setPendingAdds(prev => [...prev, email]);
    }

    setManualEmail("");
  }

  async function commitChanges() {
    try {
      await apiClient.post(
        `/api/tour-invites/${instanceId}/bulk-commit`,
        { add: pendingAdds, remove: pendingRemoves }
      );
      await loadInstanceInvites();
      setPendingAdds([]);
      setPendingRemoves([]);
      alert("Invitations updated.");
    } catch (err) {
      console.error("Commit error:", err);
      alert("Error saving changes.");
    }
  }

  function confirmForNewInstance() {
    onConfirm(invites.map(inviteKey));
  }

  function toggleCategory(cat) {
    setSelectedCats(prev =>
      prev.includes(cat)
        ? prev.filter(c => c !== cat)
        : [...prev, cat]
    );
  }

  /* ================================================================
     RENDER
================================================================= */
  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center">
        <div className="bg-white dark:bg-neutral-900 p-6 rounded shadow">
          Loading…
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="
        bg-white dark:bg-neutral-900
        text-neutral-900 dark:text-neutral-100
        rounded-lg p-6 shadow-xl
        w-full max-w-5xl h-[90vh]
        overflow-y-auto space-y-6
      ">
        {/* HEADER */}
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">
            {mode === "new-instance"
              ? "Select Invitations"
              : "Manage Invitations"}
          </h2>
          <button onClick={onClose}>✕</button>
        </div>

        {/* FILTER BAR */}
        <div className="flex flex-wrap gap-3 items-end border-b pb-4">
          <input
            placeholder="Search name or email"
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="p-2 w-56 rounded border bg-white dark:bg-neutral-800"
          />

          <select
            value={selectedCompany}
            onChange={e => setSelectedCompany(e.target.value)}
            className="p-2 w-40 rounded border bg-white dark:bg-neutral-800"
          >
            <option value="">All Companies</option>
            {companies.map(c => (
              <option key={c._id} value={c._id}>{c.name}</option>
            ))}
          </select>

          <select
            value={selectedRole}
            onChange={e => setSelectedRole(e.target.value)}
            className="p-2 w-40 rounded border bg-white dark:bg-neutral-800"
          >
            <option value="">All Roles</option>
            {ROLES.map(r => <option key={r}>{r}</option>)}
          </select>

          <div className="flex gap-2">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => toggleCategory(cat)}
                className={`px-2 py-1 rounded text-sm border ${
                  selectedCats.includes(cat)
                    ? "bg-blue-600 text-white"
                    : "bg-neutral-200 dark:bg-neutral-800"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <button
            onClick={searchUsers}
            className="px-4 py-2 bg-blue-600 text-white rounded"
          >
            Search
          </button>

          {mode === "existing-instance" ? (
            <button
              onClick={commitChanges}
              disabled={!pendingAdds.length && !pendingRemoves.length}
              className="px-4 py-2 bg-green-600 text-white rounded disabled:opacity-50"
            >
              Apply Changes
            </button>
          ) : (
            <button
              onClick={confirmForNewInstance}
              className="px-4 py-2 bg-green-600 text-white rounded"
            >
              Confirm
            </button>
          )}
        </div>

        {/* MANUAL EMAIL */}
        <div className="flex gap-2">
          <input
            type="email"
            value={manualEmail}
            onChange={e => setManualEmail(e.target.value)}
            placeholder="Manual email invite"
            className="flex-1 p-2 rounded border bg-white dark:bg-neutral-800"
          />
          <button
            onClick={addManualEmail}
            className="px-3 py-2 bg-green-600 text-white rounded"
          >
            Add
          </button>
        </div>

        {/* GRID */}
        <div className="grid grid-cols-2 gap-6">
          {/* SEARCH RESULTS */}
          <div className="border rounded p-4 space-y-3">
            <h3 className="font-semibold">Search Results</h3>
            {searchResults.length === 0 ? (
              <p className="text-neutral-500">No entries.</p>
            ) : (
              searchResults.map(user => {
                const invited = isInvited(user);
                return (
                  <div
                    key={user._id}
                    className="flex justify-between items-center p-2 rounded border"
                  >
                    <div>
                      <div className="font-medium">{user.name}</div>
                      <div className="text-sm text-neutral-500">{user.email}</div>
                    </div>
                    <button
                      disabled={invited}
                      onClick={() => addInvite(user)}
                      className={`px-2 py-1 text-sm rounded ${
                        invited
                          ? "bg-neutral-400 cursor-not-allowed"
                          : "bg-green-600 text-white"
                      }`}
                    >
                      {invited ? "Added" : "Add"}
                    </button>
                  </div>
                );
              })
            )}
          </div>

          {/* CURRENT INVITED */}
          <div className="border rounded p-4 space-y-3">
            <h3 className="font-semibold">Current Invited</h3>
            {invites.length === 0 ? (
              <p className="text-neutral-500">No entries.</p>
            ) : (
              invites.map(item => (
                <div
                  key={inviteKey(item)}
                  className="flex justify-between items-center p-2 rounded border"
                >
                  <div>
                    <div className="font-medium">
                      {item.userId?.name || item.email}
                    </div>
                    <div className="text-sm text-neutral-500">
                      {item.userId?.email || item.email}
                    </div>
                  </div>
                  <button
                    onClick={() =>
                      removeInvite(item.userId || { email: item.email })
                    }
                    className="px-2 py-1 text-sm bg-red-600 text-white rounded"
                  >
                    Remove
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
