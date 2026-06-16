import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api";
import { API_CONFIG } from "../services/config";

export default function Dashboard() {
  const navigate = useNavigate();
  const [tests, setTests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    api.getTests()
      .then((r: any) => {
        const rawRows = r?.data || r?.tests || (Array.isArray(r) ? r : []);
        
        const normalized = rawRows.map((t: any) => {
          if (!t) return null;

          const safeTopics = Array.isArray(t.topics_names)
            ? t.topics_names
            : Array.isArray(t.topics)
            ? t.topics
            : [];

          return {
            ...t,
            id: t.id || `fallback-${Math.random()}`,
            name: t.name || "Untitled Test",
            status: t.status || "draft", 
            subject_name: t.subject_name || t.subject || "Unassigned",
            topics_names: safeTopics,
            total_questions: t.total_questions || (Array.isArray(t.questions) ? t.questions.length : 0),
            created_at: t.created_at || new Date().toISOString()
          };
        }).filter(Boolean);

        setTests(normalized);
        setLoading(false);
      })
      .catch((err: any) => {
        setErrorMsg(err.message || "Failed to load tests from server.");
        setLoading(false);
      });
  }, []);

  const filtered = tests.filter((t) => {
    const matchQ =
      !query ||
      t.name.toLowerCase().includes(query.toLowerCase()) ||
      (t.subject_name || "").toLowerCase().includes(query.toLowerCase());
    const matchStatus = statusFilter === "all" || t.status === statusFilter;
    return matchQ && matchStatus;
  });

  const handleDelete = (id: string) => {
    if (!confirm("Delete this test?")) return;
    api.deleteTest(id).then(() => {
      setTests((prev) => prev.filter((t) => t.id !== id));
    });
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Test Management</h1>
          <p className="text-slate-500 text-sm mt-1">Create, manage, and publish tests for your students.</p>
        </div>
        <button
          onClick={() => navigate("/test-creation")}
          className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium shadow-sm transition"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Create New Test
        </button>
      </div>

      {/* Error Alert Banner */}
      {errorMsg && (
        <div className="text-sm rounded-lg px-4 py-3 bg-red-50 text-red-700 border border-red-200">
          ⚠️ <strong>Parsing Alert:</strong> {errorMsg}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard label="Total Tests" value={tests.length} color="indigo" />
        <StatCard label="Published" value={tests.filter((t) => t.status === "live").length} color="emerald" />
        <StatCard label="Drafts" value={tests.filter((t) => t.status === "draft" || !t.status).length} color="amber" />
        <StatCard label="Total Questions" value={tests.reduce((s, t) => s + (t.total_questions || 0), 0)} color="rose" />
      </div>

      {/* Search / Filter */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4-4" />
          </svg>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by test name or subject..."
            className="w-full pl-10 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div className="flex items-center gap-2">
          {["all", "live", "scheduled", "draft"].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 text-xs rounded-full border transition ${
                statusFilter === s
                  ? "bg-indigo-50 border-indigo-300 text-indigo-700 font-medium"
                  : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              {s === "all"
                ? "All"
                : s === "live"
                ? "Published"
                : s === "scheduled"
                ? "Scheduled"
                : "Drafts"}
            </button>
          ))}
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-800">All Tests ({filtered.length})</h2>
        </div>
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-sm">Loading tests...</div>
        ) : filtered.length === 0 ? (
          <div className="p-16 text-center">
            <div className="w-14 h-14 rounded-full bg-slate-100 mx-auto mb-4 flex items-center justify-center text-slate-400">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 12h6M9 16h6M9 8h6" /><rect x="5" y="4" width="14" height="16" rx="2" /></svg>
            </div>
            <p className="text-slate-500 mb-4">No tests found. Create your first test to get started.</p>
            <button
              onClick={() => navigate("/test-creation")}
              className="text-indigo-600 font-medium text-sm hover:underline"
            >
              + Create New Test
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3 text-left font-semibold">Test Name</th>
                  <th className="px-6 py-3 text-left font-semibold">Subject</th>
                  <th className="px-6 py-3 text-left font-semibold">Questions</th>
                  <th className="px-6 py-3 text-left font-semibold">Status</th>
                  <th className="px-6 py-3 text-left font-semibold">Created</th>
                  <th className="px-6 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/50">
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-800">{t.name}</div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {t.topics_names && t.topics_names.length > 0
                          ? t.topics_names.slice(0, 2).join(", ")
                          : "No dynamic topics linked"}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600">{t.subject_name}</td>
                    <td className="px-6 py-4 text-slate-600">{t.total_questions}</td>
                    <td className="px-6 py-4">
                      <StatusBadge status={t.status} />
                    </td>
                    <td className="px-6 py-4 text-slate-500 text-xs">{formatDate(t.created_at)}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="inline-flex gap-1">
                        <IconBtn title="View" color="indigo" onClick={() => navigate(`/tests/${t.id}/preview`)}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z" /><circle cx="12" cy="12" r="3" /></svg>
                        </IconBtn>
                        <IconBtn title="Edit" color="amber" onClick={() => navigate(`/test-creation/${t.id}`)}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 013 3L7 19l-4 1 1-4 12.5-12.5z" /></svg>
                        </IconBtn>
                        <IconBtn title="Questions" color="emerald" onClick={() => navigate(`/tests/${t.id}/questions`)}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" /></svg>
                        </IconBtn>
                        <IconBtn title="Delete" color="rose" onClick={() => handleDelete(t.id)}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18" /><path d="M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2" /><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" /></svg>
                        </IconBtn>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  const bg: Record<string, string> = {
    indigo: "bg-indigo-50 text-indigo-600",
    emerald: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
    rose: "bg-rose-50 text-rose-600",
  };
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 flex items-center justify-between">
      <div>
        <div className="text-xs text-slate-500 uppercase tracking-wider">{label}</div>
        <div className="text-2xl font-bold text-slate-800 mt-1">{value}</div>
      </div>
      <div className={`w-11 h-11 rounded-lg ${bg[color]} flex items-center justify-center`}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="4" width="18" height="16" rx="2" />
          <path d="M8 9h8M8 13h8M8 17h5" />
        </svg>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status?: string }) {
  if (status === "live")
    return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium border border-emerald-200"><span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>Published</span>;
  if (status === "scheduled")
    return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-sky-50 text-sky-700 text-xs font-medium border border-sky-200"><span className="w-1.5 h-1.5 bg-sky-500 rounded-full"></span>Scheduled</span>;
  return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-medium border border-amber-200"><span className="w-1.5 h-1.5 bg-amber-500 rounded-full"></span>Draft</span>;
}

function IconBtn({ children, onClick, title, color }: any) {
  const colors: Record<string, string> = {
    indigo: "text-indigo-600 hover:bg-indigo-50",
    amber: "text-amber-600 hover:bg-amber-50",
    rose: "text-rose-600 hover:bg-rose-50",
    emerald: "text-emerald-600 hover:bg-emerald-50",
  };
  return (
    <button onClick={onClick} title={title} className={`w-8 h-8 rounded-md flex items-center justify-center transition ${colors[color]}`}>
      {children}
    </button>
  );
}

function formatDate(d: string) {
  if (!d) return "-";
  const date = new Date(d);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}