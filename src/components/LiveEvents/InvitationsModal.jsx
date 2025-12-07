import { useState, useEffect } from "react";
import { apiClient } from "@/api/client";

/* ================================================================
   Helper: stable identifier for invites
================================================================= */
function inviteKey(inv) {
  return inv?.userId?._id || inv?.email;
}

export default function InvitationsModal({
  mode = "existing-instance", // "new-instance" OR "existing-instance"
  instanceId = null,
  initialInvites = [],
  onClose,
  onConfirm
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

  const ROLES = ["student", "teacher", "coach", "admin", "company"];
  const CATEGORIES = ["Leadership", "Sales", "Service", "Office Staff", "Install"];

  /* ================================================================
     LOAD INITIAL INVITES + COMPANIES
  ================================================================ */
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
      const data = await apiClient.get(`/api/tour-invites/${instanceId}/list`);
      setInvites(data);
      setLoading(false);
    } catch (err) {
      console.error("Load invitations error:", err);
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
     SEARCH USERS
  ================================================================ */
  async function searchUsers() {
    try {
      const params = new URLSearchParams();

      if (query) params.append("query", query);
      if (selectedCompany) params.append("companyId", selectedCompany);
      if (selectedRole) params.append("roles", selectedRole);
      if (selectedCats.length > 0)
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
     TOGGLE INVITE
  ================================================================ */
  function toggleInvite(user) {
    const key = user._id || user.email;

    const exists = invites.some(inv => inviteKey(inv) === key);

    if (exists) {
      // REMOVE
      setInvites(prev => prev.filter(inv => inviteKey(inv) !== key));

      if (mode === "existing-instance") {
        setPendingRemoves(prev => [...prev, key]);
        setPendingAdds(prev => prev.filter(k => k !== key));
      }
    } else {
      // ADD
      const newInvite = user._id
        ? { _id: "local", userId: { ...user } }
        : { _id: "local", email: key };

      setInvites(prev => [...prev, newInvite]);

      if (mode === "existing-instance") {
        setPendingAdds(prev => [...prev, key]);
        setPendingRemoves(prev => prev.filter(k => k !== key));
      }
    }
  }

  /* ================================================================
     ADD MANUAL EMAIL
  ================================================================ */
  function addManualEmail() {
    const email = manualEmail.trim();
    if (!email) return;

    const exists = invites.some(inv => inviteKey(inv) === email);
    if (exists) return;

    setInvites(prev => [...prev, { _id: "local-email", email }]);

    if (mode === "existing-instance") {
      setPendingAdds(prev => [...prev, email]);
    }

    setManualEmail("");
  }

  /* ================================================================
     COMMIT CHANGES (existing-instance)
  ================================================================ */
  async function commitChanges() {
    try {
      await apiClient.post(`/api/tour-invites/${instanceId}/bulk-commit`, {
        add: pendingAdds,
        remove: pendingRemoves
      });

      await loadInstanceInvites();
      setPendingAdds([]);
      setPendingRemoves([]);
      alert("Invitations updated.");
    } catch (err) {
      console.error("Commit error:", err);
      alert("Error saving changes.");
    }
  }

  /* ================================================================
     CONFIRM (new-instance)
  ================================================================ */
  function confirmForNewInstance() {
    const cleaned = invites.map(inv => inviteKey(inv));
    onConfirm(cleaned);
  }

  /* ================================================================
     CATEGORY SELECT UI (custom multi-select)
  ================================================================ */
  function toggleCategory(cat) {
    if (selectedCats.includes(cat)) {
      setSelectedCats(prev => prev.filter(c => c !== cat));
    } else {
      setSelectedCats(prev => [...prev, cat]);
    }
  }

  /* ================================================================
     RENDER
  ================================================================ */
  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded shadow text-center">
          Loading…
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-5xl h-[90vh] overflow-y-auto space-y-6">

        {/* HEADER */}
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">
            {mode === "new-instance" ? "Select Invitations" : "Manage Invitations"}
          </h2>
          <button onClick={onClose} className="text-gray-600 hover:text-black">✕</button>
        </div>

        {/* PENDING CHANGES */}
        {mode === "existing-instance" && (pendingAdds.length || pendingRemoves.length) > 0 && (
          <div className="bg-yellow-100 border border-yellow-300 p-3 rounded">
            Pending changes: +{pendingAdds.length} / –{pendingRemoves.length}
            <button
              onClick={commitChanges}
              className="mt-2 px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Commit Changes
            </button>
          </div>
        )}

        {/* FILTERS */}
        <div className="grid grid-cols-4 gap-4">
          <input
            type="text"
            placeholder="Search name or email"
            className="p-2 border rounded"
            value={query}
            onChange={e => setQuery(e.target.value)}
          />

          <select
            className="p-2 border rounded"
            value={selectedCompany}
            onChange={e => setSelectedCompany(e.target.value)}
          >
            <option value="">All Companies</option>
            {companies.map(c => (
              <option key={c._id} value={c._id}>{c.name}</option>
            ))}
          </select>

          <select
            className="p-2 border rounded"
            value={selectedRole}
            onChange={e => setSelectedRole(e.target.value)}
          >
            <option value="">All Roles</option>
            {ROLES.map(r => <option key={r}>{r}</option>)}
          </select>

          {/* CATEGORY MULTI-SELECT (custom pill UI) */}
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map(cat => (
              <div
                key={cat}
                className={`cursor-pointer px-2 py-1 rounded border ${
                  selectedCats.includes(cat)
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-gray-100 hover:bg-gray-200"
                }`}
                onClick={() => toggleCategory(cat)}
              >
                {cat}
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={searchUsers}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Search
        </button>

        {/* MANUAL EMAIL */}
        <div className="flex space-x-2 items-center">
          <input
            type="email"
            placeholder="Manual email invite"
            className="p-2 border rounded flex-1"
            value={manualEmail}
            onChange={e => setManualEmail(e.target.value)}
          />

          <button
            onClick={addManualEmail}
            className="px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Add
          </button>
        </div>

        {/* MAIN GRID */}
        <div className="grid grid-cols-2 gap-6">

          {/* SEARCH RESULTS */}
          <div className="border rounded p-4 space-y-4">
            <h3 className="text-lg font-semibold">Search Results</h3>

            {searchResults.length === 0 ? (
              <p className="text-gray-500">No results.</p>
            ) : (
              searchResults.map(s => {
                const already = invites.some(inv => inviteKey(inv) === s._id);

                return (
                  <div key={s._id} className="flex justify-between border p-2 rounded">
                    <div>
                      <div className="font-medium">{s.name}</div>
                      <div className="text-sm">{s.email}</div>
                      <div className="text-xs text-gray-500">
                        {s.role} • {(s.categories || []).join(", ")}
                      </div>
                    </div>

                    <input
                      type="checkbox"
                      checked={already}
                      onChange={() => toggleInvite(s)}
                    />
                  </div>
                );
              })
            )}
          </div>

          {/* CURRENT INVITES */}
          <div className="border rounded p-4 space-y-4">
            <h3 className="text-lg font-semibold">
              {mode === "new-instance" ? "Selected Invitations" : "Current Invited"}
            </h3>

            {invites.length === 0 ? (
              <p className="text-gray-500">No invitations.</p>
            ) : (
              invites.map(inv => (
                <div key={inviteKey(inv)} className="flex justify-between border p-2 rounded">
                  <div>
                    {inv.userId ? (
                      <>
                        <div className="font-medium">{inv.userId.name}</div>
                        <div className="text-sm">{inv.userId.email}</div>
                      </>
                    ) : (
                      <>
                        <div className="font-medium">{inv.email}</div>
                        <div className="text-sm text-gray-500">Manual email</div>
                      </>
                    )}
                  </div>

                  <button
                    onClick={() => toggleInvite(inv.userId || { email: inv.email })}
                    className="px-2 py-1 bg-red-600 text-white rounded text-sm"
                  >
                    Remove
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* FOOTER */}
        <div className="flex justify-end gap-3 pt-4 border-t">

          {mode === "new-instance" ? (
            <button
              onClick={confirmForNewInstance}
              className="px-5 py-2 bg-green-600 hover:bg-green-700 text-white rounded"
            >
              Confirm & Create Tour
            </button>
          ) : (
            <button
              onClick={commitChanges}
              disabled={pendingAdds.length === 0 && pendingRemoves.length === 0}
              className="px-5 py-2 bg-green-600 hover:bg-green-700 text-white rounded disabled:opacity-50"
            >
              Apply Changes
            </button>
          )}

        </div>

      </div>
    </div>
  );
}
