// TeamCareers.jsx
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { apiClient } from "@/api/client";
import { useUser } from "@/context/UserContext";

function safeErrMsg(e) {
  return e?.payload?.message || e?.response?.data?.message || e?.message || "Something broke.";
}

function Badge({ children }) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs border bg-gray-100 text-gray-700 border-gray-200 dark:bg-zinc-800 dark:text-zinc-200 dark:border-zinc-700">
      {children}
    </span>
  );
}

export default function TeamCareers() {
  const { user } = useUser();
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [studentsErr, setStudentsErr] = useState("");
  const [students, setStudents] = useState([]);

  const [activeStudentId, setActiveStudentId] = useState("");
  const [loadingMaps, setLoadingMaps] = useState(false);
  const [mapsErr, setMapsErr] = useState("");
  const [maps, setMaps] = useState([]);

  const [pendingLoading, setPendingLoading] = useState(false);
  const [pendingErr, setPendingErr] = useState("");
  const [pending, setPending] = useState(null);

  const isReviewer = useMemo(
    () => ["team-manager", "company", "admin", "coach"].includes(user?.role),
    [user?.role]
  );

  useEffect(() => {
    if (!isReviewer) return;

    (async () => {
      setLoadingStudents(true);
      setStudentsErr("");
      try {
        const res = await apiClient.get("/api/team-careers/students");
        setStudents(res || []);
        const first = res?.[0]?._id ? String(res[0]._id) : "";
        setActiveStudentId(first);
      } catch (e) {
        setStudentsErr(safeErrMsg(e));
      } finally {
        setLoadingStudents(false);
      }
    })();
  }, [isReviewer]);

  useEffect(() => {
    if (!activeStudentId) {
      setMaps([]);
      setPending(null);
      return;
    }

    (async () => {
      setLoadingMaps(true);
      setMapsErr("");
      try {
        const res = await apiClient.get(`/api/team-careers/students/${activeStudentId}/career-maps`);
        setMaps(res || []);
      } catch (e) {
        setMapsErr(safeErrMsg(e));
      } finally {
        setLoadingMaps(false);
      }
    })();

    (async () => {
      setPendingLoading(true);
      setPendingErr("");
      try {
        const res = await apiClient.get(`/api/team-careers/pending?studentId=${activeStudentId}`);
        setPending(res || null);
      } catch (e) {
        setPendingErr(safeErrMsg(e));
      } finally {
        setPendingLoading(false);
      }
    })();
  }, [activeStudentId]);

  if (!isReviewer) {
    return (
      <div className="p-6">
        <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-4">
          <div className="font-semibold text-gray-900 dark:text-zinc-100">Nope.</div>
          <div className="text-sm text-gray-600 dark:text-zinc-400 mt-1">
            Your role can’t access Team Careers.
          </div>
        </div>
      </div>
    );
  }

  const activeStudent = students.find((s) => String(s._id) === String(activeStudentId));

  return (
    <div className="p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-zinc-100">Team Careers</h1>
          <p className="text-sm text-gray-600 dark:text-zinc-400">
            Browse students → their career maps → approve/reject survey requests & threads.
          </p>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4">
        {/* LEFT: Students */}
        <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-3">
          <div className="flex items-center justify-between mb-3">
            <div className="font-semibold text-gray-900 dark:text-zinc-100">Students</div>
            <Badge>{students.length}</Badge>
          </div>

          {studentsErr ? (
            <div className="mb-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded p-2">
              {studentsErr}
            </div>
          ) : null}

          <div className="space-y-2 max-h-[70vh] overflow-auto pr-1">
            {loadingStudents ? (
              <div className="text-sm text-gray-600 dark:text-zinc-400 p-2">Loading…</div>
            ) : students.length === 0 ? (
              <div className="text-sm text-gray-600 dark:text-zinc-400 p-2">No students found.</div>
            ) : (
              students.map((s) => {
                const active = String(s._id) === String(activeStudentId);
                return (
                  <button
                    key={s._id}
                    onClick={() => setActiveStudentId(String(s._id))}
                    className={[
                      "w-full text-left px-3 py-2 rounded-lg border transition",
                      active
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-white dark:bg-zinc-950 text-gray-900 dark:text-zinc-100 border-gray-200 dark:border-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-900",
                    ].join(" ")}
                  >
                    <div className="font-medium truncate">{s.name || s.email || "Student"}</div>
                    <div className="mt-1 flex gap-2 items-center">
                      <Badge>pending {s.pendingApprovalsCount ?? 0}</Badge>
                      <span className="text-xs opacity-70 truncate">{s.email || ""}</span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT: Student maps + pending */}
        <div className="space-y-4">
          <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-semibold text-gray-900 dark:text-zinc-100">
                  {activeStudent ? activeStudent.name || activeStudent.email : "Select a student"}
                </div>
                <div className="text-sm text-gray-600 dark:text-zinc-400">
                  {activeStudent ? "Career maps and approvals" : "Pick someone on the left."}
                </div>
              </div>
              <div className="flex gap-2">
                <Badge>{pendingLoading ? "pending…" : `pending ${(pending?.totals?.total ?? 0)}`}</Badge>
              </div>
            </div>

            {pendingErr ? (
              <div className="mt-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded p-2">
                {pendingErr}
              </div>
            ) : null}

            {/* Pending list */}
            {pending?.items?.length ? (
              <div className="mt-3 space-y-2">
                <div className="text-xs uppercase tracking-wide text-gray-500 dark:text-zinc-400">
                  Pending approvals
                </div>
                <div className="space-y-2 max-h-[260px] overflow-auto pr-1">
                  {pending.items.slice(0, 20).map((it, idx) => (
                    <div
                      key={`${it.type}_${it.threadId || it.submissionId || idx}`}
                      className="rounded border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-3"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="text-sm font-medium text-gray-900 dark:text-zinc-100">
                          {it.type === "survey" ? "Survey request" : "Skill thread"}
                        </div>
                        <Badge>
  {it.type === "survey"
    ? (it.mapTitle || "Map survey")
    : (it.levelTitle || "Level")}
</Badge>
                      </div>

                      <div className="text-xs text-gray-600 dark:text-zinc-400 mt-1">
                        {it.type === "thread"
                         ? `Skill: ${it.skillTitle || "Skill"}`
                         : "Review claimed skills. Map unlocks when the survey is fully reviewed."
                         }

                      </div>

                      {/* Jump to shared detail */}
                      {it.careerMapId ? (
  <div className="mt-2">
    <Link
      className="text-sm px-3 py-1.5 rounded border border-gray-300 dark:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-900 inline-block"
      to={
        it.type === "thread"
          ? `/team-careers/${activeStudentId}/career-maps/${it.careerMapId}?focus=thread&skillId=${it.skillId || ""}`
          : `/team-careers/${activeStudentId}/career-maps/${it.careerMapId}?focus=survey&submissionId=${it.submissionId || ""}`
      }
    >
      Open career map →
    </Link>
  </div>
) : null}

                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="mt-3 text-sm text-gray-600 dark:text-zinc-400">
                {pendingLoading ? "Loading pending approvals…" : "No pending approvals."}
              </div>
            )}
          </div>

          {/* Maps */}
          <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="font-semibold text-gray-900 dark:text-zinc-100">Career maps</div>
              <Badge>{loadingMaps ? "loading…" : maps.length}</Badge>
            </div>

            {mapsErr ? (
              <div className="mb-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded p-2">
                {mapsErr}
              </div>
            ) : null}

            <div className="space-y-2">
              {loadingMaps ? (
                <div className="text-sm text-gray-600 dark:text-zinc-400">Loading…</div>
              ) : maps.length === 0 ? (
                <div className="text-sm text-gray-600 dark:text-zinc-400">No maps found.</div>
              ) : (
                maps.map((m) => (
                  <Link
                    key={m._id}
                    to={`/team-careers/${activeStudentId}/career-maps/${m._id}`}
                    className="block rounded-lg border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-3 hover:bg-gray-50 dark:hover:bg-zinc-900 transition"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="font-medium text-gray-900 dark:text-zinc-100">{m.title || "Career Map"}</div>
                      <Badge>pending {m.pendingApprovalsCount ?? 0}</Badge>
                    </div>
                    <div className="text-xs text-gray-600 dark:text-zinc-400 mt-1">
                      {m.category ? `Category: ${m.category}` : ""}
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
